import { MapSVG } from "../Core/globals.js";
import { Controller } from "../Core/Controller";
import { ScreenPoint, SVGPoint } from "../Location/Location";
import { Marker } from "../Marker/Marker";
import { Region } from "../Region/Region";
const $ = jQuery;

/**
 * Creates a scrollable popover in a map container.
 * @extends Controller
 * @param options
 * @constructor
 */
export class PopoverController extends Controller {
    point: SVGPoint;
    screenPoint: ScreenPoint;
    mapObject: Marker | Region;
    yShift: number;
    id: string;
    mobileCloseBtn: HTMLElement;

    constructor(options) {
        super(options);
        this.autoresize = true;
        this.point = options.point;
        this.yShift = options.yShift;
        this.mapObject = options.mapObject;
        this.id = this.mapObject.id + "_" + Math.random();
        $(this.containers.main).data("popover-id", this.id);
        //this._init();
    }

    /**
     * Sets a point where the popover should be shown
     * @param {ScreenPoint} point - [x,y]
     */
    setPoint(point: SVGPoint): void {
        this.point = point;
    }

    /**
     * Returns HTML template for the popover toolbar
     * @returns {string}
     */
    getToolbarTemplate(): string {
        if (this.withToolbar) return '<div class="mapsvg-popover-close"></div>';
        else return "";
    }

    /**
     * Final rendering steps of the popover
     * @private
     */
    viewDidLoad(): void {
        super.viewDidLoad.call(this);
        if (
            MapSVG.isPhone &&
            this.mapsvg.options.popovers.mobileFullscreen &&
            !this.mobileCloseBtn
        ) {
            this.mobileCloseBtn = $(
                '<button class="mapsvg-mobile-modal-close mapsvg-btn">' +
                    this.mapsvg.getData().options.mobileView.labelClose +
                    "</button>"
            )[0];
            $(this.containers.view).append(this.mobileCloseBtn);
        }
        this.adjustScreenPosition();
        $(this.containers.main).toggleClass("mapsvg-popover-animate", true);
        $(this.containers.main).toggleClass("mapsvg-popover-visible", true);
        this.adjustHeight();
        this.updateScroll();
        this.autoresize && this.resizeSensor.setScroll();
        this.events.trigger("shown", this, [this]);
    }

    /**
     * Adjusts height of the popover
     */
    adjustHeight(): void {
        $(this.containers.main).height(
            $(this.containers.main).find(".mapsvg-auto-height").outerHeight() +
                (this.containers.toolbar ? $(this.containers.toolbar).outerHeight() : 0)
        );
    }

    /**
     * Adjsuts position of the popver.
     *
     */
    adjustScreenPosition(): void {
        if (this.point) {
            const pos = this.mapsvg.converter.convertSVGToPixel(this.point);

            pos.y -= this.yShift;
            pos.x = Math.round(pos.x);
            pos.y = Math.round(pos.y);

            this.setScreenPosition(pos.x, pos.y);
        }
    }

    /**
     * Moves popover by given numbers
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
     * Set popover position by given numbers
     *
     * @param {number} x
     * @param {number} y
     */
    setScreenPosition(x: number, y: number): void {
        this.screenPoint = new ScreenPoint(x, y);
        $(this.containers.main).css({
            transform: "translateX(-50%) translate(" + x + "px," + y + "px)",
        });
    }

    /**
     * Sets event handlers for the popover
     */
    setEventHandlers(): void {
        $("body").off(".popover.mapsvg");

        $(this.containers.view).on(
            "click touchend",
            ".mapsvg-popover-close, .mapsvg-mobile-modal-close",
            (e) => {
                e.stopImmediatePropagation();
                this.close();
            }
        );

        $("body").on("mouseup.popover.mapsvg touchend.popover.mapsvg", (e) => {
            if (
                this.mapsvg.isScrolling ||
                $(e.target).closest(".mapsvg-directory").length ||
                $(e.target).closest(".mapsvg-popover").length ||
                $(e.target).hasClass("mapsvg-btn-map")
            )
                return;
            this.close();
        });
    }

    /**
     * Closes the popover
     */
    close(): void {
        if (
            $(this.containers.main).data("popover-id") != this.id ||
            !$(this.containers.main).is(":visible")
        )
            return;
        this.destroy();
        if (this.mapObject instanceof Region) {
            this.mapsvg.deselectRegion(this.mapObject);
        }
        if (this.mapObject instanceof Marker) {
            this.mapsvg.deselectAllMarkers();
        }

        this.events.trigger("closed", this, [this]);
    }

    /**
     * Destroys the popover
     */
    destroy(): void {
        $(this.containers.main).toggleClass("mapsvg-popover-animate", false);
        $(this.containers.main).toggleClass("mapsvg-popover-visible", false);
        super.destroy.call(this);
    }

    /**
     * Shows the popover
     */
    show(): void {
        $(this.containers.main).toggleClass("mapsvg-popover-animate", true);
        $(this.containers.main).toggleClass("mapsvg-popover-visible", true);
    }
}
