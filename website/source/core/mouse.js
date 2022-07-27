// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class Mouse {

    constructor() {

        this.x = 0;
        this.y = 0;
        this.dx = 0;
        this.dy = 0;

        this.leftState = false;
        this.leftLastState = false;

        this.middleState = false;
        this.middleLastState = false;

        this.rightState = false;
        this.rightLastState = false;

        this.wheelDeltaX = 0;
        this.wheelDeltaY = 0;

        this.canvasHasFocus = false;
        this.releaseCallback = null;
    }

    attach(canvas) {

        let self = this;
        function onMouseOver(event) {
            self.canvasHasFocus = true;
        }

        function onMouseOut(event) {
            self.canvasHasFocus = false;
        }

        function onMouseMove(event) {
            self.dx += event.clientX - self.x;
            self.x = event.clientX;
            self.dy += event.clientY - self.y;
            self.y = event.clientY;
        }

        function onMouseDown(event) {
            if (event.button === 0) {
                self.leftState = true;
            } else if (event.button === 1) {
                self.middleState = true;
            } else if (event.button === 2) {
                self.rightState = true;
            }
        }

        function onMouseUp(event) {
            if (event.button === 0) {
                self.leftState = false;
            } else if (event.button === 1) {
                self.middleState = false;
            } else if (event.button === 2) {
                self.rightState = false;
            }

            if (self.releaseCallback) {
                self.releaseCallback();
            }
        }

        function onMouseWheel(event) {
            self.wheelDeltaX = event.wheelDeltaX;
            self.wheelDeltaY = event.wheelDeltaY;
        }

        canvas.addEventListener("mouseover", onMouseOver);
        canvas.addEventListener("mouseout", onMouseOut);
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mousewheel", onMouseWheel);
    }

    prepareForNextFrame() {
        this.dx = 0;
        this.dy = 0;
        this.leftLastState = this.leftState;
        this.middleLastState = this.middleState;
        this.rightLastState = this.rightState;
    }

    registerReleaseCallback(callback) {
        this.releaseCallback = callback;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    getDeltaX() {
        return this.dx;
    }

    getDeltaY() {
        return this.dy;
    }

    getLeftState() {
        return this.leftState;
    }

    getLeftEdge() {
        return (this.leftState !== this.leftLastState);
    }

    getMiddleState() {
        return this.middleState;
    }

    getMiddleEdge() {
        return (this.middleState !== this.middleLastState);
    }

    getRightState() {
        return this.rightState;
    }

    getRightEdge() {
        return (this.rightState !== this.rightLastState);
    }

    getWheelDeltaX() {
        return this.wheelDeltaX;
    }

    getWheelDeltaY() {
        return this.wheelDeltaY;
    }
}

// create a single global instance
let mouseInstance = new Mouse();