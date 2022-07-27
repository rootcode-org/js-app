// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class AssetManager {

    constructor() {
        this.assetPath = "";
        this.assets = {};
        this.reference_counts = {};
    }

    setPath(path) {
        this.assetPath = path;
    }

    loadImage(url, callback) {
        this.loadAsset(ImageAsset, url, callback);
    }

    loadJSON(url, callback) {
        this.loadAsset(JSONAsset, url, callback);
    }

    loadAsset(assetClass, url, callback) {
        let asset = this.assets[url];
        if (!asset) {
            // Asset is not loaded so load it now
            let fullPath = this.assetPath + url;
            asset = new assetClass(fullPath);
            this.assets[url] = asset;
            this.reference_counts[url] = 1;
            asset.load(callback);
        } else {
            // asset already exists; it must be in one of the following states;
            // - loaded successfully; in this case issue the callback immediately
            // - still loading; in this case provide the callback to the asset to issue when load has completed
            // - previous load failed on an error; in this case issue the callback immediately
            this.reference_counts[url] += 1;
            if (!asset.error) {
                if (!asset.data) {
                    // asset is still loading; append the callback to execute on load completion
                    if (callback) asset.addCallback(callback);
                    return;
                }
            }

            // Asset either loaded successfully or failed to load previously; execute the callback immediately
            if (callback) callback(asset);
        }
    }

    unloadAsset(url) {
        if (url in this.assets) {
            this.reference_counts[url] -= 1;
            if (this.reference_counts[url] === 0) {
                this.assets[url].dispose();
                delete this.assets[url];
            }
        }
    }
}

// create a single global instance
let assetManagerInstance = new AssetManager();
