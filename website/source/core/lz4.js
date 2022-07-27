// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class LZ4 {

    static decompress(input, inputOffset) {

        let uncompressedLength = input[inputOffset++] + (input[inputOffset++] << 8) +
                                (input[inputOffset++] << 16) + (input[inputOffset++] << 24);
        let output = new Uint8Array(new ArrayBuffer(uncompressedLength));
        let outputOffset = 0;

        while (outputOffset < uncompressedLength) {

            let token = input[inputOffset++];

            // Get literal length
            let lengthByte;
            let literalLength = token >> 4;
            if (literalLength === 0x0f) {
                do {
                    lengthByte = input[inputOffset++];
                    literalLength += lengthByte;
                } while (lengthByte === 0xff);
            }

            // Copy literals
            while (literalLength) {
                output[outputOffset++] = input[inputOffset++];
                literalLength--;
            }

            // Compressed data always ends with literals, so check for completion here
            if (outputOffset === uncompressedLength) {
                break;
            }

            // Get match offset
            let matchOffset = input[inputOffset++] + (input[inputOffset++] << 8);

            // Get match length
            let matchLength = token & 0x0f;
            if (matchLength === 0x0f) {
                do {
                    lengthByte = input[inputOffset++];
                    matchLength += lengthByte;
                } while (lengthByte === 0xff);
            }
            matchLength += 4;

            // Copy match
            while (matchLength) {
                output[outputOffset] = output[outputOffset - matchOffset];
                outputOffset++;
                matchLength--;
            }
        }

        return output.buffer;
    }
}
