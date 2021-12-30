import { Events } from "../Core/Events";
import { MapSVGMap } from "../Map/Map";
import { GeoPoint, ScreenPoint, SVGPoint } from "../Location/Location";
import { ViewBox } from "../Map/MapOptionsInterface";
const $ = jQuery;

/**
 * Abstract MapObject class. Extended by {@link #region|MapSVG.Region} & {@link #marker|MapSVG.Marker}
 * @abstract
 * @param {object} jQueryObject
 * @param {MapSVG.Map} mapsvg
 */
export class MapObject {
    id: string;
    objects: any[];
    events: Events;
    element: HTMLElement | SVGElement;
    mapsvg: MapSVGMap;

    constructor(element: HTMLElement | SVGElement | null, mapsvg: MapSVGMap) {
        this.id = "";
        this.objects = [];
        this.events = new Events(this);
        this.element = element;
        //        this.elemType = element.tagName;
        this.mapsvg = mapsvg;
    }

    /**
     * Returns bounding box of an object in SVG coordinates
     * @returns {*[]} - [x,y,width,height]
     * @abstract
     * @private
     */
    getBBox(): ViewBox {
        return new ViewBox(1, 2, 3, 4);
    }
    /**
     * Returns geo-bounds of an object - South-West & North-East points.
     * @returns {{sw: (number[]), ne: (number[])}}
     */
    getGeoBounds(): { sw: GeoPoint; ne: GeoPoint } {
        const bbox = this.getBBox();
        const pointSW = new SVGPoint(bbox.x, bbox.y + bbox.height);
        const pointNE = new SVGPoint(bbox.x + bbox.width, bbox.y);
        const sw = this.mapsvg.converter.convertSVGToGeo(pointSW);
        const ne = this.mapsvg.converter.convertSVGToGeo(pointNE);

        return { sw: sw, ne: ne };
    }
    /**
     * Returns style of a given property of an SVG object
     * @param {string} prop - property name
     * @param {object} elem - SVG object
     * @returns {string} - style
     */
    getComputedStyle(prop: string, elem?: SVGElement | HTMLElement): string {
        elem = elem || this.element;
        return MapObject.getComputedStyle(prop, elem);
    }

    static getComputedStyle(prop: string, elem?: SVGElement | HTMLElement): string {
        const _p1: string = elem.getAttribute(prop);
        if (_p1) {
            return _p1;
        }

        const _p2: string = elem.getAttribute("style");
        if (_p2) {
            const s = _p2.split(";");
            const z = s.filter(function (e) {
                e = e.trim();
                const attr = e.split(":");
                if (attr[0] == prop) return true;
            });
            if (z.length) {
                return z[0].split(":").pop().trim();
            }
        }

        const parent = elem.parentElement;
        const elemType = parent ? parent.tagName : null;

        if (elemType && elemType != "svg") return MapObject.getComputedStyle(prop, parent);
        else return undefined;
    }
    /**
     * Returns style of a property of the SVG object
     * @param {string} prop - property name
     * @returns {string}
     */
    getStyle(prop: string) {
        const _p1 = this.attr(prop);
        if (_p1) {
            return _p1;
        }
        const _p2 = this.attr("style");
        if (_p2) {
            const s = _p2.split(";");
            const z = s.filter(function (e) {
                var e = e.trim();
                if (e.indexOf(prop) === 0) return e;
            });

            return z.length ? z[0].split(":").pop().trim() : undefined;
        }
        return "";
    }
    /**
     * Returns center of an object in pixel coordinates
     * @returns {number[]} - [x,y]
     */
    getCenter(): ScreenPoint {
        const x = this.element.getBoundingClientRect().left;
        const y = this.element.getBoundingClientRect().top;
        const w = this.element.getBoundingClientRect().width;
        const h = this.element.getBoundingClientRect().height;
        const point = new ScreenPoint(x + w / 2, y + h / 2);
        return point;
    }
    /**
     * Returns center of an object in SVG coordinates
     * @returns {{x: number, y: number}}
     */
    getCenterSVG(): SVGPoint {
        const bbox = this.getBBox();
        const point = new SVGPoint(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
        return point;
    }
    /**
     * Returns center of an object in geo-coordinates
     * @returns {{lat: number, lng: number}}
     */
    getCenterLatLng(yShift) {
        yShift = yShift ? yShift : 0;
        const bbox = this.getBBox();
        const x = bbox.x + bbox.width / 2;
        const y = bbox.y + bbox.height / 2 - yShift;
        const point = new SVGPoint(x, y);
        return this.mapsvg.converter.convertSVGToGeo(point);
    }
    /**
     * Sets attribute of an SVG object
     * @param {string|object} v1 - attribute name or object: {name: value, name: value}
     * @param {string|number} v2 - value
     * @returns {*}
     */
    attr(v1, v2 = null) {
        const svgDom = this.element;

        if (typeof v1 == "object") {
            for (const key in v1) {
                const item = v1[key];
                if (typeof item === "string" || typeof item === "number") {
                    svgDom.setAttribute(key, "" + item);
                }
            }
        } else if (typeof v1 == "string" && (typeof v2 == "string" || typeof v2 == "number")) {
            svgDom.setAttribute(v1, "" + v2);
        } else if (v2 == undefined) {
            return svgDom.getAttribute(v1);
        }
    }
    /**
     * Set ID of an object
     * @param {string} id
     */
    setId(id: string) {
        if (id !== undefined) {
            this.id = id;
            this.element.setAttribute("id", id);
        }
    }
}
