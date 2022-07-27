// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class FullScreenButton extends XButton {

    constructor(x, y) {
        super(x, y);
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 32;
        this.color = "#40ff40";
        this.inFocus = false;
    }

    draw(context) {
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }

    testFocus(x, y) {
        return ((x >= this.x) && (x < this.x + this.width) && (y >= this.y) && (y < this.y + this.height));
    }

    // Special case handling for fullscreen.  Since fullscreen can only be requested from an event handler, we register
    // a special callback with the mouse manager which will be called when the left mouse button is released *if* this
    // button is in focus.  From this callback we can legally request full screen mode.
    onEnterFocus() {
        super.onEnterFocus();
        this.color = "#ffffff";
        mouseInstance.registerReleaseCallback(this.toggleFullScreen);
    }

    onExitFocus() {
        super.onExitFocus();
        this.color = "#40ff40";
        mouseInstance.registerReleaseCallback(null);
    }

    toggleFullScreen() {
        if (!fullscreenManagerInstance.isFullScreen()) {
            fullscreenManagerInstance.requestFullScreen();
        } else {
            fullscreenManagerInstance.exitFullScreen();
        }
    }
}
