// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

const ENCODE_TABLE_STANDARD = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const ENCODE_TABLE_SAFE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// Same table can decode both standard and url-safe variants
const DECODE_TABLE = [
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 62, 0, 62, 0, 63,
    52, 53, 54, 55, 56, 57, 58, 59,
    60, 61, 0, 0, 0, -1, 0, 0,
    0, 0, 1, 2, 3, 4, 5, 6,
    7, 8, 9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22,
    23, 24, 25, 0, 0, 0, 0, 63,
    0, 26, 27, 28, 29, 30, 31, 32,
    33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48,
    49, 50, 51, 0, 0, 0, 0, 0
];


class Base64 {

    static encode(input, urlSafe, truncate) {

        let encodeTable;
        if (urlSafe) encodeTable = ENCODE_TABLE_SAFE;
        else         encodeTable = ENCODE_TABLE_STANDARD;

        let output = "";
        let bits = 0;
        let shift = 0;
        let i = 0;

        while (i < input.length) {
            shift = (shift + 2) & 7;
            if (shift !== 0) {
                bits = (bits << 8) + input.charCodeAt(i);
                i += 1;
            }
            output += encodeTable[(bits >>> shift) & 0x3f];
        }

        switch (shift) {
            case 2:
                output += encodeTable[(bits << 4) & 0x3f];
                if (!truncate) {
                    output += "==";
                }
                break;
            case 4:
                output += encodeTable[(bits << 2) & 0x3f];
                if (!truncate) {
                    output += "=";
                }
                break;
            case 6:
                output += encodeTable[bits & 0x3f];
                break;
        }

        return output;

    }

    static decode(input) {

        let output = "";
        let bits = 0;
        let i = 0;
        let a, b, c, d;

        while (i < input.length) {

            // Read up to 4 input characters
            a = DECODE_TABLE[input.charCodeAt(i)];
            b = DECODE_TABLE[input.charCodeAt(i + 1)];
            i += 2;

            c = d = -1;
            if (i < input.length) {
                c = DECODE_TABLE[input.charCodeAt(i)];
                i += 1;
            }
            if (i < input.length) {
                d = DECODE_TABLE[input.charCodeAt(i)];
                i += 1;
            }

            // Write up to 3 bytes of binary data
            if (c === -1) {
                bits = (a << 6) + b;
                output += String.fromCharCode(bits >> 4);
            } else if (d === -1) {
                bits = (a << 12) + (b << 6) + c;
                output += String.fromCharCode(bits >> 10);
                output += String.fromCharCode((bits >> 2) & 0xff);
            } else {
                bits = (a << 18) + (b << 12) + (c << 6) + d;
                output += String.fromCharCode(bits >> 16);
                output += String.fromCharCode((bits >> 8) & 0xff);
                output += String.fromCharCode(bits & 0xff);
            }
        }

        return output;
    }
}
