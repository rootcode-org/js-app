// Copyright is waived. No warranty is provided. Unrestricted use and modification is permitted.

// base class for all displayable elements
class TextBoxDisplayable {
    super() {
    }
}

// A word element
class TextBoxWord extends TextBoxDisplayable {
    constructor(text) {
        super();
        this.text = text;
    }
}

// A space element (contains one or more space characters)
class TextBoxSpace extends TextBoxDisplayable {
    constructor(text) {
        super();
        this.text = text;
    }
}

// A tab element (contains one or more tab characters)
class TextBoxTab extends TextBoxDisplayable {
    constructor(text) {
        super();
        this.text = text;
    }
}

// A format element
class TextBoxFormat extends TextBoxDisplayable {
    constructor() {
        super();
    }
}

// A substitutable value
class TextBoxSubstitution extends TextBoxDisplayable {
    constructor() {
        super();
    }
}

// A hyperlink
class TextBoxHyperlink extends TextBoxDisplayable {
    constructor() {
        super();
    }
}

// A fragment is a collection of displayable elements
class TextBoxFragment {
    constructor() {
    }
}

// A text style
class TextBoxStyle {
    constructor() {
    }
}

// A region defining a clickable area for a displayable element
class TextBoxHitRegion {
    constructor() {
    }
}

// Base class for individual entries that are added or removed from the TextBox
class TextBoxEntry {
    constructor() {
    }
}

// An entry that fits on a single line
class TextBoxLine extends TextBoxEntry {
    constructor() {
        super();
    }
}

// An entry that spans multiple lines
class TextBoxMultiLine extends TextBoxEntry {
    constructor() {
        super();
    }
}

// An entry that displays a list
class TextBoxList extends TextBoxEntry {
    constructor(useColumns=false) {
        super();
    }
}

// An entry that displays an image
class TextBoxImage extends TextBoxEntry {
    constructor(useColumns=false) {
        super();
    }
}

// A handle for a text box entry that allows the entry to be dragged and/or opens an action menu
class TextBoxEntryHandle {
    constructor() {
    }
}

// A highlight for a text box entry
class TextBoxEntryHighlight {
    constructor() {
    }
}

// A highlight for text content
class TextBoxTextHighlight {
    constructor() {
    }
}

// A menu item
class TextBoxMenuItem {
    constructor() {
    }
}

// A menu
class TextBoxMenu {
    constructor() {
    }
}


class TextBox extends EntityBase {

    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.width = 512;
        this.height = 256;
        this.fontSizeInPoints = 14;
        this.fontSizeInPixels = 19; // is this accurate? https://websemantics.uk/articles/font-size-conversion/
        this.fontFace = "Calibri";
        this.bgColor = "#000000";
        this.textColor = "#FFFFFF";
        this.innerBorderWidth = 2;
        this.lineSpacingInPixels = 2;
        this.scrollY = 0;
        this.maxLines = 100;
        this.lines = [];
        this.wrappedLines = [];
        this.wrappedLineCount = 0;
    }

    addText(text, canvas) {
        this.lines.push(text);
        this._wrapLine(text, canvas);

        // Trim history
        if (this.lines.length > this.maxLines) {
            this.lines.shift();
            this.wrappedLines.shift();
        }
    }

    _wrapLine(text, canvas) {

        let context = canvas.getContext("2d");
        context.save();
        context.font = this.fontSizeInPoints +"pt " + this.fontFace;

        let lines = [];
        for (let line of text.split("\r\n")) {
            let start = 0;
            let i = 0;
            let fittingLine = "";
            let fittingIndex = 0;
            let partialLine = "";
            let isComplete = false;
            while (!isComplete) {

                // Find next word
                while (i < line.length && line[i] !== '\r' && line[i] !== '\n' && line[i] !== '\t' && line[i] !== ' ') i++;

                // Calculate width of partial line
                partialLine = line.slice(start, i);
                let partialLineWidth = context.measureText(partialLine).width;
                if (partialLineWidth < this.width - (this.innerBorderWidth * 2)) {
                    // The partial line fits so save it
                    fittingLine = partialLine;
                    // Skip whitespace
                    while (i < line.length && (line[i] === '\r' || line[i] === '\n' || line[i] === '\t' || line[i] === ' ')) i++;
                    // Save start index of next word
                    fittingIndex = i;
                } else {
                    // Line overflowed so push the last partial line that fit
                    lines.push(fittingLine);
                    // Start next line from end of previous line
                    start = fittingIndex;
                    fittingLine = "";
                }

                // If we reached the end then push any remnant
                if (i === line.length) {
                    if (fittingLine !== "") {
                        lines.push(fittingLine);
                    }
                    isComplete = true;
                }
            }
        }
        this.wrappedLines.push(lines);
        this.wrappedLineCount += lines.length;
        context.restore();
    }

    update(frameTime) {
        let textHeight = (this.wrappedLineCount * this.fontSizeInPixels) + ((this.wrappedLineCount - 1) * this.lineSpacingInPixels);
        let maxScrollY = textHeight - this.height + (this.innerBorderWidth * 2);
        if (maxScrollY < 0) maxScrollY = 0;

        if (keyboardInstance.getKey("w")) {
            this.scrollY -= frameTime * 256;
            if (this.scrollY < 0) this.scrollY = 0;
        }
        if (keyboardInstance.getKey("s")) {
            this.scrollY += frameTime * 256;
            if (this.scrollY > maxScrollY) this.scrollY = maxScrollY;
        }
    }

    draw(context) {
        context.save();

        // Clear textbox
        context.fillOpacity = 1.0;
        context.fillStyle = this.bgColor;
        context.fillRect(this.x, this.y, this.width, this.height);

        // Set clipping region for text
        context.rect(this.x + this.innerBorderWidth,
                     this.y + this.innerBorderWidth,
                     this.width - (this.innerBorderWidth * 2),
                     this.height - (this.innerBorderWidth * 2));
        context.clip();

        // Draw text
        context.font = this.fontSizeInPoints +"pt " + this.fontFace;
        context.fillStyle = this.textColor;
        context.textBaseline = "top";
        let x = this.x + this.innerBorderWidth;
        let y = this.y + this.innerBorderWidth - this.scrollY;
        for (let lines of this.wrappedLines) {
            for (let line of lines) {
                if (y >= this.y) {
                    context.fillText(line, x, y);
                }
                y += this.fontSizeInPixels + this.lineSpacingInPixels;
                if (y >= this.y + this.height - this.fontSizeInPixels) break;
            }
            if (y >= this.y + this.height - this.fontSizeInPixels) break;
        }
        context.restore();
    }

    testFocus(x, y) {
        return ((x >= this.x) && (x < this.x + this.width) && (y >= this.y) && (y < this.y + this.height));
    }
}
