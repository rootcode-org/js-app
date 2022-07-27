// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class FrameManager {

    constructor() {

        // all times are in milliseconds
        this.appStartTime = window.performance.now();
        this.frameStartTime = this.appStartTime;
        this.frameDeltaTime = 0;
        this.frameCount = 0;
        this.callback = null;

        // Frame update function
        let self = this;
        function onFrame() {
            // Calculate time since last frame
            let currentTime = window.performance.now();
            self.frameDeltaTime = (currentTime - self.frameStartTime) / 1000;
            self.frameStartTime = currentTime;

            // Execute frame callback
            if (self.callback) self.callback(self.frameDeltaTime);

            // Count frames; do this after the frame callback
            self.frameCount += 1;

            // Request update on next frame
            if (updateMethod) updateMethod(onFrame);
        }

        // Start frame update
        let updateMethod = window.requestAnimationFrame ||
                           window.mozRequestAnimationFrame ||
                           window.oRequestAnimationFrame ||
                           window.msRequestAnimationFrame;
        if (updateMethod) updateMethod(onFrame);
        else window.setInterval(onFrame, 1000 / 60);
    }

    setCallback(callback) {
        this.callback = callback;
    }

    getFrameDeltaTime() {
        return this.frameDeltaTime;
    }

    getFrameCount() {
        return this.frameCount;
    }

    getAppStartTime() {
        return this.appStartTime;
    }

    getAppElapsedTime() {
        return this.frameStartTime - this.appStartTime;
    }
}

// create a single global instance
let frameManagerInstance = new FrameManager();