import { MapSVG } from "../Core/globals.js";
import { MapObject } from "../MapObject/MapObject.js";
import { SVGPoint, ScreenPoint } from "../Location/Location.js";
import { ViewBox } from "../Map/MapOptionsInterface.js";
const $ = jQuery;
export class Marker extends MapObject {
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
        }
        else {
            this.setSize(15, 24);
        }
        this.setId(this.mapsvg.markerId());
        this.setSvgPointFromLocation();
        this.setImage(this.src);
        this.setAltAttr();
    }
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.setCentered(this.width === this.height);
    }
    setSvgPointFromLocation() {
        const svgPoint = this.location.geoPoint &&
            this.location.geoPoint.lat !== 0 &&
            this.location.geoPoint.lng !== 0
            ? this.mapsvg.converter.convertGeoToSVG(this.location.geoPoint)
            : this.location.svgPoint;
        if (svgPoint) {
            this.setSvgPoint(svgPoint);
        }
    }
    setId(id) {
        MapObject.prototype.setId.call(this, id);
        this.mapsvg.markers.reindex();
    }
    getBBox() {
        if (this.centered) {
            return new ViewBox(this.svgPoint.x - this.width / 2 / this.mapsvg.scale, this.svgPoint.y - this.height / 2 / this.mapsvg.scale, this.width / this.mapsvg.scale, this.height / this.mapsvg.scale);
        }
        else {
            return new ViewBox(this.svgPoint.x - this.width / 2 / this.mapsvg.scale, this.svgPoint.y - this.height / this.mapsvg.scale, this.width / this.mapsvg.scale, this.height / this.mapsvg.scale);
        }
    }
    getOptions() {
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
    update(data) {
        for (const key in data) {
            const setter = "set" + MapSVG.ucfirst(key);
            if (setter in this)
                this[setter](data[key]);
        }
    }
    setImage(src) {
        if (!src)
            return;
        src = MapSVG.safeURL(src);
        const img = new Image();
        const marker = this;
        this.src = src;
        if (marker.image.getAttribute("src") !== "src") {
            marker.image.setAttribute("src", src);
        }
        img.onload = function () {
            marker.setSize(this.width, this.height);
            marker.adjustScreenPosition();
        };
        img.src = src;
        if (this.location && this.location.imagePath !== src) {
            this.location.setImage(src);
        }
        this.events.trigger("change");
    }
    setAltAttr() {
        const marker = this;
        marker.altAttr =
            typeof marker.object != "undefined" &&
                typeof marker.object.title != "undefined" &&
                marker.object.title !== ""
                ? marker.object.title
                : marker.id;
        marker.element.setAttribute("alt", marker.altAttr);
    }
    setSvgPoint(svgPoint) {
        this.svgPoint = svgPoint;
        this.adjustScreenPosition();
        this.events.trigger("change");
    }
    adjustScreenPosition() {
        const pos = this.mapsvg.converter.convertSVGToPixel(this.svgPoint);
        pos.x -= this.width / 2;
        pos.y -= !this.centered ? this.height : this.height / 2;
        this.setScreenPosition(pos.x, pos.y);
    }
    moveSrceenPositionBy(deltaX, deltaY) {
        const oldPos = this.screenPoint, x = oldPos.x - deltaX, y = oldPos.y - deltaY;
        this.setScreenPosition(x, y);
    }
    setScreenPosition(x, y) {
        if (this.screenPoint instanceof ScreenPoint) {
            this.screenPoint.x = x;
            this.screenPoint.y = y;
        }
        else {
            this.screenPoint = new ScreenPoint(x, y);
        }
        this.updateVisibility();
        if (this.visible === true) {
            this.element.style.transform = "translate(" + x + "px," + y + "px)";
            this.adjustLabelScreenPosition();
        }
    }
    adjustLabelScreenPosition() {
        if (this.label) {
            const markerPos = this.screenPoint, x = Math.round(markerPos.x + this.width / 2 - $(this.label).outerWidth() / 2), y = Math.round(markerPos.y - $(this.label).outerHeight());
        }
    }
    inViewBox() {
        const x = this.screenPoint.x, y = this.screenPoint.y, mapFullWidth = this.mapsvg.containers.map.offsetWidth, mapFullHeight = this.mapsvg.containers.map.offsetHeight;
        return (x - this.width / 2 < 2 * mapFullWidth &&
            x + this.width / 2 > -mapFullWidth &&
            y - this.height / 2 < 2 * mapFullHeight &&
            y + this.height / 2 > -mapFullHeight);
    }
    updateVisibility() {
        if (this.inViewBox() === true) {
            this.visible = true;
            this.element.classList.remove("mapsvg-out-of-sight");
            if (this.label) {
                this.label.classList.remove("mapsvg-out-of-sight");
            }
        }
        else {
            this.visible = false;
            this.element.classList.add("mapsvg-out-of-sight");
            if (this.label) {
                this.label.classList.add("mapsvg-out-of-sight");
            }
        }
        return this.visible;
    }
    isMoving() {
        return this.moving;
    }
    setMoving(value) {
        this.moving = value;
    }
    drag(startCoords, scale, endCallback, clickCallback) {
        const _this = this;
        this.svgPointBeforeDrag = new SVGPoint(this.svgPoint.x, this.svgPoint.y);
        this.setMoving(true);
        $("body").on("mousemove.drag.mapsvg", function (e) {
            e.preventDefault();
            $(_this.mapsvg.containers.map).addClass("no-transitions");
            const mouseNew = MapSVG.mouseCoords(e);
            const dx = mouseNew.x - startCoords.x;
            const dy = mouseNew.y - startCoords.y;
            const newSvgPoint = new SVGPoint(_this.svgPointBeforeDrag.x + dx / scale, _this.svgPointBeforeDrag.y + dy / scale);
            _this.setSvgPoint(newSvgPoint);
        });
        $("body").on("mouseup.drag.mapsvg", function (e) {
            e.preventDefault();
            _this.undrag();
            const mouseNew = MapSVG.mouseCoords(e);
            const dx = mouseNew.x - startCoords.x;
            const dy = mouseNew.y - startCoords.y;
            const newSvgPoint = new SVGPoint(_this.svgPointBeforeDrag.x + dx / scale, _this.svgPointBeforeDrag.y + dy / scale);
            _this.setSvgPoint(newSvgPoint);
            if (_this.mapsvg.isGeo()) {
                _this.geoPoint = _this.mapsvg.converter.convertSVGToGeo(newSvgPoint);
            }
            endCallback && endCallback.call(_this);
            if (_this.svgPointBeforeDrag.x == _this.svgPoint.x &&
                _this.svgPointBeforeDrag.y == _this.svgPoint.y)
                clickCallback && clickCallback.call(_this);
        });
    }
    undrag() {
        this.setMoving(false);
        $("body").off(".drag.mapsvg");
        $(this.mapsvg.containers.map).removeClass("no-transitions");
    }
    delete() {
        if (this.label) {
            this.label.remove();
            this.label = null;
        }
        $(this.element).empty().remove();
    }
    setObject(obj) {
        this.object = obj;
        $(this.element).attr("data-object-id", this.object.id);
    }
    hide() {
        $(this.element).addClass("mapsvg-marker-hidden");
        if (this.label) {
            $(this.label).hide();
        }
    }
    show() {
        $(this.element).removeClass("mapsvg-marker-hidden");
        if (this.label) {
            $(this.label).show();
        }
    }
    highlight() {
        $(this.element).addClass("mapsvg-marker-hover");
    }
    unhighlight() {
        $(this.element).removeClass("mapsvg-marker-hover");
    }
    select() {
        this.selected = true;
        $(this.element).addClass("mapsvg-marker-active");
    }
    deselect() {
        this.selected = false;
        $(this.element).removeClass("mapsvg-marker-active");
    }
    getData() {
        return this.object;
    }
    getChoroplethColor() {
        const markerValue = parseFloat(this.object[this.mapsvg.options.choropleth.sourceField]);
        let color;
        if (!markerValue) {
            color = this.mapsvg.options.choropleth.coloring.noData.color;
        }
        else if (this.mapsvg.options.choropleth.coloring.mode === "gradient") {
            const gradient = this.mapsvg.options.choropleth.coloring.gradient, w = gradient.values.maxAdjusted === 0
                ? 0
                : (markerValue - gradient.values.min) / gradient.values.maxAdjusted, r = Math.round(gradient.colors.diffRGB.r * w + gradient.colors.lowRGB.r), g = Math.round(gradient.colors.diffRGB.g * w + gradient.colors.lowRGB.g), b = Math.round(gradient.colors.diffRGB.b * w + gradient.colors.lowRGB.b), a = (gradient.colors.diffRGB.a * w + gradient.colors.lowRGB.a).toFixed(2);
            color = "rgba(" + r + "," + g + "," + b + "," + a + ")";
        }
        else {
            const paletteColors = this.mapsvg.options.choropleth.coloring.palette.colors;
            if (!paletteColors[0].valueFrom && markerValue < paletteColors[0].valueTo) {
                color = paletteColors[0].color;
            }
            else if (!paletteColors[paletteColors.length - 1].valueTo &&
                markerValue > paletteColors[paletteColors.length - 1].valueFrom) {
                color = paletteColors[paletteColors.length - 1].color;
            }
            else {
                paletteColors.forEach(function (paletteColor) {
                    if (markerValue >= paletteColor.valueFrom &&
                        markerValue < paletteColor.valueTo) {
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
    getBubbleSize() {
        let bubbleSize;
        if (this.object[this.mapsvg.options.choropleth.sourceField]) {
            const maxBubbleSize = Number(this.mapsvg.options.choropleth.bubbleSize.max), minBubbleSize = Number(this.mapsvg.options.choropleth.bubbleSize.min), maxSourceFieldvalue = this.mapsvg.options.choropleth.coloring.gradient.values.max, minSourceFieldvalue = this.mapsvg.options.choropleth.coloring.gradient.values.min, sourceFieldvalue = parseFloat(this.object[this.mapsvg.options.choropleth.sourceField]);
            bubbleSize =
                ((sourceFieldvalue - minSourceFieldvalue) /
                    (maxSourceFieldvalue - minSourceFieldvalue)) *
                    (maxBubbleSize - minBubbleSize) +
                    Number(minBubbleSize);
        }
        else {
            bubbleSize = false;
        }
        return bubbleSize;
    }
    getBubbleScreenPosition() {
        const bubbleSize = Number(this.getBubbleSize());
        return {
            x: this.width / 2 - bubbleSize / 2,
            y: this.height - bubbleSize / 2,
        };
    }
    drawBubble() {
        const bubbleId = "mapsvg-bubble-" + this.object.id;
        const bubbleValue = parseFloat(this.object[this.mapsvg.options.choropleth.sourceField]);
        if (bubbleValue) {
            if (!this.bubble) {
                this.bubble = $('<div id="' +
                    bubbleId +
                    '" data-marker-id="' +
                    this.element.id +
                    '" class="mapsvg-bubble mapsvg-marker-bubble"></div>')[0];
                $(this.element).append(this.bubble);
            }
            const color = this.getChoroplethColor(), bubbleSize = Number(this.getBubbleSize());
            $(this.bubble)
                .css("background-color", color)
                .css("width", bubbleSize + "px")
                .css("height", bubbleSize + "px")
                .css("lineHeight", bubbleSize - 2 + "px");
        }
        else {
            $("#" + bubbleId).remove();
            delete this.bubble;
        }
    }
    setBubbleMode(bubbleMode) {
        this.bubbleMode = bubbleMode;
        if (bubbleMode) {
            this.setCentered(true);
            this.drawBubble();
            if (this.bubble) {
                this.width = this.bubble.offsetWidth;
                this.height = this.bubble.offsetHeight;
                this.adjustScreenPosition();
            }
        }
        else {
            this.setImage(this.src);
        }
    }
    setLabel(html) {
        if (!this.label) {
            this.label = $("<div />").addClass("mapsvg-marker-label")[0];
            $(this.element).append(this.label);
        }
        $(this.label).html(html);
    }
    setCentered(on) {
        this.centered = on;
    }
}
//# sourceMappingURL=Marker.js.map