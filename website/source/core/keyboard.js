// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class XKeyboard {

    constructor() {
        this.keyState = {};
        this.keyFrame = {};
    }

    attach(canvas) {

        let self = this;
        function onKeyDown(event) {
            let code = event.key;
            if (!self.keyState[code]) {
                self.keyFrame[code] = frameManagerInstance.getFrameCount();
            }
            self.keyState[code] = true;
        }

        function onKeyUp(event) {
            let code = event.key;
            if (self.keyState[code]) {
                self.keyFrame[code] = frameManagerInstance.getFrameCount();
            }
            self.keyState[code] = false;
        }

        canvas.addEventListener("keydown", onKeyDown);
        canvas.addEventListener("keyup", onKeyUp);
    }

    getKey(code) {
        return this.keyState[code];
    }

    getEdge(code) {
        return (this.keyFrame[code] === frameManagerInstance.getFrameCount());
    }
}

// create a single global instance
let keyboardInstance = new XKeyboard();