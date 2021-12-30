import { MapSVGMap } from "../Map/Map.js";
import { MapSVG } from "../Core/globals.js";
import { tinycolor } from "../Vendor/tinycolor.js";
import { MapObject } from "../MapObject/MapObject.js";
import { ViewBox } from "../Map/MapOptionsInterface.js";
import { SVGPoint } from "../Location/Location.js";
import { CustomObject } from "../Object/CustomObject";
import { ArrayIndexed } from "../Core/ArrayIndexed";
import { transform } from "@babel/core";
const $ = jQuery;

/**
 * Region class. Contains a reference to an SVG element.
 * @extends MapObject
 * @param {element} SVGElement
 * @param {string} regionID - Region ID
 * @param {Map} mapsvg - MapSVG instance
 */
export class Region extends MapObject {
    id: string;
    title?: string;
    id_no_spaces: string;
    disabled: boolean;
    selected: boolean;
    status: number;
    default_attr: any;
    selected_attr: any;
    hover_attr: any;
    initialState: string;
    elemOriginal: SVGGraphicsElement;
    elem: SVGGraphicsElement;
    style: {
        fill?: string;
        stroke?: string;
        "stroke-width"?: number;
        [key: string]: string | number;
    };
    choroplethValue: number;
    customAttrs: Array<string>;
    fill?: string;
    center?: SVGPoint;
    label: HTMLElement;
    bubble: HTMLElement;
    data: CustomObject;

    gaugeValue: number;

    constructor(element: SVGElement, mapsvg: MapSVGMap) {
        super(element, mapsvg);
        this.id = this.element.getAttribute("id");
        if (this.id && this.mapsvg.options.regionPrefix) {
            this.setId(this.id.replace(this.mapsvg.options.regionPrefix, ""));
        }

        this.id_no_spaces = this.id.replace(/\s/g, "_");

        this.element.setAttribute("class", (this.element.className || "") + " mapsvg-region");

        this.setStyleInitial();

        const regionOptions =
            this.mapsvg.options.regions && this.mapsvg.options.regions[this.id]
                ? this.mapsvg.options.regions[this.id]
                : null;

        this.disabled = this.getDisabledState();
        this.disabled && this.attr("class", this.attr("class") + " mapsvg-disabled");

        this.default_attr = {};
        this.selected_attr = {};
        this.hover_attr = {};
        let selected = false;
        if (regionOptions && regionOptions.selected) {
            selected = true;
            delete regionOptions.selected;
        }
        regionOptions && this.update(regionOptions);
        this.setFill();
        if (selected) {
            this.setSelected();
        }
        this.saveState();
    }

    adjustStroke(scale: number): void {
        $(this.element).css({ "stroke-width": this.style["stroke-width"] / scale });
    }

