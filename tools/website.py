# Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

import os
import sys
import re
import io
import gzip
import base64
import subprocess
import tempfile
import datetime
import xml.etree.ElementTree as ET
from urllib.request import urlopen
from urllib.error import HTTPError, URLError

try:
    import boto3
    from botocore.config import Config
    from botocore.exceptions import ClientError
except ImportError:
    sys.exit("Requires Boto3 module; try 'pip install boto3'")

PURPOSE = """\
website.py list                       List site versions
website.py reindex                    Rebuild index.html
website.py compile                    Compile javascript code
website.py lint                       Lint javascript code
website.py push <description>         Push a site version
website.py deploy <version_id>        Deploy specified version to live
website.py delete <version_ids...>    Delete site versions
website.py view <version_id>          View a site version

where,
   <description>   Text description for site version
   <version_id>    Version identifier
"""

# ContentEncoding for file types
mime_types = {
    '.txt':  'text/plain; charset=utf-8',
    '.htm':  'text/html; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.csv':  'text/csv; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml':  'application/xml; charset=utf-8',
    '.bin':  'application/octet-stream',
    '.pdf':  'application/pdf',
    '.ogx':  'application/ogg',
    '.zip':  'application/zip',
    '.bmp':  'image/bmp',
    '.ico':  'image/x-icon',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.tiff': 'image/tiff',
    '.oga':  'audio/ogg',
    '.mp4a': 'audio/mp4',
    '.wav':  'audio/x-wav',
    '.ogv':  'video/ogg',
    '.mp4':  'video/mp4'
}

# These file types are gzip compressed before upload
gzip_types = ['.txt', '.htm', '.html', '.css', '.csv', '.js', '.json']


# A timemark encodes the current date and time into a base32 string
def encode_timemark():
    base_year = 2020                                    # Start year for timemark i.e. 2020 is year 0
    now = datetime.datetime.utcnow()
    encoding = '0123456789ACDEFGHJKLMNPQRSTVWXYZ'       # Custom base32 encoding table
    # First part of the timemark consists of a single digit each for the year, month and day
    year = encoding[(now.year - base_year) % 32]        # Wraps every 32 years
    month = encoding[now.month]
    day = encoding[now.day]
    # Second part of the timemark consists of 4 digits representing time of day divided into 2^20 units
    seconds_since_midnight = (now.hour*3600) + (now.minute*60) + now.second
    microseconds_since_midnight = (seconds_since_midnight * 1000000) + now.microsecond
    percent_of_day = float(microseconds_since_midnight) / 86400000000.0     # % of day that has passed from 0.0 to 1.0
    time_increment = int(percent_of_day * 1048576)                          # % of day times 2^20
    timestamp = encoding[(time_increment >> 15) & 0x1f]
    timestamp += encoding[(time_increment >> 10) & 0x1f]
    timestamp += encoding[(time_increment >> 5) & 0x1f]
    timestamp += encoding[time_increment & 0x1f]
    return year + month + day + '-' + timestamp


def list_files(path, extensions=None):
    file_list = []
    for root, dirs, files in os.walk(path):
        for f in files:
            ext = os.path.splitext(f)[1]
            if not extensions or ext in extensions:
                file_path = os.path.join(root, f)
                file_path = file_path.replace('\\', '/')
                file_list.append(file_path)
    return file_list


def sort_js_by_class_hierarchy(file_paths):
    # Load each source file and identify class inheritance
    class_to_file_map = {}
    class_hierarchy_chain = {}
    output_file_list = []
    for file_path in file_paths:
        with open(file_path, 'r') as f:
            inheritance_found = False
            for line in f.read().splitlines():
                match = re.search(r'class\s+(.*)\s+extends\s+(.*)\s+', line)
                if match:
                    class_name = match.group(1)
                    superclass_name = match.group(2)
                    class_to_file_map[class_name] = file_path
                    class_hierarchy_chain[class_name] = [superclass_name]
                    inheritance_found = True
                    break
            if not inheritance_found:
                output_file_list.append(file_path)

    # Complete the inheritance chain for each class
    for class_name, chain in class_hierarchy_chain.items():
        superclass_name = chain[0]
        while superclass_name:
            if superclass_name in class_hierarchy_chain:
                next_class = class_hierarchy_chain[superclass_name][0]
                class_hierarchy_chain[class_name].append(next_class)
                superclass_name = next_class
            else:
                superclass_name = None

    # Sort classes in inheritance order
    ordered_class_list = []
    for class_name, chain in class_hierarchy_chain.items():
        for superclass_name in reversed(chain):
            if superclass_name not in ordered_class_list:
                ordered_class_list.append(superclass_name)
        if class_name not in ordered_class_list:
            ordered_class_list.append(class_name)

    # Generate file list with superclasses preceding classes
    for class_name in ordered_class_list:
        if class_name in class_hierarchy_chain:
            output_file_list.append(class_to_file_map[class_name])
    return output_file_list


