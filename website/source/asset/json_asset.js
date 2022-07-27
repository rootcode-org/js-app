// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class JSONAsset extends Asset {

    constructor(url) {
        super(url, BODY_TYPES.JSON);
    }

    parse(data) {
        return data;
    }
}
