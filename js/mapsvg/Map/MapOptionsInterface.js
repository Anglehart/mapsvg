export class ViewBox {
    constructor(x, y, width, height) {
        if (typeof x === "object") {
            if (x.hasOwnProperty("x") &&
                x.hasOwnProperty("y") &&
                x.hasOwnProperty("width") &&
                x.hasOwnProperty("height")) {
                this.x = typeof x.x === "string" ? parseFloat(x.x) : x.x;
                this.y = typeof x.y === "string" ? parseFloat(x.y) : x.y;
                this.width = typeof x.width === "string" ? parseFloat(x.width) : x.width;
                this.height = typeof x.height === "string" ? parseFloat(x.height) : x.height;
            }
            else if (typeof x === "object" && x.length && x.length === 4) {
                this.x = typeof x[0] === "string" ? parseFloat(x[0]) : x[0];
                this.y = typeof x[1] === "string" ? parseFloat(x[1]) : x[1];
                this.width = typeof x[2] === "string" ? parseFloat(x[2]) : x[2];
                this.height = typeof x[3] === "string" ? parseFloat(x[3]) : x[3];
            }
        }
        else {
            this.x = typeof x === "string" ? parseFloat(x) : x;
            this.y = typeof y === "string" ? parseFloat(y) : y;
            this.width = typeof width === "string" ? parseFloat(width) : width;
            this.height = typeof height === "string" ? parseFloat(height) : height;
        }
    }
    update(newViewBox) {
        this.x = newViewBox.x;
        this.y = newViewBox.y;
        this.width = newViewBox.width;
        this.height = newViewBox.height;
    }
    toString() {
        return this.x + " " + this.y + " " + this.width + " " + this.height;
    }
    toArray() {
        return [this.x, this.y, this.width, this.height];
    }
    clone() {
        return new ViewBox({ x: this.x, y: this.y, width: this.width, height: this.height });
    }
    fitsInViewBox(viewBox, atLeastByOneDimension) {
        if (atLeastByOneDimension === true) {
            return viewBox.width > this.width || viewBox.height > this.height;
        }
        else {
            return viewBox.width > this.width && viewBox.height > this.height;
        }
    }
    addPadding(padding) {
        if (padding.top) {
            this.y -= padding.top;
            this.height += padding.top;
        }
        if (padding.right) {
            this.width += padding.right;
        }
        if (padding.bottom) {
            this.height += padding.bottom;
        }
        if (padding.left) {
            this.x -= padding.left;
            this.width += padding.left;
        }
    }
}
export class GeoViewBox {
    constructor(sw, ne) {
        this.sw = sw;
        this.ne = ne;
    }
}
//# sourceMappingURL=MapOptionsInterface.js.map