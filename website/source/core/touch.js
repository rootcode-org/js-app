// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class XTouch {          // 'X' is to disambiguate from DOM Touch class

    constructor() {
        this.x = 0;
        this.y = 0;
        this.isTouched = false;
    }

    attach(canvas) {

        let self = this;
        function onTouchStart(event) {
            event.preventDefault();
            self.isTouched = true;
            let touches = event.changedTouches;
            self.x = touches[0].pageX;
            self.y = touches[0].pageY;
        }

        function onTouchMove(event) {
            event.preventDefault();
            let touches = event.changedTouches;
            self.x = touches[0].pageX;
            self.y = touches[0].pageY;
        }

        function onTouchEnd(event) {
            event.preventDefault();
            self.isTouched = false;
        }

        function onTouchCancel(event) {
            event.preventDefault();
            self.isTouched = false;
        }

        function onTouchLeave(event) {
            event.preventDefault();
            self.isTouched = false;
        }

        canvas.addEventListener("ontouchstart", onTouchStart);
        canvas.addEventListener("ontouchmove", onTouchMove);
        canvas.addEventListener("ontouchend", onTouchEnd);
        canvas.addEventListener("ontouchcancel", onTouchCancel);
        canvas.addEventListener("ontouchleave", onTouchLeave);

    }

    isTouching() {
        return this.isTouched;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }
}

// create a single global instance
let touchInstance = new XTouch();