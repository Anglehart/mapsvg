import { MapSVG } from "../Core/globals.js";
import { MapObject } from "../MapObject/MapObject.js";
import { Location, SVGPoint, GeoPoint, ScreenPoint } from "../Location/Location.js";
import { ViewBox } from "../Map/MapOptionsInterface.js";
import { CustomObject } from "../Object/CustomObject.js";
import { type } from "os";
const $ = jQuery;

/**
 * Marker class
 * @extends MapObject
 * @param params
 * @constructor
 *
 * @example
 * var location = new MapSVG.Location({
 *   lat: 55.22,
 *   lng: 64.12,
 *   img: "/path/to/image.png"
 *  });
 *
 * var marker = new MapSVG.Marker({
 *   location: location,
 *   mapsvg: mapsvgInstance
 * });
 *
 * // The marker is created but still not added to the map. Let's add it:
 * mapsvg.markerAdd(marker);
 *
 */
export class Marker extends MapObject {
    src: string;
    location: Location;
    svgPoint?: SVGPoint;
    geoPoint?: GeoPoint;
    screenPoint?: ScreenPoint;
    element: HTMLElement;
    label: HTMLElement;
    image: HTMLElement;
    width: number;
    height: number;
    selected: boolean;
    object: CustomObject;
    centered: boolean;
    altAttr: string;
    private svgPointBeforeDrag: SVGPoint;

    mapped?: boolean;
    needToRemove?: boolean;
    moving?: boolean;
    bubble: HTMLElement;
    bubbleMode: boolean;
    visible: boolean;

    constructor(params) {
        super(null, params.mapsvg);

        this.src = params.location.getMarkerImageUrl();

        this.element = $("<div />").addClass("mapsvg-marker")[0];
        this.image = $('<img src="' + this.src + '" />').addClass("mapsvg-marker-image")[0];
        $(this.element).append(this.image);

        this.location = params.location;
        this.location.marker = this;
        this.mapsvg = params.mapsvg;
        params.object && this.setObject(params.object);

        if (params.width && params.height) {
            this.setSize(params.width, params.height);
        } else {
            this.setSize(15, 24);
        }

        this.setId(this.mapsvg.markerId());
        this.setSvgPointFromLocation();

        this.setImage(this.src);

        this.setAltAttr();
    }

