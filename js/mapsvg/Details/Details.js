import { MapSVG } from "../Core/globals.js";
import { Controller } from "../Core/Controller";
const $ = jQuery;
export class DetailsController extends Controller {
    constructor(options) {
        super(options);
        this.modal = options.modal;
    }
    getToolbarTemplate() {
        if (this.withToolbar)
            return '<div class="mapsvg-popover-close mapsvg-details-close"></div>';
        else
            return "";
    }
    viewDidLoad() {
        const _this = this;
        this.events.trigger("shown", _this, [_this]);
        if (this.modal &&
            MapSVG.isPhone &&
            this.mapsvg.options.detailsView.mobileFullscreen &&
            !this.mobileCloseBtn) {
            this.mobileCloseBtn = $('<button class="mapsvg-mobile-modal-close">' +
                _this.mapsvg.options.mobileView.labelClose +
                "</button>")[0];
            this.containers.view.appendChild(this.mobileCloseBtn);
        }
    }
    setEventHandlers() {
        const _this = this;
        $(this.containers.toolbar).on("click touchend", ".mapsvg-popover-close", function (e) {
            e.stopPropagation();
            _this.destroy();
            _this.events.trigger("closed", _this, [_this]);
        });
        $(this.containers.view).on("click touchend", ".mapsvg-mobile-modal-close", function (e) {
            e.stopPropagation();
            _this.destroy();
            _this.events.trigger("closed", _this, [_this]);
        });
    }
}
//# sourceMappingURL=Details.js.map