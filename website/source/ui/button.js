// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class XButton extends EntityBase {     // 'X' is to disambiguate from DOM Button class

    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.width = 128;
        this.height = 48;
        this.color = "#c80000";
        this.inHold = false;
    }

    update(frameTime) {
        if (this.inHold) {
            this.x += mouseInstance.getDeltaX();
            this.y += mouseInstance.getDeltaY();
        }

    }

    draw(context) {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }

    testFocus(x, y) {
        return ((x >= this.x) && (x < this.x + this.width) && (y >= this.y) && (y < this.y + this.height));
    }

    onEnterFocus() {
        this.color = "#00c800";
    }

    onExitFocus() {
        this.color = "#c80000";
        this.inHold = false;
    }

    onTapDown() {
        this.color = "#ffffff";
    }

    onTapRelease() {
        this.color = "#00c800";
        this.inHold = false;
    }

    onTapHold() {
        this.color = "#808080";
        this.inHold = true;
    }

    onDoubleTap() {
        this.color = "#000000";
    }
}