    setSize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        this.setCentered(this.width === this.height);
    }

    setSvgPointFromLocation(): void {
        const svgPoint =
            this.location.geoPoint &&
            this.location.geoPoint.lat !== 0 &&
            this.location.geoPoint.lng !== 0
                ? this.mapsvg.converter.convertGeoToSVG(this.location.geoPoint)
                : this.location.svgPoint;
        if (svgPoint) {
            this.setSvgPoint(svgPoint);
        }
    }

    /**
     * Set ID of the Marker
     * @param {string} id
     */
    setId(id: string | number): void {
        MapObject.prototype.setId.call(this, id);
        this.mapsvg.markers.reindex();
    }
    /**
     * Get SVG bounding box of the Marker
     * @returns {ViewBox}
     */
    getBBox(): ViewBox {
        if (this.centered) {
            return new ViewBox(
                this.svgPoint.x - this.width / 2 / this.mapsvg.scale,
                this.svgPoint.y - this.height / 2 / this.mapsvg.scale,
                this.width / this.mapsvg.scale,
                this.height / this.mapsvg.scale
            );
        } else {
            return new ViewBox(
                this.svgPoint.x - this.width / 2 / this.mapsvg.scale,
                this.svgPoint.y - this.height / this.mapsvg.scale,
                this.width / this.mapsvg.scale,
                this.height / this.mapsvg.scale
            );
        }
    }
    /**
     * Get Marker options
     * @returns {{id: string, src: string, svgPoint: SVGPoint, geoPoint: GeoPoint}}
     */
    getOptions(): { id: string; src: string; svgPoint: SVGPoint; geoPoint: GeoPoint } {
        const o = {
            id: this.id,
            src: this.src,
            svgPoint: this.svgPoint,
            geoPoint: this.geoPoint,
        };
        $.each(o, function (key, val) {
            if (val == undefined) {
                delete o[key];
            }
        });
        return o;
    }
    /**
     * Update marker settings
     * @param {object} data - Options
     */
    update(data): void {
        for (const key in data) {
            // check if there's a setter for a property
            const setter = "set" + MapSVG.ucfirst(key);
            if (setter in this) this[setter](data[key]);
        }
    }
    /**
     * Set image of the Marker
     * @param {string} src
     */
    setImage(src: string): void {
        if (!src) return;
        src = MapSVG.safeURL(src);
        const img = new Image();
        const marker = this;
        this.src = src;
        if (marker.image.getAttribute("src") !== "src") {
            marker.image.setAttribute("src", src);
        }
        img.onload = function () {
            marker.setSize((<HTMLImageElement>this).width, (<HTMLImageElement>this).height);
            marker.adjustScreenPosition();
        };
        img.src = src;
        if (this.location && this.location.imagePath !== src) {
            this.location.setImage(src);
        }
        this.events.trigger("change");
    }

    /**
     * Set 'alt' attribute of the Marker
     */
    setAltAttr(): void {
        const marker = this;

        marker.altAttr =
            typeof marker.object != "undefined" &&
            typeof marker.object.title != "undefined" &&
            marker.object.title !== ""
                ? marker.object.title
                : marker.id;
        marker.element.setAttribute("alt", marker.altAttr);
    }

    /**
     * Set x/y coordinates of the Marker
     * @param {SVGPoint} svgPoint
     */
    setSvgPoint(svgPoint: SVGPoint): void {
        this.svgPoint = svgPoint;

        // if (this.location) {
        //     this.location.setSvgPoint(this.svgPoint);
        // }
        // if (this.mapsvg.mapIsGeo) {
        //     this.geoPoint = this.mapsvg.converter.convertSVGToGeo(this.svgPoint);
        //     this.location.setGeoPoint(this.geoPoint);
        // }

        this.adjustScreenPosition();
        this.events.trigger("change");
    }

    /**
     * Moves marker to a point.
     * @private
     * @param {Array} xy
     */
    /*
    moveSvgPositionToClick = function (screen) {

        var _data = this.mapsvg.getData();
        var markerOptions = {};

        xy[0] = xy[0] + _data.viewBox[0];
        xy[1] = xy[1] + _data.viewBox[1];


        if (_data.mapIsGeo)
            this.geoCoords = this.mapsvg.converter.convertSVGToGeo(xy[0], xy[1]);

        markerOptions.xy = xy;
        this.update(markerOptions);
    };
     */

    /**
     * Adjusts position of the Marker. Called on map zoom and on map container resize.
     */
    adjustScreenPosition(): void {
        const pos = this.mapsvg.converter.convertSVGToPixel(this.svgPoint);

        pos.x -= this.width / 2;
        pos.y -= !this.centered ? this.height : this.height / 2;

        this.setScreenPosition(pos.x, pos.y);
    }

    /**
     * Moves marker by given numbers
     *
     * @param {number} deltaX
     * @param {number} deltaY
     */
    moveSrceenPositionBy(deltaX: number, deltaY: number): void {
        const oldPos = this.screenPoint,
            x = oldPos.x - deltaX,
            y = oldPos.y - deltaY;

        this.setScreenPosition(x, y);
    }

    /**
     * Set position of the marker by given numbers
     *
     * @param {number} x
     * @param {number} y
     */
    setScreenPosition(x: number, y: number): void {
        if (this.screenPoint instanceof ScreenPoint) {
            this.screenPoint.x = x;
            this.screenPoint.y = y;
        } else {
            this.screenPoint = new ScreenPoint(x, y);
        }

        this.updateVisibility();

        if (this.visible === true) {
            this.element.style.transform = "translate(" + x + "px," + y + "px)";

            this.adjustLabelScreenPosition();
        }
    }

    /**
     * Adjust position of marker label
     *
     */
    adjustLabelScreenPosition(): void {
        if (this.label) {
            const markerPos = this.screenPoint,
                x = Math.round(markerPos.x + this.width / 2 - $(this.label).outerWidth() / 2),
                y = Math.round(markerPos.y - $(this.label).outerHeight());
        }
    }

    /**
     * Check if the marker is inside of the viewBox
     *
     * @return boolean
     */
    inViewBox(): boolean {
        const x = this.screenPoint.x,
            y = this.screenPoint.y,
            mapFullWidth = this.mapsvg.containers.map.offsetWidth,
            mapFullHeight = this.mapsvg.containers.map.offsetHeight;

        // Marker stays visible if it's inside of the map-width/height buffer zone around the map:
        return (
            x - this.width / 2 < 2 * mapFullWidth &&
            x + this.width / 2 > -mapFullWidth &&
            y - this.height / 2 < 2 * mapFullHeight &&
            y + this.height / 2 > -mapFullHeight
        );
    }

    /**
     * Set visibility of the marker
     *
     */
    updateVisibility(): boolean {
        if (this.inViewBox() === true) {
            this.visible = true;

            this.element.classList.remove("mapsvg-out-of-sight");

            if (this.label) {
                this.label.classList.remove("mapsvg-out-of-sight");
            }
        } else {
            this.visible = false;

            this.element.classList.add("mapsvg-out-of-sight");

            if (this.label) {
                this.label.classList.add("mapsvg-out-of-sight");
            }
        }

        return this.visible;
    }

    isMoving(): boolean {
        return this.moving;
    }
    setMoving(value: boolean) {
        this.moving = value;
    }

    /**
     * Marker drag event handler
     * @private
     * @param startCoords
     * @param scale
     * @param endCallback
     * @param clickCallback
     */
    drag(startCoords, scale, endCallback?: () => void, clickCallback?: () => void): void {
        const _this = this;
        this.svgPointBeforeDrag = new SVGPoint(this.svgPoint.x, this.svgPoint.y);
        this.setMoving(true);

        $("body").on("mousemove.drag.mapsvg", function (e) {
            e.preventDefault();
            $(_this.mapsvg.containers.map).addClass("no-transitions");
            //$('body').css('cursor','move');
            const mouseNew = MapSVG.mouseCoords(e);
            const dx = mouseNew.x - startCoords.x;
            const dy = mouseNew.y - startCoords.y;
            const newSvgPoint = new SVGPoint(
                _this.svgPointBeforeDrag.x + dx / scale,
                _this.svgPointBeforeDrag.y + dy / scale
            );
            _this.setSvgPoint(newSvgPoint);
        });
        $("body").on("mouseup.drag.mapsvg", function (e) {
            e.preventDefault();
            _this.undrag();
            const mouseNew = MapSVG.mouseCoords(e);
            const dx = mouseNew.x - startCoords.x;
            const dy = mouseNew.y - startCoords.y;
            const newSvgPoint = new SVGPoint(
                _this.svgPointBeforeDrag.x + dx / scale,
                _this.svgPointBeforeDrag.y + dy / scale
            );

            _this.setSvgPoint(newSvgPoint);

            if (_this.mapsvg.isGeo()) {
                // var svgPoint = new SVGPoint(_this.x + _this.width / 2, this.y + (this.height-1));
                _this.geoPoint = _this.mapsvg.converter.convertSVGToGeo(newSvgPoint);
            }

            endCallback && endCallback.call(_this);
            if (
                _this.svgPointBeforeDrag.x == _this.svgPoint.x &&
                _this.svgPointBeforeDrag.y == _this.svgPoint.y
            )
                clickCallback && clickCallback.call(_this);
        });
    }
    /**
     * Marker undrag event handler
     * @private
     */
    undrag(): void {
        //$(this.element).closest('svg').css('pointer-events','auto');
        //$('body').css('cursor','default');
        this.setMoving(false);
        $("body").off(".drag.mapsvg");
        $(this.mapsvg.containers.map).removeClass("no-transitions");
    }
    /**
     * Deletes the Marker
     */
    delete(): void {
        if (this.label) {
            this.label.remove();
            this.label = null;
        }
        $(this.element).empty().remove();
    }
    /**
     * Sets parent DB object of the Marker
     * @param {object} obj
     */
    setObject(obj: CustomObject): void {
        this.object = obj;
        $(this.element).attr("data-object-id", this.object.id);
    }
    /**
     * Hides the Marker
     */
    hide(): void {
        $(this.element).addClass("mapsvg-marker-hidden");
        if (this.label) {
            $(this.label).hide();
        }
    }
    /**
     * Shows the Marker
     */
    show(): void {
        $(this.element).removeClass("mapsvg-marker-hidden");
        if (this.label) {
            $(this.label).show();
        }
    }

    /**
     * Highlight the Marker.
     * Used on mouseover.
     */
    highlight(): void {
        $(this.element).addClass("mapsvg-marker-hover");
    }
    /**
     * Unhighlight the Marker.
     * Used on mouseout.
     */
    unhighlight(): void {
        $(this.element).removeClass("mapsvg-marker-hover");
    }
    /**
     * Select the Marker.
     */
    select(): void {
        this.selected = true;
        $(this.element).addClass("mapsvg-marker-active");
    }
    /**
     * Deselect the Marker.
     */
    deselect(): void {
        this.selected = false;
        $(this.element).removeClass("mapsvg-marker-active");
    }

    getData(): CustomObject {
        return this.object;
    }

    /**
     * Returns color of the choropleth marker bubble
     * @returns {string} color
     */
    getChoroplethColor(): string {
        const markerValue = parseFloat(this.object[this.mapsvg.options.choropleth.sourceField]);
        let color;

        if (!markerValue) {
            color = this.mapsvg.options.choropleth.coloring.noData.color;
        } else if (this.mapsvg.options.choropleth.coloring.mode === "gradient") {
            // Gradient mode
            const gradient = this.mapsvg.options.choropleth.coloring.gradient,
                w =
                    gradient.values.maxAdjusted === 0
                        ? 0
                        : (markerValue - gradient.values.min) / gradient.values.maxAdjusted,
                r = Math.round(gradient.colors.diffRGB.r * w + gradient.colors.lowRGB.r),
                g = Math.round(gradient.colors.diffRGB.g * w + gradient.colors.lowRGB.g),
                b = Math.round(gradient.colors.diffRGB.b * w + gradient.colors.lowRGB.b),
                a = (gradient.colors.diffRGB.a * w + gradient.colors.lowRGB.a).toFixed(2);

            color = "rgba(" + r + "," + g + "," + b + "," + a + ")";
        } else {
            // Palette mode
            const paletteColors = this.mapsvg.options.choropleth.coloring.palette.colors;

            if (!paletteColors[0].valueFrom && markerValue < paletteColors[0].valueTo) {
                color = paletteColors[0].color;
            } else if (
                !paletteColors[paletteColors.length - 1].valueTo &&
                markerValue > paletteColors[paletteColors.length - 1].valueFrom
            ) {
                color = paletteColors[paletteColors.length - 1].color;
            } else {
                paletteColors.forEach(function (paletteColor) {
                    if (
                        markerValue >= paletteColor.valueFrom &&
                        markerValue < paletteColor.valueTo
                    ) {
                        color = paletteColor.color;
                    }
                });

                color = color
                    ? color
                    : this.mapsvg.options.choropleth.coloring.palette.outOfRange.color;
            }
        }

        return color;
    }

    /**
     * Returns size of the choropleth bubble
     */
    getBubbleSize(): number {
        let bubbleSize;

        if (this.object[this.mapsvg.options.choropleth.sourceField]) {
            const maxBubbleSize = Number(this.mapsvg.options.choropleth.bubbleSize.max),
                minBubbleSize = Number(this.mapsvg.options.choropleth.bubbleSize.min),
                maxSourceFieldvalue = this.mapsvg.options.choropleth.coloring.gradient.values.max,
                minSourceFieldvalue = this.mapsvg.options.choropleth.coloring.gradient.values.min,
                sourceFieldvalue = parseFloat(
                    this.object[this.mapsvg.options.choropleth.sourceField]
                );

            bubbleSize =
                ((sourceFieldvalue - minSourceFieldvalue) /
                    (maxSourceFieldvalue - minSourceFieldvalue)) *
                    (maxBubbleSize - minBubbleSize) +
                Number(minBubbleSize);
        } else {
            bubbleSize = false;
        }

        return bubbleSize;
    }

    /**
     * Returns screen point of the choropleth bubble
     */
    getBubbleScreenPosition(): { x: number; y: number } {
        const bubbleSize = Number(this.getBubbleSize());

        return {
            x: this.width / 2 - bubbleSize / 2,
            y: this.height - bubbleSize / 2,
        };
    }

    /**
     * Draw a choropleth bubble for the marker
     */
    drawBubble(): void {
        const bubbleId = "mapsvg-bubble-" + this.object.id;
        const bubbleValue = parseFloat(this.object[this.mapsvg.options.choropleth.sourceField]);
        if (bubbleValue) {
            if (!this.bubble) {
                this.bubble = $(
                    '<div id="' +
                        bubbleId +
                        '" data-marker-id="' +
                        this.element.id +
                        '" class="mapsvg-bubble mapsvg-marker-bubble"></div>'
                )[0];
                $(this.element).append(this.bubble);
            }
            const color = this.getChoroplethColor(),
                bubbleSize = Number(this.getBubbleSize());

            $(this.bubble)
                .css("background-color", color)
                .css("width", bubbleSize + "px")
                .css("height", bubbleSize + "px")
                .css("lineHeight", bubbleSize - 2 + "px");
        } else {
            $("#" + bubbleId).remove();
            delete this.bubble;
        }
    }

    /**
     * Disable/enable BubbleMode for the marker
     *
     * @param {boolean} bubbleMode
     */
    setBubbleMode(bubbleMode: boolean): void {
        this.bubbleMode = bubbleMode;

        if (bubbleMode) {
            this.setCentered(true);
            this.drawBubble();
            if (this.bubble) {
                this.width = this.bubble.offsetWidth;
                this.height = this.bubble.offsetHeight;
                this.adjustScreenPosition();
            }
        } else {
            this.setImage(this.src);
        }
    }

    setLabel(html: string): void {
        if (!this.label) {
            this.label = $("<div />").addClass("mapsvg-marker-label")[0];
            $(this.element).append(this.label);
        }
        $(this.label).html(html);
    }

    /**
     * Set centered propperty of the marker
     *
     * @param {boolean} on
     */
    setCentered(on: boolean): void {
        this.centered = on;
    }
}
