import { MapSVG } from "./globals.js";
import Handlebars from "Handlebars";
import { ResizeSensor } from "./ResizeSensor.js";
import { Events } from "./Events.js";
const $ = jQuery;
export class Controller {
    constructor(options) {
        this.containers = {
            main: options.container,
        };
        this.mapsvg = options.mapsvg;
        this.template = options.template || "";
        this.scrollable = options.scrollable === undefined ? true : options.scrollable;
        this.withToolbar = options.withToolbar === undefined ? true : options.withToolbar;
        this.autoresize = MapSVG.parseBoolean(options.autoresize);
        this.templates = {
            toolbar: Handlebars.compile(this.getToolbarTemplate()),
            main: Handlebars.compile(this.getMainTemplate()),
        };
        this.data = options.data;
        this.width = options.width;
        this.color = options.color;
        this.events = new Events(this);
        if (options.events) {
            for (const eventName in options.events) {
                if (typeof options.events[eventName] === "function") {
                    this.events.on(eventName, options.events[eventName]);
                }
            }
        }
    }
    viewDidLoad() {
        const _this = this;
        _this.updateScroll();
        if (this.autoresize) {
            _this.adjustHeight();
            this.resizeSensor.setScroll();
        }
    }
    _viewDidLoad() {
        this.updateScroll();
    }
    viewDidAppear() { }
    viewDidDisappear() { }
    updateScroll() {
        if (!this.scrollable)
            return;
        const _this = this;
        $(this.containers.contentWrap).nanoScroller({
            preventPageScrolling: true,
        });
        setTimeout(function () {
            $(_this.containers.contentWrap).nanoScroller({
                preventPageScrolling: true,
            });
        }, 300);
    }
    adjustHeight() {
        const _this = this;
        $(_this.containers.main).height($(_this.containers.main).find(".mapsvg-auto-height").outerHeight() +
            (_this.containers.toolbar ? $(_this.containers.toolbar).outerHeight() : 0));
    }
    _init() {
        const _this = this;
        _this.render();
        _this.init();
    }
    init() { }
    getToolbarTemplate() {
        return "";
    }
    setMainTemplate(template) {
        return (this.templates.main = Handlebars.compile(template));
    }
    getMainTemplate() {
        return this.template;
    }
    render() {
        const _this = this;
        this.containers.view = $("<div />")
            .attr("id", "mapsvg-controller-" + this.name)
            .addClass("mapsvg-controller-view")[0];
        this.containers.contentWrap = $("<div />").addClass("mapsvg-controller-view-wrap")[0];
        this.containers.contentWrap2 = $("<div />")[0];
        this.containers.sizer = $("<div />").addClass("mapsvg-auto-height")[0];
        this.containers.contentView = $("<div />").addClass("mapsvg-controller-view-content")[0];
        this.containers.sizer.appendChild(this.containers.contentView);
        if (this.scrollable) {
            $(this.containers.contentWrap).addClass("nano");
            $(this.containers.contentWrap2).addClass("nano-content");
        }
        this.containers.contentWrap.appendChild(this.containers.contentWrap2);
        this.containers.contentWrap2.appendChild(this.containers.sizer);
        if (this.withToolbar && this.templates.toolbar) {
            this.containers.toolbar = $("<div />").addClass("mapsvg-controller-view-toolbar")[0];
            this.containers.view.appendChild(this.containers.toolbar);
        }
        this.containers.view.append(this.containers.contentWrap);
        this.containers.main.appendChild(this.containers.view);
        $(this.containers.main).data("controller", this);
        if (this.width)
            this.containers.view.style.width = this.width;
        if (this.color)
            this.containers.view.style["background-color"] = this.color;
        _this.viewReadyToFill();
        this.redraw();
        setTimeout(function () {
            _this._viewDidLoad();
            _this.viewDidLoad();
            _this.setEventHandlersCommon();
            _this.setEventHandlers();
        }, 1);
    }
    viewReadyToFill() {
        const _this = this;
        if (_this.autoresize) {
            _this.resizeSensor = new ResizeSensor(this.containers.sizer, () => {
                _this.adjustHeight();
                _this.updateScroll();
                _this.events.trigger("resize", this, [this]);
            });
        }
    }
    redraw(data) {
        if (data !== undefined) {
            this.data = data;
        }
        try {
            $(this.containers.contentView).html(this.templates.main(this.data));
        }
        catch (err) {
            console.error(err);
            $(this.containers.contentView).html("");
        }
        if (this.withToolbar && this.templates.toolbar)
            $(this.containers.toolbar).html(this.templates.toolbar(this.data));
        this.updateTopShift();
        if (this.noPadding)
            this.containers.contentView.style.padding = "0";
        this.updateScroll();
    }
    updateTopShift() {
        const _this = this;
        if (!this.withToolbar)
            return;
        $(_this.containers.contentWrap).css({
            top: $(_this.containers.toolbar).outerHeight(true) + "px",
        });
        setTimeout(function () {
            $(_this.containers.contentWrap).css({
                top: $(_this.containers.toolbar).outerHeight(true) + "px",
            });
        }, 100);
        setTimeout(function () {
            $(_this.containers.contentWrap).css({
                top: $(_this.containers.toolbar).outerHeight(true) + "px",
            });
        }, 200);
        setTimeout(function () {
            $(_this.containers.contentWrap).css({
                top: $(_this.containers.toolbar).outerHeight(true) + "px",
            });
            _this.updateScroll();
        }, 500);
    }
    setEventHandlersCommon() { }
    setEventHandlers() { }
    destroy() {
        delete this.resizeSensor;
        $(this.containers.view).empty().remove();
    }
}
//# sourceMappingURL=Controller.js.map