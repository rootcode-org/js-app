// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

const BODY_TYPES = {
    ARRAYBUFFER: 0,
    BLOB: 1,
    JSON: 2,
    TEXT: 3,
    FORMDATA: 4
};

class Asset {

    constructor(url, bodytype) {
        this.url = url;
        this.bodytype = bodytype;
        this.data = null;
        this.error = false;
        this.callbacks = [];
    }

    load(callback=null) {
        let self = this;
        this.callbacks.push(callback);
        function onResponse(response) {
            switch(self.bodytype) {
                case BODY_TYPES.ARRAYBUFFER:
                    return response.arrayBuffer();
                case BODY_TYPES.BLOB:
                    return response.blob();
                case BODY_TYPES.JSON:
                    return response.json();
                case BODY_TYPES.TEXT:
                    return response.text();
                case BODY_TYPES.FORMDATA:
                    return response.formData();
                default:
                    throw ("illegal body type");
            }
        }

        function onData(body) {
            self.data = self.parse(body);
        }

        function onError(body) {
            self.error = true;
        }

        function onFinally() {
            self.callbacks.forEach(function(callback) {callback(self);});
        }

        // see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
        fetch(this.url).then(onResponse).then(onData).catch(onError).finally(onFinally);
    }

    addCallback(callback) {
        this.callbacks.push(callback);
    }

    parse(body) {
        throw ("virtual method");
    }

    getData() {
        return this.data;
    }

    dispose() {
        this.data = null;
    }
}
