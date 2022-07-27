// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class Vigenere {

    constructor(keySeed, keyLength) {
        let r = new Random(keySeed);
        this.key = r.generateArray(keyLength);
    }

    decipher(input, inputOffset, decodeLength) {

        // Ensure we will not run past the end of the buffer
        let remaining = input.byteLength - inputOffset;
        let length = remaining < decodeLength ? remaining : decodeLength;

        // Decipher in-place
        let keyIndex = 0;
        let keyLength = this.key.byteLength;
        for (let i = 0; i < length; i++) {
            let offset = inputOffset + i;
            input[offset] = (input[offset] - this.key[keyIndex]) & 0xff;
            keyIndex = (keyIndex + 1) % keyLength;
        }
    }
}