def download_closure_compiler(closure_version):
    script_path = os.path.abspath(os.path.dirname(sys.argv[0]))
    jar_path = os.path.join(script_path, '..', '.cache', 'closure')
    jar_file = os.path.join(jar_path, 'closure-compiler-' + closure_version + '.jar').replace('\\', '/')
    if not os.path.exists(jar_file):
        jar_url = 'https://repo1.maven.org/maven2/com/google/javascript/closure-compiler/' + closure_version + '/closure-compiler-' + closure_version + '.jar'
        try:
            fp = urlopen(jar_url)
            body = fp.read()
        except (HTTPError, URLError):
            sys.exit('Failed to download closure compiler')
        if not os.path.exists(jar_path):
            os.makedirs(jar_path)
        with open(jar_file, 'wb') as f:
            f.write(body)
    return jar_file


def compile_javascript(closure_version):
    js_files = list_files('../website/source', extensions=['.js'])
    js_files = sort_js_by_class_hierarchy(js_files)
    compiled_file = '../.cache/compiled.js'
    if not os.path.exists(os.path.dirname(compiled_file)):
        os.makedirs(os.path.dirname(compiled_file))
    if os.path.exists(compiled_file):
        os.remove(compiled_file)
    jar_path = download_closure_compiler(closure_version)
    args = [
        'java', '-jar', jar_path,
        '--compilation_level', 'ADVANCED',
        '--language_in', 'ECMASCRIPT_2015',
        '--language_out', 'ECMASCRIPT_2015',
        '--strict_mode_input',
        '--warning_level', 'VERBOSE',
        '--js_output_file', compiled_file]
    for extern_file in list_files('../website/externs'):
        args.extend(['--externs', extern_file])
    args.extend(js_files)
    try:
        subprocess.call(args)
    except OSError:
        sys.exit('ERROR: Java not installed; install and try again')
    if not os.path.exists(compiled_file):
        sys.exit('Javascript compilation failed')
    return compiled_file


def populate_html(html_path, js_files, css_files):
    with open(html_path, 'r') as f:
        input_lines = f.read().splitlines()
    output_lines = []
    in_css = in_source = False
    for line in input_lines:
        # JS file references between the JS marker comments are replaced with an updated list of files
        if line.find('<!-- Begin JS') != -1:
            in_source = True
            output_lines.append(line)
        elif line.find('<!-- End JS') != -1:
            in_source = False
            for file_path in js_files:
                output_lines.append('        <script src="' + file_path + '"></script>')

        # CSS file references between the CSS marker comments are replaced with an updated list of files
        if line.find('<!-- Begin CSS') != -1:
            in_css = True
            output_lines.append(line)
        elif line.find('<!-- End CSS') != -1:
            in_css = False
            for file_path in css_files:
                output_lines.append('        <link rel="stylesheet" href="' + file_path + '">')

        if not in_css and not in_source:
            output_lines.append(line)

    return '\n'.join(output_lines)


def bake_html_version(html_data, version_id):

    # Make version ID available to javascript
    html_data = html_data.replace('window["versionID"]="";', 'window["versionID"]="{0}";'.format(version_id))

    # Find href and src references
    match = re.findall(r"(src|href)\s*=\s*[\"|']([a-zA-Z0-9 \-._/'!@#$%^&()]+)[\"|']", html_data)
    if match is not None:
        # Create a unique set from the found reference names
        matches = [x[-1] for x in match]
        matches = set(matches)

        # For each reference name check if it's a relative or absolute path
        for name in matches:
            if name[0:2] == '//':
                continue
            if name[0:4].lower() == 'http':
                continue
            # If the path is relative then remap it to the version path
            html_data = html_data.replace(name, version_id + '/' + name)
    return html_data


def minify_html(input_file, output_file):
    try:
        subprocess.call(
            [
                # see https://www.npmjs.com/package/html-minifier
                'html-minifier.cmd' if sys.platform == 'win32' else 'html-minifier',
                '--collapse-whitespace',
                '--remove-comments',
                '--remove-optional-tags',
                '--remove-redundant-attributes',
                '--remove-script-type-attributes',
                '--use-short-doctype',
                '-o', output_file,
                input_file
            ]
        )
    except OSError:
        sys.exit("HTML Minify not installed; try 'npm install -g html-minifier'")


def minify_css(input_file, output_file):
    try:
        subprocess.call(
            [
                'uglifycss.cmd' if sys.platform == 'win32' else 'uglifycss',
                '--output', output_file,
                input_file
            ]
        )
    except OSError:
        sys.exit("UglifyCSS is not installed; try 'npm install -g uglifycss'")


