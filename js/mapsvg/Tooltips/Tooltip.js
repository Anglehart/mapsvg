import { MapSVG } from "../Core/globals.js";
import { Controller } from "../Core/Controller";
import { ScreenPoint } from "../Location/Location";
const $ = jQuery;
export class Tooltip extends Controller {
    constructor(options) {
        super(options);
        this.scrollable = false;
        this.withToolbar = false;
        this.autoresize = false;
        this.screenPoint = new ScreenPoint(0, 0);
        this.posOriginal = {};
        this.posShifted = {};
        this.posShiftedPrev = {};
        this.mirror = {};
        this.noPadding = true;
        this.setPosition(options.position);
        this.setSize(options.minWidth, options.maxWidth);
    }
    setSize(minWidth, maxWidth) {
        this.minWidth = minWidth;
        this.maxWidth = maxWidth;
        this.containers.main.style["min-width"] = this.minWidth + "px";
        this.containers.main.style["max-width"] = this.maxWidth + "px";
    }
    setPosition(position) {
        const ex = position.split("-");
        if (ex[0].indexOf("top") != -1 || ex[0].indexOf("bottom") != -1) {
            this.posOriginal.topbottom = ex[0];
        }
        if (ex[0].indexOf("left") != -1 || ex[0].indexOf("right") != -1) {
            this.posOriginal.leftright = ex[0];
        }
        if (ex[1]) {
            this.posOriginal.leftright = ex[1];
        }
        this.containers.main.className = this.containers.main.className.replace(/(^|\s)mapsvg-tt-\S+/g, "");
        this.containers.main.classList.add("mapsvg-tt-" + position);
    }
    setScreenPoint(x, y) {
        this.screenPoint.x = x;
        this.screenPoint.y = y;
    }
    viewDidLoad() {
        super.viewDidLoad.call(this);
    }
    viewDidAppear() {
        super.viewDidAppear();
        this.events.trigger("shown", this, [this]);
    }
    setScreenPosition(x, y) {
        this.setScreenPoint(x, y);
        this.containers.main.style.transform =
            "translateX(-50%) translate(" + x + "px," + y + "px)";
    }
    setEventHandlers() {
        const event = "mousemove.tooltip.mapsvg-" + this.mapsvg.id;
        $("body")
            .off(event)
            .on(event, (e) => {
            MapSVG.mouse = MapSVG.mouseCoords(e);
            this.containers.main.style.left =
                e.clientX +
                    $(window).scrollLeft() -
                    $(this.mapsvg.containers.map).offset().left +
                    "px";
            this.containers.main.style.top =
                e.clientY +
                    $(window).scrollTop() -
                    $(this.mapsvg.containers.map).offset().top +
                    "px";
            const m = new ScreenPoint(e.clientX + $(window).scrollLeft(), e.clientY + $(window).scrollTop());
            const _tbbox = this.containers.main.getBoundingClientRect();
            const _mbbox = this.mapsvg.containers.wrap.getBoundingClientRect();
            const tbbox = {
                top: _tbbox.top + $(window).scrollTop(),
                bottom: _tbbox.bottom + $(window).scrollTop(),
                left: _tbbox.left + $(window).scrollLeft(),
                right: _tbbox.right + $(window).scrollLeft(),
                width: _tbbox.width,
                height: _tbbox.height,
            };
            const mbbox = {
                top: _mbbox.top + $(window).scrollTop(),
                bottom: _mbbox.bottom + $(window).scrollTop(),
                left: _mbbox.left + $(window).scrollLeft(),
                right: _mbbox.right + $(window).scrollLeft(),
                width: _mbbox.width,
                height: _mbbox.height,
            };
            if (m.x > mbbox.right ||
                m.y > mbbox.bottom ||
                m.x < mbbox.left ||
                m.y < mbbox.top) {
                return;
            }
            if (this.mirror.top || this.mirror.bottom) {
                if (this.mirror.top && m.y > this.mirror.top) {
                    this.mirror.top = 0;
                    delete this.posShifted.topbottom;
                }
                else if (this.mirror.bottom && m.y < this.mirror.bottom) {
                    this.mirror.bottom = 0;
                    delete this.posShifted.topbottom;
                }
            }
            else {
                if (tbbox.bottom < mbbox.top + tbbox.height) {
                    this.posShifted.topbottom = "bottom";
                    this.mirror.top = m.y;
                }
                else if (tbbox.top > mbbox.bottom - tbbox.height) {
                    this.posShifted.topbottom = "top";
                    this.mirror.bottom = m.y;
                }
            }
            if (this.mirror.right || this.mirror.left) {
                if (this.mirror.left && m.x > this.mirror.left) {
                    this.mirror.left = 0;
                    delete this.posShifted.leftright;
                }
                else if (this.mirror.right && m.x < this.mirror.right) {
                    this.mirror.right = 0;
                    delete this.posShifted.leftright;
                }
            }
            else {
                if (tbbox.right < mbbox.left + tbbox.width) {
                    this.posShifted.leftright = "right";
                    this.mirror.left = m.x;
                }
                else if (tbbox.left > mbbox.right - tbbox.width) {
                    this.posShifted.leftright = "left";
                    this.mirror.right = m.x;
                }
            }
            let pos = $.extend({}, this.posOriginal, this.posShifted);
            const _pos = [];
            pos.topbottom && _pos.push(pos.topbottom);
            pos.leftright && _pos.push(pos.leftright);
            pos = _pos.join("-");
            if (this.posShifted.topbottom != this.posOriginal.topbottom ||
                this.posShifted.leftright != this.posOriginal.leftright) {
                this.containers.main.className = this.containers.main.className.replace(/(^|\s)mapsvg-tt-\S+/g, "");
                this.containers.main.classList.add("mapsvg-tt-" + pos);
                this.posShiftedPrev = pos;
            }
        });
    }
    setContent(template, data) {
        this.containers.main.innerHTML = template(data);
        return this;
    }
    show() {
        this.containers.main.classList.add("mapsvg-tooltip-visible");
        return this;
    }
    hide() {
        this.containers.main.classList.remove("mapsvg-tooltip-visible");
        return this;
    }
}
//# sourceMappingURL=Tooltip.js.map