import { LocationAddress } from "./LocationAddress";
import { MapSVG } from "../Core/globals.js";
export class ScreenPoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
export class SVGPoint {
    constructor(x, y) {
        let _x, _y;
        if (typeof x === "object") {
            if (x.x && x.y) {
                _x = parseFloat(x.x + "");
                _y = parseFloat(x.y + "");
            }
            else {
                console.error("MapSVG: incorrect format of {x, y} object for SVGPoint.");
                _x = 0;
                _y = 0;
            }
        }
        else {
            _x = parseFloat(x + "");
            _y = parseFloat(y + "");
        }
        this.x = _x;
        this.y = _y;
    }
    toString() {
        return this.x + "," + this.y;
    }
}
export class GeoPoint {
    constructor(lat, lng) {
        let _lat, _lng;
        if (typeof lat === "object") {
            if (lat.lat && lat.lng) {
                _lat = parseFloat(lat.lat + "");
                _lng = parseFloat(lat.lng + "");
            }
            else {
                console.error("MapSVG: incorrect format of {lat, lng} object for GeoPoint.");
                _lat = 0;
                _lng = 0;
            }
        }
        else {
            _lat = parseFloat(lat + "");
            _lng = parseFloat(lng + "");
        }
        this.lat = _lat;
        this.lng = _lng;
    }
    toString() {
        return this.lat + "," + this.lng;
    }
}
export class Location {
    constructor(options) {
        this.update(options);
    }
    update(options) {
        if (options.object) {
            this.setObject(options.object);
        }
        if (options.img) {
            this.setImage(options.img);
        }
        if (options.address) {
            this.setAddress(options.address);
        }
        if (options.svgPoint) {
            this.setSvgPoint(options.svgPoint);
        }
        if (options.geoPoint) {
            this.setGeoPoint(options.geoPoint);
        }
    }
    setObject(object) {
        this.object = object;
    }
    setImage(imgUrl) {
        if (typeof imgUrl !== "string") {
            return;
        }
        let src = imgUrl.split("/").pop();
        if (imgUrl.indexOf("uploads") !== -1) {
            src = "uploads/" + src;
        }
        this.img = src;
        this.imagePath = this.getImageUrl();
        this.marker && this.marker && this.marker.setImage(this.imagePath);
    }
    getImageUrl() {
        if (this.img && this.img.indexOf("uploads/") === 0) {
            return MapSVG.urls.uploads + "markers/" + this.img.replace("uploads/", "");
        }
        else {
            return MapSVG.urls.root + "markers/" + (this.img || "_pin_default.png");
        }
    }
    setAddress(address) {
        this.address = new LocationAddress(address);
    }
    setSvgPoint(svgPoint) {
        this.svgPoint = svgPoint instanceof SVGPoint ? svgPoint : new SVGPoint(svgPoint);
        if (this.marker) {
            this.marker.setSvgPointFromLocation();
        }
    }
    setGeoPoint(geoPoint) {
        this.geoPoint = geoPoint instanceof GeoPoint ? geoPoint : new GeoPoint(geoPoint);
        if (this.marker) {
            this.marker.setSvgPointFromLocation();
        }
    }
    getMarkerImage() {
        if (this.img && this.img.indexOf("uploads/") === 0) {
            return MapSVG.urls.uploads + "markers/" + this.img.replace("uploads/", "");
        }
        else {
            return MapSVG.urls.root + "markers/" + (this.img || "_pin_default.png");
        }
    }
    getData() {
        const data = {
            img: this.img,
            imagePath: this.imagePath,
            markerImagePath: this.marker && this.marker.object
                ? this.marker.object.getMarkerImage()
                : this.imagePath,
            address: this.address,
        };
        if (this.geoPoint) {
            data.geoPoint = { lat: this.geoPoint.lat, lng: this.geoPoint.lng };
        }
        if (this.svgPoint) {
            data.svgPoint = { x: this.svgPoint.x, y: this.svgPoint.y };
        }
        return data;
    }
}
//# sourceMappingURL=Location.js.map