def upload_file(client, file_path, bucket_name, object_key):

    # Determine MIME type of file
    extension = os.path.splitext(file_path)[1]
    if extension and extension in mime_types:
        content_type = mime_types[extension]
    else:
        content_type = 'binary/octet-stream'

    # Read file
    with open(file_path, 'rb') as f:
        file_data = f.read()

    # Compress file if necessary
    content_encoding = None
    if extension in gzip_types:
        output = io.BytesIO()
        with gzip.GzipFile(fileobj=output, mode='wb') as f:
            f.write(file_data)
        file_data = output.getvalue()
        content_encoding='gzip'

    # Upload file
    _upload_file(client, file_data, bucket_name, object_key, 'public-read', content_type, 'public,max-age=31536000', content_encoding)


def _upload_file(client, file_data, bucket_name, object_key, acl, content_type, cache_control, content_encoding):
    if content_encoding is not None:
        response = client.put_object(
            Bucket=bucket_name,
            ACL=acl,
            Body=file_data,
            CacheControl=cache_control,
            ContentEncoding=content_encoding,
            ContentLength=len(file_data),
            ContentType=content_type,
            Key=object_key
        )
    else:
        response = client.put_object(
            Bucket=bucket_name,
            ACL=acl,
            Body=file_data,
            CacheControl=cache_control,
            ContentLength=len(file_data),
            ContentType=content_type,
            Key=object_key
        )


def get_live_version_id(client, bucket_name):
    flo = io.BytesIO()
    try:
        client.download_fileobj(bucket_name, 'index.html', flo)
    except ClientError:
        return None
    with gzip.GzipFile(fileobj=io.BytesIO(flo.getvalue()), mode='rb') as f:
        index_data = f.read().decode('latin_1')
    match = re.search('href="([a-zA-Z0-9_-]+)/index.css"', index_data)
    live_version_id = match.group(1) if match else None
    return live_version_id


