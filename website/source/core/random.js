// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class Random {

    constructor(seed = 0x444f4368) {
        this.seed = seed;
    }

    generate() {
        this.seed = ((this.seed * 0x19660d) + 0x3c6ef35f) % 0x100000000;
        return this.seed;
    }

    generateInRange(minimum, maximum) {
        return (this.generate() % (1 + maximum - minimum)) + minimum;
    }

    generateArray(length) {

        // Generate an array of incrementing values
        let i;
        let x = new Uint8Array(new ArrayBuffer(length));
        for (i = 0; i < length; i++) {
            x[i] = i;
        }

        // Shuffle the array with Fisher-Yates shuffle
        for (i = length - 1; i > 0; i--) {
            let j = this.generateInRange(0, i);
            let t = x[j];
            x[j] = x[i];
            x[i] = t;
        }
        return x;
    }
}
