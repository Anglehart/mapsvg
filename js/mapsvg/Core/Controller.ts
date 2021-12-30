/**
 * Abstract class. Creates a scrollable controller. Extended by {@link #mapsvgpopovercontroller|PopoverController} / {@link #mapsvgdetailscontroller|DetailsController} / {@link #mapsvgdirectorycontroller|DirectoryController}
 * @abstract
 * @constructor
 * @param {object} options - List of options
 */
import { MapSVG } from "./globals.js";
import { MapSVGMap } from "../Map/Map";
// import {Handlebars} from "../../handlebars.js"
// @ts-ignore
import Handlebars from "Handlebars";
import { ResizeSensor } from "./ResizeSensor.js";
import { Events } from "./Events.js";
const $ = jQuery;

export class Controller {
    containers: {
        main: HTMLElement;
        view?: HTMLElement;
        toolbar?: HTMLElement;
        contentWrap?: HTMLElement;
        contentWrap2?: HTMLElement;
        contentView?: HTMLElement;
        sizer?: HTMLElement;
    };
    mapsvg: MapSVGMap;
    name: string;
    template: Function;
    scrollable: boolean;
    withToolbar: boolean;
    autoresize: boolean;
    templates: {
        toolbar: Function;
        main: Function;
    };
    data: { [key: string]: any };
    width: string;
    color: string;
    // container: HTMLElement;
    // contentWrap: HTMLElement;
    // contentWrap2: HTMLElement;
    // view: HTMLElement;
    // contentView: HTMLElement;
    // contentSizer: HTMLElement;
    // toolbarView: HTMLElement;
    resizeSensor: ResizeSensor;
    noPadding: boolean;
    events: Events;

    constructor(options: { [key: string]: any }) {
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
        //this._init();
    }

    /**
     * This method fires when the view is fully loaded. Can be used to do any final actions.
     * @method
     */
    viewDidLoad() {
        const _this = this;
        _this.updateScroll();
        if (this.autoresize) {
            _this.adjustHeight();
            this.resizeSensor.setScroll();
        }
    }

    /**
     * This method cannot be overriden and it fires always for all child classes.
     * @private
     */
    _viewDidLoad() {
        this.updateScroll();
    }

    /**
     * Fires when the view appears after being hidden.
     * Should be overriden by a child class.
     * @abstract
     */
    viewDidAppear() {}

    /**
     * This method fires when the view disappears.
     * Should be overriden by a child class.
     * @abstract
     */
    viewDidDisappear() {}

    /**
     * Updates the size of the scrollable container. Automatically fires when window size or content size changes.
     */
    updateScroll() {
        if (!this.scrollable) return;
        const _this = this;
        $(this.containers.contentWrap).nanoScroller({
            preventPageScrolling: true,
            // iOSNativeScrolling: true,
        });
        setTimeout(function () {
            $(_this.containers.contentWrap).nanoScroller({
                preventPageScrolling: true,
                // iOSNativeScrolling: true,
            });
        }, 300);
    }

    /**
     * Adjusts height of the container to fit content.
     */
    adjustHeight() {
        const _this = this;
        $(_this.containers.main).height(
            $(_this.containers.main).find(".mapsvg-auto-height").outerHeight() +
                (_this.containers.toolbar ? $(_this.containers.toolbar).outerHeight() : 0)
        );
    }

    /**
     * Initialization actions for all child classes. Should not be overriden.
     * @private
     */
    _init() {
        const _this = this;
        _this.render();
        _this.init();
    }

    /**
     * Initialization actions. Empty method. Can be overriden by child classes.
     */
    init() {}

    /**
     * This method must be overriden by a child class and return an HTML code for the toolbar.
     */
    getToolbarTemplate() {
        return "";
    }

    /**
     * Sets the template for the body
     */
    setMainTemplate(template: any) {
        return (this.templates.main = Handlebars.compile(template));
    }

    /**
     * This method must be overriden by a child class and  to return an HTML code for the main content
     */
    getMainTemplate() {
        return this.template;
    }

    /**
     * Renders the content.
     */
    render() {
        const _this = this;
        this.containers.view = $("<div />")
            .attr("id", "mapsvg-controller-" + this.name)
            .addClass("mapsvg-controller-view")[0];

        // Wrap cointainer, includes scrollable container
        this.containers.contentWrap = $("<div />").addClass("mapsvg-controller-view-wrap")[0];
        this.containers.contentWrap2 = $("<div />")[0];

        // Scrollable container
        this.containers.sizer = $("<div />").addClass("mapsvg-auto-height")[0];
        this.containers.contentView = $("<div />").addClass("mapsvg-controller-view-content")[0];
        this.containers.sizer.appendChild(this.containers.contentView);

        if (this.scrollable) {
            $(this.containers.contentWrap).addClass("nano");
            $(this.containers.contentWrap2).addClass("nano-content");
        }
        this.containers.contentWrap.appendChild(this.containers.contentWrap2);
        this.containers.contentWrap2.appendChild(this.containers.sizer);

        // Add toolbar if it exists in template file
        if (this.withToolbar && this.templates.toolbar) {
            this.containers.toolbar = $("<div />").addClass("mapsvg-controller-view-toolbar")[0];
            this.containers.view.appendChild(this.containers.toolbar);
        }

        this.containers.view.append(this.containers.contentWrap);

        // Add view into container
        this.containers.main.appendChild(this.containers.view);
        $(this.containers.main).data("controller", this);

        if (this.width) this.containers.view.style.width = this.width;
        if (this.color) this.containers.view.style["background-color"] = this.color;

        _this.viewReadyToFill();
        this.redraw();

        setTimeout(function () {
            _this._viewDidLoad();
            _this.viewDidLoad();
            _this.setEventHandlersCommon();
            _this.setEventHandlers();
        }, 1);
    }

    /**
     * Fires right before rendering starts.
     */
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

    /**
     * Redraws the container.
     */
    redraw(data?: { [key: string]: any }) {
        if (data !== undefined) {
            this.data = data;
        }

        try {
            $(this.containers.contentView).html(this.templates.main(this.data));
        } catch (err) {
            console.error(err);
            $(this.containers.contentView).html("");
        }

        if (this.withToolbar && this.templates.toolbar)
            $(this.containers.toolbar).html(this.templates.toolbar(this.data));

        this.updateTopShift();

        if (this.noPadding) this.containers.contentView.style.padding = "0";

        this.updateScroll();
    }

    /**
     * Updates top shift of the main container depending on toolbar height
     */
    updateTopShift() {
        const _this = this;
        if (!this.withToolbar) return;
        // bad, i know.
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

    /**
     * Set common event handlers for all child classes
     */
    setEventHandlersCommon() {}

    /**
     * Set event handlers. Can be overriden by a child class.
     */
    setEventHandlers() {}

    /**
     * Destroys the controller.
     */
    destroy() {
        delete this.resizeSensor;
        $(this.containers.view).empty().remove();
    }
}