if __name__ == '__main__':

    if len(sys.argv) < 2:
        sys.exit(PURPOSE)

    config = ET.parse('configuration.xml').getroot().find('website')
    region = config.find('region').text
    bucket_name = config.find('bucket').text
    closure_version = config.find('closure_version').text

    command = sys.argv[1]
    if command == 'list':
        client = boto3.client('s3', config=Config(region_name=region))

        # Get version id of currently live version
        live_version_id = get_live_version_id(client, bucket_name)

        # List all index files on site
        response = client.list_objects_v2(
            Bucket=bucket_name,
            Prefix='index-'
        )
        if 'Contents' in response:
            for entry in response['Contents']:
                key = entry['Key']
                version_id = key[6:-5]
                current = '*' if version_id == live_version_id else ''
                tags_response = client.get_object_tagging(
                    Bucket=bucket_name,
                    Key=key
                )
                description = ''
                for tag in tags_response['TagSet']:
                    if tag['Key'] == 'description':
                        description = tag['Value']
                        break
                print("{0} {1:1}  {2}".format(version_id, current, description))

    elif command == 'reindex':
        js_files = list_files('../website/source', extensions=['.js'])
        js_files = sort_js_by_class_hierarchy(js_files)
        js_files = ['/'.join(f.split('/')[2:]) for f in js_files]   # make paths relative to index.html
        css_files = list_files('../website/source', extensions=['.css'])
        css_files = ['/'.join(f.split('/')[2:]) for f in css_files]   # make paths relative to index.html
        populated_data = populate_html('../website/index.html', js_files, css_files)
        with open('../website/index.html', 'w') as f:
            f.write(populated_data)

        js_files = ['../.cache/compiled.js']
        populated_data = populate_html('../website/index.html', js_files, css_files)
        with open('../website/compiled.html', 'w') as f:
            f.write(populated_data)

    elif command == 'compile':
        compile_javascript(closure_version)

    elif command == 'lint':
        js_files = list_files('../website/source', extensions=['.js'])
        js_files = sort_js_by_class_hierarchy(js_files)
        combined_file = '../.cache/combined.js'
        combined_path = os.path.dirname(combined_file)
        if not os.path.exists(combined_path):
            os.makedirs(combined_path)
        with open(combined_file, 'w') as w:
            for input_file in js_files:
                with open(input_file, 'r') as r:
                    w.write(r.read() + '\n')
        try:
            subprocess.call(['jshint.cmd' if sys.platform == 'win32' else 'jshint', combined_file])
        except OSError as e:
            sys.exit("JSHint not installed; try 'npm install -g jshint'")

        css_files = list_files('../website/source', extensions=['.css'])
        combined_file = '../.cache/combined.css'
        with open(combined_file, 'w') as w:
            for input_file in css_files:
                with open(input_file, 'r') as r:
                    w.write(r.read() + '\n')
        try:
            subprocess.call(
                [
                    'csslint.cmd' if sys.platform == 'win32' else 'csslint',
                    '--quiet',
                    '--format=compact',
                    '--ignore=order-alphabetical,fallback-colors,compatible-vendor-prefixes,font-sizes',
                    combined_file
                ]
            )
        except OSError:
            sys.exit("CSSLint not installed; try 'npm install -g csslint'")

    elif command == 'push':
        if len(sys.argv) < 3:
            sys.exit(PURPOSE)

        description = " ".join(sys.argv[2:])
        version_id = encode_timemark() + '-' + base64.b32encode(os.urandom(10)).decode('latin_1')
        object_prefix = version_id + '/'

        # Compile javascript
        compiled_file = compile_javascript(closure_version)

        # Upload compiled javascript as index.js
        client = boto3.client('s3', config=Config(region_name=region))
        upload_file(client, compiled_file, bucket_name, object_prefix + 'index.js')

        # Combine, minify and upload CSS as index.css
        css_files = list_files('../website/source', extensions=[".css"])
        combined_file = tempfile.mktemp() + ".css"
        with open(combined_file, 'w') as w:
            for css_file in css_files:
                with open(css_file, 'r') as r:
                    w.write(r.read() + '\n')
        minified_file = tempfile.mktemp() + '.css'
        minify_css(combined_file, minified_file)
        upload_file(client, minified_file, bucket_name, object_prefix + 'index.css')

        # Upload top level files
        top_level_files = ['../website/favicon.ico']
        for file_name in top_level_files:
            key_name = object_prefix + '/'.join(file_name.split('/')[2:])
            upload_file(client, file_name, bucket_name, key_name)

        # Upload asset files
        file_list = list_files('../website/assets')
        for file_name in file_list:
            key_name = object_prefix + '/'.join(file_name.split('/')[2:])
            upload_file(client, file_name, bucket_name, key_name)

        # Upload minified libraries
        library_files = list_files('../website/libraries')
        for file_name in library_files:
            if file_name.find('.min.') != -1:
                key_name = object_prefix + '/'.join(file_name.split('/')[2:])
                upload_file(client, file_name, bucket_name, key_name)

        # Finalize and upload index.html
        populated_data = populate_html('../website/index.html', ['index.js'], ['index.css'])
        replacements = [('normalize.css', 'normalize.min.css')]
        for replacement in replacements:
            populated_data = populated_data.replace(replacement[0], replacement[1])
        baked_data = bake_html_version(populated_data, version_id)
        tf = tempfile.mktemp() + '.html'
        with open (tf, 'w') as f:
            f.write(baked_data)
        minify_html(tf, tf)
        index_file_name = 'index-' + version_id + '.html'
        upload_file(client, tf, bucket_name, index_file_name)
        os.remove(tf)

        # Add description tag to index file
        response = client.put_object_tagging(
            Bucket=bucket_name,
            Key=index_file_name,
            Tagging={'TagSet': [{'Key': 'description', 'Value': description}]}
        )

        # Display link to version
        print('Version available at https://' + bucket_name + '.s3.amazonaws.com/index-' + version_id + '.html')

    elif command == 'deploy':
        # Copy version index file to index.html
        version_id = sys.argv[2] if len(sys.argv) > 2 else sys.exit(PURPOSE)
        client = boto3.client('s3', config=Config(region_name=region))
        response = client.get_object(
            Bucket=bucket_name,
            Key='index-' + version_id + '.html'
        )
        content_type = response['ContentType']
        content_encoding = response['ContentEncoding'] if 'ContentEncoding' in response else None
        file_data = response['Body'].read()
        _upload_file(client, file_data, bucket_name, 'index.html', 'public-read', content_type, 'public,max-age=300', content_encoding)
        print('Deployed version ' + version_id)

    elif command == 'delete':
        client = boto3.client('s3', config=Config(region_name=region))

        # Get version id of current live version
        live_version_id = get_live_version_id(client, bucket_name)

        # Delete each specified version
        for version_key in sys.argv[2:]:
            if version_key == live_version_id:
                print(live_version_id + 'is live and will not be deleted')
                continue

            # List all objects to be deleted
            response = client.list_objects_v2(
                Bucket=bucket_name,
                Prefix=version_key
            )
            delete_keys = []
            for entry in response['Contents']:
                delete_keys.append({'Key': entry['Key']})
            delete_keys.append({'Key': 'index-' + version_key + '.html'})

            # Delete all objects in this version
            delete_response = client.delete_objects(
                Bucket=bucket_name,
                Delete={'Objects': delete_keys}
            )

    elif command == 'view':
        version_id = sys.argv[2] if len(sys.argv) > 2 else sys.exit(PURPOSE)
        os.startfile('https://' + bucket_name + '.s3.amazonaws.com/' + 'index-' + version_id + '.html')

    else:
        sys.exit('Error: Unknown command')
