// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class FullScreenManager {

    constructor() {
        this.canvas = null;
    }

    attach(canvas) {

        this.canvas = canvas;

        function OnFullScreenChange() {
        }

        function OnFullScreenError() {
        }

        document.addEventListener("fullscreenchange", OnFullScreenChange);
        document.addEventListener("webkitfullscreenchange", OnFullScreenChange);
        document.addEventListener("mozfullscreenchange", OnFullScreenChange);
        document.addEventListener("ofullscreenchange", OnFullScreenChange);
        document.addEventListener("msfullscreenchange", OnFullScreenChange);

        canvas.addEventListener("fullscreenerror", OnFullScreenError);
        canvas.addEventListener("webkitfullscreenerror", OnFullScreenError);
        canvas.addEventListener("mozfullscreenerror", OnFullScreenError);
        canvas.addEventListener("ofullscreenerror", OnFullScreenError);
        canvas.addEventListener("msfullscreenerror", OnFullScreenError);
    }

    isFullScreen() {
        return (document.fullScreen || document.webkitIsFullScreen || document.mozFullScreen || document.oFullScreen || document.msFullScreen);
    }

    requestFullScreen() {
        // Must be called from an event handler or will not work
        if (this.canvas.requestFullScreen) {
            this.canvas.requestFullScreen();
        } else if (this.canvas.webkitRequestFullScreen) {
            this.canvas.webkitRequestFullScreen();
        } else if (this.canvas.mozRequestFullScreen) {
            this.canvas.mozRequestFullScreen();
        } else if (this.canvas.oRequestFullScreen) {
            this.canvas.oRequestFullScreen();
        } else if (this.canvas.msRequestFullScreen) {
            this.canvas.msRequestFullScreen();
        }
    }

    exitFullScreen() {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.oCancelFullScreen) {
            document.oCancelFullScreen();
        } else if (document.msCancelFullScreen) {
            document.msCancelFullScreen();
        }
    }
}

// create a single global instance
let fullscreenManagerInstance = new FullScreenManager();
