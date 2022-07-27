// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class LoginButton extends XButton {

    constructor(x, y) {
        super(x, y);
        this.width = 186;
        this.height = 24;
        this.opacity = 0;

        // Instance state machine
        let states = {
            "FadeIn": [0, null, this.fadeInUpdate, null],
            "FadeOut": [0, null, this.fadeOutUpdate, null]
        };
        this.stateMachine = new StateMachine(this, states, "FadeIn");
    }

    update(frameTime) {
        super.update(frameTime);
        this.stateMachine.update();
    }

    draw(context) {
        let gradient = context.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0.0, "#c0c040");
        gradient.addColorStop(1.0, "#404020");
        context.save();
        context.globalAlpha = this.opacity;
        context.fillStyle = gradient;
        context.fillOpacity = 1.0;
        context.fillRect(this.x, this.y, this.width, this.height);
        context.fillStyle = "#FFFFFF";
        context.font = "14pt Calibri";
        context.fillText("Login", this.x + 8, this.y + 17);
        context.restore();
    }

    resize(width, height) {
        //this.canvas.style.left = (width - this.canvas.width - 16) + "px";
    }

    testFocus(x, y) {
        return ((x >= this.x) && (x < this.x + this.width) && (y >= this.y) && (y < this.y + this.height));
    }

    onEnterFocus() {
        this.opacity = 1.0;
    }

    onExitFocus() {
        this.opacity = 0.8;
    }

    onTapRelease() {
        this.stateMachine.requestState("FadeOut");
    }

    fadeInUpdate() {
        if (this.opacity < 0.8) {
            this.opacity += 0.04;
            if (this.opacity >= 0.8) {
                this.opacity = 0.8;
                this.stateMachine.requestState(null);
            }
        }
    }

    fadeOutUpdate() {
        this.opacity -= 0.04;
        if (this.opacity <= 0) {
            this.opacity = 0;
            this.dispose();
        }
    }
}
