/**
 * Details View controller. Large scrollable window with content and "X" close button
 * that can be placed in the map container, header/footer/sidebar or in a custom DIV container outside of the map.
 * @param {object} options
 * @extends Controller
 * @constructor
 */
import { MapSVG } from "../Core/globals.js";
import { Controller } from "../Core/Controller";
const $ = jQuery;

export class DetailsController extends Controller {
    modal: boolean;
    mobileCloseBtn: HTMLElement;

    constructor(options: { [key: string]: any }) {
        super(options);
        this.modal = options.modal;
        //this._init();
    }

    /**
     * Returns toolbar for the Details View
     * @returns {string}
     * @private
     */
    getToolbarTemplate() {
        if (this.withToolbar)
            return '<div class="mapsvg-popover-close mapsvg-details-close"></div>';
        else return "";
    }

    /**
     * Fires when view is fully rendered. Intended for final actions.
     * @private
     */
    viewDidLoad() {
        const _this = this;
        this.events.trigger("shown", _this, [_this]);
        if (
            this.modal &&
            MapSVG.isPhone &&
            this.mapsvg.options.detailsView.mobileFullscreen &&
            !this.mobileCloseBtn
        ) {
            this.mobileCloseBtn = $(
                '<button class="mapsvg-mobile-modal-close">' +
                    _this.mapsvg.options.mobileView.labelClose +
                    "</button>"
            )[0];
            this.containers.view.appendChild(this.mobileCloseBtn);
        }
    }

    /**
     * Sets event handlers
     * @private
     */
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
