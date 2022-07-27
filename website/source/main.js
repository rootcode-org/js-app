// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

class Main {

    constructor() {

        // Get app version string; this is embedded when a site version is pushed to S3
        let versionID = window["versionID"];
        if (versionID === undefined) versionID = "";

        // Determine path to asset files
        let assetPath = "assets/";
        if (versionID !== "") {
            assetPath = versionID + "/" + assetPath;
        }

        // Install global error handler
        window.onerror = (msg, url, lineNo) => {
            Log.error("Uncaught Exception: " + msg);
        };

        // Create the main canvas element
        let canvas = document.createElement("canvas");
        canvas.tabIndex = 1;               // need this in order to receive keyboard events
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 5;
        document.body.appendChild(canvas);

        // Initialize core systems
        assetManagerInstance.setPath(assetPath);
        keyboardInstance.attach(canvas);
        mouseInstance.attach(canvas);
        touchInstance.attach(canvas);
        entityManagerInstance.attach(canvas);
        fullscreenManagerInstance.attach(canvas);

        // Start frame updates
        frameManagerInstance.setCallback((frameTime) => {
            entityManagerInstance.updateAll(frameTime);
            entityManagerInstance.focusAll();
            entityManagerInstance.drawAll();
            mouseInstance.prepareForNextFrame();
        });

        // Add handler for window resize
        window.onresize = () => {
            if ((canvas.width !== window.innerWidth) || (canvas.height !== (window.innerHeight - 5))) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - 5;
                entityManagerInstance.drawAll();
            }
        };

        // Create test objects
        let textbox = new TextBox(32, 32);
        textbox.addText("Text String 01", canvas);
        textbox.addText("Text String 02", canvas);
        textbox.addText("Text String 03", canvas);
        textbox.addText("Text String 04", canvas);
        textbox.addText("Text String 05", canvas);
        textbox.addText("Text String 06", canvas);
        textbox.addText("Text String 07", canvas);
        textbox.addText("Text String 08", canvas);
        textbox.addText("Text String 09", canvas);
        textbox.addText("Text String 10", canvas);
        textbox.addText("Text String 11", canvas);
        textbox.addText("Text String 12", canvas);
        textbox.addText("Text String 13", canvas);
        textbox.addText("Text String 14", canvas);
        textbox.addText("Text String 15", canvas);
        textbox.addText("Text String 16", canvas);
        textbox.addText("Text String 17", canvas);
        textbox.addText("Text String 18", canvas);
        textbox.addText("Text String 19", canvas);
        textbox.addText("Text String 20", canvas);

        let button = new XButton(640, 64);
        let login_button = new LoginButton(640, 128);
        let fullscreen_button = new FullScreenButton(640, 192);
        let image = new XImage("small.png", 640, 256)

        // Make the html page visible
        document.body.style.backgroundColor = "#200000";
        document.body.style.visibility = "visible";
    }
}

/* Application entry point; executes when HTML page load completes */
window.onload = function() {
    window["main"] = new Main();
};
