// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

const HOLD_THRESHOLD = 0.3;
const DOUBLE_CLICK_THRESHOLD = 0.3;

class EntityManager {

    constructor() {
        this.canvas = null;
        this.context2d = null;
        this.entities = [];
        this.currentFocus = null;
        this.focusHoldTime = 0.0;
        this.lastClickTime = -1;
    }

    attach(canvas) {
        this.canvas = canvas;
        this.context2d = canvas.getContext("2d");
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    removeEntity(entity) {
        let index = this.entities.indexOf(entity);
        let lastEntity = this.entities.pop();
        if (entity !== lastEntity) {
            this.entities[index] = lastEntity;
        }
        if (entity === this.currentFocus) {
            this.currentFocus = null;
        }
    }

    updateAll(frameTime) {
        // Update all entities
        this.entities.forEach(function(entity) {
            if (entity.update) {
                entity.update(frameTime);
            }
        });

        // Re-sort entities after update
        this.entities.sort(function(a, b) {
            return (a.depth - b.depth);
        });
    }

    drawAll() {
        let context = this.context2d;

        // Clear the canvas
        context.fillStyle = "rgb(0,0,64)";
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw all entities in depth order from back to front
        this.entities.forEach(function(entity) {
            if (entity.draw) {
                entity.draw(context);
            }
        });
    }

    createAllResources() {
        this.entities.forEach(function(entity) {
            if (entity.createResources) {
                entity.createResources();
            }
        });
    }

    destroyAllResources() {
        this.entities.forEach(function(entity) {
            if (entity.destroyResources) {
                entity.destroyResources();
            }
        });
    }

    setFocus(entity) {
        if (entity !== this.currentFocus) {
            this.clearFocus();
        }

        this.currentFocus = entity;
        if (entity.onEnterFocus !== undefined) {
            entity.onEnterFocus();
        }
    }

    clearFocus() {
        if (this.currentFocus) {
            if (this.currentFocus.onExitFocus !== undefined) {
                this.currentFocus.onExitFocus();
            }
            this.currentFocus = null;
        }
    }

    focusAll() {
        let x = mouseInstance.getX();
        let y = mouseInstance.getY();

        // Walk entity list in depth order from front to back
        for (let i = this.entities.length - 1; i >= 0; i--) {
            let entity = this.entities[i];
            if (entity.testFocus) {
                if (entity.testFocus(x,y) === true) {

                    if (entity === this.currentFocus) {
                        // Focus has not changed
                        let left = mouseInstance.getLeftState();
                        let edge = mouseInstance.getLeftEdge();
                        if (left) {
                            if (edge) {
                                if (entity.onTapDown) {
                                    entity.onTapDown();
                                }
                                this.focusHoldTime = 0;
                            } else {
                                let holdTime = this.focusHoldTime + frameManagerInstance.getFrameDeltaTime();
                                if ((this.focusHoldTime < HOLD_THRESHOLD) && (holdTime >= HOLD_THRESHOLD)) {
                                    if (entity.onTapHold) {
                                        entity.onTapHold();
                                    }
                                }
                                this.focusHoldTime = holdTime;
                            }
                        } else {
                            if (edge) {
                                if (entity.onTapRelease) {
                                    entity.onTapRelease();
                                }

                                if (this.focusHoldTime < HOLD_THRESHOLD) {
                                    // This counts as a click
                                    let appTime = frameManagerInstance.getAppElapsedTime();
                                    if (appTime < this.lastClickTime + DOUBLE_CLICK_THRESHOLD) {
                                        if (entity.onDoubleTap !== undefined) {
                                            entity.onDoubleTap();
                                        }
                                        this.lastClickTime = -1;
                                    } else {
                                        this.lastClickTime = appTime;
                                    }
                                }
                            }
                        }
                    } else {
                        // Focus has changed
                        this.setFocus(entity);
                    }

                    return;
                }
            }
        }

        // If we get here we didn't find an entity under the mouse so clear the focus
        this.clearFocus();
    }
}

// create a single global instance
let entityManagerInstance = new EntityManager();