    /**
     * Sets initial style of a Region, computed from SVG
     * @private
     */
    setStyleInitial(): void {
        this.style = { fill: this.getComputedStyle("fill") };
        this.style.stroke = this.getComputedStyle("stroke") || "";
        let w;
        w = this.getComputedStyle("stroke-width");
        w = w ? w.replace("px", "") : "1";
        w = parseFloat(w);
        this.style["stroke-width"] = w;
        $(this.element).attr("data-stroke-width", w);
    }
    /**
     * Save state of a Region (all parameters)
     * @private
     */
    saveState(): void {
        this.initialState = JSON.stringify(this.getOptions());
    }
    /**
     * Returns SVG bounding box of the Region
     * @returns {[number,number,number,number]} - [x,y,width,height]
     */
    getBBox(): ViewBox {
        // @ts-ignore
        const _bbox = this.element.getBBox();
        const bbox = new ViewBox(_bbox.x, _bbox.y, _bbox.width, _bbox.height);

        // @ts-ignore (TS doesn't recognize getTransformToElement() method from SVGGraphicsElement)
        const matrix = this.element.getTransformToElement(this.mapsvg.containers.svg);
        if (!matrix) {
            return _bbox;
        }

        const x2 = bbox.x + bbox.width;
        const y2 = bbox.y + bbox.height;

        // transform a point using the transformed matrix
        let position = this.mapsvg.containers.svg.createSVGPoint();
        position.x = bbox.x;
        position.y = bbox.y;
        position = position.matrixTransform(matrix);
        bbox.x = position.x;
        bbox.y = position.y;
        // var position = this.mapsvg.containers.svg.createSVGPoint();
        position.x = x2;
        position.y = y2;
        position = position.matrixTransform(matrix);
        bbox.width = position.x - bbox.x;
        bbox.height = position.y - bbox.y;

        return bbox;
    }
    /**
     * Checks whether the Region was changed from the initial state
     * @returns {boolean}
     * @private
     */
    changed(): boolean {
        return JSON.stringify(this.getOptions()) != this.initialState;
    }
    /**
     * Saves a copy of the Region SVG elem.
     * Used in Map Editor by "Edit SVG file" mode.
     * @private
     */
    edit(): void {
        this.elemOriginal = <SVGGraphicsElement>$(this.element).clone()[0];
    }
    /**
     * Deletes the copy of the Region SVG elem created by .edit() method.
     * Used in Map Editor by "Edit SVG file" mode.
     * @private
     */
    editCommit(): void {
        this.elemOriginal = null;
    }
    /**
     * Restores SVG elem.
     * Used in Map Editor by "Edit SVG file" mode.
     * @private
     */
    editCancel(): void {
        this.mapsvg.containers.svg.appendChild(this.elemOriginal);
        this.element = this.elemOriginal;
        this.elemOriginal = null;
    }
    /**
     * Returns Region properties
     * @param {boolean} forTemplate - adds special properties for use in a template
     * @returns {object}
     */
    getOptions(forTemplate?: boolean): { [key: string]: any } {
        let o: any;
        o = {
            id: this.id,
            id_no_spaces: this.id_no_spaces,
            title: this.title,
            fill: this.mapsvg.options.regions[this.id] && this.mapsvg.options.regions[this.id].fill,
            data: this.data,
            choroplethValue: this.choroplethValue,
        };
        if (forTemplate) {
            o.disabled = this.disabled;
        }
        for (const key in o) {
            if (typeof o[key] === "undefined") {
                delete o[key];
            }
        }
        if (this.customAttrs) {
            const that = this;
            this.customAttrs.forEach(function (attr) {
                o[attr] = that[attr];
            });
        }
        return o;
    }
    /**
     * Returns an object with properties of the Region formatted for a template
     * @returns {object}
     */
    forTemplate(): any {
        const data = {
            id: this.id,
            title: this.title,
            objects: this.objects,
            data: this.data,
        };
        if (this.data) {
            for (const key in this.data) {
                if (key != "title" && key != "id") data[key] = this.data[key];
            }
        }

        return data;
    }
    getData(): any {
        return this.forTemplate();
    }
    /**
     * Updates the Region
     * @param {object} options
     *
     * @example
     * var region = mapsvg.getRegion("US-TX");
     * region.update({
     *   fill: "#FF3322"
     * });
     */
    update(options): void {
        for (const key in options) {
            // check if there's a setter for a property
            const setter = "set" + MapSVG.ucfirst(key);
            if (setter in this) this[setter](options[key]);
            else {
                this[key] = options[key];
                this.customAttrs = this.customAttrs || [];
                this.customAttrs.push(key);
            }
        }
    }
    /**
     * Sets Title of the Region
     * @param {string} title
     */
    setTitle(title?: string): void {
        if (title) {
            this.title = title;
        }

        this.element.setAttribute("title", this.title);
    }

    /**
     * Sets CSS style of the Region
     * @param {object} style - CSS-format styles
     * @private
     */
    setStyle(style: any): void {
        $.extend(true, this.style, style);
        this.setFill();
    }

    /**
     * Returns color of the Region for choropleth map
     * @returns {string} color
     */
    getChoroplethColor() {
        const o = this.mapsvg.options.choropleth;
        let color = "";

        if (
            this.data &&
            (this.data[this.mapsvg.options.regionChoroplethField] ||
                this.data[this.mapsvg.options.regionChoroplethField] === 0)
        ) {
            const w =
                o.maxAdjusted === 0
                    ? 0
                    : (parseFloat(this.data[this.mapsvg.options.regionChoroplethField]) - o.min) /
                      o.maxAdjusted;

            const c = {
                r: Math.round(o.colors.diffRGB.r * w + o.colors.lowRGB.r),
                g: Math.round(o.colors.diffRGB.g * w + o.colors.lowRGB.g),
                b: Math.round(o.colors.diffRGB.b * w + o.colors.lowRGB.b),
                a: (o.colors.diffRGB.a * w + o.colors.lowRGB.a).toFixed(2),
            };
            color = "rgba(" + c.r + "," + c.g + "," + c.b + "," + c.a + ")";
        } else {
            color = o.colors.noData;
        }

        return color;
    }

