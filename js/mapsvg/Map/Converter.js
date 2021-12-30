import { GeoPoint, ScreenPoint, SVGPoint } from "../Location/Location";
class Converter {
    constructor(mapElement, defViewBox, viewBox, geoViewBox) {
        this.mapElement = mapElement;
        this.defViewBox = defViewBox;
        this.viewBox = viewBox;
        this.yShift = 0;
        if (geoViewBox) {
            this.setGeoViewBox(geoViewBox);
        }
    }
    setYShift() {
        if (this.defViewBox.width === 20426) {
            this.yShift = 0;
            return;
        }
        if (this.geoViewBox) {
            const topLeftPoint = this.convertGeoToSVG(this.geoViewBox.ne);
            this.yShift = topLeftPoint.y - this.defViewBox.y;
        }
    }
    setGeoViewBox(geoViewBox) {
        this.geoViewBox = geoViewBox;
        this.mapLonDelta = this.geoViewBox.ne.lng - this.geoViewBox.sw.lng;
        this.mapLatBottomDegree = (this.geoViewBox.sw.lat * Math.PI) / 180;
        this.worldMapWidth = (this.defViewBox.width / this.mapLonDelta) * 360;
        this.worldMapRadius = ((this.defViewBox.width / this.mapLonDelta) * 360) / (2 * Math.PI);
        this.setYShift();
    }
    setWorldShift(on) {
        this.worldShift = on;
    }
    getScale() {
        return this.mapElement.clientWidth / this.viewBox.width;
    }
    convertSVGToPixel(svgPoint) {
        const scale = this.getScale();
        let shiftXByGM = 0;
        const shiftYByGM = 0;
        if (this.worldShift) {
            if (this.viewBox.x - this.defViewBox.x > this.defViewBox.width) {
                shiftXByGM =
                    this.worldMapWidth *
                        Math.floor((this.viewBox.x - this.defViewBox.x) / this.defViewBox.width);
            }
        }
        return new ScreenPoint((svgPoint.x - this.viewBox.x + shiftXByGM) * scale, (svgPoint.y - this.viewBox.y + shiftYByGM) * scale);
    }
    convertPixelToSVG(screenPoint) {
        const scale = this.getScale();
        return new SVGPoint(screenPoint.x / scale + this.viewBox.x, screenPoint.y / scale + this.viewBox.y);
    }
    convertGeoToSVG(geoPoint) {
        if (!this.geoViewBox) {
            throw new Error("Can't do convertGeoToSVG() - geoViewBox is not provided.");
        }
        let x = (geoPoint.lng - this.geoViewBox.sw.lng) * (this.defViewBox.width / this.mapLonDelta);
        const lat = (geoPoint.lat * Math.PI) / 180;
        const mapOffsetY = (this.worldMapRadius / 2) *
            Math.log((1 + Math.sin(this.mapLatBottomDegree)) / (1 - Math.sin(this.mapLatBottomDegree)));
        let y = this.defViewBox.height -
            ((this.worldMapRadius / 2) * Math.log((1 + Math.sin(lat)) / (1 - Math.sin(lat))) -
                mapOffsetY);
        x += this.defViewBox.x;
        y += this.defViewBox.y;
        y -= this.yShift;
        return new SVGPoint(x, y);
    }
    convertSVGToGeo(svgPoint) {
        if (!this.geoViewBox) {
            throw new Error("Can't do convertSVGToGeo() - geoViewBox is not provided.");
        }
        const tx = svgPoint.x - this.defViewBox.x;
        const ty = svgPoint.y - this.defViewBox.y;
        const mapOffsetY = (this.worldMapRadius / 2) *
            Math.log((1 + Math.sin(this.mapLatBottomDegree)) / (1 - Math.sin(this.mapLatBottomDegree)));
        const equatorY = this.defViewBox.height + mapOffsetY;
        const a = (equatorY - ty) / this.worldMapRadius;
        let lat = (180 / Math.PI) * (2 * Math.atan(Math.exp(a)) - Math.PI / 2);
        let lng = this.geoViewBox.sw.lng + (tx / this.defViewBox.width) * this.mapLonDelta;
        lat = parseFloat(lat.toFixed(6));
        lng = parseFloat(lng.toFixed(6));
        return new GeoPoint(lat, lng);
    }
}
export { Converter };
//# sourceMappingURL=Converter.js.map