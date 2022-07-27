// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class ImageAsset extends Asset {

    constructor(url) {
        super(url, null);
    }

    load(callback=null) {
        let self = this;
        this.data = new Image();
        this.callbacks.push(callback);
        function onLoaded() {
            self.callbacks.forEach(function(callback) {callback(self);});
        }
        function onError() {
            self.error = true;
            self.dispose();
            self.callbacks.forEach(function(callback) {callback(self);});
        }
        this.data.onload = onLoaded;
        this.data.onerror = onError;
        this.data.onabort = onError;
        this.data.ontimeout = onError;
        this.data.src = this.url;
    }
}
