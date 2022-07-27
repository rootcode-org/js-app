// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class XImage extends EntityBase {      // 'X' is to disambiguate from DOM Image class

    constructor(url, x, y) {
        super();
        this.asset = null;
        this.x = x;
        this.y = y;
        this.width = 128;
        this.height = 128;
        this.inHold = false;

        let self = this;
        assetManagerInstance.loadImage(url, function(asset) {
            self.asset = asset;
            self.width = asset.data.width;
            self.height = asset.data.height;
        });
    }

    update(frameTime) {
        if (this.inHold) {
            this.x += mouseInstance.getDeltaX();
            this.y += mouseInstance.getDeltaY();
        }
    }

    draw(context) {
        if (this.asset && this.asset.data) {
            context.drawImage(this.asset.data, this.x, this.y);
        }
    }

    testFocus(x, y) {
        return ((x >= this.x) && (x < this.x + this.width) && (y >= this.y) && (y < this.y + this.height));
    }

    onExitFocus() {
        this.inHold = false;
    }

    onTapRelease() {
        this.inHold = false;
    }

    onTapHold() {
        this.inHold = true;
    }

    dispose() {
        if (this.asset) this.asset.dispose();
        this.asset = null;
        super.dispose();
    }
}