    _new_getChoroplethColor() {
        let regionValue = parseFloat(this.data[this.mapsvg.options.choropleth.sourceField]),
            color;

        if (!regionValue) {
            color = this.mapsvg.options.choropleth.coloring.noData.color;
        } else if (this.mapsvg.options.choropleth.coloring.mode === "gradient") {
            // Gradient mode
            const gradient = this.mapsvg.options.choropleth.coloring.gradient,
                w =
                    gradient.values.maxAdjusted === 0
                        ? 0
                        : (regionValue - gradient.values.min) / gradient.values.maxAdjusted,
                r = Math.round(gradient.colors.diffRGB.r * w + gradient.colors.lowRGB.r),
                g = Math.round(gradient.colors.diffRGB.g * w + gradient.colors.lowRGB.g),
                b = Math.round(gradient.colors.diffRGB.b * w + gradient.colors.lowRGB.b),
                a = (gradient.colors.diffRGB.a * w + gradient.colors.lowRGB.a).toFixed(2);

            color = "rgba(" + r + "," + g + "," + b + "," + a + ")";
        } else {
            // Palette mode
            const paletteColors = this.mapsvg.options.choropleth.coloring.palette.colors;

            if (!paletteColors[0].valueFrom && regionValue < paletteColors[0].valueTo) {
                color = paletteColors[0].color;
            } else if (
                !paletteColors[paletteColors.length - 1].valueTo &&
                regionValue > paletteColors[paletteColors.length - 1].valueFrom
            ) {
                color = paletteColors[paletteColors.length - 1].color;
            } else {
                paletteColors.forEach(function (paletteColor) {
                    if (
                        regionValue >= paletteColor.valueFrom &&
                        regionValue < paletteColor.valueTo
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
    getBubbleSize() {
        let bubbleSize;

        if (this.data[this.mapsvg.options.choropleth.sourceField]) {
            const maxBubbleSize = Number(this.mapsvg.options.choropleth.bubbleSize.max),
                minBubbleSize = Number(this.mapsvg.options.choropleth.bubbleSize.min),
                maxSourceFieldvalue = this.mapsvg.options.choropleth.coloring.gradient.values.max,
                minSourceFieldvalue = this.mapsvg.options.choropleth.coloring.gradient.values.min,
                sourceFieldvalue = parseFloat(
                    this.data[this.mapsvg.options.choropleth.sourceField]
                );

            bubbleSize =
                ((sourceFieldvalue - minSourceFieldvalue) /
                    (maxSourceFieldvalue - minSourceFieldvalue)) *
                    (maxBubbleSize - minBubbleSize) +
                minBubbleSize;
        } else {
            bubbleSize = false;
        }

        return bubbleSize;
    }
    /**
     * Sets fill color of the Region
     * @param {string} fill - color in a CSS format
     * @example
     * region.setFill("#FF2233");
     * region.setFill("rgba(255,255,100,0.5");
     */
    setFill(fill?: string) {
        if (this.mapsvg.options.colorsIgnore) {
            $(this.element).css(this.style);
            return;
        }

        if (fill) {
            const regions = {};
            regions[this.id] = { fill: fill };
            $.extend(true, this.mapsvg.options, { regions: regions });
        } else if (
            !fill &&
            fill !== undefined &&
            this.mapsvg.options.regions &&
            this.mapsvg.options.regions[this.id] &&
            this.mapsvg.options.regions[this.id].fill
        ) {
            delete this.mapsvg.options.regions[this.id].fill;
        }

        // Priority: choropleth > status > options.fill > disabled > base > svg
        if (
            this.mapsvg.options.choropleth.on
            // TODO: choropleth new
            // &&
            // this.mapsvg.options.choropleth.source === "regions" &&
            // this.mapsvg.options.choropleth.sourceField &&
            // this.mapsvg.options.choropleth.bubbleMode === false &&
            // this.data &&
            // typeof this.data[this.mapsvg.options.choropleth.sourceField] !== "undefined"
        ) {
            this.default_attr["fill"] = this.getChoroplethColor();
        } else if (
            this.status !== undefined &&
            this.mapsvg.regions &&
            this.mapsvg.regionsRepository.getSchema().getFieldByType("status") &&
            this.mapsvg.regionsRepository.getSchema().getFieldByType("status").optionsDict &&
            this.mapsvg.regionsRepository.getSchema().getFieldByType("status").optionsDict[
                this.status
            ] &&
            this.mapsvg.regionsRepository.getSchema().getFieldByType("status").optionsDict[
                this.status
            ].color
        ) {
            this.default_attr["fill"] = this.mapsvg.regionsRepository
                .getSchema()
                .getFieldByType("status").optionsDict[this.status].color;
        } else if (
            this.mapsvg.options.regions[this.id] &&
            this.mapsvg.options.regions[this.id].fill
        ) {
            this.default_attr["fill"] = this.mapsvg.options.regions[this.id].fill;

            // }else if(this.disabled && this.mapsvg.options.colors.disabled){
            //     this.default_attr['fill'] = this.mapsvg.options.colors.disabled;
        } else if (this.mapsvg.options.colors.base) {
            this.default_attr["fill"] = this.mapsvg.options.colors.base;
        } else if (this.style.fill != "none") {
            this.default_attr["fill"] = this.style.fill
                ? this.style.fill
                : this.mapsvg.options.colors.baseDefault;
        } else {
            this.default_attr["fill"] = "none";
        }

        if (MapSVG.isNumber(this.mapsvg.options.colors.selected))
            this.selected_attr["fill"] = tinycolor(this.default_attr.fill)
                .lighten(parseFloat("" + this.mapsvg.options.colors.selected))
                .toRgbString();
        else this.selected_attr["fill"] = this.mapsvg.options.colors.selected;

        if (MapSVG.isNumber(this.mapsvg.options.colors.hover))
            this.hover_attr["fill"] = tinycolor(this.default_attr.fill)
                .lighten(parseFloat("" + this.mapsvg.options.colors.hover))
                .toRgbString();
        else this.hover_attr["fill"] = this.mapsvg.options.colors.hover;

        $(this.element).css("fill", this.default_attr["fill"]);
        this.fill = this.default_attr["fill"];

        if (this.style.stroke != "none" && this.mapsvg.options.colors.stroke != undefined) {
            $(this.element).css("stroke", this.mapsvg.options.colors.stroke);
        } else {
            const s = this.style.stroke == undefined ? "" : this.style.stroke;
            $(this.element).css("stroke", s);
        }

        if (this.selected) this.setSelected();
    }
    /**
     * Disables the Region.
     * @param {boolean} on - true/false = disable/enable
     * @param {boolean} skipSetFill - If false, color of the Region will not be changed
     */
    setDisabled(on?: boolean, skipSetFill?: boolean) {
        on = on !== undefined ? MapSVG.parseBoolean(on) : this.getDisabledState(); // get default disabled state if undefined
        const prevDisabled = this.disabled;
        this.disabled = on;
        this.attr("class", this.attr("class").replace("mapsvg-disabled", ""));
        if (on) {
            this.attr("class", this.attr("class") + " mapsvg-disabled");
        }
        if (this.disabled != prevDisabled) this.mapsvg.deselectRegion(this);
        !skipSetFill && this.setFill();
    }
    /**
     * Sets status of the Region.
     * Takes the list of statuses from global MapSVG options.
     * @param {number} status
     */
    setStatus(status: number) {
        const statusOptions =
            this.mapsvg.options.regionStatuses && this.mapsvg.options.regionStatuses[status];
        if (statusOptions) {
            this.status = status;
            if (this.data) {
                this.data.status = status;
                this.data.status_text = statusOptions.label;
            }
            this.setDisabled(statusOptions.disabled, true);
        } else {
            this.status = undefined;
            if (this.data) {
                this.data.status = undefined;
                this.data.status_text = undefined;
            }
            this.setDisabled(false, true);
        }
        this.setFill();
    }
    /**
     * Selects the Region.
     */
    setSelected() {
        this.mapsvg.selectRegion(this);
    }
    /**
     * Set Region choropleth value. Used to calculate color of the Region.
     * @param {number} val
     */
    setchoroplethValue(val: number) {
        if ($.isNumeric(val)) {
            if (typeof val === "string") {
                val = parseFloat(val);
            }
            this.choroplethValue = val;
        } else {
            this.choroplethValue = undefined;
        }
    }
    /**
     * Checks if Region should be disabled
     * @param {boolean} asDefault
     * @returns {boolean}
     */
    getDisabledState(asDefault?: boolean): boolean {
        const opts = this.mapsvg.options.regions[this.id];
        if (!asDefault && opts && opts.disabled !== undefined) {
            return opts.disabled;
        } else {
            return (
                this.mapsvg.options.disableAll ||
                this.style.fill === "none" ||
                this.id == "labels" ||
                this.id == "Labels"
            );
        }
    }
    /**
     * Highlight the Region.
     * Used on mouseover.
     */
    highlight() {
        $(this.element).css({ fill: this.hover_attr.fill });
        $(this.element).addClass("mapsvg-region-hover");
    }
    /**
     * Unhighlight the Region.
     * Used on mouseout.
     */
    unhighlight() {
        $(this.element).css({ fill: this.default_attr.fill });
        $(this.element).removeClass("mapsvg-region-hover");
    }
    /**
     * Select the Region.
     */
    select() {
        $(this.element).css({ fill: this.selected_attr.fill });
        this.selected = true;
        $(this.element).addClass("mapsvg-region-active");
    }
    /**
     * Deselect the Region.
     */
    deselect() {
        $(this.element).css({ fill: this.default_attr.fill });
        this.selected = false;
        $(this.element).removeClass("mapsvg-region-active");
    }

    /**
     * Adds custom data loaded from server
     * @param {object} data - Any set of {key:value} pairs
     */
    setData(data: CustomObject) {
        this.data = data;
        if (typeof data.title !== "undefined") {
            this.setTitle(data.title);
        }
    }

    /**
     * Draw a choropleth bubble for the region
     */
    drawBubble() {
        if (this.data) {
            const bubbleId = "mapsvg-bubble-" + this.id;
            const bubbleValue = parseFloat(this.data[this.mapsvg.options.choropleth.sourceField]);

            if (bubbleValue) {
                if (!this.center) {
                    this.center = this.getCenterSVG();
                }

                const pos = this.mapsvg.converter.convertSVGToPixel(this.center);

                if (!this.bubble) {
                    this.bubble = $(
                        '<div id="' +
                            bubbleId +
                            '" class="mapsvg-bubble mapsvg-region-bubble"></div>'
                    )[0];
                    $(this.mapsvg.layers.bubbles).append(this.bubble);
                }

                const color = this.getChoroplethColor();
                const bubbleSize = Number(this.getBubbleSize());

                $(this.bubble)
                    .css(
                        "transform",
                        "translate(-50%,-50%) translate(" + pos.x + "px," + pos.y + "px)"
                    )
                    .css("background-color", color)
                    .css("width", bubbleSize + "px")
                    .css("height", bubbleSize + "px")
                    .css("lineHeight", bubbleSize - 2 + "px");
            } else {
                delete this.bubble;
            }
        }
    }

    /**
     * Adjust position of Region Label
     *
     */
    adjustLabelScreenPosition() {
        if (this.label) {
            if (!this.center) {
                this.center = this.getCenterSVG();
            }

            const pos = this.mapsvg.converter.convertSVGToPixel(this.center),
                x = pos.x - this.label.offsetWidth / 2,
                y = pos.y - this.label.offsetHeight / 2;

            this.setLabelScreenPosition(x, y);
        }
    }

    /**
     * Adjust position of Region bubble
     *
     */
    adjustBubbleScreenPosition() {
        if (this.bubble) {
            if (!this.center) {
                this.center = this.getCenterSVG();
            }

            const pos = this.mapsvg.converter.convertSVGToPixel(this.center),
                x = pos.x - this.bubble.offsetWidth / 2,
                y = pos.y - this.bubble.offsetHeight / 2;

            this.setBubbleScreenPosition(x, y);
        }
    }

    /**
     * Set position of Region Label by given numbers
     *
     * @param {number} deltaX
     * @param {number} deltaY
     */
    moveLabelScreenPositionBy(deltaX, deltaY) {
        if (this.label) {
            const labelStyle = window.getComputedStyle(this.label),
                matrix = labelStyle.transform || labelStyle.webkitTransform,
                matrixValues = matrix.match(/matrix.*\((.+)\)/)[1].split(", "),
                x = parseFloat(matrixValues[4]) - deltaX,
                y = parseFloat(matrixValues[5]) - deltaY;

            this.setLabelScreenPosition(x, y);
        }
    }

    /**
     * Set position of Region bubble by given numbers
     *
     * @param {number} deltaX
     * @param {number} deltaY
     */
    moveBubbleScreenPositionBy(deltaX, deltaY) {
        if (this.bubble) {
            const labelStyle = window.getComputedStyle(this.bubble),
                matrix = labelStyle.transform || labelStyle.webkitTransform,
                matrixValues = matrix.match(/matrix.*\((.+)\)/)[1].split(", "),
                x = parseFloat(matrixValues[4]) - deltaX,
                y = parseFloat(matrixValues[5]) - deltaY;

            this.setBubbleScreenPosition(x, y);
        }
    }

    /**
     * Set position of Region Labels by given numbers
     *
     * @param {number} x
     * @param {number} y
     */
    setLabelScreenPosition(x, y) {
        if (this.label) {
            this.label.style.transform = "translate(" + x + "px," + y + "px)";
        }
    }

    /**
     * Set position of Region bubble by given numbers
     *
     * @param {number} x
     * @param {number} y
     */
    setBubbleScreenPosition(x, y) {
        if (this.bubble) {
            this.bubble.style.transform = "translate(" + x + "px," + y + "px)";
        }
    }
}
