import { Events } from "../Core/Events";
import { ScreenPoint, SVGPoint } from "../Location/Location";
import { ViewBox } from "../Map/MapOptionsInterface";
const $ = jQuery;
export class MapObject {
    constructor(element, mapsvg) {
        this.id = "";
        this.objects = [];
        this.events = new Events(this);
        this.element = element;
        this.mapsvg = mapsvg;
    }
    getBBox() {
        return new ViewBox(1, 2, 3, 4);
    }
    getGeoBounds() {
        const bbox = this.getBBox();
        const pointSW = new SVGPoint(bbox.x, bbox.y + bbox.height);
        const pointNE = new SVGPoint(bbox.x + bbox.width, bbox.y);
        const sw = this.mapsvg.converter.convertSVGToGeo(pointSW);
        const ne = this.mapsvg.converter.convertSVGToGeo(pointNE);
        return { sw: sw, ne: ne };
    }
    getComputedStyle(prop, elem) {
        elem = elem || this.element;
        return MapObject.getComputedStyle(prop, elem);
    }
    static getComputedStyle(prop, elem) {
        const _p1 = elem.getAttribute(prop);
        if (_p1) {
            return _p1;
        }
        const _p2 = elem.getAttribute("style");
        if (_p2) {
            const s = _p2.split(";");
            const z = s.filter(function (e) {
                e = e.trim();
                const attr = e.split(":");
                if (attr[0] == prop)
                    return true;
            });
            if (z.length) {
                return z[0].split(":").pop().trim();
            }
        }
        const parent = elem.parentElement;
        const elemType = parent ? parent.tagName : null;
        if (elemType && elemType != "svg")
            return MapObject.getComputedStyle(prop, parent);
        else
            return undefined;
    }
    getStyle(prop) {
        const _p1 = this.attr(prop);
        if (_p1) {
            return _p1;
        }
        const _p2 = this.attr("style");
        if (_p2) {
            const s = _p2.split(";");
            const z = s.filter(function (e) {
                var e = e.trim();
                if (e.indexOf(prop) === 0)
                    return e;
            });
            return z.length ? z[0].split(":").pop().trim() : undefined;
        }
        return "";
    }
    getCenter() {
        const x = this.element.getBoundingClientRect().left;
        const y = this.element.getBoundingClientRect().top;
        const w = this.element.getBoundingClientRect().width;
        const h = this.element.getBoundingClientRect().height;
        const point = new ScreenPoint(x + w / 2, y + h / 2);
        return point;
    }
    getCenterSVG() {
        const bbox = this.getBBox();
        const point = new SVGPoint(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
        return point;
    }
    getCenterLatLng(yShift) {
        yShift = yShift ? yShift : 0;
        const bbox = this.getBBox();
        const x = bbox.x + bbox.width / 2;
        const y = bbox.y + bbox.height / 2 - yShift;
        const point = new SVGPoint(x, y);
        return this.mapsvg.converter.convertSVGToGeo(point);
    }
    attr(v1, v2 = null) {
        const svgDom = this.element;
        if (typeof v1 == "object") {
            for (const key in v1) {
                const item = v1[key];
                if (typeof item === "string" || typeof item === "number") {
                    svgDom.setAttribute(key, "" + item);
                }
            }
        }
        else if (typeof v1 == "string" && (typeof v2 == "string" || typeof v2 == "number")) {
            svgDom.setAttribute(v1, "" + v2);
        }
        else if (v2 == undefined) {
            return svgDom.getAttribute(v1);
        }
    }
    setId(id) {
        if (id !== undefined) {
            this.id = id;
            this.element.setAttribute("id", id);
        }
    }
}
//# sourceMappingURL=MapObject.js.map