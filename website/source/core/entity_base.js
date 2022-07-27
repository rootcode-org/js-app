// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class EntityBase {

    constructor() {
        this.depth = 0;
        entityManagerInstance.addEntity(this);
    }

    setDepth(depth) {
        this.depth = depth;
    }

    dispose() {
        entityManagerInstance.removeEntity(this);
    }
}
