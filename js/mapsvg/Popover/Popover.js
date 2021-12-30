import { MapSVG } from "../Core/globals.js";
import { Controller } from "../Core/Controller";
import { ScreenPoint } from "../Location/Location";
import { Marker } from "../Marker/Marker";
import { Region } from "../Region/Region";
const $ = jQuery;
export class PopoverController extends Controller {
    constructor(options) {
        super(options);
        this.autoresize = true;
        this.point = options.point;
        this.yShift = options.yShift;
        this.mapObject = options.mapObject;
        this.id = this.mapObject.id + "_" + Math.random();
        $(this.containers.main).data("popover-id", this.id);
    }
    setPoint(point) {
        this.point = point;
    }
    getToolbarTemplate() {
        if (this.withToolbar)
            return '<div class="mapsvg-popover-close"></div>';
        else
            return "";
    }
    viewDidLoad() {
        super.viewDidLoad.call(this);
        if (MapSVG.isPhone &&
            this.mapsvg.options.popovers.mobileFullscreen &&
            !this.mobileCloseBtn) {
            this.mobileCloseBtn = $('<button class="mapsvg-mobile-modal-close mapsvg-btn">' +
                this.mapsvg.getData().options.mobileView.labelClose +
                "</button>")[0];
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
    adjustHeight() {
        $(this.containers.main).height($(this.containers.main).find(".mapsvg-auto-height").outerHeight() +
            (this.containers.toolbar ? $(this.containers.toolbar).outerHeight() : 0));
    }
    adjustScreenPosition() {
        if (this.point) {
            const pos = this.mapsvg.converter.convertSVGToPixel(this.point);
            pos.y -= this.yShift;
            pos.x = Math.round(pos.x);
            pos.y = Math.round(pos.y);
            this.setScreenPosition(pos.x, pos.y);
        }
    }
    moveSrceenPositionBy(deltaX, deltaY) {
        const oldPos = this.screenPoint, x = oldPos.x - deltaX, y = oldPos.y - deltaY;
        this.setScreenPosition(x, y);
    }
    setScreenPosition(x, y) {
        this.screenPoint = new ScreenPoint(x, y);
        $(this.containers.main).css({
            transform: "translateX(-50%) translate(" + x + "px," + y + "px)",
        });
    }
    setEventHandlers() {
        $("body").off(".popover.mapsvg");
        $(this.containers.view).on("click touchend", ".mapsvg-popover-close, .mapsvg-mobile-modal-close", (e) => {
            e.stopImmediatePropagation();
            this.close();
        });
        $("body").on("mouseup.popover.mapsvg touchend.popover.mapsvg", (e) => {
            if (this.mapsvg.isScrolling ||
                $(e.target).closest(".mapsvg-directory").length ||
                $(e.target).closest(".mapsvg-popover").length ||
                $(e.target).hasClass("mapsvg-btn-map"))
                return;
            this.close();
        });
    }
    close() {
        if ($(this.containers.main).data("popover-id") != this.id ||
            !$(this.containers.main).is(":visible"))
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
    destroy() {
        $(this.containers.main).toggleClass("mapsvg-popover-animate", false);
        $(this.containers.main).toggleClass("mapsvg-popover-visible", false);
        super.destroy.call(this);
    }
    show() {
        $(this.containers.main).toggleClass("mapsvg-popover-animate", true);
        $(this.containers.main).toggleClass("mapsvg-popover-visible", true);
    }
}
//# sourceMappingURL=Popover.js.map