(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('Handlebars'), require('Bloodhound'), require('CodeMirror')) :
    typeof define === 'function' && define.amd ? define(['exports', 'Handlebars', 'Bloodhound', 'CodeMirror'], factory) :
    (global = global || self, factory(global.mapsvg = {}, global.Handlebars, global.Bloodhound, global.CodeMirror));
}(this, (function (exports, Handlebars, Bloodhound, CodeMirror) { 'use strict';

    Handlebars = Handlebars && Handlebars.hasOwnProperty('default') ? Handlebars['default'] : Handlebars;
    Bloodhound = Bloodhound && Bloodhound.hasOwnProperty('default') ? Bloodhound['default'] : Bloodhound;

    /**
     * Global MapSVG class. It contains all other MapSVG classes and some static methods.
     * @constructor
     * @example
     * var mapsvg = MapSVG.get(0); // get first map instance
     * var mapsvg2 = MapSVG.get(1); // get second map instance
     * var mapsvg3 = MapSVG.getById(123); // get map by ID
     *
     * var mapsvg = new MapSVG.Map("my-container",{
     *   source: "/path/to/map.svg"
     * });
     *
     * var marker = new MapSVG.Marker({
     *   location: location,
     *   mapsvg: mapsvg
     * });
     *
     * if(MapSVG.isPhone){
     *  // do something special for mobile devices
     * }
     *
     *
     */
    var MapSVG = function () {};
    const $ = jQuery;

    MapSVG.formBuilder = {};
    MapSVG.mediaUploader = {};

    if (typeof wp !== "undefined" && typeof wp.media !== "undefined") {
        MapSVG.mediaUploader = wp.media({
            title: "Choose images",
            button: {
                text: "Choose images",
            },
            multiple: true,
        });
    }

    /**
     * Keeps loaded HBS templates
     * @type {Array}
     * @private
     * @static
     * @property
     */
    MapSVG.templatesLoaded = {};

    /**
     * Keeps URLs
     * @type {Array}
     * @private
     * @static
     * @property
     */
    if (typeof mapsvg_paths !== "undefined") {
        MapSVG.urls = mapsvg_paths;
    } else {
        MapSVG.urls = {};
    }
    if (typeof ajaxurl !== "undefined") {
        MapSVG.urls.ajaxurl = ajaxurl;
    }

    /**
     * Keeps map instances
     * @type {Array}
     * @private
     * @static
     * @property
     */
    MapSVG.instances = [];

    MapSVG.userAgent = navigator.userAgent.toLowerCase();

    /**
     * Determines if current device is touch-device
     * @type {boolean}
     * @static
     * @property
     */
    MapSVG.touchDevice =
        "ontouchstart" in window || navigator.MaxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    // (MapSVG.userAgent.indexOf("ipad") > -1) ||
    // (MapSVG.userAgent.indexOf("iphone") > -1) ||
    // (MapSVG.userAgent.indexOf("ipod") > -1) ||
    // (MapSVG.userAgent.indexOf("android") > -1);

    /**
     * Determines if current device is iOS-device
     * @type {boolean}
     * @static
     * @property
     */
    MapSVG.ios =
        MapSVG.userAgent.indexOf("ipad") > -1 ||
        MapSVG.userAgent.indexOf("iphone") > -1 ||
        MapSVG.userAgent.indexOf("ipod") > -1;

    /**
     * Determines if current device is Android-device
     * @type {boolean}
     * @static
     * @property
     */
    MapSVG.android = MapSVG.userAgent.indexOf("android");

    /**
     * Determines if current device is mobile-device
     * @type {boolean}
     * @static
     * @property
     */
    MapSVG.isPhone = window.matchMedia("only screen and (max-width: 812px)").matches;

    /**
     * Keeps browser information
     * @type {object}
     * @static
     * @property
     */
    MapSVG.browser = {};
    MapSVG.browser.ie =
        MapSVG.userAgent.indexOf("msie") > -1 ||
        MapSVG.userAgent.indexOf("trident") > -1 ||
        MapSVG.userAgent.indexOf("edge") > -1
            ? {}
            : false;
    MapSVG.browser.firefox = MapSVG.userAgent.indexOf("firefox") > -1;

    /**
     * Contains device information
     * @type {object}
     * @static
     * @property
     */
    var ua = window.navigator.userAgent;
    MapSVG.device = {};
    MapSVG.device.ios = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    MapSVG.device.android = !!ua.match(/Android/i);

    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g, "");
        };
    }

    /**
     * Converts mouse event object to x/y coordinates
     * @param e
     * @returns {{x: *, y: *}}
     */
    MapSVG.mouseCoords = function (e) {
        if (e.clientX) {
            return { x: e.clientX + $(document).scrollLeft(), y: e.clientY + $(document).scrollTop() };
        }
        if (e.pageX) {
            return { x: e.pageX, y: e.pageY };
        } else if (MapSVG.touchDevice) {
            e = e.originalEvent || e;
            return e.touches && e.touches[0]
                ? { x: e.touches[0].pageX, y: e.touches[0].pageY }
                : { x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY };
        }
    };

    /**
     * Adds new instance of the map
     * @param {MapSVG.Map} mapsvg
     */
    MapSVG.addInstance = function (mapsvg) {
        MapSVG.instances.push(mapsvg);
    };

    MapSVG.get = function (index) {
        return MapSVG.instances[index];
    };

    MapSVG.getById = function (id) {
        var instance = MapSVG.instances.filter(function (i) {
            return i.id == id;
        });
        if (instance.length > 0) {
            return instance[0];
        }
    };

    MapSVG.getByContainerId = function (id) {
        var instance = MapSVG.instances.filter(function (i) {
            return i.$map.attr("id") == id;
        });
        if (instance.length > 0) {
            return instance[0];
        }
    };

    MapSVG.extend = function (sub, base) {
        sub.prototype = Object.create(base.prototype);
        sub.prototype.constructor = sub;
    };

    MapSVG.ucfirst = function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };
    MapSVG.parseBoolean = function (string) {
        switch (String(string).toLowerCase()) {
            case "on":
            case "true":
            case "1":
            case "yes":
            case "y":
                return true;
            case "off":
            case "false":
            case "0":
            case "no":
            case "n":
                return false;
            default:
                return undefined;
        }
    };
    MapSVG.isNumber = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    MapSVG.safeURL = function (url) {
        if (url.indexOf("http://") == 0 || url.indexOf("https://") == 0)
            url = "//" + url.split("://").pop();
        return url.replace(/^.*\/\/[^\/]+/, "");
    };

    MapSVG.convertToText = function (obj) {
        //create an array that will later be joined into a string.
        var string = [];

        //is object
        //    Both arrays and objects seem to return "object"
        //    when typeof(obj) is applied to them. So instead
        //    I am checking to see if they have the property
        //    join, which normal objects don't have but
        //    arrays do.
        if (obj === null) {
            return null;
        }
        if (obj === undefined) {
            return '""';
        } else if (typeof obj == "object" && obj.join == undefined) {
            var prop;
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    var key = '"' + prop.replace(/\"/g, '\\"') + '"'; //prop.search(/[^a-zA-Z]+/) === -1 ?  prop : ...
                    string.push(key + ": " + MapSVG.convertToText(obj[prop]));
                }
            }
            return "{" + string.join(",") + "}";

            //is array
        } else if (typeof obj == "object" && !(obj.join == undefined)) {
            var prop;
            for (prop in obj) {
                string.push(MapSVG.convertToText(obj[prop]));
            }
            return "[" + string.join(",") + "]";

            //is function
        } else if (typeof obj == "function") {
            return obj.toString().replace("function anonymous", "function");
            // string.push(obj.toString().replace('function anonymous','function'));

            //all other values can be done with JSON.stringify
        } else {
            return JSON.stringify(obj);
            // var s = JSON.stringify(obj);
            // string.push(s);
        }
    };

    // Create Element.remove() function if not exists
    if (!("remove" in Element.prototype)) {
        Element.prototype.remove = function () {
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        };
    }

    Math.hypot =
        Math.hypot ||
        function () {
            var y = 0;
            var length = arguments.length;

            for (var i = 0; i < length; i++) {
                if (arguments[i] === Infinity || arguments[i] === -Infinity) {
                    return Infinity;
                }
                y += arguments[i] * arguments[i];
            }
            return Math.sqrt(y);
        };
    SVGElement.prototype.getTransformToElement =
        SVGElement.prototype.getTransformToElement ||
        function (toElement) {
            let value;
            try {
                value = toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());
            } catch (e) {
                return;
            }
            return value;
        };

    Map.prototype.toArray = function () {
        return Array.from(this, ([name, value]) => value);
    };

    MapSVG.ResizeSensor = class ResizeSensor {
        constructor(element, callback) {
            var _this = this;
            _this.element = element;
            _this.callback = callback;
            var style = getComputedStyle(element);
            var zIndex = parseInt(style.zIndex);
            if (isNaN(zIndex)) {
                zIndex = 0;
            }
            zIndex--;
            _this.expand = document.createElement("div");
            _this.expand.style.position = "absolute";
            _this.expand.style.left = "0px";
            _this.expand.style.top = "0px";
            _this.expand.style.right = "0px";
            _this.expand.style.bottom = "0px";
            _this.expand.style.overflow = "hidden";
            _this.expand.style.zIndex = zIndex.toString();
            _this.expand.style.visibility = "hidden";
            var expandChild = document.createElement("div");
            expandChild.style.position = "absolute";
            expandChild.style.left = "0px";
            expandChild.style.top = "0px";
            expandChild.style.width = "10000000px";
            expandChild.style.height = "10000000px";
            _this.expand.appendChild(expandChild);
            _this.shrink = document.createElement("div");
            _this.shrink.style.position = "absolute";
            _this.shrink.style.left = "0px";
            _this.shrink.style.top = "0px";
            _this.shrink.style.right = "0px";
            _this.shrink.style.bottom = "0px";
            _this.shrink.style.overflow = "hidden";
            _this.shrink.style.zIndex = zIndex.toString();
            _this.shrink.style.visibility = "hidden";
            var shrinkChild = document.createElement("div");
            shrinkChild.style.position = "absolute";
            shrinkChild.style.left = "0px";
            shrinkChild.style.top = "0px";
            shrinkChild.style.width = "200%";
            shrinkChild.style.height = "200%";
            _this.shrink.appendChild(shrinkChild);
            _this.element.appendChild(_this.expand);
            _this.element.appendChild(_this.shrink);
            var size = element.getBoundingClientRect();
            _this.currentWidth = size.width;
            _this.currentHeight = size.height;
            _this.setScroll();
            _this.expand.addEventListener("scroll", function () {
                _this.onScroll();
            });
            _this.shrink.addEventListener("scroll", function () {
                _this.onScroll();
            });
        }
        onScroll() {
            var _this = this;
            var size = _this.element.getBoundingClientRect();
            var newWidth = size.width;
            var newHeight = size.height;
            if (newWidth != _this.currentWidth || newHeight != _this.currentHeight) {
                _this.currentWidth = newWidth;
                _this.currentHeight = newHeight;
                _this.callback();
            }
            this.setScroll();
        }
        setScroll() {
            this.expand.scrollLeft = 10000000;
            this.expand.scrollTop = 10000000;
            this.shrink.scrollLeft = 10000000;
            this.shrink.scrollTop = 10000000;
        }
        destroy() {
            this.expand.remove();
            this.shrink.remove();
        }
    };

    MapSVG.nonce = function () {
        return mapsvg_runtime_vars.nonce;
    };

    /**
     * Adds # hash at the beginning of HEX color value
     * @param {String} color
     * @returns {String}
     * @private
     */
    MapSVG.fixColorHash = (color) => {
        const hexColorNoHash = new RegExp(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
        if (color && color.match(hexColorNoHash) !== null) {
            color = "#" + color;
        }
        return color;
    };

    /**
     * Delays method execution.
     * For example, it can be used in search input fields to prevent sending
     * an ajax request on each key press.
     * @param {Function} method
     * @param {number} delay
     * @param {object} scope
     * @param {array} params
     * @private
     */
    MapSVG.throttle = (method, delay, scope, params) => {
        clearTimeout(method._tId);
        method._tId = setTimeout(function () {
            method.apply(scope, params);
        }, delay);
    };
    MapSVG.geocode = (query, callback) => {
        if (!window.google) {
            console.error("MapSVG: can't do Geocoding - Google Maps API is not loaded.");
            jQuery.growl.error({
                title: "Error",
                message: "Google Maps API files are not loaded",
            });
            return false;
        }
        if (!MapSVG.options.google_api_key) {
            jQuery.growl.error({
                title: "Error",
                message: "Google Maps API key is not provided",
            });
            return false;
        }
        if (!MapSVG.geocoder) {
            MapSVG.geocoder = new google.maps.Geocoder();
        }

        MapSVG.throttle(MapSVG.geocoder.geocode, 500, MapSVG.geocoder, [
            query,
            function (results, status) {
                if (status === "OK") {
                    callback(results);
                } else {
                    jQuery.growl.error({
                        title: "Error: " + status,
                        message:
                            "There is some problem with Google API keys. See browser's console for more details",
                    });
                }
            },
        ]);
    };

    MapSVG.handleFailedRequest = (response) => {
        var message = "";

        if (response.status === 403) {
            if (response.responseText.indexOf("Wordfence") !== -1) {
                message +=
                    "The request has been blocked by Wordfence. " +
                    'Switch Wordfence to "Learning mode", and save the map settings again. ' +
                    "If the settings are saved successfully, you can switch Wordfence back to normal mode.";
            } else {
                message +=
                    "The request has been blocked by your server. " +
                    "Do you have mod_sec Apache's module enabled? If that's the case you need to change its settings.";
            }
        } else {
            if (response && response.responseText) {
                try {
                    var _response = JSON.parse(response.responseText);
                    if (_response && _response.data && _response.data.error) {
                        message = _response.data.error;
                    }
                } catch (e) {
                }
            }
        }

        $.growl.error({
            title: "Error: " + response.status + " " + response.statusText,
            message: message,
            duration: 30000,
        });
    };

    if (!Object.values) {
        Object.values = function (object) {
            return Object.keys(object).map(function (k) {
                return object[k];
            });
        };
    }

    window.MapSVG = MapSVG;

    const defRegionTemplate = "<div>\n" +
        "  <p>This is the demo content of the <strong>Region %templateType%</strong>.</p>\n" +
        '  <p>How to edit it: if you are in mapsvg control panel now, click on the following link to open the template editor for this view: <a href="#" class="mapsvg-template-link" data-template="%templateTypeSnake%Region">Menu > Templates > Region %templateType%</a>.</p>\n' +
        '  <p>More information about templates: <a href="https://mapsvg.com/docs/map-editor/templates" target="_blank">mapsvg.com/docs/map-editor/templates</a></p>\n' +
        "</div>\n" +
        "<hr />\n\n" +
        "<!-- Region fields are available in this template -->\n" +
        "<h5>{{#if title}} {{title}} {{else}} {{id}} {{/if}}</h5>\n" +
        "<p>Status: {{status_text}}</p>\n\n" +
        "<!-- Show all linked Database Objects: -->\n" +
        "{{#each objects}}\n\n" +
        "  <!-- DB Object are available inside of this block -->\n\n" +
        "  <h5>{{title}}</h5>\n" +
        "  <!-- When you need to render a field as HTML, use 3 curly braces instead of 2:-->\n" +
        "  <p>{{{description}}}</p>\n" +
        "  <p><em>{{location.address.formatted}}</em></p>\n\n" +
        "  <!-- Show all images: -->\n" +
        "  {{#each images}}\n" +
        '    <!-- Image fields "thumbnail", "medium", "full" -->\n' +
        "    <!-- are available in this block                -->\n" +
        '    <img src="{{thumbnail}}" />\n' +
        "  {{/each}}\n\n" +
        "{{/each}}";
    const defDBTemplate = "<div>\n" +
        "  <p>This is the demo content of the <strong>DB Object %templateType%</strong>.</p>\n" +
        '  <p>How to edit it: if you are in mapsvg control panel now, click on the following link to open the template editor for this view: <a href="#" class="mapsvg-template-link" data-template="%templateTypeSnake%">Menu > Templates > DB Object %templateType%</a>.</p>\n' +
        '  <p>More information about templates: <a href="https://mapsvg.com/docs/map-editor/templates" target="_blank">mapsvg.com/docs/map-editor/templates</a></p>\n' +
        "</div>\n" +
        "<hr />\n\n" +
        "<!-- DB Object fields are available in this template. -->\n" +
        "<h5>{{title}}</h5>\n" +
        "<!-- When you need to render a fields as HTML, use 3 curly braces instead of 2:-->\n" +
        "<p>{{{description}}}</p>\n" +
        "<p><em>{{location.address.formatted}}</em></p>\n\n" +
        "<!-- Show all images: -->\n" +
        "{{#each images}}\n" +
        '  <!-- Image fields "thumbnail", "medium", "full" -->\n' +
        "  <!-- are available in this block                -->\n" +
        '  <img src="{{thumbnail}}" />\n' +
        "{{/each}}\n\n" +
        "<!-- Show all linked Regions, comma-separated: -->\n" +
        "<p> Regions: \n" +
        "  {{#each regions}}\n" +
        "    <!-- Region fields are available in this block -->\n" +
        "    {{#if title}}\n" +
        "      {{title}}\n" +
        "    {{else}}\n" +
        "      {{id}}\n" +
        "    {{/if}}{{#unless @last}}, {{/unless}}\n" +
        "  {{/each}}\n" +
        "</p>";
    const dirItemItemTemplate = "<!-- If Directory Source = Database: DB Object fields are available in this template -->\n" +
        "<!-- If Directory Source = Regions: Region fields are available in this template -->\n" +
        "{{title}}";
    const DefaultOptions = {
        source: "",
        markerLastID: 0,
        regionLastID: 0,
        dataLastID: 1,
        disableAll: false,
        width: null,
        height: null,
        lockAspectRatio: false,
        padding: { top: 0, left: 0, right: 0, bottom: 0 },
        maxWidth: null,
        maxHeight: null,
        minWidth: null,
        minHeight: null,
        loadingText: "Loading map...",
        colorsIgnore: false,
        colors: {
            baseDefault: "#000000",
            background: "#eeeeee",
            selected: 40,
            hover: 20,
            directory: "#fafafa",
            detailsView: "",
            status: {},
            clusters: "",
            clustersBorders: "",
            clustersText: "",
            clustersHover: "",
            clustersHoverBorders: "",
            clustersHoverText: "",
            markers: {
                base: { opacity: 100, saturation: 100 },
                hovered: { opacity: 100, saturation: 100 },
                unhovered: { opacity: 40, saturation: 100 },
                active: { opacity: 100, saturation: 100 },
                inactive: { opacity: 40, saturation: 100 },
            },
        },
        regions: {},
        clustering: { on: false },
        viewBox: [],
        cursor: "default",
        manualRegions: false,
        onClick: null,
        mouseOver: null,
        mouseOut: null,
        menuOnClick: null,
        beforeLoad: null,
        afterLoad: null,
        zoom: {
            on: true,
            limit: [0, 22],
            delta: 2,
            buttons: { on: true, location: "right" },
            mousewheel: true,
            fingers: true,
            hideSvg: false,
            hideSvgZoomLevel: 7,
        },
        scroll: { on: true, limit: false, background: false, spacebar: false },
        responsive: true,
        tooltips: { on: false, position: "bottom-right", template: "", maxWidth: "", minWidth: 100 },
        popovers: {
            on: false,
            position: "top",
            template: "",
            centerOn: true,
            width: 300,
            maxWidth: 50,
            maxHeight: 50,
        },
        multiSelect: false,
        regionStatuses: {
            "1": { label: "Enabled", value: "1", color: "", disabled: false },
            "0": { label: "Disabled", value: "0", color: "", disabled: true },
        },
        events: {
            afterLoad: "function(){\n" +
                "  // var mapsvg = this;\n" +
                "  // var regions = mapsvg.regions;\n" +
                "  // var dbObjects = mapsvg.database.getLoaded();\n" +
                "}",
            beforeLoad: "function(){\n" +
                "  // var mapsvg = this;\n" +
                "  // var settings = mapsvg.options;\n" +
                "  // console.log(settings);\n" +
                "}",
            databaseLoaded: "function (){\n" +
                "  // var mapsvg = this;\n" +
                "  // var dbObjects = mapsvg.database.getLoaded();\n" +
                "}",
            "click.region": "function (e, mapsvg){\n" +
                "  // var region = this;\n" +
                "  // console.log(region);\n" +
                "}",
            "mouseover.region": "function (e, mapsvg){\n" +
                "  // var region = this;\n" +
                "  // console.log(region);\n" +
                "}",
            "mouseout.region": "function (e, mapsvg){\n" +
                "  // var region = this;\n" +
                "  // console.log(region);\n" +
                "}",
            "click.marker": "function (e, mapsvg){\n" +
                "  // var marker = this;\n" +
                "  // console.log(marker);\n" +
                "}",
            "mouseover.marker": "function (e, mapsvg){\n" +
                "  // var marker = this;\n" +
                "  // console.log(marker);\n" +
                "}",
            "mouseout.marker": "function (e, mapsvg){\n" +
                "  // var marker = this;\n" +
                "  // console.log(marker);\n" +
                "}",
            "click.directoryItem": "function (e, regionOrObject, mapsvg){\n" + "  // var itemjQueryObject = this;\n" + "}",
            "mouseover.directoryItem": "function (e, regionOrObject, mapsvg){\n" + "  // var itemjQueryObject = this;\n" + "}",
            "mouseout.directoryItem": "function (e, regionOrObject, mapsvg){\n" + "  // var itemjQueryObject = this;\n" + "}",
            "shown.popover": "function (mapsvg){\n" + "  // var popoverjQueryObject = this;\n" + "}",
            "closed.popover": "function (mapsvg){\n" + "  // var popoverjQueryObject = this;\n" + "}",
            "closed.detailsView": "function (mapsvg){\n" + "  // var detailsjQueryObject = this;\n" + "}",
            "shown.detailsView": "function (mapsvg){\n" + "  // var detailsjQueryObject = this;\n" + "}",
        },
        css: "#mapsvg-map-%id% .mapsvg-tooltip {\n\n}\n" +
            "#mapsvg-map-%id% .mapsvg-popover {\n\n}\n" +
            "#mapsvg-map-%id% .mapsvg-details-container {\n\n}\n" +
            "#mapsvg-map-%id% .mapsvg-directory-item {\n\n}\n" +
            "#mapsvg-map-%id% .mapsvg-region-label {\n" +
            "  /* background-color: rgba(255,255,255,.6); */\n" +
            "  font-size: 11px;\n" +
            "  padding: 3px 5px;\n" +
            "  border-radius: 4px;\n" +
            "}\n" +
            "#mapsvg-map-%id% .mapsvg-marker-label {\n" +
            "  padding: 3px 5px;\n" +
            "  /*\n" +
            "  border-radius: 4px;\n" +
            "  background-color: white;\n" +
            "  margin-top: -4px;\n" +
            "  */\n}\n" +
            "#mapsvg-map-%id% .mapsvg-filters-wrap {\n\n}\n" +
            "\n\n\n\n\n\n",
        templates: {
            popoverRegion: defRegionTemplate
                .replace(/%templateType%/g, "Popover")
                .replace(/%templateTypeSnake%/g, "popover"),
            popoverMarker: defDBTemplate
                .replace(/%templateType%/g, "Popover")
                .replace(/%templateTypeSnake%/g, "popover"),
            tooltipRegion: "<!-- Region fields are available in this template -->\n{{id}} - {{title}}",
            tooltipMarker: "<!-- DB Object fields are available in this template -->\n{{title}}",
            directoryItem: dirItemItemTemplate,
            directoryCategoryItem: '<!-- Available fields: "label", "value", "counter" -->\n<span class="mapsvg-category-label">{{label}}</span>\n<span class="mapsvg-category-counter">{{counter}}</span>\n<span class="mapsvg-chevron"></span>',
            detailsView: defDBTemplate
                .replace(/%templateType%/g, "Details View")
                .replace(/%templateTypeSnake%/g, "detailsView"),
            detailsViewRegion: defRegionTemplate
                .replace(/%templateType%/g, "Details View")
                .replace(/%templateTypeSnake%/g, "detailsView"),
            labelMarker: "<!-- DB Object fields are available in this template -->\n{{title}}",
            labelRegion: "<!-- Region fields are available in this template -->\n{{title}}",
            labelLocation: "You are here!",
        },
        choropleth: {
            on: false,
            source: "regions",
            sourceFieldSelect: {
                on: false,
                variants: [],
            },
            bubbleMode: false,
            bubbleSize: {
                min: 20,
                max: 40,
            },
            labels: { low: "low", high: "high" },
            colors: { lowRGB: null, highRGB: null, low: "#550000", high: "#ee0000", noData: "#333333" },
            min: 0,
            max: 0,
            coloring: {
                mode: "gradient",
                noData: {
                    color: "#999999",
                    description: "No data",
                },
                gradient: {
                    colors: {
                        lowRGB: null,
                        highRGB: null,
                        diffRGB: null,
                        low: "#550000",
                        high: "#ee0000",
                    },
                    labels: {
                        low: "low",
                        high: "high",
                    },
                    values: {
                        min: null,
                        max: null,
                        maxAdjusted: null,
                    },
                },
                palette: {
                    outOfRange: {
                        color: "#ececec",
                        description: "Out of range",
                    },
                    colors: [
                        {
                            color: "#550000",
                            valueFrom: 0,
                            valueTo: 50,
                            description: "",
                        },
                    ],
                },
                legend: {
                    on: true,
                    layout: "vertical",
                    container: "bottom-left",
                    title: "Choropleth map",
                    text: "",
                    description: "",
                    width: "20%",
                    height: "20%",
                },
            },
        },
        filters: {
            on: true,
            source: "database",
            location: "header",
            modalLocation: "map",
            width: "100%",
            hide: false,
            showButtonText: "Filters",
            clearButtonText: "Clear all",
            clearButton: false,
            searchButton: false,
            searchButtonText: "Search",
            padding: "",
        },
        menu: {
            on: false,
            hideOnMobile: true,
            location: "leftSidebar",
            locationMobile: "leftSidebar",
            search: false,
            containerId: "",
            searchPlaceholder: "Search...",
            searchFallback: false,
            source: "database",
            showFirst: "map",
            showMapOnClick: true,
            minHeight: "400",
            sortBy: "id",
            sortDirection: "desc",
            categories: {
                on: false,
                groupBy: "",
                hideEmpty: true,
                collapse: true,
                collapseOther: true,
            },
            clickActions: {
                region: "default",
                marker: "default",
                directoryItem: {
                    triggerClick: true,
                    showPopover: false,
                    showDetails: true,
                },
            },
            detailsViewLocation: "overDirectory",
            noResultsText: "No results found",
            filterout: { field: "", cond: "=", val: "" },
        },
        database: {
            pagination: {
                on: true,
                perpage: 30,
                next: "Next",
                prev: "Prev.",
                showIn: "both",
            },
            loadOnStart: true,
            table: "",
        },
        actions: {
            map: {
                afterLoad: {
                    selectRegion: false,
                },
            },
            region: {
                mouseover: {
                    showTooltip: false,
                },
                click: {
                    addIdToUrl: false,
                    showDetails: true,
                    showDetailsFor: "region",
                    filterDirectory: false,
                    loadObjects: false,
                    showPopover: false,
                    showPopoverFor: "region",
                    goToLink: false,
                    linkField: "Region.link",
                },
                touch: {
                    showPopover: false,
                },
            },
            marker: {
                mouseover: {
                    showTooltip: false,
                },
                click: {
                    showDetails: true,
                    showPopover: false,
                    goToLink: false,
                    linkField: "Object.link",
                },
                touch: {
                    showPopover: false,
                },
            },
            directoryItem: {
                click: {
                    showDetails: true,
                    showPopover: false,
                    goToLink: false,
                    selectRegion: true,
                    fireRegionOnClick: true,
                    linkField: "Object.link",
                },
                hover: {
                    centerOnMarker: false,
                },
            },
        },
        detailsView: {
            location: "map",
            containerId: "",
            width: "100%",
            mobileFullscreen: true,
        },
        mobileView: {
            labelMap: "Map",
            labelList: "List",
            labelClose: "Close",
        },
        googleMaps: {
            on: false,
            apiKey: "",
            loaded: false,
            center: "auto",
            type: "roadmap",
            minZoom: 1,
            style: "default",
            styleJSON: [],
            language: "en",
        },
        groups: [],
        floors: [],
        layersControl: {
            on: false,
            position: "top-left",
            label: "Show on map",
            expanded: true,
            maxHeight: "100%",
        },
        floorsControl: {
            on: false,
            position: "top-left",
            label: "Floors",
            expanded: false,
            maxHeight: "100%",
        },
        containers: {
            leftSidebar: { on: false, width: "250px" },
            rightSidebar: { on: false, width: "250px" },
            header: { on: true, height: "auto" },
            footer: { on: false, height: "auto" },
        },
        labelsMarkers: { on: false },
        labelsRegions: { on: false },
        svgFileVersion: 1,
        fitMarkers: false,
        fitMarkersOnStart: false,
        fitSingleMarkerZoom: 20,
        controls: {
            location: "right",
            zoom: true,
            zoomReset: false,
            userLocation: false,
            previousMap: false,
        },
        previousMapsIds: [],
    };

    // TinyColor v1.4.1
    // https://github.com/bgrins/TinyColor
    // Brian Grinstead, MIT License

    //(function(Math) {

    var trimLeft = /^\s+/,
        trimRight = /\s+$/,
        tinyCounter = 0,
        mathRound = Math.round,
        mathMin = Math.min,
        mathMax = Math.max,
        mathRandom = Math.random;

    function tinycolor(color, opts) {
        color = color ? color : "";
        opts = opts || {};

        // If input is already a tinycolor, return itself
        if (color instanceof tinycolor) {
            return color;
        }
        // If we are called as a function, call using new instead
        if (!(this instanceof tinycolor)) {
            return new tinycolor(color, opts);
        }

        var rgb = inputToRGB(color);
        (this._originalInput = color),
            (this._r = rgb.r),
            (this._g = rgb.g),
            (this._b = rgb.b),
            (this._a = rgb.a),
            (this._roundA = mathRound(100 * this._a) / 100),
            (this._format = opts.format || rgb.format);
        this._gradientType = opts.gradientType;

        // Don't let the range of [0,255] come back in [0,1].
        // Potentially lose a little bit of precision here, but will fix issues where
        // .5 gets interpreted as half of the total, instead of half of 1
        // If it was supposed to be 128, this was already taken care of by `inputToRgb`
        if (this._r < 1) {
            this._r = mathRound(this._r);
        }
        if (this._g < 1) {
            this._g = mathRound(this._g);
        }
        if (this._b < 1) {
            this._b = mathRound(this._b);
        }

        this._ok = rgb.ok;
        this._tc_id = tinyCounter++;
    }

    tinycolor.prototype = {
        isDark: function () {
            return this.getBrightness() < 128;
        },
        isLight: function () {
            return !this.isDark();
        },
        isValid: function () {
            return this._ok;
        },
        getOriginalInput: function () {
            return this._originalInput;
        },
        getFormat: function () {
            return this._format;
        },
        getAlpha: function () {
            return this._a;
        },
        getBrightness: function () {
            //http://www.w3.org/TR/AERT#color-contrast
            var rgb = this.toRgb();
            return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        },
        getLuminance: function () {
            //http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
            var rgb = this.toRgb();
            var RsRGB, GsRGB, BsRGB, R, G, B;
            RsRGB = rgb.r / 255;
            GsRGB = rgb.g / 255;
            BsRGB = rgb.b / 255;

            if (RsRGB <= 0.03928) {
                R = RsRGB / 12.92;
            } else {
                R = Math.pow((RsRGB + 0.055) / 1.055, 2.4);
            }
            if (GsRGB <= 0.03928) {
                G = GsRGB / 12.92;
            } else {
                G = Math.pow((GsRGB + 0.055) / 1.055, 2.4);
            }
            if (BsRGB <= 0.03928) {
                B = BsRGB / 12.92;
            } else {
                B = Math.pow((BsRGB + 0.055) / 1.055, 2.4);
            }
            return 0.2126 * R + 0.7152 * G + 0.0722 * B;
        },
        setAlpha: function (value) {
            this._a = boundAlpha(value);
            this._roundA = mathRound(100 * this._a) / 100;
            return this;
        },
        toHsv: function () {
            var hsv = rgbToHsv(this._r, this._g, this._b);
            return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
        },
        toHsvString: function () {
            var hsv = rgbToHsv(this._r, this._g, this._b);
            var h = mathRound(hsv.h * 360),
                s = mathRound(hsv.s * 100),
                v = mathRound(hsv.v * 100);
            return this._a == 1
                ? "hsv(" + h + ", " + s + "%, " + v + "%)"
                : "hsva(" + h + ", " + s + "%, " + v + "%, " + this._roundA + ")";
        },
        toHsl: function () {
            var hsl = rgbToHsl(this._r, this._g, this._b);
            return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
        },
        toHslString: function () {
            var hsl = rgbToHsl(this._r, this._g, this._b);
            var h = mathRound(hsl.h * 360),
                s = mathRound(hsl.s * 100),
                l = mathRound(hsl.l * 100);
            return this._a == 1
                ? "hsl(" + h + ", " + s + "%, " + l + "%)"
                : "hsla(" + h + ", " + s + "%, " + l + "%, " + this._roundA + ")";
        },
        toHex: function (allow3Char) {
            return rgbToHex(this._r, this._g, this._b, allow3Char);
        },
        toHexString: function (allow3Char) {
            return "#" + this.toHex(allow3Char);
        },
        toHex8: function (allow4Char) {
            return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char);
        },
        toHex8String: function (allow4Char) {
            return "#" + this.toHex8(allow4Char);
        },
        toRgb: function () {
            return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
        },
        toRgbString: function () {
            return this._a == 1
                ? "rgb(" +
                      mathRound(this._r) +
                      ", " +
                      mathRound(this._g) +
                      ", " +
                      mathRound(this._b) +
                      ")"
                : "rgba(" +
                      mathRound(this._r) +
                      ", " +
                      mathRound(this._g) +
                      ", " +
                      mathRound(this._b) +
                      ", " +
                      this._roundA +
                      ")";
        },
        toPercentageRgb: function () {
            return {
                r: mathRound(bound01(this._r, 255) * 100) + "%",
                g: mathRound(bound01(this._g, 255) * 100) + "%",
                b: mathRound(bound01(this._b, 255) * 100) + "%",
                a: this._a,
            };
        },
        toPercentageRgbString: function () {
            return this._a == 1
                ? "rgb(" +
                      mathRound(bound01(this._r, 255) * 100) +
                      "%, " +
                      mathRound(bound01(this._g, 255) * 100) +
                      "%, " +
                      mathRound(bound01(this._b, 255) * 100) +
                      "%)"
                : "rgba(" +
                      mathRound(bound01(this._r, 255) * 100) +
                      "%, " +
                      mathRound(bound01(this._g, 255) * 100) +
                      "%, " +
                      mathRound(bound01(this._b, 255) * 100) +
                      "%, " +
                      this._roundA +
                      ")";
        },
        toName: function () {
            if (this._a === 0) {
                return "transparent";
            }

            if (this._a < 1) {
                return false;
            }

            return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
        },
        toFilter: function (secondColor) {
            var hex8String = "#" + rgbaToArgbHex(this._r, this._g, this._b, this._a);
            var secondHex8String = hex8String;
            var gradientType = this._gradientType ? "GradientType = 1, " : "";

            if (secondColor) {
                var s = tinycolor(secondColor);
                secondHex8String = "#" + rgbaToArgbHex(s._r, s._g, s._b, s._a);
            }

            return (
                "progid:DXImageTransform.Microsoft.gradient(" +
                gradientType +
                "startColorstr=" +
                hex8String +
                ",endColorstr=" +
                secondHex8String +
                ")"
            );
        },
        toString: function (format) {
            var formatSet = !!format;
            format = format || this._format;

            var formattedString = false;
            var hasAlpha = this._a < 1 && this._a >= 0;
            var needsAlphaFormat =
                !formatSet &&
                hasAlpha &&
                (format === "hex" ||
                    format === "hex6" ||
                    format === "hex3" ||
                    format === "hex4" ||
                    format === "hex8" ||
                    format === "name");

            if (needsAlphaFormat) {
                // Special case for "transparent", all other non-alpha formats
                // will return rgba when there is transparency.
                if (format === "name" && this._a === 0) {
                    return this.toName();
                }
                return this.toRgbString();
            }
            if (format === "rgb") {
                formattedString = this.toRgbString();
            }
            if (format === "prgb") {
                formattedString = this.toPercentageRgbString();
            }
            if (format === "hex" || format === "hex6") {
                formattedString = this.toHexString();
            }
            if (format === "hex3") {
                formattedString = this.toHexString(true);
            }
            if (format === "hex4") {
                formattedString = this.toHex8String(true);
            }
            if (format === "hex8") {
                formattedString = this.toHex8String();
            }
            if (format === "name") {
                formattedString = this.toName();
            }
            if (format === "hsl") {
                formattedString = this.toHslString();
            }
            if (format === "hsv") {
                formattedString = this.toHsvString();
            }

            return formattedString || this.toHexString();
        },
        clone: function () {
            return tinycolor(this.toString());
        },

        _applyModification: function (fn, args) {
            var color = fn.apply(null, [this].concat([].slice.call(args)));
            this._r = color._r;
            this._g = color._g;
            this._b = color._b;
            this.setAlpha(color._a);
            return this;
        },
        lighten: function () {
            return this._applyModification(lighten, arguments);
        },
        brighten: function () {
            return this._applyModification(brighten, arguments);
        },
        darken: function () {
            return this._applyModification(darken, arguments);
        },
        desaturate: function () {
            return this._applyModification(desaturate, arguments);
        },
        saturate: function () {
            return this._applyModification(saturate, arguments);
        },
        greyscale: function () {
            return this._applyModification(greyscale, arguments);
        },
        spin: function () {
            return this._applyModification(spin, arguments);
        },

        _applyCombination: function (fn, args) {
            return fn.apply(null, [this].concat([].slice.call(args)));
        },
        analogous: function () {
            return this._applyCombination(analogous, arguments);
        },
        complement: function () {
            return this._applyCombination(complement, arguments);
        },
        monochromatic: function () {
            return this._applyCombination(monochromatic, arguments);
        },
        splitcomplement: function () {
            return this._applyCombination(splitcomplement, arguments);
        },
        triad: function () {
            return this._applyCombination(triad, arguments);
        },
        tetrad: function () {
            return this._applyCombination(tetrad, arguments);
        },
    };

    // If input is an object, force 1 into "1.0" to handle ratios properly
    // String input requires "1.0" as input, so 1 will be treated as 1
    tinycolor.fromRatio = function (color, opts) {
        if (typeof color == "object") {
            var newColor = {};
            for (var i in color) {
                if (color.hasOwnProperty(i)) {
                    if (i === "a") {
                        newColor[i] = color[i];
                    } else {
                        newColor[i] = convertToPercentage(color[i]);
                    }
                }
            }
            color = newColor;
        }

        return tinycolor(color, opts);
    };

    // Given a string or object, convert that input to RGB
    // Possible string inputs:
    //
    //     "red"
    //     "#f00" or "f00"
    //     "#ff0000" or "ff0000"
    //     "#ff000000" or "ff000000"
    //     "rgb 255 0 0" or "rgb (255, 0, 0)"
    //     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
    //     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
    //     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
    //     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
    //     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
    //     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
    //
    function inputToRGB(color) {
        var rgb = { r: 0, g: 0, b: 0 };
        var a = 1;
        var s = null;
        var v = null;
        var l = null;
        var ok = false;
        var format = false;

        if (typeof color == "string") {
            color = stringInputToObject(color);
        }

        if (typeof color == "object") {
            if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
                rgb = rgbToRgb(color.r, color.g, color.b);
                ok = true;
                format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
            } else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
                s = convertToPercentage(color.s);
                v = convertToPercentage(color.v);
                rgb = hsvToRgb(color.h, s, v);
                ok = true;
                format = "hsv";
            } else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
                s = convertToPercentage(color.s);
                l = convertToPercentage(color.l);
                rgb = hslToRgb(color.h, s, l);
                ok = true;
                format = "hsl";
            }

            if (color.hasOwnProperty("a")) {
                a = color.a;
            }
        }

        a = boundAlpha(a);

        return {
            ok: ok,
            format: color.format || format,
            r: mathMin(255, mathMax(rgb.r, 0)),
            g: mathMin(255, mathMax(rgb.g, 0)),
            b: mathMin(255, mathMax(rgb.b, 0)),
            a: a,
        };
    }

    // Conversion Functions
    // --------------------

    // `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
    // <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

    // `rgbToRgb`
    // Handle bounds / percentage checking to conform to CSS color spec
    // <http://www.w3.org/TR/css3-color/>
    // *Assumes:* r, g, b in [0, 255] or [0, 1]
    // *Returns:* { r, g, b } in [0, 255]
    function rgbToRgb(r, g, b) {
        return {
            r: bound01(r, 255) * 255,
            g: bound01(g, 255) * 255,
            b: bound01(b, 255) * 255,
        };
    }

    // `rgbToHsl`
    // Converts an RGB color value to HSL.
    // *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
    // *Returns:* { h, s, l } in [0,1]
    function rgbToHsl(r, g, b) {
        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b),
            min = mathMin(r, g, b);
        var h,
            s,
            l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        return { h: h, s: s, l: l };
    }

    // `hslToRgb`
    // Converts an HSL color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
    function hslToRgb(h, s, l) {
        var r, g, b;

        h = bound01(h, 360);
        s = bound01(s, 100);
        l = bound01(l, 100);

        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHsv`
    // Converts an RGB color value to HSV
    // *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
    // *Returns:* { h, s, v } in [0,1]
    function rgbToHsv(r, g, b) {
        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b),
            min = mathMin(r, g, b);
        var h,
            s,
            v = max;

        var d = max - min;
        s = max === 0 ? 0 : d / max;

        if (max == min) {
            h = 0; // achromatic
        } else {
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return { h: h, s: s, v: v };
    }

    // `hsvToRgb`
    // Converts an HSV color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
    function hsvToRgb(h, s, v) {
        h = bound01(h, 360) * 6;
        s = bound01(s, 100);
        v = bound01(v, 100);

        var i = Math.floor(h),
            f = h - i,
            p = v * (1 - s),
            q = v * (1 - f * s),
            t = v * (1 - (1 - f) * s),
            mod = i % 6,
            r = [v, q, p, p, t, v][mod],
            g = [t, v, v, q, p, p][mod],
            b = [p, p, t, v, v, q][mod];

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHex`
    // Converts an RGB color to hex
    // Assumes r, g, and b are contained in the set [0, 255]
    // Returns a 3 or 6 character hex
    function rgbToHex(r, g, b, allow3Char) {
        var hex = [
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16)),
        ];

        // Return a 3 character hex if possible
        if (
            allow3Char &&
            hex[0].charAt(0) == hex[0].charAt(1) &&
            hex[1].charAt(0) == hex[1].charAt(1) &&
            hex[2].charAt(0) == hex[2].charAt(1)
        ) {
            return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
        }

        return hex.join("");
    }

    // `rgbaToHex`
    // Converts an RGBA color plus alpha transparency to hex
    // Assumes r, g, b are contained in the set [0, 255] and
    // a in [0, 1]. Returns a 4 or 8 character rgba hex
    function rgbaToHex(r, g, b, a, allow4Char) {
        var hex = [
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16)),
            pad2(convertDecimalToHex(a)),
        ];

        // Return a 4 character hex if possible
        if (
            allow4Char &&
            hex[0].charAt(0) == hex[0].charAt(1) &&
            hex[1].charAt(0) == hex[1].charAt(1) &&
            hex[2].charAt(0) == hex[2].charAt(1) &&
            hex[3].charAt(0) == hex[3].charAt(1)
        ) {
            return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
        }

        return hex.join("");
    }

    // `rgbaToArgbHex`
    // Converts an RGBA color to an ARGB Hex8 string
    // Rarely used, but required for "toFilter()"
    function rgbaToArgbHex(r, g, b, a) {
        var hex = [
            pad2(convertDecimalToHex(a)),
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16)),
        ];

        return hex.join("");
    }

    // `equals`
    // Can be called with any tinycolor input
    tinycolor.equals = function (color1, color2) {
        if (!color1 || !color2) {
            return false;
        }
        return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
    };

    tinycolor.random = function () {
        return tinycolor.fromRatio({
            r: mathRandom(),
            g: mathRandom(),
            b: mathRandom(),
        });
    };

    // Modification Functions
    // ----------------------
    // Thanks to less.js for some of the basics here
    // <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

    function desaturate(color, amount) {
        amount = amount === 0 ? 0 : amount || 10;
        var hsl = tinycolor(color).toHsl();
        hsl.s -= amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    }

    function saturate(color, amount) {
        amount = amount === 0 ? 0 : amount || 10;
        var hsl = tinycolor(color).toHsl();
        hsl.s += amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    }

    function greyscale(color) {
        return tinycolor(color).desaturate(100);
    }

    function lighten(color, amount) {
        amount = amount === 0 ? 0 : amount || 10;
        var hsl = tinycolor(color).toHsl();
        hsl.l += amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    }

    function brighten(color, amount) {
        amount = amount === 0 ? 0 : amount || 10;
        var rgb = tinycolor(color).toRgb();
        rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * -(amount / 100))));
        rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * -(amount / 100))));
        rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * -(amount / 100))));
        return tinycolor(rgb);
    }

    function darken(color, amount) {
        amount = amount === 0 ? 0 : amount || 10;
        var hsl = tinycolor(color).toHsl();
        hsl.l -= amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    }

    // Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
    // Values outside of this range will be wrapped into this range.
    function spin(color, amount) {
        var hsl = tinycolor(color).toHsl();
        var hue = (hsl.h + amount) % 360;
        hsl.h = hue < 0 ? 360 + hue : hue;
        return tinycolor(hsl);
    }

    // Combination Functions
    // ---------------------
    // Thanks to jQuery xColor for some of the ideas behind these
    // <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

    function complement(color) {
        var hsl = tinycolor(color).toHsl();
        hsl.h = (hsl.h + 180) % 360;
        return tinycolor(hsl);
    }

    function triad(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l }),
        ];
    }

    function tetrad(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l }),
        ];
    }

    function splitcomplement(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l }),
        ];
    }

    function analogous(color, results, slices) {
        results = results || 6;
        slices = slices || 30;

        var hsl = tinycolor(color).toHsl();
        var part = 360 / slices;
        var ret = [tinycolor(color)];

        for (hsl.h = (hsl.h - ((part * results) >> 1) + 720) % 360; --results; ) {
            hsl.h = (hsl.h + part) % 360;
            ret.push(tinycolor(hsl));
        }
        return ret;
    }

    function monochromatic(color, results) {
        results = results || 6;
        var hsv = tinycolor(color).toHsv();
        var h = hsv.h,
            s = hsv.s,
            v = hsv.v;
        var ret = [];
        var modification = 1 / results;

        while (results--) {
            ret.push(tinycolor({ h: h, s: s, v: v }));
            v = (v + modification) % 1;
        }

        return ret;
    }

    // Utility Functions
    // ---------------------

    tinycolor.mix = function (color1, color2, amount) {
        amount = amount === 0 ? 0 : amount || 50;

        var rgb1 = tinycolor(color1).toRgb();
        var rgb2 = tinycolor(color2).toRgb();

        var p = amount / 100;

        var rgba = {
            r: (rgb2.r - rgb1.r) * p + rgb1.r,
            g: (rgb2.g - rgb1.g) * p + rgb1.g,
            b: (rgb2.b - rgb1.b) * p + rgb1.b,
            a: (rgb2.a - rgb1.a) * p + rgb1.a,
        };

        return tinycolor(rgba);
    };

    // Readability Functions
    // ---------------------
    // <http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef (WCAG Version 2)

    // `contrast`
    // Analyze the 2 colors and returns the color contrast defined by (WCAG Version 2)
    tinycolor.readability = function (color1, color2) {
        var c1 = tinycolor(color1);
        var c2 = tinycolor(color2);
        return (
            (Math.max(c1.getLuminance(), c2.getLuminance()) + 0.05) /
            (Math.min(c1.getLuminance(), c2.getLuminance()) + 0.05)
        );
    };

    // `isReadable`
    // Ensure that foreground and background color combinations meet WCAG2 guidelines.
    // The third argument is an optional Object.
    //      the 'level' property states 'AA' or 'AAA' - if missing or invalid, it defaults to 'AA';
    //      the 'size' property states 'large' or 'small' - if missing or invalid, it defaults to 'small'.
    // If the entire object is absent, isReadable defaults to {level:"AA",size:"small"}.

    // *Example*
    //    tinycolor.isReadable("#000", "#111") => false
    //    tinycolor.isReadable("#000", "#111",{level:"AA",size:"large"}) => false
    tinycolor.isReadable = function (color1, color2, wcag2) {
        var readability = tinycolor.readability(color1, color2);
        var wcag2Parms, out;

        out = false;

        wcag2Parms = validateWCAG2Parms(wcag2);
        switch (wcag2Parms.level + wcag2Parms.size) {
            case "AAsmall":
            case "AAAlarge":
                out = readability >= 4.5;
                break;
            case "AAlarge":
                out = readability >= 3;
                break;
            case "AAAsmall":
                out = readability >= 7;
                break;
        }
        return out;
    };

    // `mostReadable`
    // Given a base color and a list of possible foreground or background
    // colors for that base, returns the most readable color.
    // Optionally returns Black or White if the most readable color is unreadable.
    // *Example*
    //    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:false}).toHexString(); // "#112255"
    //    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:true}).toHexString();  // "#ffffff"
    //    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"large"}).toHexString(); // "#faf3f3"
    //    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"small"}).toHexString(); // "#ffffff"
    tinycolor.mostReadable = function (baseColor, colorList, args) {
        var bestColor = null;
        var bestScore = 0;
        var readability;
        var includeFallbackColors, level, size;
        args = args || {};
        includeFallbackColors = args.includeFallbackColors;
        level = args.level;
        size = args.size;

        for (var i = 0; i < colorList.length; i++) {
            readability = tinycolor.readability(baseColor, colorList[i]);
            if (readability > bestScore) {
                bestScore = readability;
                bestColor = tinycolor(colorList[i]);
            }
        }

        if (
            tinycolor.isReadable(baseColor, bestColor, { level: level, size: size }) ||
            !includeFallbackColors
        ) {
            return bestColor;
        } else {
            args.includeFallbackColors = false;
            return tinycolor.mostReadable(baseColor, ["#fff", "#000"], args);
        }
    };

    // Big List of Colors
    // ------------------
    // <http://www.w3.org/TR/css3-color/#svg-color>
    var names = (tinycolor.names = {
        aliceblue: "f0f8ff",
        antiquewhite: "faebd7",
        aqua: "0ff",
        aquamarine: "7fffd4",
        azure: "f0ffff",
        beige: "f5f5dc",
        bisque: "ffe4c4",
        black: "000",
        blanchedalmond: "ffebcd",
        blue: "00f",
        blueviolet: "8a2be2",
        brown: "a52a2a",
        burlywood: "deb887",
        burntsienna: "ea7e5d",
        cadetblue: "5f9ea0",
        chartreuse: "7fff00",
        chocolate: "d2691e",
        coral: "ff7f50",
        cornflowerblue: "6495ed",
        cornsilk: "fff8dc",
        crimson: "dc143c",
        cyan: "0ff",
        darkblue: "00008b",
        darkcyan: "008b8b",
        darkgoldenrod: "b8860b",
        darkgray: "a9a9a9",
        darkgreen: "006400",
        darkgrey: "a9a9a9",
        darkkhaki: "bdb76b",
        darkmagenta: "8b008b",
        darkolivegreen: "556b2f",
        darkorange: "ff8c00",
        darkorchid: "9932cc",
        darkred: "8b0000",
        darksalmon: "e9967a",
        darkseagreen: "8fbc8f",
        darkslateblue: "483d8b",
        darkslategray: "2f4f4f",
        darkslategrey: "2f4f4f",
        darkturquoise: "00ced1",
        darkviolet: "9400d3",
        deeppink: "ff1493",
        deepskyblue: "00bfff",
        dimgray: "696969",
        dimgrey: "696969",
        dodgerblue: "1e90ff",
        firebrick: "b22222",
        floralwhite: "fffaf0",
        forestgreen: "228b22",
        fuchsia: "f0f",
        gainsboro: "dcdcdc",
        ghostwhite: "f8f8ff",
        gold: "ffd700",
        goldenrod: "daa520",
        gray: "808080",
        green: "008000",
        greenyellow: "adff2f",
        grey: "808080",
        honeydew: "f0fff0",
        hotpink: "ff69b4",
        indianred: "cd5c5c",
        indigo: "4b0082",
        ivory: "fffff0",
        khaki: "f0e68c",
        lavender: "e6e6fa",
        lavenderblush: "fff0f5",
        lawngreen: "7cfc00",
        lemonchiffon: "fffacd",
        lightblue: "add8e6",
        lightcoral: "f08080",
        lightcyan: "e0ffff",
        lightgoldenrodyellow: "fafad2",
        lightgray: "d3d3d3",
        lightgreen: "90ee90",
        lightgrey: "d3d3d3",
        lightpink: "ffb6c1",
        lightsalmon: "ffa07a",
        lightseagreen: "20b2aa",
        lightskyblue: "87cefa",
        lightslategray: "789",
        lightslategrey: "789",
        lightsteelblue: "b0c4de",
        lightyellow: "ffffe0",
        lime: "0f0",
        limegreen: "32cd32",
        linen: "faf0e6",
        magenta: "f0f",
        maroon: "800000",
        mediumaquamarine: "66cdaa",
        mediumblue: "0000cd",
        mediumorchid: "ba55d3",
        mediumpurple: "9370db",
        mediumseagreen: "3cb371",
        mediumslateblue: "7b68ee",
        mediumspringgreen: "00fa9a",
        mediumturquoise: "48d1cc",
        mediumvioletred: "c71585",
        midnightblue: "191970",
        mintcream: "f5fffa",
        mistyrose: "ffe4e1",
        moccasin: "ffe4b5",
        navajowhite: "ffdead",
        navy: "000080",
        oldlace: "fdf5e6",
        olive: "808000",
        olivedrab: "6b8e23",
        orange: "ffa500",
        orangered: "ff4500",
        orchid: "da70d6",
        palegoldenrod: "eee8aa",
        palegreen: "98fb98",
        paleturquoise: "afeeee",
        palevioletred: "db7093",
        papayawhip: "ffefd5",
        peachpuff: "ffdab9",
        peru: "cd853f",
        pink: "ffc0cb",
        plum: "dda0dd",
        powderblue: "b0e0e6",
        purple: "800080",
        rebeccapurple: "663399",
        red: "f00",
        rosybrown: "bc8f8f",
        royalblue: "4169e1",
        saddlebrown: "8b4513",
        salmon: "fa8072",
        sandybrown: "f4a460",
        seagreen: "2e8b57",
        seashell: "fff5ee",
        sienna: "a0522d",
        silver: "c0c0c0",
        skyblue: "87ceeb",
        slateblue: "6a5acd",
        slategray: "708090",
        slategrey: "708090",
        snow: "fffafa",
        springgreen: "00ff7f",
        steelblue: "4682b4",
        tan: "d2b48c",
        teal: "008080",
        thistle: "d8bfd8",
        tomato: "ff6347",
        turquoise: "40e0d0",
        violet: "ee82ee",
        wheat: "f5deb3",
        white: "fff",
        whitesmoke: "f5f5f5",
        yellow: "ff0",
        yellowgreen: "9acd32",
    });

    // Make it easy to access colors via `hexNames[hex]`
    var hexNames = (tinycolor.hexNames = flip(names));

    // Utilities
    // ---------

    // `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
    function flip(o) {
        var flipped = {};
        for (var i in o) {
            if (o.hasOwnProperty(i)) {
                flipped[o[i]] = i;
            }
        }
        return flipped;
    }

    // Return a valid alpha value [0,1] with all invalid values being set to 1
    function boundAlpha(a) {
        a = parseFloat(a);

        if (isNaN(a) || a < 0 || a > 1) {
            a = 1;
        }

        return a;
    }

    // Take input from [0, n] and return it as [0, 1]
    function bound01(n, max) {
        if (isOnePointZero(n)) {
            n = "100%";
        }

        var processPercent = isPercentage(n);
        n = mathMin(max, mathMax(0, parseFloat(n)));

        // Automatically convert percentage into number
        if (processPercent) {
            n = parseInt(n * max, 10) / 100;
        }

        // Handle floating point rounding errors
        if (Math.abs(n - max) < 0.000001) {
            return 1;
        }

        // Convert into [0, 1] range if it isn't already
        return (n % max) / parseFloat(max);
    }

    // Force a number between 0 and 1
    function clamp01(val) {
        return mathMin(1, mathMax(0, val));
    }

    // Parse a base-16 hex value into a base-10 integer
    function parseIntFromHex(val) {
        return parseInt(val, 16);
    }

    // Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
    // <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
    function isOnePointZero(n) {
        return typeof n == "string" && n.indexOf(".") != -1 && parseFloat(n) === 1;
    }

    // Check to see if string passed in is a percentage
    function isPercentage(n) {
        return typeof n === "string" && n.indexOf("%") != -1;
    }

    // Force a hex value to have 2 characters
    function pad2(c) {
        return c.length == 1 ? "0" + c : "" + c;
    }

    // Replace a decimal with it's percentage value
    function convertToPercentage(n) {
        if (n <= 1) {
            n = n * 100 + "%";
        }

        return n;
    }

    // Converts a decimal to a hex value
    function convertDecimalToHex(d) {
        return Math.round(parseFloat(d) * 255).toString(16);
    }
    // Converts a hex value to a decimal
    function convertHexToDecimal(h) {
        return parseIntFromHex(h) / 255;
    }

    var matchers = (function () {
        // <http://www.w3.org/TR/css3-values/#integers>
        var CSS_INTEGER = "[-\\+]?\\d+%?";

        // <http://www.w3.org/TR/css3-values/#number-value>
        var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

        // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
        var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

        // Actual matching.
        // Parentheses and commas are optional, but not required.
        // Whitespace can take the place of commas or opening paren
        var PERMISSIVE_MATCH3 =
            "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
        var PERMISSIVE_MATCH4 =
            "[\\s|\\(]+(" +
            CSS_UNIT +
            ")[,|\\s]+(" +
            CSS_UNIT +
            ")[,|\\s]+(" +
            CSS_UNIT +
            ")[,|\\s]+(" +
            CSS_UNIT +
            ")\\s*\\)?";

        return {
            CSS_UNIT: new RegExp(CSS_UNIT),
            rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
            rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
            hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
            hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
            hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
            hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
            hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
            hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
            hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
            hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
        };
    })();

    // `isValidCSSUnit`
    // Take in a single string / number and check to see if it looks like a CSS unit
    // (see `matchers` above for definition).
    function isValidCSSUnit(color) {
        return !!matchers.CSS_UNIT.exec(color);
    }

    // `stringInputToObject`
    // Permissive string parsing.  Take in a number of formats, and output an object
    // based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
    function stringInputToObject(color) {
        color = color.replace(trimLeft, "").replace(trimRight, "").toLowerCase();
        var named = false;
        if (names[color]) {
            color = names[color];
            named = true;
        } else if (color == "transparent") {
            return { r: 0, g: 0, b: 0, a: 0, format: "name" };
        }

        // Try to match string input using regular expressions.
        // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
        // Just return an object and let the conversion functions handle that.
        // This way the result will be the same whether the tinycolor is initialized with string or object.
        var match;
        if ((match = matchers.rgb.exec(color))) {
            return { r: match[1], g: match[2], b: match[3] };
        }
        if ((match = matchers.rgba.exec(color))) {
            return { r: match[1], g: match[2], b: match[3], a: match[4] };
        }
        if ((match = matchers.hsl.exec(color))) {
            return { h: match[1], s: match[2], l: match[3] };
        }
        if ((match = matchers.hsla.exec(color))) {
            return { h: match[1], s: match[2], l: match[3], a: match[4] };
        }
        if ((match = matchers.hsv.exec(color))) {
            return { h: match[1], s: match[2], v: match[3] };
        }
        if ((match = matchers.hsva.exec(color))) {
            return { h: match[1], s: match[2], v: match[3], a: match[4] };
        }
        if ((match = matchers.hex8.exec(color))) {
            return {
                r: parseIntFromHex(match[1]),
                g: parseIntFromHex(match[2]),
                b: parseIntFromHex(match[3]),
                a: convertHexToDecimal(match[4]),
                format: named ? "name" : "hex8",
            };
        }
        if ((match = matchers.hex6.exec(color))) {
            return {
                r: parseIntFromHex(match[1]),
                g: parseIntFromHex(match[2]),
                b: parseIntFromHex(match[3]),
                format: named ? "name" : "hex",
            };
        }
        if ((match = matchers.hex4.exec(color))) {
            return {
                r: parseIntFromHex(match[1] + "" + match[1]),
                g: parseIntFromHex(match[2] + "" + match[2]),
                b: parseIntFromHex(match[3] + "" + match[3]),
                a: convertHexToDecimal(match[4] + "" + match[4]),
                format: named ? "name" : "hex8",
            };
        }
        if ((match = matchers.hex3.exec(color))) {
            return {
                r: parseIntFromHex(match[1] + "" + match[1]),
                g: parseIntFromHex(match[2] + "" + match[2]),
                b: parseIntFromHex(match[3] + "" + match[3]),
                format: named ? "name" : "hex",
            };
        }

        return false;
    }

    function validateWCAG2Parms(parms) {
        // return valid WCAG2 parms for isReadable.
        // If input parms are invalid, return {"level":"AA", "size":"small"}
        var level, size;
        parms = parms || { level: "AA", size: "small" };
        level = (parms.level || "AA").toUpperCase();
        size = (parms.size || "small").toLowerCase();
        if (level !== "AA" && level !== "AAA") {
            level = "AA";
        }
        if (size !== "small" && size !== "large") {
            size = "small";
        }
        return { level: level, size: size };
    }

    const $$1 = jQuery;
    class Server {
        constructor() {
            this.apiUrl = MapSVG.urls.api;
        }
        getUrl(path) {
            return this.apiUrl + path;
        }
        get(path, data) {
            return $$1.ajax({
                url: this.apiUrl + path,
                type: "GET",
                data: data,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
                },
            });
        }
        post(path, data) {
            const ajaxParams = {
                url: this.apiUrl + path,
                type: "POST",
                data: data,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
                },
            };
            if (data instanceof FormData) {
                ajaxParams["processData"] = false;
                ajaxParams["contentType"] = false;
            }
            return $$1.ajax(ajaxParams);
        }
        put(path, data) {
            const ajaxParams = {
                url: this.apiUrl + path,
                type: "POST",
                data: data,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
                    xhr.setRequestHeader("X-HTTP-Method-Override", "PUT");
                },
            };
            if (data instanceof FormData) {
                ajaxParams["processData"] = false;
                ajaxParams["contentType"] = false;
            }
            return $$1.ajax(ajaxParams);
        }
        delete(path, data) {
            return $$1.ajax({
                url: this.apiUrl + path,
                type: "POST",
                data: data,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
                    xhr.setRequestHeader("X-HTTP-Method-Override", "DELETE");
                },
            });
        }
        ajax(path, data) {
            data.url = this.getUrl(path);
            data.beforeSend = function (xhr) {
                xhr.setRequestHeader("X-WP-Nonce", MapSVG.nonce());
            };
            return $$1.ajax(data);
        }
    }

    class Events {
        constructor(context) {
            this.events = {};
            this.context = context;
        }
        on(event, callbackOrObjectType, callback) {
            if (!this.events[event])
                this.events[event] = [];
            let callbackFunction;
            if (typeof callbackOrObjectType === "string") {
                callbackFunction = callback;
            }
            else {
                callbackFunction = callbackOrObjectType;
            }
            this.events[event].push(callbackFunction);
            return this;
        }
        off(event, callback) {
            const _this = this;
            if (this.events[event] && this.events[event].length) {
                this.events[event].forEach(function (_callback, index) {
                    if (typeof callback === "undefined") {
                        _this.events[event].splice(index, 1);
                    }
                    else if (_callback === callback) {
                        _this.events[event].splice(index, 1);
                    }
                });
            }
            return this;
        }
        trigger(event, thisArg, args) {
            if (this.events[event] && this.events[event].length)
                this.events[event].forEach((callback) => {
                    try {
                        callback && callback.apply(thisArg || this.context, args || [this.context]);
                    }
                    catch (err) {
                        console.error(err);
                    }
                });
            return this;
        }
    }

    class ArrayIndexed extends Array {
        constructor(indexKey, items, options) {
            if (items) {
                super(...items);
            }
            else {
                super();
            }
            this.key = indexKey;
            this.dict = {};
            this.nextId = 1;
            if (options) {
                this.options = options;
            }
            else {
                this.options = { autoId: false, unique: false };
            }
            if (this.length > 0) {
                let i = 0;
                const _this = this;
                if (this.options.autoId) {
                    let maxId = 0;
                    let missingIds = false;
                    this.forEach(function (item) {
                        if (item[_this.key] != null) {
                            if (item[_this.key] > maxId) {
                                maxId = item[_this.key];
                            }
                        }
                        else {
                            missingIds = true;
                        }
                    });
                    this.nextId = ++maxId;
                    if (missingIds) {
                        this.forEach(function (item) {
                            if (item[_this.key] == null) {
                                item[_this.key] = _this.nextId;
                                _this.nextId++;
                            }
                        });
                    }
                }
                this.forEach(function (item) {
                    _this.dict[item[_this.key]] = i;
                    i++;
                });
            }
        }
        push(item) {
            const length = super.push(item);
            if (this.options.autoId === true) {
                item[this.key] = this.nextId;
                this.nextId++;
            }
            this.dict[item[this.key]] = length - 1;
            return length;
        }
        pop() {
            const item = this[this.length - 1];
            const id = item[this.key];
            const length = super.pop();
            delete this.dict[id];
            this.reindex();
            return super.pop();
        }
        update(data) {
            if (data[this.key] != null) {
                const obj = this.get(data[this.key]);
                for (const i in data) {
                    obj[i] = data[i];
                }
                return obj;
            }
            return false;
        }
        get(id) {
            return this.findById(id);
        }
        findById(id) {
            return this[this.dict[id]];
        }
        deleteById(id) {
            const index = this.dict[id];
            if (typeof index !== "undefined") {
                delete this.dict[id];
                this.splice(index, 1);
            }
        }
        delete(id) {
            this.deleteById(id);
        }
        clear() {
            this.length = 0;
            this.reindex();
        }
        reindex() {
            const _this = this;
            this.dict = {};
            this.forEach(function (item, index) {
                _this.dict[item[_this.key]] = index;
            });
        }
        sort(compareFn) {
            super.sort(compareFn);
            this.reindex();
            return this;
        }
        splice(start, deleteCount) {
            const res = super.splice(start, deleteCount);
            this.reindex();
            return res;
        }
    }

    class SchemaField {
        constructor(field) {
            const booleans = ["visible", "searchable", "readonly", "protected"];
            for (const key in field) {
                this[key] = field[key];
            }
            booleans.forEach((paramName) => {
                if (typeof this[paramName] !== "undefined") {
                    this[paramName] = MapSVG.parseBoolean(this[paramName]);
                }
                else {
                    this[paramName] = false;
                }
            });
            if (typeof this.options !== "undefined") {
                if (!(this.options instanceof ArrayIndexed)) {
                    this.options = new ArrayIndexed("value", this.options);
                }
            }
        }
    }

    class Schema {
        constructor(options) {
            this.fields = new ArrayIndexed("name");
            this.build(options);
            this.lastChangeTime = Date.now();
            this.events = new Events(this);
        }
        build(options) {
            const allowedParams = ["id", "title", "type", "name", "fields"];
            allowedParams.forEach((paramName) => {
                const setter = "set" + MapSVG.ucfirst(paramName);
                if (typeof options[paramName] !== "undefined" && typeof this[setter] == "function") {
                    this[setter](options[paramName]);
                }
            });
        }
        update(options) {
            this.build(options);
        }
        setId(id) {
            this.id = id;
        }
        setTitle(title) {
            this.title = title;
        }
        setName(name) {
            this.name = name;
        }
        loaded() {
            return this.fields.length !== 0;
        }
        setFields(fields) {
            if (fields) {
                this.fields.clear();
                fields.forEach((fieldParams) => {
                    this.fields.push(new SchemaField(fieldParams));
                });
            }
        }
        getFields() {
            return this.fields;
        }
        getFieldsAsArray() {
            return this.fields;
        }
        getFieldNames() {
            return this.fields.map((f) => f.name);
        }
        getField(field) {
            return this.fields.findById(field);
        }
        getFieldByType(type) {
            let f = null;
            this.fields.forEach(function (field) {
                if (field.type === type)
                    f = field;
            });
            return f;
        }
        getColumns(filters) {
            filters = filters || {};
            const columns = this.fields;
            const needfilters = Object.keys(filters).length !== 0;
            let results = [];
            if (needfilters) {
                let filterpass;
                columns.forEach(function (obj) {
                    filterpass = true;
                    for (const param in filters) {
                        filterpass = obj[param] == filters[param];
                    }
                    filterpass && results.push(obj);
                });
            }
            else {
                results = columns;
            }
            return results;
        }
        getData() {
            const data = {
                id: this.id,
                title: this.title,
                name: this.name,
                fields: this.fields,
                type: this.type,
            };
            return data;
        }
    }

    class Query {
        constructor(options) {
            this.filters = {};
            this.filterout = {};
            this.page = 1;
            if (options) {
                for (const i in options) {
                    if (typeof options[i] !== "undefined") {
                        this[i] = options[i];
                    }
                }
            }
        }
        setFields(fields) {
            const _this = this;
            for (const key in fields) {
                if (key == "filters") {
                    _this.setFilters(fields[key]);
                }
                else {
                    _this[key] = fields[key];
                }
            }
        }
        update(query) {
            for (const i in query) {
                if (typeof query[i] !== "undefined") {
                    if (i === "filters") {
                        this.setFilters(query[i]);
                    }
                    else {
                        this[i] = query[i];
                    }
                }
            }
        }
        get() {
            return {
                search: this.search,
                searchField: this.searchField,
                searchFallback: this.searchFallback,
                filters: this.filters,
                filterout: this.filterout,
                page: this.page,
                sort: this.sort,
                perpage: this.perpage,
                lastpage: this.lastpage,
            };
        }
        clearFilters() {
            this.resetFilters();
        }
        setFilters(fields) {
            const _this = this;
            for (const key in fields) {
                if (fields[key] === null || fields[key] === "" || fields[key] === undefined) {
                    if (_this.filters[key]) {
                        delete _this.filters[key];
                    }
                }
                else {
                    _this.filters[key] = fields[key];
                }
            }
        }
        setSearch(search) {
            this.search = search;
        }
        setFilterOut(fields) {
            this.filterout = fields;
        }
        resetFilters(fields) {
            this.filters = {};
            this.setSearch("");
        }
        setFilterField(field, value) {
            this.filters[field] = value;
        }
        hasFilters() {
            return Object.keys(this.filters).length > 0 || this.search.length > 0;
        }
        removeFilter(fieldName) {
            this.filters[fieldName] = null;
            delete this.filters[fieldName];
        }
        requestSchema(requestSchema) {
            this.withSchema = requestSchema ? requestSchema : true;
        }
    }

    class LocationAddress {
        constructor(fields) {
            for (const i in fields) {
                this[i] = fields[i];
            }
        }
        getData() {
            const copy = {};
            [
                "route",
                "address_formatted",
                "administrative_area_level_1",
                "administrative_area_level_1_short",
                "administrative_area_level_2",
                "administrative_area_level_2_short",
                "country",
                "country_short",
                "postal_code",
            ].forEach((field) => {
                if (this[field]) {
                    copy[field] = this[field];
                }
            });
            return copy;
        }
        get state() {
            return this.country_short === "US" ? this.administrative_area_level_1 : null;
        }
        get state_short() {
            return this.country_short === "US" ? this.administrative_area_level_1_short : null;
        }
        get county() {
            return this.country_short === "US" ? this.administrative_area_level_2 : null;
        }
        get zip() {
            return this.postal_code;
        }
    }

    class ScreenPoint {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }
    class SVGPoint {
        constructor(x, y) {
            let _x, _y;
            if (typeof x === "object") {
                if (x.x && x.y) {
                    _x = parseFloat(x.x + "");
                    _y = parseFloat(x.y + "");
                }
                else {
                    console.error("MapSVG: incorrect format of {x, y} object for SVGPoint.");
                    _x = 0;
                    _y = 0;
                }
            }
            else {
                _x = parseFloat(x + "");
                _y = parseFloat(y + "");
            }
            this.x = _x;
            this.y = _y;
        }
        toString() {
            return this.x + "," + this.y;
        }
    }
    class GeoPoint {
        constructor(lat, lng) {
            let _lat, _lng;
            if (typeof lat === "object") {
                if (lat.lat && lat.lng) {
                    _lat = parseFloat(lat.lat + "");
                    _lng = parseFloat(lat.lng + "");
                }
                else {
                    console.error("MapSVG: incorrect format of {lat, lng} object for GeoPoint.");
                    _lat = 0;
                    _lng = 0;
                }
            }
            else {
                _lat = parseFloat(lat + "");
                _lng = parseFloat(lng + "");
            }
            this.lat = _lat;
            this.lng = _lng;
        }
        toString() {
            return this.lat + "," + this.lng;
        }
    }
    class Location {
        constructor(options) {
            this.update(options);
        }
        update(options) {
            if (options.object) {
                this.setObject(options.object);
            }
            if (options.img) {
                this.setImage(options.img);
            }
            if (options.address) {
                this.setAddress(options.address);
            }
            if (options.svgPoint) {
                this.setSvgPoint(options.svgPoint);
            }
            if (options.geoPoint) {
                this.setGeoPoint(options.geoPoint);
            }
        }
        setObject(object) {
            this.object = object;
        }
        setImage(imgUrl) {
            if (typeof imgUrl !== "string") {
                return;
            }
            let src = imgUrl.split("/").pop();
            if (imgUrl.indexOf("uploads") !== -1) {
                src = "uploads/" + src;
            }
            this.img = src;
            this.imagePath = this.getImageUrl();
            this.marker && this.marker && this.marker.setImage(this.imagePath);
        }
        getImageUrl() {
            if (this.img && this.img.indexOf("uploads/") === 0) {
                return MapSVG.urls.uploads + "markers/" + this.img.replace("uploads/", "");
            }
            else {
                return MapSVG.urls.root + "markers/" + (this.img || "_pin_default.png");
            }
        }
        setAddress(address) {
            this.address = new LocationAddress(address);
        }
        setSvgPoint(svgPoint) {
            this.svgPoint = svgPoint instanceof SVGPoint ? svgPoint : new SVGPoint(svgPoint);
            if (this.marker) {
                this.marker.setSvgPointFromLocation();
            }
        }
        setGeoPoint(geoPoint) {
            this.geoPoint = geoPoint instanceof GeoPoint ? geoPoint : new GeoPoint(geoPoint);
            if (this.marker) {
                this.marker.setSvgPointFromLocation();
            }
        }
        getMarkerImage() {
            if (this.img && this.img.indexOf("uploads/") === 0) {
                return MapSVG.urls.uploads + "markers/" + this.img.replace("uploads/", "");
            }
            else {
                return MapSVG.urls.root + "markers/" + (this.img || "_pin_default.png");
            }
        }
        getData() {
            const data = {
                img: this.img,
                imagePath: this.imagePath,
                markerImagePath: this.marker && this.marker.object
                    ? this.marker.object.getMarkerImage()
                    : this.imagePath,
                address: this.address,
            };
            if (this.geoPoint) {
                data.geoPoint = { lat: this.geoPoint.lat, lng: this.geoPoint.lng };
            }
            if (this.svgPoint) {
                data.svgPoint = { x: this.svgPoint.x, y: this.svgPoint.y };
            }
            return data;
        }
    }

    class CustomObject {
        constructor(params, schema) {
            this.initialLoad = true;
            this.setSchema(schema);
            this.dirtyFields = [];
            this.regions = [];
            this._regions = {};
            if (params.id !== undefined) {
                this.id = params.id;
            }
            this.initialLoad = true;
            this.build(params);
            this.initialLoad = false;
            if (this.id) {
                this.clearDirtyFields();
            }
        }
        setSchema(schema) {
            this.schema = schema;
            this.schema.events.on("changed", () => this.setLocationField());
            this.fields = schema.getFieldNames();
            this.setLocationField();
        }
        build(params) {
            for (const fieldName in params) {
                const field = this.schema.getField(fieldName);
                if (field) {
                    if (!this.initialLoad) {
                        this.dirtyFields.push(fieldName);
                    }
                    switch (field.type) {
                        case "region":
                            this.regions = params[fieldName];
                            break;
                        case "location":
                            if (params[fieldName] != null &&
                                params[fieldName] != "" &&
                                Object.keys(params[fieldName]).length !== 0) {
                                const data = {
                                    img: this.isMarkersByFieldEnabled()
                                        ? this.getMarkerImage()
                                        : params[fieldName].img,
                                    address: new LocationAddress(params[fieldName].address),
                                };
                                if (params[fieldName].geoPoint &&
                                    params[fieldName].geoPoint.lat &&
                                    params[fieldName].geoPoint.lng) {
                                    data.geoPoint = new GeoPoint(params[fieldName].geoPoint);
                                }
                                else if (params[fieldName].svgPoint &&
                                    params[fieldName].svgPoint.x &&
                                    params[fieldName].svgPoint.y) {
                                    data.svgPoint = new SVGPoint(params[fieldName].svgPoint);
                                }
                                if (this.location != null) {
                                    this.location.update(data);
                                }
                                else {
                                    this.location = new Location(data);
                                }
                            }
                            else {
                                this.location = null;
                            }
                            break;
                        case "post":
                            if (params.post) {
                                this.post = params.post;
                            }
                            break;
                        case "select":
                            this[fieldName] = params[fieldName];
                            if (!field.multiselect) {
                                this[fieldName + "_text"] = this.getEnumLabel(field, params, fieldName);
                            }
                            break;
                        case "radio":
                            this[fieldName] = params[fieldName];
                            this[fieldName + "_text"] = this.getEnumLabel(field, params, fieldName);
                            break;
                        default:
                            this[fieldName] = params[fieldName];
                            break;
                    }
                }
            }
            const locationField = this.getLocationField();
            if (locationField && this.isMarkersByFieldEnabled() && this.isMarkerFieldChanged(params)) {
                this.reloadMarkerImage();
            }
        }
        isMarkerFieldChanged(params) {
            return Object.keys(params).indexOf(this.getLocationField().markerField) !== -1;
        }
        setLocationField() {
        }
        getLocationField() {
            return this.schema.getFieldByType("location");
        }
        reloadMarkerImage() {
            this.location && this.location.setImage(this.getMarkerImage());
        }
        getMarkerImage() {
            let fieldValue;
            if (this.isMarkersByFieldEnabled()) {
                const locationField = this.getLocationField();
                fieldValue = this[locationField.markerField];
                if (!fieldValue) {
                    return locationField.defaultMarkerPath || MapSVG.defaultMarkerImage;
                }
                else {
                    if (locationField.markerField === "regions") {
                        fieldValue = fieldValue[0] && fieldValue[0].id;
                    }
                    else if (typeof fieldValue === "object" && fieldValue.length) {
                        fieldValue = fieldValue[0].value;
                    }
                    return (locationField.markersByField[fieldValue] ||
                        locationField.defaultMarkerPath ||
                        MapSVG.defaultMarkerImage);
                }
            }
            else {
                return this.location.imagePath;
            }
        }
        isMarkersByFieldEnabled() {
            const locationField = this.getLocationField();
            if (!locationField) {
                return false;
            }
            if (locationField.markersByFieldEnabled &&
                locationField.markerField &&
                Object.values(locationField.markersByField).length > 0) {
                return true;
            }
            else {
                return false;
            }
        }
        clone() {
            const data = this.getData();
            return new CustomObject(data, this.schema);
        }
        getEnumLabel(field, params, fieldName) {
            const value = field.options.get(params[fieldName]);
            if (typeof value !== "undefined") {
                return value.label;
            }
            else {
                return "";
            }
        }
        update(params) {
            this.build(params);
        }
        getDirtyFields() {
            const data = {};
            this.dirtyFields.forEach((field) => {
                data[field] = this[field];
            });
            data.id = this.id;
            if (data.location != null) {
                data.location = data.location.getData();
            }
            if (this.schema.getFieldByType("region")) {
                data.regions = this.regions;
            }
            return data;
        }
        clearDirtyFields() {
            this.dirtyFields = [];
        }
        getData() {
            const data = {};
            const fields = this.schema.getFields();
            fields.forEach((field) => {
                switch (field.type) {
                    case "region":
                        data[field.name] = this[field.name];
                        break;
                    case "select":
                        data[field.name] = this[field.name];
                        if (!field.multiselect) {
                            data[field.name + "_text"] = this[field.name + "_text"];
                        }
                        break;
                    case "post":
                        data[field.name] = this[field.name];
                        data["post"] = this.post;
                        break;
                    case "status":
                    case "radio":
                        data[field.name] = this[field.name];
                        data[field.name + "_text"] = this[field.name + "_text"];
                        break;
                    case "location":
                        data[field.name] = this[field.name] ? this[field.name].getData() : null;
                        break;
                    default:
                        data[field.name] = this[field.name];
                        break;
                }
            });
            return data;
        }
        getRegions(regionsTableName) {
            return this.regions;
        }
        getRegionsForTable(regionsTableName) {
            return this.regions
                ? this.regions.filter((region) => !region.tableName || region.tableName === regionsTableName)
                : [];
        }
    }

    const $$2 = jQuery;
    class Repository {
        constructor(objectName, path) {
            this.server = new Server();
            this.query = new Query();
            this.events = new Events(this);
            this.className = "";
            this.objectNameSingle = objectName;
            this.objectNameMany = objectName + "s";
            this.setPath(path);
            this.objects = new ArrayIndexed("id");
            this.completeChunks = 0;
        }
        setNoFiltersNoLoad(value) {
            this.noFiltersNoLoad = value;
        }
        setDataSource(path) {
            this.setPath(path);
            this.query = new Query({ withSchema: true });
            return this.find().done(() => {
                this.query.update({ withSchema: false });
            });
        }
        setPath(path) {
            this.path = path.replace(/\/+$/, "") + "/";
        }
        setSchema(schema) {
            this.schema = schema;
        }
        getSchema() {
            return this.schema;
        }
        loadDataFromResponse(response) {
            let data;
            data = this.decodeData(response);
            this.objects.clear();
            if (data[this.objectNameMany] && data[this.objectNameMany].length) {
                this.hasMoreRecords =
                    this.query.perpage && data[this.objectNameMany].length > this.query.perpage;
                if (this.hasMoreRecords) {
                    data[this.objectNameMany].pop();
                }
                data[this.objectNameMany].forEach((obj) => {
                    this.objects.push(obj);
                });
            }
            else {
                this.hasMoreRecords = false;
            }
            this.loaded = true;
            this.events.trigger("loaded");
        }
        reload() {
            return this.find();
        }
        create(object) {
            const defer = jQuery.Deferred();
            defer.promise();
            const data = {};
            data[this.objectNameSingle] = this.encodeData(object);
            this.server
                .post(this.path, data)
                .done((response) => {
                const data = this.decodeData(response);
                const object = data[this.objectNameSingle];
                this.objects.push(object);
                defer.resolve(object);
                this.events.trigger("created", this, [object]);
            })
                .fail((response) => {
                defer.reject(response);
            });
            return defer;
        }
        findById(id, nocache = false) {
            const defer = jQuery.Deferred();
            defer.promise();
            let object;
            if (!nocache) {
                object = this.objects.findById(id.toString());
            }
            if (!nocache && object) {
                defer.resolve(object);
            }
            else {
                this.server
                    .get(this.path + id)
                    .done((response) => {
                    const data = this.decodeData(response);
                    defer.resolve(data[this.objectNameSingle]);
                })
                    .fail((response) => {
                    defer.reject(response);
                });
            }
            return defer;
        }
        find(query) {
            this.events.trigger("load");
            const defer = jQuery.Deferred();
            defer.promise();
            if (typeof query !== "undefined") {
                this.query.update(query);
            }
            if (this.noFiltersNoLoad && !this.query.hasFilters()) {
                this.objects.clear();
                this.events.trigger("loaded");
                defer.resolve(this.getLoaded());
                return defer;
            }
            if (!this.schema) {
                this.query.update({ withSchema: true });
            }
            this.server
                .get(this.path, this.query)
                .done((response) => {
                if (!this.schema) {
                    this.query.update({ withSchema: false });
                }
                this.loadDataFromResponse(response);
                defer.resolve(this.getLoaded());
            })
                .fail((response) => {
                defer.reject(response);
            });
            return defer;
        }
        getLoaded() {
            return this.objects;
        }
        getLoadedObject(id) {
            return this.objects.findById(id.toString());
        }
        getLoadedAsArray() {
            return this.objects;
        }
        update(object) {
            const defer = jQuery.Deferred();
            defer.promise();
            const data = {};
            const objectUpdatedFields = "getDirtyFields" in object ? object.getDirtyFields() : object;
            data[this.objectNameSingle] = this.encodeData(objectUpdatedFields);
            this.server
                .put(this.path + objectUpdatedFields.id, data)
                .done((response) => {
                if ("clearDirtyFields" in object) {
                    object.clearDirtyFields();
                }
                defer.resolve(object);
                this.events.trigger("updated", this, object);
            })
                .fail((response, stat) => {
                defer.reject(response, stat);
            });
            return defer;
        }
        delete(id) {
            const defer = jQuery.Deferred();
            defer.promise();
            this.server
                .delete(this.path + id)
                .done((response) => {
                this.objects.delete(id.toString());
                this.events.trigger("deleted");
                defer.resolve();
            })
                .fail((response) => {
                defer.reject(response);
            });
            return defer;
        }
        clear() {
            const defer = jQuery.Deferred();
            defer.promise();
            this.server
                .delete(this.path)
                .done((response) => {
                this.objects.clear();
                this.events.trigger("loaded");
                this.events.trigger("cleared");
                defer.resolve();
            })
                .fail((response) => {
                defer.reject(response);
            });
            return defer;
        }
        onFirstPage() {
            return this.query.page === 1;
        }
        onLastPage() {
            return this.hasMoreRecords === false;
        }
        encodeData(params) {
            return params;
        }
        decodeData(dataJSON) {
            let data;
            if (typeof dataJSON === "string") {
                data = JSON.parse(dataJSON);
            }
            else {
                data = dataJSON;
            }
            if ((data.object || data.region || data.regions || data.objects) && data.schema) {
                this.setSchema(new Schema(data.schema));
            }
            const dataFormatted = {};
            for (const key in data) {
                if (data[key]) {
                    switch (key) {
                        case "object":
                        case "region":
                            dataFormatted[key] = new CustomObject(data[key], this.schema);
                            break;
                        case "objects":
                        case "regions":
                            dataFormatted[key] = data[key].map((obj) => new CustomObject(obj, this.schema));
                            break;
                        case "schema":
                            dataFormatted[key] = this.schema || new Schema(data[key]);
                            break;
                        case "schemas":
                            dataFormatted[key] = data[key].map((obj) => new Schema(obj));
                            break;
                    }
                }
            }
            return dataFormatted;
        }
        import(data, convertLatlngToAddress, mapsvg) {
            const _this = this;
            const locationField = _this.schema.getFieldByType("location");
            let language = "en";
            if (locationField && locationField.language) {
                language = locationField.language;
            }
            data = this.formatCSV(data, mapsvg);
            return this.importByChunks(data, language, convertLatlngToAddress).done(function () {
                _this.find();
            });
        }
        importByChunks(data, language, convertLatlngToAddress) {
            const _this = this;
            let i, j, temparray, chunk = 50;
            const chunks = [];
            for (i = 0, j = data.length; i < j; i += chunk) {
                temparray = data.slice(i, i + chunk);
                chunks.push(temparray);
            }
            if (chunks.length > 0) {
                let delay = 0;
                const delayPlus = chunks[0][0] && chunks[0][0].location ? 1000 : 0;
                var defer = $$2.Deferred();
                defer.promise();
                _this.completeChunks = 0;
                chunks.forEach(function (chunk) {
                    delay += delayPlus;
                    setTimeout(function () {
                        const data = {
                            language: language,
                            convertLatlngToAddress: convertLatlngToAddress,
                        };
                        data[_this.objectNameMany] = JSON.stringify(chunk);
                        _this.server
                            .post(_this.path + "import", data)
                            .done(function (_data) {
                            _this.completeChunk(chunks, defer);
                        })
                            .fail((response) => {
                            console.error(response);
                        });
                    }, delay);
                });
            }
            return defer;
        }
        completeChunk(chunks, defer) {
            const _this = this;
            _this.completeChunks++;
            if (_this.completeChunks === chunks.length) {
                defer.resolve();
            }
        }
        formatCSV(data, mapsvg) {
            const _this = this;
            const latLngRegex = /^(\-?\d+(\.\d+)?),\s*(\-?\d+(\.\d+)?)$/g;
            const regionsTable = mapsvg.regionsRepository.getSchema().name;
            data.forEach(function (object, index) {
                const newObject = {};
                for (const key in object) {
                    let field = _this.schema.getField(key);
                    if (key === "post") {
                        field = { type: "post" };
                    }
                    if (field !== undefined) {
                        switch (field.type) {
                            case "region":
                                newObject[key] = {};
                                newObject[key] = object[key]
                                    .split(",")
                                    .map(function (regionId) {
                                    return regionId.trim();
                                })
                                    .filter(function (rId) {
                                    return (mapsvg.getRegion(rId) !== undefined ||
                                        mapsvg.regions.find(function (item) {
                                            return item.title === rId;
                                        }) !== undefined);
                                })
                                    .map(function (rId) {
                                    let r = mapsvg.getRegion(rId);
                                    if (typeof r === "undefined") {
                                        r = mapsvg.regions.find(function (item) {
                                            return item.title === rId;
                                        });
                                    }
                                    return { id: r.id, title: r.title, tableName: regionsTable };
                                });
                                break;
                            case "location":
                                if (object[key].match(latLngRegex)) {
                                    const coords = object[key].split(",").map(function (n) {
                                        return parseFloat(n);
                                    });
                                    if (coords.length == 2 &&
                                        coords[0] > -90 &&
                                        coords[0] < 90 &&
                                        coords[1] > -180 &&
                                        coords[1] < 180) {
                                        newObject[key] = {
                                            geoPoint: { lat: coords[0], lng: coords[1] },
                                        };
                                    }
                                    else {
                                        newObject[key] = "";
                                    }
                                }
                                else if (object[key]) {
                                    newObject[key] = { address: object[key] };
                                }
                                if (typeof newObject[key] == "object") {
                                    newObject[key].img = mapsvg.options.defaultMarkerImage;
                                }
                                break;
                            case "select":
                                const field = _this.schema.getField(key);
                                if (field.multiselect) {
                                    const labels = _this.schema.getField(key).options.map(function (f) {
                                        return f.label;
                                    });
                                    newObject[key] = object[key]
                                        .split(",")
                                        .map(function (label) {
                                        return label.trim();
                                    })
                                        .filter(function (label) {
                                        return labels.indexOf(label) !== -1;
                                    })
                                        .map(function (label) {
                                        return _this.schema
                                            .getField(key)
                                            .options.filter(function (option) {
                                            return option.label == label;
                                        })[0];
                                    });
                                    if (newObject[key].length === 0) {
                                        const values = _this.schema
                                            .getField(key)
                                            .options.map(function (f) {
                                            return f.value + "";
                                        });
                                        newObject[key] = object[key]
                                            .split(",")
                                            .map(function (value) {
                                            return value.trim();
                                        })
                                            .filter(function (value) {
                                            return values.indexOf(value) !== -1;
                                        })
                                            .map(function (value) {
                                            return _this.schema
                                                .getField(key)
                                                .options.filter(function (option) {
                                                return option.value == value;
                                            })[0];
                                        });
                                    }
                                }
                                else {
                                    newObject[key] = object[key];
                                }
                                break;
                            case "radio":
                            case "text":
                            case "textarea":
                            case "status":
                            default:
                                newObject[key] = object[key];
                                break;
                        }
                    }
                }
                data[index] = newObject;
            });
            return data;
        }
    }

    class MapsRepository extends Repository {
        constructor() {
            super("map", "maps");
            this.path = "maps/";
        }
        encodeData(params) {
            const data = {};
            if (typeof params.options !== "undefined") {
                data.options = JSON.stringify(params.options);
                data.options = data.options.replace(/select/g, "!mapsvg-encoded-slct");
                data.options = data.options.replace(/table/g, "!mapsvg-encoded-tbl");
                data.options = data.options.replace(/database/g, "!mapsvg-encoded-db");
                data.options = data.options.replace(/varchar/g, "!mapsvg-encoded-vc");
                data.options = data.options.replace(/int\(11\)/g, "!mapsvg-encoded-int");
            }
            if (typeof params.title !== "undefined") {
                data.title = params.title;
            }
            if (typeof params.id !== "undefined") {
                data.id = params.id;
            }
            if (typeof params.status !== "undefined") {
                data.status = params.status;
            }
            return data;
        }
        decodeData(dataJSON) {
            let data;
            if (typeof dataJSON === "string") {
                data = JSON.parse(dataJSON);
            }
            else {
                data = dataJSON;
            }
            return data;
        }
        copy(id, title) {
            const defer = jQuery.Deferred();
            defer.promise();
            const data = { options: { title: title } };
            this.server
                .post(this.path + id + "/copy", this.encodeData(data))
                .done((response) => {
                const data = this.decodeData(response);
                this.objects.clear();
                this.events.trigger("loaded");
                this.events.trigger("cleared");
                defer.resolve(data.map);
            })
                .fail(() => {
                defer.reject();
            });
            return defer;
        }
        createFromV2(object) {
            const defer = jQuery.Deferred();
            defer.promise();
            const data = {};
            data[this.objectNameSingle] = this.encodeData(object);
            this.server
                .post(this.path + "/createFromV2", data)
                .done((response) => {
                const data = this.decodeData(response);
                const object = data[this.objectNameSingle];
                this.objects.push(object);
                defer.resolve(object);
                this.events.trigger("created", this, [object]);
            })
                .fail(() => {
                defer.reject();
            });
            return defer;
        }
        delete(id) {
            const defer = jQuery.Deferred();
            defer.promise();
            this.server
                .delete(this.path + id)
                .done((response) => {
                this.objects.delete(id.toString());
                this.events.trigger("deleted");
                defer.resolve();
            })
                .fail(() => {
                defer.reject();
            });
            return defer;
        }
    }

    class MapsV2Repository extends Repository {
        constructor() {
            super("map", "maps");
            this.path = "maps-v2/";
        }
        encodeData(params) {
            const data = {};
            data.options = JSON.stringify(params.options);
            data.options = data.options.replace(/select/g, "!mapsvg-encoded-slct");
            data.options = data.options.replace(/table/g, "!mapsvg-encoded-tbl");
            data.options = data.options.replace(/database/g, "!mapsvg-encoded-db");
            data.options = data.options.replace(/varchar/g, "!mapsvg-encoded-vc");
            data.id = params.id;
            data.title = params.title;
            return data;
        }
        decodeData(dataJSON) {
            let data;
            if (typeof dataJSON === "string") {
                data = JSON.parse(dataJSON);
            }
            else {
                data = dataJSON;
            }
            return data;
        }
    }

    class Converter {
        constructor(mapElement, defViewBox, viewBox, geoViewBox) {
            this.mapElement = mapElement;
            this.defViewBox = defViewBox;
            this.viewBox = viewBox;
            this.yShift = 0;
            if (geoViewBox) {
                this.setGeoViewBox(geoViewBox);
            }
        }
        setYShift() {
            if (this.defViewBox.width === 20426) {
                this.yShift = 0;
                return;
            }
            if (this.geoViewBox) {
                const topLeftPoint = this.convertGeoToSVG(this.geoViewBox.ne);
                this.yShift = topLeftPoint.y - this.defViewBox.y;
            }
        }
        setGeoViewBox(geoViewBox) {
            this.geoViewBox = geoViewBox;
            this.mapLonDelta = this.geoViewBox.ne.lng - this.geoViewBox.sw.lng;
            this.mapLatBottomDegree = (this.geoViewBox.sw.lat * Math.PI) / 180;
            this.worldMapWidth = (this.defViewBox.width / this.mapLonDelta) * 360;
            this.worldMapRadius = ((this.defViewBox.width / this.mapLonDelta) * 360) / (2 * Math.PI);
            this.setYShift();
        }
        setWorldShift(on) {
            this.worldShift = on;
        }
        getScale() {
            return this.mapElement.clientWidth / this.viewBox.width;
        }
        convertSVGToPixel(svgPoint) {
            const scale = this.getScale();
            let shiftXByGM = 0;
            const shiftYByGM = 0;
            if (this.worldShift) {
                if (this.viewBox.x - this.defViewBox.x > this.defViewBox.width) {
                    shiftXByGM =
                        this.worldMapWidth *
                            Math.floor((this.viewBox.x - this.defViewBox.x) / this.defViewBox.width);
                }
            }
            return new ScreenPoint((svgPoint.x - this.viewBox.x + shiftXByGM) * scale, (svgPoint.y - this.viewBox.y + shiftYByGM) * scale);
        }
        convertPixelToSVG(screenPoint) {
            const scale = this.getScale();
            return new SVGPoint(screenPoint.x / scale + this.viewBox.x, screenPoint.y / scale + this.viewBox.y);
        }
        convertGeoToSVG(geoPoint) {
            if (!this.geoViewBox) {
                throw new Error("Can't do convertGeoToSVG() - geoViewBox is not provided.");
            }
            let x = (geoPoint.lng - this.geoViewBox.sw.lng) * (this.defViewBox.width / this.mapLonDelta);
            const lat = (geoPoint.lat * Math.PI) / 180;
            const mapOffsetY = (this.worldMapRadius / 2) *
                Math.log((1 + Math.sin(this.mapLatBottomDegree)) / (1 - Math.sin(this.mapLatBottomDegree)));
            let y = this.defViewBox.height -
                ((this.worldMapRadius / 2) * Math.log((1 + Math.sin(lat)) / (1 - Math.sin(lat))) -
                    mapOffsetY);
            x += this.defViewBox.x;
            y += this.defViewBox.y;
            y -= this.yShift;
            return new SVGPoint(x, y);
        }
        convertSVGToGeo(svgPoint) {
            if (!this.geoViewBox) {
                throw new Error("Can't do convertSVGToGeo() - geoViewBox is not provided.");
            }
            const tx = svgPoint.x - this.defViewBox.x;
            const ty = svgPoint.y - this.defViewBox.y;
            const mapOffsetY = (this.worldMapRadius / 2) *
                Math.log((1 + Math.sin(this.mapLatBottomDegree)) / (1 - Math.sin(this.mapLatBottomDegree)));
            const equatorY = this.defViewBox.height + mapOffsetY;
            const a = (equatorY - ty) / this.worldMapRadius;
            let lat = (180 / Math.PI) * (2 * Math.atan(Math.exp(a)) - Math.PI / 2);
            let lng = this.geoViewBox.sw.lng + (tx / this.defViewBox.width) * this.mapLonDelta;
            lat = parseFloat(lat.toFixed(6));
            lng = parseFloat(lng.toFixed(6));
            return new GeoPoint(lat, lng);
        }
    }

    const $$3 = jQuery;
    class ResizeSensor {
        constructor(element, callback) {
            const _this = this;
            _this.element = element;
            _this.callback = callback;
            const style = getComputedStyle(element);
            let zIndex = parseInt(style.zIndex);
            if (isNaN(zIndex)) {
                zIndex = 0;
            }
            zIndex--;
            _this.expand = document.createElement("div");
            _this.expand.style.position = "absolute";
            _this.expand.style.left = "0px";
            _this.expand.style.top = "0px";
            _this.expand.style.right = "0px";
            _this.expand.style.bottom = "0px";
            _this.expand.style.overflow = "hidden";
            _this.expand.style.zIndex = zIndex.toString();
            _this.expand.style.visibility = "hidden";
            const expandChild = document.createElement("div");
            expandChild.style.position = "absolute";
            expandChild.style.left = "0px";
            expandChild.style.top = "0px";
            expandChild.style.width = "10000000px";
            expandChild.style.height = "10000000px";
            _this.expand.appendChild(expandChild);
            _this.shrink = document.createElement("div");
            _this.shrink.style.position = "absolute";
            _this.shrink.style.left = "0px";
            _this.shrink.style.top = "0px";
            _this.shrink.style.right = "0px";
            _this.shrink.style.bottom = "0px";
            _this.shrink.style.overflow = "hidden";
            _this.shrink.style.zIndex = zIndex.toString();
            _this.shrink.style.visibility = "hidden";
            const shrinkChild = document.createElement("div");
            shrinkChild.style.position = "absolute";
            shrinkChild.style.left = "0px";
            shrinkChild.style.top = "0px";
            shrinkChild.style.width = "200%";
            shrinkChild.style.height = "200%";
            _this.shrink.appendChild(shrinkChild);
            _this.element.appendChild(_this.expand);
            _this.element.appendChild(_this.shrink);
            const size = element.getBoundingClientRect();
            _this.currentWidth = size.width;
            _this.currentHeight = size.height;
            _this.setScroll();
            _this.expand.addEventListener("scroll", function () {
                _this.onScroll();
            });
            _this.shrink.addEventListener("scroll", function () {
                _this.onScroll();
            });
        }
        onScroll() {
            const _this = this;
            const size = _this.element.getBoundingClientRect();
            const newWidth = size.width;
            const newHeight = size.height;
            if (newWidth != _this.currentWidth || newHeight != _this.currentHeight) {
                _this.currentWidth = newWidth;
                _this.currentHeight = newHeight;
                _this.callback();
            }
            this.setScroll();
        }
        setScroll() {
            this.expand.scrollLeft = 10000000;
            this.expand.scrollTop = 10000000;
            this.shrink.scrollLeft = 10000000;
            this.shrink.scrollTop = 10000000;
        }
        destroy() {
            this.expand.remove();
            this.shrink.remove();
        }
    }

    class ViewBox {
        constructor(x, y, width, height) {
            if (typeof x === "object") {
                if (x.hasOwnProperty("x") &&
                    x.hasOwnProperty("y") &&
                    x.hasOwnProperty("width") &&
                    x.hasOwnProperty("height")) {
                    this.x = typeof x.x === "string" ? parseFloat(x.x) : x.x;
                    this.y = typeof x.y === "string" ? parseFloat(x.y) : x.y;
                    this.width = typeof x.width === "string" ? parseFloat(x.width) : x.width;
                    this.height = typeof x.height === "string" ? parseFloat(x.height) : x.height;
                }
                else if (typeof x === "object" && x.length && x.length === 4) {
                    this.x = typeof x[0] === "string" ? parseFloat(x[0]) : x[0];
                    this.y = typeof x[1] === "string" ? parseFloat(x[1]) : x[1];
                    this.width = typeof x[2] === "string" ? parseFloat(x[2]) : x[2];
                    this.height = typeof x[3] === "string" ? parseFloat(x[3]) : x[3];
                }
            }
            else {
                this.x = typeof x === "string" ? parseFloat(x) : x;
                this.y = typeof y === "string" ? parseFloat(y) : y;
                this.width = typeof width === "string" ? parseFloat(width) : width;
                this.height = typeof height === "string" ? parseFloat(height) : height;
            }
        }
        update(newViewBox) {
            this.x = newViewBox.x;
            this.y = newViewBox.y;
            this.width = newViewBox.width;
            this.height = newViewBox.height;
        }
        toString() {
            return this.x + " " + this.y + " " + this.width + " " + this.height;
        }
        toArray() {
            return [this.x, this.y, this.width, this.height];
        }
        clone() {
            return new ViewBox({ x: this.x, y: this.y, width: this.width, height: this.height });
        }
        fitsInViewBox(viewBox, atLeastByOneDimension) {
            if (atLeastByOneDimension === true) {
                return viewBox.width > this.width || viewBox.height > this.height;
            }
            else {
                return viewBox.width > this.width && viewBox.height > this.height;
            }
        }
        addPadding(padding) {
            if (padding.top) {
                this.y -= padding.top;
                this.height += padding.top;
            }
            if (padding.right) {
                this.width += padding.right;
            }
            if (padding.bottom) {
                this.height += padding.bottom;
            }
            if (padding.left) {
                this.x -= padding.left;
                this.width += padding.left;
            }
        }
    }
    class GeoViewBox {
        constructor(sw, ne) {
            this.sw = sw;
            this.ne = ne;
        }
    }

    const $$4 = jQuery;
    class MapObject {
        constructor(element, mapsvg) {
            this.id = "";
            this.objects = [];
            this.events = new Events(this);
            this.element = element;
            this.mapsvg = mapsvg;
        }
        getBBox() {
            return new ViewBox(1, 2, 3, 4);
        }
        getGeoBounds() {
            const bbox = this.getBBox();
            const pointSW = new SVGPoint(bbox.x, bbox.y + bbox.height);
            const pointNE = new SVGPoint(bbox.x + bbox.width, bbox.y);
            const sw = this.mapsvg.converter.convertSVGToGeo(pointSW);
            const ne = this.mapsvg.converter.convertSVGToGeo(pointNE);
            return { sw: sw, ne: ne };
        }
        getComputedStyle(prop, elem) {
            elem = elem || this.element;
            return MapObject.getComputedStyle(prop, elem);
        }
        static getComputedStyle(prop, elem) {
            const _p1 = elem.getAttribute(prop);
            if (_p1) {
                return _p1;
            }
            const _p2 = elem.getAttribute("style");
            if (_p2) {
                const s = _p2.split(";");
                const z = s.filter(function (e) {
                    e = e.trim();
                    const attr = e.split(":");
                    if (attr[0] == prop)
                        return true;
                });
                if (z.length) {
                    return z[0].split(":").pop().trim();
                }
            }
            const parent = elem.parentElement;
            const elemType = parent ? parent.tagName : null;
            if (elemType && elemType != "svg")
                return MapObject.getComputedStyle(prop, parent);
            else
                return undefined;
        }
        getStyle(prop) {
            const _p1 = this.attr(prop);
            if (_p1) {
                return _p1;
            }
            const _p2 = this.attr("style");
            if (_p2) {
                const s = _p2.split(";");
                const z = s.filter(function (e) {
                    var e = e.trim();
                    if (e.indexOf(prop) === 0)
                        return e;
                });
                return z.length ? z[0].split(":").pop().trim() : undefined;
            }
            return "";
        }
        getCenter() {
            const x = this.element.getBoundingClientRect().left;
            const y = this.element.getBoundingClientRect().top;
            const w = this.element.getBoundingClientRect().width;
            const h = this.element.getBoundingClientRect().height;
            const point = new ScreenPoint(x + w / 2, y + h / 2);
            return point;
        }
        getCenterSVG() {
            const bbox = this.getBBox();
            const point = new SVGPoint(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
            return point;
        }
        getCenterLatLng(yShift) {
            yShift = yShift ? yShift : 0;
            const bbox = this.getBBox();
            const x = bbox.x + bbox.width / 2;
            const y = bbox.y + bbox.height / 2 - yShift;
            const point = new SVGPoint(x, y);
            return this.mapsvg.converter.convertSVGToGeo(point);
        }
        attr(v1, v2 = null) {
            const svgDom = this.element;
            if (typeof v1 == "object") {
                for (const key in v1) {
                    const item = v1[key];
                    if (typeof item === "string" || typeof item === "number") {
                        svgDom.setAttribute(key, "" + item);
                    }
                }
            }
            else if (typeof v1 == "string" && (typeof v2 == "string" || typeof v2 == "number")) {
                svgDom.setAttribute(v1, "" + v2);
            }
            else if (v2 == undefined) {
                return svgDom.getAttribute(v1);
            }
        }
        setId(id) {
            if (id !== undefined) {
                this.id = id;
                this.element.setAttribute("id", id);
            }
        }
    }

    const $$5 = jQuery;
    class Marker extends MapObject {
        constructor(params) {
            super(null, params.mapsvg);
            this.element = $$5("<div />").addClass("mapsvg-marker")[0];
            this.image = $$5('<img src="" />').addClass("mapsvg-marker-image")[0];
            if (params.object) {
                this.setObject(params.object);
            }
            if (!(params.location instanceof Location)) {
                throw new Error("MapSVG.Marker: no Location provided for Marker initializaton");
            }
            else {
                this.location = params.location;
                this.location.marker = this;
            }
            this.setImage(this.location.imagePath);
            $$5(this.element).append(this.image);
            if (params.width && params.height) {
                this.setSize(params.width, params.height);
            }
            else {
                this.setSize(15, 24);
            }
            this.setId(this.mapsvg.markerId());
            this.setSvgPointFromLocation();
            this.setAltAttr();
        }
        reload() {
            this.setImage();
            this.setSvgPointFromLocation();
        }
        getImagePath() {
            return (this.object && this.object.getMarkerImage()) || this.location.getMarkerImage();
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
            $$5.each(o, function (key, val) {
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
        setImage(src, skipChangingLocationImage = false) {
            if (!src) {
                src = this.getImagePath();
            }
            this.src = MapSVG.safeURL(src);
            const img = new Image();
            const marker = this;
            img.onload = function () {
                if (marker.image.getAttribute("src") !== "src") {
                    marker.image.setAttribute("src", marker.src);
                }
                marker.setSize(this.width, this.height);
                marker.adjustScreenPosition();
            };
            img.src = this.src;
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
                const markerPos = this.screenPoint, x = Math.round(markerPos.x + this.width / 2 - $$5(this.label).outerWidth() / 2), y = Math.round(markerPos.y - $$5(this.label).outerHeight());
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
            $$5("body").on("mousemove.drag.mapsvg", function (e) {
                e.preventDefault();
                $$5(_this.mapsvg.containers.map).addClass("no-transitions");
                const mouseNew = MapSVG.mouseCoords(e);
                const dx = mouseNew.x - startCoords.x;
                const dy = mouseNew.y - startCoords.y;
                const newSvgPoint = new SVGPoint(_this.svgPointBeforeDrag.x + dx / scale, _this.svgPointBeforeDrag.y + dy / scale);
                _this.setSvgPoint(newSvgPoint);
            });
            $$5("body").on("mouseup.drag.mapsvg", function (e) {
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
            $$5("body").off(".drag.mapsvg");
            $$5(this.mapsvg.containers.map).removeClass("no-transitions");
        }
        delete() {
            if (this.label) {
                this.label.remove();
                this.label = null;
            }
            $$5(this.element).empty().remove();
        }
        setObject(obj) {
            this.object = obj;
            $$5(this.element).attr("data-object-id", this.object.id);
        }
        hide() {
            $$5(this.element).addClass("mapsvg-marker-hidden");
            if (this.label) {
                $$5(this.label).hide();
            }
        }
        show() {
            $$5(this.element).removeClass("mapsvg-marker-hidden");
            if (this.label) {
                $$5(this.label).show();
            }
        }
        highlight() {
            $$5(this.element).addClass("mapsvg-marker-hover");
        }
        unhighlight() {
            $$5(this.element).removeClass("mapsvg-marker-hover");
        }
        select() {
            this.selected = true;
            $$5(this.element).addClass("mapsvg-marker-active");
        }
        deselect() {
            this.selected = false;
            $$5(this.element).removeClass("mapsvg-marker-active");
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
                    this.bubble = $$5('<div id="' +
                        bubbleId +
                        '" data-marker-id="' +
                        this.element.id +
                        '" class="mapsvg-bubble mapsvg-marker-bubble"></div>')[0];
                    $$5(this.element).append(this.bubble);
                }
                const color = this.getChoroplethColor(), bubbleSize = Number(this.getBubbleSize());
                $$5(this.bubble)
                    .css("background-color", color)
                    .css("width", bubbleSize + "px")
                    .css("height", bubbleSize + "px")
                    .css("lineHeight", bubbleSize - 2 + "px");
            }
            else {
                $$5("#" + bubbleId).remove();
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
            if (html) {
                if (!this.label) {
                    this.label = $$5("<div />").addClass("mapsvg-marker-label")[0];
                    $$5(this.element).append(this.label);
                }
                $$5(this.label).html(html);
            }
            else {
                if (this.label) {
                    $$5(this.label).remove();
                    delete this.label;
                }
            }
        }
        setCentered(on) {
            this.centered = on;
        }
    }

    const $$6 = jQuery;
    class MarkerCluster extends MapObject {
        constructor(options, mapsvg) {
            super(null, mapsvg);
            this.svgPoint = options.svgPoint;
            this.cellX = options.cellX;
            this.cellY = options.cellY;
            this.markers = options.markers || [];
            this.cellSize = 50;
            this.width = 30;
            this.elem = $$6('<div class="mapsvg-marker-cluster">' + this.markers.length + "</div>")[0];
            $$6(this.elem).data("cluster", this);
            if (this.markers.length < 2) {
                $$6(this.elem).hide();
            }
            this.adjustScreenPosition();
        }
        addMarker(marker) {
            this.markers.push(marker);
            if (this.markers.length > 1) {
                if (this.markers.length === 2) {
                    $$6(this.elem).show();
                }
                if (this.markers.length === 2) {
                    const x = this.markers.map(function (m) {
                        return m.svgPoint.x;
                    });
                    this.min_x = Math.min.apply(null, x);
                    this.max_x = Math.max.apply(null, x);
                    const y = this.markers.map(function (m) {
                        return m.svgPoint.y;
                    });
                    this.min_y = Math.min.apply(null, y);
                    this.max_y = Math.max.apply(null, y);
                    this.svgPoint.x = this.min_x + (this.max_x - this.min_x) / 2;
                    this.svgPoint.y = this.min_y + (this.max_y - this.min_y) / 2;
                }
                if (this.markers.length > 2) {
                    if (marker.svgPoint.x < this.min_x) {
                        this.min_x = marker.svgPoint.x;
                    }
                    else if (marker.svgPoint.x > this.max_x) {
                        this.max_x = marker.svgPoint.x;
                    }
                    if (marker.svgPoint.y < this.min_y) {
                        this.min_y = marker.svgPoint.y;
                    }
                    else if (marker.svgPoint.x > this.max_x) {
                        this.max_y = marker.svgPoint.y;
                    }
                    this.svgPoint.x = this.min_x + (this.max_x - this.min_x) / 2;
                    this.svgPoint.y = this.min_y + (this.max_y - this.min_y) / 2;
                }
            }
            else {
                this.svgPoint.x = marker.svgPoint.x;
                this.svgPoint.y = marker.svgPoint.y;
            }
            $$6(this.elem).text(this.markers.length);
            this.adjustScreenPosition();
        }
        canTakeMarker(marker) {
            const _this = this;
            const screenPoint = _this.mapsvg.converter.convertSVGToPixel(marker.svgPoint);
            return (this.cellX === Math.ceil(screenPoint.x / this.cellSize) &&
                this.cellY === Math.ceil(screenPoint.y / this.cellSize));
        }
        destroy() {
            this.markers = null;
            $$6(this.elem).remove();
        }
        adjustScreenPosition() {
            const pos = this.mapsvg.converter.convertSVGToPixel(this.svgPoint);
            pos.x -= this.width / 2;
            pos.y -= this.width / 2;
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
                this.elem.style.transform = "translate(" + x + "px," + y + "px)";
            }
        }
        inViewBox() {
            const x = this.screenPoint.x, y = this.screenPoint.y, mapFullWidth = this.mapsvg.containers.map.offsetWidth, mapFullHeight = this.mapsvg.containers.map.offsetHeight;
            return (x - this.width / 2 < mapFullWidth &&
                x + this.width / 2 > 0 &&
                y - this.width / 2 < mapFullHeight &&
                y + this.width / 2 > 0);
        }
        updateVisibility() {
            if (this.inViewBox() === true) {
                this.visible = true;
                this.elem.classList.remove("mapsvg-out-of-sight");
            }
            else {
                this.visible = false;
                this.elem.classList.add("mapsvg-out-of-sight");
            }
            return this.visible;
        }
        getBBox() {
            let bbox = {
                x: this.svgPoint.x,
                y: this.svgPoint.y,
                width: this.cellSize / this.mapsvg.getScale(),
                height: this.cellSize / this.mapsvg.getScale(),
            };
            bbox = $$6.extend(true, {}, bbox);
            return new ViewBox(bbox.x, bbox.y, bbox.width, bbox.height);
        }
        getData() {
            return this.markers.map((m) => m.object);
        }
    }

    const $$7 = jQuery;
    class Region extends MapObject {
        constructor(element, mapsvg) {
            super(element, mapsvg);
            this.id = this.element.getAttribute("id");
            if (this.id && this.mapsvg.options.regionPrefix) {
                this.setId(this.id.replace(this.mapsvg.options.regionPrefix, ""));
            }
            this.id_no_spaces = this.id.replace(/\s/g, "_");
            this.element.setAttribute("class", (this.element.className || "") + " mapsvg-region");
            this.setStyleInitial();
            const regionOptions = this.mapsvg.options.regions && this.mapsvg.options.regions[this.id]
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
        adjustStroke(scale) {
            $$7(this.element).css({ "stroke-width": this.style["stroke-width"] / scale });
        }
        setStyleInitial() {
            this.style = { fill: this.getComputedStyle("fill") };
            this.style.stroke = this.getComputedStyle("stroke") || "";
            let w;
            w = this.getComputedStyle("stroke-width");
            w = w ? w.replace("px", "") : "1";
            w = parseFloat(w);
            this.style["stroke-width"] = w;
            $$7(this.element).attr("data-stroke-width", w);
        }
        saveState() {
            this.initialState = JSON.stringify(this.getOptions());
        }
        getBBox() {
            const _bbox = this.element.getBBox();
            const bbox = new ViewBox(_bbox.x, _bbox.y, _bbox.width, _bbox.height);
            const matrix = this.element.getTransformToElement(this.mapsvg.containers.svg);
            if (!matrix) {
                return _bbox;
            }
            const x2 = bbox.x + bbox.width;
            const y2 = bbox.y + bbox.height;
            let position = this.mapsvg.containers.svg.createSVGPoint();
            position.x = bbox.x;
            position.y = bbox.y;
            position = position.matrixTransform(matrix);
            bbox.x = position.x;
            bbox.y = position.y;
            position.x = x2;
            position.y = y2;
            position = position.matrixTransform(matrix);
            bbox.width = position.x - bbox.x;
            bbox.height = position.y - bbox.y;
            return bbox;
        }
        changed() {
            return JSON.stringify(this.getOptions()) != this.initialState;
        }
        edit() {
            this.elemOriginal = $$7(this.element).clone()[0];
        }
        editCommit() {
            this.elemOriginal = null;
        }
        editCancel() {
            this.mapsvg.containers.svg.appendChild(this.elemOriginal);
            this.element = this.elemOriginal;
            this.elemOriginal = null;
        }
        getOptions(forTemplate) {
            let o;
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
        forTemplate() {
            const data = {
                id: this.id,
                title: this.title,
                objects: this.objects,
                data: this.data,
            };
            if (this.data) {
                for (const key in this.data) {
                    if (key != "title" && key != "id")
                        data[key] = this.data[key];
                }
            }
            return data;
        }
        getData() {
            return this.forTemplate();
        }
        update(options) {
            for (const key in options) {
                const setter = "set" + MapSVG.ucfirst(key);
                if (setter in this)
                    this[setter](options[key]);
                else {
                    this[key] = options[key];
                    this.customAttrs = this.customAttrs || [];
                    this.customAttrs.push(key);
                }
            }
        }
        setTitle(title) {
            if (title) {
                this.title = title;
            }
            this.element.setAttribute("title", this.title);
        }
        setStyle(style) {
            $$7.extend(true, this.style, style);
            this.setFill();
        }
        getChoroplethColor() {
            const o = this.mapsvg.options.choropleth;
            let color = "";
            if (this.data &&
                (this.data[this.mapsvg.options.regionChoroplethField] ||
                    this.data[this.mapsvg.options.regionChoroplethField] === 0)) {
                const w = o.maxAdjusted === 0
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
            }
            else {
                color = o.colors.noData;
            }
            return color;
        }
        _new_getChoroplethColor() {
            let regionValue = parseFloat(this.data[this.mapsvg.options.choropleth.sourceField]), color;
            if (!regionValue) {
                color = this.mapsvg.options.choropleth.coloring.noData.color;
            }
            else if (this.mapsvg.options.choropleth.coloring.mode === "gradient") {
                const gradient = this.mapsvg.options.choropleth.coloring.gradient, w = gradient.values.maxAdjusted === 0
                    ? 0
                    : (regionValue - gradient.values.min) / gradient.values.maxAdjusted, r = Math.round(gradient.colors.diffRGB.r * w + gradient.colors.lowRGB.r), g = Math.round(gradient.colors.diffRGB.g * w + gradient.colors.lowRGB.g), b = Math.round(gradient.colors.diffRGB.b * w + gradient.colors.lowRGB.b), a = (gradient.colors.diffRGB.a * w + gradient.colors.lowRGB.a).toFixed(2);
                color = "rgba(" + r + "," + g + "," + b + "," + a + ")";
            }
            else {
                const paletteColors = this.mapsvg.options.choropleth.coloring.palette.colors;
                if (!paletteColors[0].valueFrom && regionValue < paletteColors[0].valueTo) {
                    color = paletteColors[0].color;
                }
                else if (!paletteColors[paletteColors.length - 1].valueTo &&
                    regionValue > paletteColors[paletteColors.length - 1].valueFrom) {
                    color = paletteColors[paletteColors.length - 1].color;
                }
                else {
                    paletteColors.forEach(function (paletteColor) {
                        if (regionValue >= paletteColor.valueFrom &&
                            regionValue < paletteColor.valueTo) {
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
            if (this.data[this.mapsvg.options.choropleth.sourceField]) {
                const maxBubbleSize = Number(this.mapsvg.options.choropleth.bubbleSize.max), minBubbleSize = Number(this.mapsvg.options.choropleth.bubbleSize.min), maxSourceFieldvalue = this.mapsvg.options.choropleth.coloring.gradient.values.max, minSourceFieldvalue = this.mapsvg.options.choropleth.coloring.gradient.values.min, sourceFieldvalue = parseFloat(this.data[this.mapsvg.options.choropleth.sourceField]);
                bubbleSize =
                    ((sourceFieldvalue - minSourceFieldvalue) /
                        (maxSourceFieldvalue - minSourceFieldvalue)) *
                        (maxBubbleSize - minBubbleSize) +
                        minBubbleSize;
            }
            else {
                bubbleSize = false;
            }
            return bubbleSize;
        }
        setFill(fill) {
            if (this.mapsvg.options.colorsIgnore) {
                $$7(this.element).css(this.style);
                return;
            }
            if (fill) {
                const regions = {};
                regions[this.id] = { fill: fill };
                $$7.extend(true, this.mapsvg.options, { regions: regions });
            }
            else if (!fill &&
                fill !== undefined &&
                this.mapsvg.options.regions &&
                this.mapsvg.options.regions[this.id] &&
                this.mapsvg.options.regions[this.id].fill) {
                delete this.mapsvg.options.regions[this.id].fill;
            }
            if (this.mapsvg.options.choropleth.on) {
                this.default_attr["fill"] = this.getChoroplethColor();
            }
            else if (this.status !== undefined &&
                this.mapsvg.regions &&
                this.mapsvg.regionsRepository.getSchema().getFieldByType("status") &&
                this.mapsvg.regionsRepository.getSchema().getFieldByType("status").optionsDict &&
                this.mapsvg.regionsRepository.getSchema().getFieldByType("status").optionsDict[this.status] &&
                this.mapsvg.regionsRepository.getSchema().getFieldByType("status").optionsDict[this.status].color) {
                this.default_attr["fill"] = this.mapsvg.regionsRepository
                    .getSchema()
                    .getFieldByType("status").optionsDict[this.status].color;
            }
            else if (this.mapsvg.options.regions[this.id] &&
                this.mapsvg.options.regions[this.id].fill) {
                this.default_attr["fill"] = this.mapsvg.options.regions[this.id].fill;
            }
            else if (this.mapsvg.options.colors.base) {
                this.default_attr["fill"] = this.mapsvg.options.colors.base;
            }
            else if (this.style.fill != "none") {
                this.default_attr["fill"] = this.style.fill
                    ? this.style.fill
                    : this.mapsvg.options.colors.baseDefault;
            }
            else {
                this.default_attr["fill"] = "none";
            }
            if (MapSVG.isNumber(this.mapsvg.options.colors.selected))
                this.selected_attr["fill"] = tinycolor(this.default_attr.fill)
                    .lighten(parseFloat("" + this.mapsvg.options.colors.selected))
                    .toRgbString();
            else
                this.selected_attr["fill"] = this.mapsvg.options.colors.selected;
            if (MapSVG.isNumber(this.mapsvg.options.colors.hover))
                this.hover_attr["fill"] = tinycolor(this.default_attr.fill)
                    .lighten(parseFloat("" + this.mapsvg.options.colors.hover))
                    .toRgbString();
            else
                this.hover_attr["fill"] = this.mapsvg.options.colors.hover;
            $$7(this.element).css("fill", this.default_attr["fill"]);
            this.fill = this.default_attr["fill"];
            if (this.style.stroke != "none" && this.mapsvg.options.colors.stroke != undefined) {
                $$7(this.element).css("stroke", this.mapsvg.options.colors.stroke);
            }
            else {
                const s = this.style.stroke == undefined ? "" : this.style.stroke;
                $$7(this.element).css("stroke", s);
            }
            if (this.selected)
                this.setSelected();
        }
        setDisabled(on, skipSetFill) {
            on = on !== undefined ? MapSVG.parseBoolean(on) : this.getDisabledState();
            const prevDisabled = this.disabled;
            this.disabled = on;
            this.attr("class", this.attr("class").replace("mapsvg-disabled", ""));
            if (on) {
                this.attr("class", this.attr("class") + " mapsvg-disabled");
            }
            if (this.disabled != prevDisabled)
                this.mapsvg.deselectRegion(this);
            !skipSetFill && this.setFill();
        }
        setStatus(status) {
            const statusOptions = this.mapsvg.options.regionStatuses && this.mapsvg.options.regionStatuses[status];
            if (statusOptions) {
                this.status = status;
                if (this.data) {
                    this.data.status = status;
                    this.data.status_text = statusOptions.label;
                }
                this.setDisabled(statusOptions.disabled, true);
            }
            else {
                this.status = undefined;
                if (this.data) {
                    this.data.status = undefined;
                    this.data.status_text = undefined;
                }
                this.setDisabled(false, true);
            }
            this.setFill();
        }
        setSelected() {
            this.mapsvg.selectRegion(this);
        }
        setchoroplethValue(val) {
            if ($$7.isNumeric(val)) {
                if (typeof val === "string") {
                    val = parseFloat(val);
                }
                this.choroplethValue = val;
            }
            else {
                this.choroplethValue = undefined;
            }
        }
        getDisabledState(asDefault) {
            const opts = this.mapsvg.options.regions[this.id];
            if (!asDefault && opts && opts.disabled !== undefined) {
                return opts.disabled;
            }
            else {
                return (this.mapsvg.options.disableAll ||
                    this.style.fill === "none" ||
                    this.id == "labels" ||
                    this.id == "Labels");
            }
        }
        highlight() {
            $$7(this.element).css({ fill: this.hover_attr.fill });
            $$7(this.element).addClass("mapsvg-region-hover");
        }
        unhighlight() {
            $$7(this.element).css({ fill: this.default_attr.fill });
            $$7(this.element).removeClass("mapsvg-region-hover");
        }
        select() {
            $$7(this.element).css({ fill: this.selected_attr.fill });
            this.selected = true;
            $$7(this.element).addClass("mapsvg-region-active");
        }
        deselect() {
            $$7(this.element).css({ fill: this.default_attr.fill });
            this.selected = false;
            $$7(this.element).removeClass("mapsvg-region-active");
        }
        setData(data) {
            this.data = data;
            if (typeof data.title !== "undefined") {
                this.setTitle(data.title);
            }
        }
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
                        this.bubble = $$7('<div id="' +
                            bubbleId +
                            '" class="mapsvg-bubble mapsvg-region-bubble"></div>')[0];
                        $$7(this.mapsvg.layers.bubbles).append(this.bubble);
                    }
                    const color = this.getChoroplethColor();
                    const bubbleSize = Number(this.getBubbleSize());
                    $$7(this.bubble)
                        .css("transform", "translate(-50%,-50%) translate(" + pos.x + "px," + pos.y + "px)")
                        .css("background-color", color)
                        .css("width", bubbleSize + "px")
                        .css("height", bubbleSize + "px")
                        .css("lineHeight", bubbleSize - 2 + "px");
                }
                else {
                    delete this.bubble;
                }
            }
        }
        adjustLabelScreenPosition() {
            if (this.label) {
                if (!this.center) {
                    this.center = this.getCenterSVG();
                }
                const pos = this.mapsvg.converter.convertSVGToPixel(this.center), x = pos.x - this.label.offsetWidth / 2, y = pos.y - this.label.offsetHeight / 2;
                this.setLabelScreenPosition(x, y);
            }
        }
        adjustBubbleScreenPosition() {
            if (this.bubble) {
                if (!this.center) {
                    this.center = this.getCenterSVG();
                }
                const pos = this.mapsvg.converter.convertSVGToPixel(this.center), x = pos.x - this.bubble.offsetWidth / 2, y = pos.y - this.bubble.offsetHeight / 2;
                this.setBubbleScreenPosition(x, y);
            }
        }
        moveLabelScreenPositionBy(deltaX, deltaY) {
            if (this.label) {
                const labelStyle = window.getComputedStyle(this.label), matrix = labelStyle.transform || labelStyle.webkitTransform, matrixValues = matrix.match(/matrix.*\((.+)\)/)[1].split(", "), x = parseFloat(matrixValues[4]) - deltaX, y = parseFloat(matrixValues[5]) - deltaY;
                this.setLabelScreenPosition(x, y);
            }
        }
        moveBubbleScreenPositionBy(deltaX, deltaY) {
            if (this.bubble) {
                const labelStyle = window.getComputedStyle(this.bubble), matrix = labelStyle.transform || labelStyle.webkitTransform, matrixValues = matrix.match(/matrix.*\((.+)\)/)[1].split(", "), x = parseFloat(matrixValues[4]) - deltaX, y = parseFloat(matrixValues[5]) - deltaY;
                this.setBubbleScreenPosition(x, y);
            }
        }
        setLabelScreenPosition(x, y) {
            if (this.label) {
                this.label.style.transform = "translate(" + x + "px," + y + "px)";
            }
        }
        setBubbleScreenPosition(x, y) {
            if (this.bubble) {
                this.bubble.style.transform = "translate(" + x + "px," + y + "px)";
            }
        }
    }

    class SchemaRepository extends Repository {
        constructor() {
            const objectName = "schema";
            super(objectName, +objectName + "s");
            this.className = "Schema";
            this.objectNameSingle = objectName;
            this.objectNameMany = objectName + "s";
            this.path = objectName + "s/";
            this.events = new Events(this);
        }
        create(schema) {
            const defer = jQuery.Deferred();
            defer.promise();
            const data = {};
            data[this.objectNameSingle] = this.encodeData(schema);
            this.server
                .post(this.path, data)
                .done((response) => {
                const data = this.decodeData(response);
                schema.id = data[this.objectNameSingle].id;
                this.objects.push(schema);
                this.events.trigger("created");
                schema.events.trigger("created");
                defer.resolve(schema);
            })
                .fail(() => {
                defer.reject();
            });
            return defer;
        }
        update(schema) {
            const defer = jQuery.Deferred();
            defer.promise();
            const data = {};
            data[this.objectNameSingle] = this.encodeData(schema);
            this.server
                .put(this.path + schema.id, data)
                .done((response) => {
                const data = this.decodeData(response);
                this.objects.push(schema);
                defer.resolve(schema);
                this.events.trigger("changed");
                schema.events.trigger("changed");
            })
                .fail(() => {
                defer.reject();
            });
            return defer;
        }
        encodeData(schema) {
            const _schema = schema.getData();
            let fieldsJsonString = JSON.stringify(_schema);
            fieldsJsonString = fieldsJsonString.replace(/select/g, "!mapsvg-encoded-slct");
            fieldsJsonString = fieldsJsonString.replace(/table/g, "!mapsvg-encoded-tbl");
            fieldsJsonString = fieldsJsonString.replace(/database/g, "!mapsvg-encoded-db");
            fieldsJsonString = fieldsJsonString.replace(/varchar/g, "!mapsvg-encoded-vc");
            fieldsJsonString = fieldsJsonString.replace(/int\(11\)/g, "!mapsvg-encoded-int");
            const back = JSON.parse(fieldsJsonString);
            back.fields = JSON.stringify(_schema.fields);
            return back;
        }
    }

    const $$8 = jQuery;
    class Controller {
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
            $$8(this.containers.contentWrap).nanoScroller({
                preventPageScrolling: true,
            });
            setTimeout(function () {
                $$8(_this.containers.contentWrap).nanoScroller({
                    preventPageScrolling: true,
                });
            }, 300);
        }
        adjustHeight() {
            const _this = this;
            $$8(_this.containers.main).height($$8(_this.containers.main).find(".mapsvg-auto-height").outerHeight() +
                (_this.containers.toolbar ? $$8(_this.containers.toolbar).outerHeight() : 0));
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
            this.containers.view = $$8("<div />")
                .attr("id", "mapsvg-controller-" + this.name)
                .addClass("mapsvg-controller-view")[0];
            this.containers.contentWrap = $$8("<div />").addClass("mapsvg-controller-view-wrap")[0];
            this.containers.contentWrap2 = $$8("<div />")[0];
            this.containers.sizer = $$8("<div />").addClass("mapsvg-auto-height")[0];
            this.containers.contentView = $$8("<div />").addClass("mapsvg-controller-view-content")[0];
            this.containers.sizer.appendChild(this.containers.contentView);
            if (this.scrollable) {
                $$8(this.containers.contentWrap).addClass("nano");
                $$8(this.containers.contentWrap2).addClass("nano-content");
            }
            this.containers.contentWrap.appendChild(this.containers.contentWrap2);
            this.containers.contentWrap2.appendChild(this.containers.sizer);
            if (this.withToolbar && this.templates.toolbar) {
                this.containers.toolbar = $$8("<div />").addClass("mapsvg-controller-view-toolbar")[0];
                this.containers.view.appendChild(this.containers.toolbar);
            }
            this.containers.view.append(this.containers.contentWrap);
            this.containers.main.appendChild(this.containers.view);
            $$8(this.containers.main).data("controller", this);
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
                $$8(this.containers.contentView).html(this.templates.main(this.data));
            }
            catch (err) {
                console.error(err);
                $$8(this.containers.contentView).html("");
            }
            if (this.withToolbar && this.templates.toolbar)
                $$8(this.containers.toolbar).html(this.templates.toolbar(this.data));
            this.updateTopShift();
            if (this.noPadding)
                this.containers.contentView.style.padding = "0";
            this.updateScroll();
        }
        updateTopShift() {
            const _this = this;
            if (!this.withToolbar)
                return;
            $$8(_this.containers.contentWrap).css({
                top: $$8(_this.containers.toolbar).outerHeight(true) + "px",
            });
            setTimeout(function () {
                $$8(_this.containers.contentWrap).css({
                    top: $$8(_this.containers.toolbar).outerHeight(true) + "px",
                });
            }, 100);
            setTimeout(function () {
                $$8(_this.containers.contentWrap).css({
                    top: $$8(_this.containers.toolbar).outerHeight(true) + "px",
                });
            }, 200);
            setTimeout(function () {
                $$8(_this.containers.contentWrap).css({
                    top: $$8(_this.containers.toolbar).outerHeight(true) + "px",
                });
                _this.updateScroll();
            }, 500);
        }
        setEventHandlersCommon() { }
        setEventHandlers() { }
        destroy() {
            delete this.resizeSensor;
            $$8(this.containers.view).empty().remove();
        }
    }

    const $$9 = jQuery;
    class DirectoryController extends Controller {
        constructor(options) {
            super(options);
            this.repository = options.repository;
            this.noPadding = true;
            this.position = options.position;
            this.search = options.search;
        }
        getToolbarTemplate() {
            let t = '<div class="mapsvg-directory-search-wrap">';
            t += '<div class="mapsvg-directory-filter-wrap filter-wrap"></div>';
            t += "</div>";
            t += "</div>";
            return t;
        }
        viewDidLoad() {
            const _this = this;
            this.menuBtn = $$9('<div class="mapsvg-button-menu"><i class="mapsvg-icon-menu"></i> ' +
                this.mapsvg.options.mobileView.labelList +
                "</div>")[0];
            this.mapBtn = $$9('<div class="mapsvg-button-map"><i class="mapsvg-icon-map"></i> ' +
                this.mapsvg.options.mobileView.labelMap +
                "</div>")[0];
            if (MapSVG.isPhone && _this.mapsvg.options.menu.hideOnMobile) {
                if (this.mapsvg.options.menu.showFirst == "map") {
                    this.toggle(false);
                }
                else {
                    this.toggle(true);
                }
            }
            this.mobileButtons = $$9('<div class="mapsvg-mobile-buttons"></div>')[0];
            this.mobileButtons.append(this.menuBtn, this.mapBtn);
            if (this.mapsvg.options.menu.on !== false) {
                this.mapsvg.containers.wrapAll.appendChild(this.mobileButtons);
            }
            this.events.trigger("shown", this.containers.view);
        }
        setEventHandlers() {
            const _this = this;
            $$9(window).on("resize", function () {
                _this.updateTopShift();
            });
            $$9(this.menuBtn).on("click", function () {
                _this.toggle(true);
            });
            $$9(this.mapBtn).on("click", function () {
                _this.toggle(false);
                _this.mapsvg.redraw();
            });
            $$9(this.containers.view)
                .on("click.menu.mapsvg", ".mapsvg-directory-item", function (e) {
                if (e.target.nodeName == "A") {
                    return;
                }
                const objID = $$9(this).data("object-id");
                let regions;
                let marker;
                let detailsViewObject;
                let eventObject;
                _this.deselectItems();
                _this.selectItems(objID, false);
                if (MapSVG.isPhone && _this.mapsvg.options.menu.showMapOnClick) {
                    _this.toggle(false);
                }
                if (_this.mapsvg.options.menu.source == "regions") {
                    regions = [_this.mapsvg.getRegion(objID)];
                    eventObject = regions[0];
                    detailsViewObject = regions[0];
                }
                else {
                    detailsViewObject = _this.repository.getLoadedObject(objID);
                    eventObject = detailsViewObject;
                    const _regions = detailsViewObject.getRegions(_this.mapsvg.regionsRepository.schema.name);
                    if (_regions) {
                        regions = _regions
                            .map(function (region) {
                            return _this.mapsvg.getRegion(region.id);
                        })
                            .filter(function (r) {
                            return r !== undefined;
                        });
                    }
                }
                if (detailsViewObject.location && detailsViewObject.location.marker)
                    marker = detailsViewObject.location.marker;
                if (_this.mapsvg.options.actions.directoryItem.click.showDetails) {
                    _this.mapsvg.loadDetailsView(detailsViewObject);
                }
                if (regions && regions.length > 0) {
                    if (_this.mapsvg.options.actions.directoryItem.click.zoom) {
                        _this.mapsvg.zoomTo(regions, _this.mapsvg.options.actions.directoryItem.click.zoomToLevel);
                    }
                    if (regions.length > 1) {
                        _this.mapsvg.setMultiSelect(true);
                    }
                    regions.forEach(function (region) {
                        const center = region.getCenter();
                        e.clientX = center[0];
                        e.clientY = center[1];
                        if (_this.mapsvg.options.actions.directoryItem.click.selectRegion) {
                            _this.mapsvg.selectRegion(region, true);
                        }
                        if (_this.mapsvg.options.actions.directoryItem.click.showRegionPopover) {
                            if (_this.mapsvg.options.actions.directoryItem.click.zoom) {
                                setTimeout(function () {
                                    _this.mapsvg.showPopover(region);
                                }, 500);
                            }
                            else {
                                _this.mapsvg.showPopover(region);
                            }
                        }
                        if (_this.mapsvg.options.actions.directoryItem.click.fireRegionOnClick) {
                            _this.mapsvg.events.trigger("click.region", region, [region]);
                        }
                    });
                    if (regions.length > 1) {
                        _this.mapsvg.setMultiSelect(false, false);
                    }
                }
                if (marker) {
                    if (_this.mapsvg.options.actions.directoryItem.click.zoomToMarker) {
                        _this.mapsvg.zoomTo(marker, _this.mapsvg.options.actions.directoryItem.click.zoomToMarkerLevel);
                    }
                    if (_this.mapsvg.options.actions.directoryItem.click.showMarkerPopover) {
                        if (_this.mapsvg.options.actions.directoryItem.click.zoomToMarker) {
                            setTimeout(function () {
                                _this.mapsvg.showPopover(detailsViewObject);
                            }, 500);
                        }
                        else {
                            _this.mapsvg.showPopover(detailsViewObject);
                        }
                    }
                    if (_this.mapsvg.options.actions.directoryItem.click.fireMarkerOnClick) {
                        _this.mapsvg.events.trigger("click.marker", marker, [e, _this.mapsvg]);
                    }
                    _this.mapsvg.selectMarker(marker);
                }
                _this.events.trigger("click", this, [e, eventObject, _this.mapsvg]);
                const actions = _this.mapsvg.options.actions;
                if (actions.directoryItem.click.goToLink) {
                    const linkParts = actions.directoryItem.click.linkField.split(".");
                    let url;
                    if (linkParts.length > 1) {
                        const obj = linkParts.shift();
                        const attr = "." + linkParts.join(".");
                        if (obj == "Region") {
                            if (regions[0] && regions[0].data)
                                url = eval("regions[0].data" + attr);
                        }
                        else {
                            if (detailsViewObject)
                                url = eval("detailsViewObject" + attr);
                        }
                        if (url) {
                            if (actions.directoryItem.click.newTab) {
                                const win = window.open(url, "_blank");
                                win.focus();
                            }
                            else {
                                window.location.href = url;
                            }
                        }
                    }
                }
                if (actions.directoryItem.click.showAnotherMap) {
                    if (_this.mapsvg.editMode) {
                        alert('"Show another map" action is disabled in the preview');
                        return true;
                    }
                    const linkParts2 = actions.directoryItem.click.showAnotherMapField.split(".");
                    if (linkParts2.length > 1) {
                        const obj2 = linkParts2.shift();
                        const attr2 = "." + linkParts2.join(".");
                        let map_id;
                        if (obj2 == "Region") {
                            if (regions[0] && regions[0].data)
                                map_id = eval("regions[0].data" + attr2);
                        }
                        else {
                            if (detailsViewObject)
                                map_id = eval("detailsViewObject" + attr2);
                        }
                        if (map_id) {
                            const container = actions.directoryItem.click.showAnotherMapContainerId
                                ? $$9("#" + actions.directoryItem.click.showAnotherMapContainerId)[0]
                                : $$9(_this.mapsvg.containers.map)[0];
                            _this.mapsvg.loadMap(map_id, container);
                        }
                    }
                }
            })
                .on("mouseover.menu.mapsvg", ".mapsvg-directory-item", function (e) {
                const objID = $$9(this).data("object-id");
                let regions;
                let detailsViewObject;
                let eventObject;
                let marker;
                if (_this.mapsvg.options.menu.source == "regions") {
                    regions = [_this.mapsvg.getRegion(objID)];
                    eventObject = regions[0];
                    detailsViewObject = regions[0];
                }
                else {
                    detailsViewObject = _this.repository.getLoadedObject(objID);
                    eventObject = detailsViewObject;
                    const _regions = detailsViewObject.getRegions(_this.mapsvg.regionsRepository.schema.name);
                    if (_regions) {
                        regions = _regions.map(function (region) {
                            return _this.mapsvg.getRegion(region.id);
                        });
                    }
                    if (detailsViewObject.location) {
                        marker = detailsViewObject.location.marker;
                    }
                }
                if (regions && regions.length) {
                    _this.mapsvg.highlightRegions(regions);
                }
                if (marker) {
                    _this.mapsvg.highlightMarker(marker);
                    if (_this.mapsvg.options.actions.directoryItem.hover.centerOnMarker) {
                        _this.mapsvg.centerOn(marker);
                    }
                }
                _this.events.trigger("mouseover", $$9(this), [e, eventObject, _this.mapsvg]);
            })
                .on("mouseout.menu.mapsvg", ".mapsvg-directory-item", function (e) {
                const objID = $$9(this).data("object-id");
                let regions;
                let detailsViewObject;
                let eventObject;
                let marker;
                if (_this.mapsvg.options.menu.source == "regions") {
                    regions = [_this.mapsvg.getRegion(objID)];
                    eventObject = regions[0];
                    detailsViewObject = regions[0];
                }
                else {
                    detailsViewObject = _this.repository.getLoadedObject(objID);
                    eventObject = detailsViewObject;
                    const _regions = detailsViewObject.getRegions(_this.mapsvg.regionsRepository.schema.name);
                    if (_regions) {
                        regions = _regions.map(function (region) {
                            return _this.mapsvg.getRegion(region.id);
                        });
                    }
                    if (detailsViewObject.location) {
                        marker = detailsViewObject.location.marker;
                    }
                }
                if (regions && regions.length) {
                    _this.mapsvg.unhighlightRegions();
                }
                if (marker) {
                    _this.mapsvg.unhighlightMarker();
                }
                _this.events.trigger("mouseout", $$9(this), [e, eventObject, _this.mapsvg]);
            });
            $$9(this.containers.contentView).on("click", ".mapsvg-category-item", function () {
                const panel = $$9(this).next(".mapsvg-category-block");
                if (panel[0].style.maxHeight || panel.hasClass("active")) {
                    panel[0].style.maxHeight = null;
                }
                else {
                    panel[0].style.maxHeight = panel[0].scrollHeight + "px";
                }
                if ($$9(this).hasClass("active")) {
                    $$9(this).toggleClass("active", false);
                    $$9(this).next(".mapsvg-category-block").addClass("collapsed").removeClass("active");
                }
                else {
                    if (_this.mapsvg.options.menu.categories.collapseOther) {
                        $$9(this).parent().find(".mapsvg-category-item.active").removeClass("active");
                        $$9(this)
                            .parent()
                            .find(".mapsvg-category-block.active")
                            .removeClass("active")
                            .addClass("collapsed");
                    }
                    $$9(this).toggleClass("active", true);
                    $$9(this).next(".mapsvg-category-block").removeClass("collapsed").addClass("active");
                }
                const panels = $$9(".mapsvg-category-block.collapsed");
                panels.each(function (i, panel) {
                    panel.style.maxHeight = null;
                });
            });
        }
        highlightItems(ids) {
            const _this = this;
            if (typeof ids != "object")
                ids = [ids];
            ids.forEach(function (id) {
                $$9(_this.containers.view)
                    .find("#mapsvg-directory-item-" + _this.convertId(id))
                    .addClass("hover");
            });
        }
        unhighlightItems() {
            $$9(this.containers.view).find(".mapsvg-directory-item").removeClass("hover");
        }
        selectItems(ids, scrollTo = true) {
            if (typeof ids != "object")
                ids = [ids];
            ids.forEach((id) => {
                $$9(this.containers.view)
                    .find("#mapsvg-directory-item-" + this.convertId(id))
                    .addClass("selected");
            });
            if (scrollTo && $$9("#mapsvg-directory-item-" + ids[0]).length > 0) {
                this.scrollable &&
                    $$9(this.containers.contentWrap).nanoScroller({
                        scrollTo: $$9(this.containers.view).find("#mapsvg-directory-item-" + this.convertId(ids[0])),
                    });
            }
        }
        deselectItems() {
            $$9(this.containers.view).find(".mapsvg-directory-item").removeClass("selected");
        }
        removeItems(ids) {
            $$9(this.containers.view)
                .find("#mapsvg-directory-item-" + this.convertId(ids))
                .remove();
        }
        filterOut(items) {
            return items;
        }
        loadItemsToDirectory() {
            let items = [];
            const _this = this;
            if (!_this.repository.loaded)
                return false;
            if (_this.mapsvg.options.menu.categories &&
                _this.mapsvg.options.menu.categories.on &&
                _this.mapsvg.options.menu.categories.groupBy) {
                const categoryField = _this.mapsvg.options.menu.categories.groupBy;
                if (_this.repository.getSchema().getField(categoryField) === undefined ||
                    _this.repository.getSchema().getField(categoryField).options === undefined) {
                    return false;
                }
                const categories = _this.repository.getSchema().getField(categoryField).options;
                categories.forEach(function (category) {
                    let dbItems = _this.repository.getLoaded();
                    dbItems = _this.filterOut(dbItems);
                    const itemArr = [];
                    dbItems.forEach((item) => {
                        itemArr.push(item);
                    });
                    const catItems = itemArr.filter(function (object) {
                        if (categoryField === "regions") {
                            const objectRegions = typeof object[categoryField] !== "undefined" &&
                                object[categoryField].length
                                ? object[categoryField]
                                : [];
                            const objectRegionIDs = objectRegions.map(function (region) {
                                return region.id;
                            });
                            return objectRegionIDs.indexOf(category.id) !== -1;
                        }
                        else {
                            return object[categoryField] == category.value;
                        }
                    });
                    category.counter = catItems.length;
                    if (categoryField === "regions") {
                        category.label = category.title;
                        category.value = category.id;
                    }
                    items.push({ category: category, items: catItems });
                });
                if (_this.mapsvg.options.menu.categories.hideEmpty) {
                    items = items.filter(function (item) {
                        return item.category.counter > 0;
                    });
                }
            }
            else {
                if (_this.mapsvg.options.menu.source === "regions") {
                    items = _this.repository.getLoaded().map((r) => {
                        const data = r.getData();
                        data.objects = _this.mapsvg.getRegion(data.id).objects;
                        data.id_no_spaces = data.id.split(" ").join("_");
                        return data;
                    });
                }
                else {
                    items = _this.repository
                        .getLoaded()
                        .map((r) => r.getData(_this.mapsvg.regionsRepository.schema.name));
                }
            }
            try {
                $$9(this.containers.contentView).html(this.templates.main({ items: items }));
            }
            catch (err) {
                console.error('MapSVG: Error in the "Directory item" template');
                console.error(err);
            }
            if (items.length === 0) {
                $$9(this.containers.contentView).html('<div class="mapsvg-no-results">' +
                    this.mapsvg.options.menu.noResultsText +
                    "</div>");
            }
            if (_this.mapsvg.options.menu.categories.on) {
                if (_this.mapsvg.options.menu.categories.collapse && items.length > 1) {
                    $$9(this.containers.contentView).find(".mapsvg-category-block").addClass("collapsed");
                }
                else if (_this.mapsvg.options.menu.categories.collapse && items.length === 1) {
                    $$9(this.containers.contentView).find(".mapsvg-category-item").addClass("active");
                    $$9(this.containers.contentView).find(".mapsvg-category-block").addClass("active");
                    const panel = $$9(this.containers.contentView).find(".mapsvg-category-block")[0];
                    if (panel)
                        panel.style.maxHeight = panel.scrollHeight + "px";
                }
                else if (!_this.mapsvg.options.menu.categories.collapse) {
                    $$9(this.containers.contentView).find(".mapsvg-category-item").addClass("active");
                    $$9(this.containers.contentView).find(".mapsvg-category-block").addClass("active");
                    const panels = $$9(this.containers.contentView).find(".mapsvg-category-block");
                    if (panels.length)
                        panels.each(function (i, panel) {
                            panel.style.maxHeight = panel.scrollHeight + "px";
                        });
                }
            }
            this.updateTopShift();
            this.updateScroll();
        }
        toggle(on) {
            const _this = this;
            if (on) {
                $$9(this.containers.main).parent().show();
                $$9(_this.mapsvg.containers.mapContainer).hide();
                $$9(this.menuBtn).addClass("active");
                $$9(this.mapBtn).removeClass("active");
            }
            else {
                $$9(this.containers.main).parent().hide();
                $$9(_this.mapsvg.containers.mapContainer).show();
                $$9(this.menuBtn).removeClass("active");
                $$9(this.mapBtn).addClass("active");
            }
            if (!$$9(this.containers.main).parent().is(":visible")) {
                if (MapSVG.isPhone) {
                    $$9(_this.mapsvg.containers.wrap).css("height", "auto");
                    _this.updateScroll();
                }
            }
            else {
                if (MapSVG.isPhone &&
                    $$9(this.containers.main).height() < parseInt(this.mapsvg.options.menu.minHeight)) {
                    $$9(_this.mapsvg.containers.wrap).css("height", parseInt(this.mapsvg.options.menu.minHeight) + "px");
                    _this.updateScroll();
                }
            }
            this.updateTopShift();
        }
        addPagination(pager) {
            $$9(this.containers.contentView).append('<div class="mapsvg-pagination-container"></div>');
            $$9(this.containers.contentView).find(".mapsvg-pagination-container").html(pager);
        }
        convertId(id) {
            return (id + "")
                .split(" ")
                .join("_")
                .replace(/(:|\(|\)|\.|\[|\]|,|=|@)/g, "\\$1");
        }
    }

    const $$a = jQuery;
    class DetailsController extends Controller {
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
                this.mobileCloseBtn = $$a('<button class="mapsvg-mobile-modal-close">' +
                    _this.mapsvg.options.mobileView.labelClose +
                    "</button>")[0];
                this.containers.view.appendChild(this.mobileCloseBtn);
            }
        }
        setEventHandlers() {
            const _this = this;
            $$a(this.containers.toolbar).on("click touchend", ".mapsvg-popover-close", function (e) {
                e.stopPropagation();
                _this.destroy();
                _this.events.trigger("closed", _this, [_this]);
            });
            $$a(this.containers.view).on("click touchend", ".mapsvg-mobile-modal-close", function (e) {
                e.stopPropagation();
                _this.destroy();
                _this.events.trigger("closed", _this, [_this]);
            });
        }
    }

    const $$b = jQuery;
    class FormElement {
        constructor(options, formBuilder, external) {
            this.readonly = typeof options.readonly !== "undefined" ? options.readonly : false;
            this.protected = typeof options.protected !== "undefined" ? options.protected : false;
            this.auto_increment =
                typeof options.auto_increment !== "undefined" ? options.auto_increment : false;
            this.not_null = typeof options.not_null !== "undefined" ? options.not_null : false;
            this.searchable = typeof options.searchable !== "undefined" ? options.searchable : false;
            this.visible = typeof options.visible !== "undefined" ? options.visible : true;
            this.formBuilder = formBuilder;
            this.events = new Events(this);
            this.type = options.type;
            this.value = options.value;
            this.db_type = options.db_type || "varchar(255)";
            this.label = this.label || (options.label === undefined ? "Label" : options.label);
            this.name = this.name || options.name || "label";
            this.help = options.help || "";
            this.placeholder = options.placeholder;
            this.setExternal(external);
            let t = this.type;
            if (t === "marker" && this.mapIsGeo) {
                t = "marker-geo";
            }
            if (t === "location" && this.mapIsGeo) {
                t = "location-geo";
            }
            if (this.filtersMode) {
                this.parameterName = options.parameterName || "";
                this.parameterNameShort = this.parameterName.split(".")[1];
                this.name = this.parameterNameShort;
                this.placeholder = options.placeholder || "";
                this.templates = {
                    main: Handlebars.compile($$b("#mapsvg-filters-tmpl-" + t + "-view").html()),
                };
            }
            else {
                this.templates = {
                    main: Handlebars.compile($$b("#mapsvg-data-tmpl-" + t + "-view").html()),
                };
            }
            this.inputs = {};
        }
        init() {
            this.setDomElements();
            this.setEventHandlers();
        }
        setDomElements() {
            this.domElements = {
                main: $$b(this.templates.main(this.getDataForTemplate()))[0],
            };
            $$b(this.domElements.main).data("formElement", this);
            this.addSelect2();
        }
        setEventHandlers() {
            const _this = this;
            if (this.formBuilder.editMode) {
                $$b(this.domElements.main).on("click", function () {
                    _this.events.trigger("click", _this, [_this]);
                });
            }
        }
        addSelect2() {
            if ($$b().mselect2) {
                $$b(this.domElements.main)
                    .find("select")
                    .css({ width: "100%", display: "block" })
                    .mselect2()
                    .on("select2:focus", function () {
                    $$b(this).mselect2("open");
                });
                $$b(this.domElements.main)
                    .find(".select2-selection--multiple .select2-search__field")
                    .css("width", "100%");
            }
        }
        setEditorEventHandlers() {
            const _this = this;
            $$b(this.domElements.edit).on("click", "button.mapsvg-remove", function () {
                $$b(_this.domElements.main).empty().remove();
                $$b(_this.domElements.edit).empty().remove();
                _this.events.trigger("delete", _this, [_this]);
            });
            $$b(this.domElements.edit).on("click", ".mapsvg-filter-insert-options", function () {
                const objType = _this.parameterName.split(".")[0];
                const fieldName = _this.parameterName.split(".")[1];
                let field;
                if (objType == "Object") {
                    field = _this.formBuilder.mapsvg.objectsRepository.getSchema().getField(fieldName);
                }
                else {
                    if (fieldName == "id") {
                        const options = [];
                        _this.formBuilder.mapsvg.regions.forEach(function (r) {
                            options.push({ label: r.id, value: r.id });
                        });
                        field = {
                            options: options,
                        };
                    }
                    else if (fieldName === "title") {
                        const options = [];
                        _this.formBuilder.mapsvg.regions.forEach(function (r) {
                            options.push({ label: r.title, value: r.title });
                        });
                        field = { options: options };
                    }
                    else {
                        field = _this.formBuilder.mapsvg.regionsRepository
                            .getSchema()
                            .getField(fieldName);
                    }
                }
                if ((field && field.options) || fieldName === "regions") {
                    let options;
                    if (fieldName == "regions") {
                        const _options = _this.formBuilder.mapsvg.regions.map((r) => {
                            return { id: r.id, title: r.title };
                        });
                        _options.sort(function (a, b) {
                            if (a.title < b.title)
                                return -1;
                            if (a.title > b.title)
                                return 1;
                            return 0;
                        });
                        options = _options.map(function (o) {
                            return (o.title || o.id) + ":" + o.id;
                        });
                    }
                    else {
                        options = field.options.map(function (o) {
                            return o.label + ":" + o.value;
                        });
                    }
                    $$b(this)
                        .closest(".form-group")
                        .find("textarea")
                        .val(options.join("\n"))
                        .trigger("change");
                }
            });
            $$b(this.domElements.edit).on("keyup change paste", "input, textarea, select", function () {
                const prop = $$b(this).attr("name");
                const array = $$b(this).data("array");
                if (_this.type === "status" && array) {
                    const param = $$b(this).data("param");
                    const index = $$b(this).closest("tr").index();
                    _this.options[index] = _this.options[index] || {
                        label: "",
                        value: "",
                        color: "",
                        disabled: false,
                    };
                    _this.options[index][param] = $$b(this).is(":checkbox")
                        ? $$b(this).prop("checked")
                        : $$b(this).val();
                    _this.redraw();
                }
                else if (_this.type === "distance" && array) {
                    const param = $$b(this).data("param");
                    const index = $$b(this).closest("tr").index();
                    if (!_this.options[index]) {
                        _this.options[index] = { value: "", default: false };
                    }
                    if (param === "default") {
                        _this.options.forEach(function (option) {
                            option.default = false;
                        });
                        _this.options[index].default = $$b(this).prop("checked");
                    }
                    else {
                        _this.options[index].value = $$b(this).val();
                    }
                    _this.redraw();
                }
                else if (prop == "label" || prop == "name") {
                    return false;
                }
                else {
                    let value;
                    value =
                        $$b(this).attr("type") == "checkbox" ? $$b(this).prop("checked") : $$b(this).val();
                    if ($$b(this).attr("type") == "radio") {
                        const name = $$b(this).attr("name");
                        value = $$b('input[name="' + name + '"]:checked').val();
                    }
                    _this.update(prop, value);
                }
            });
            $$b(this.domElements.edit).on("keyup change paste", 'input[name="label"]', function () {
                if (!_this.nameChanged) {
                    _this.label = $$b(this).val() + "";
                    if (_this.type != "region" && _this.type != "location" && _this.type != "title") {
                        let str = $$b(this).val() + "";
                        str = str.toLowerCase().replace(/ /g, "_").replace(/\W/g, "");
                        if (str.length < 64) {
                            $$b(_this.domElements.edit).find('input[name="name"]').val(str);
                        }
                        _this.name = str + "";
                    }
                    $$b(_this.domElements.main).find("label").first().html(_this.label);
                    if (!_this.filtersMode) {
                        $$b(_this.domElements.main)
                            .find("label")
                            .first()
                            .append('<div class="field-name">' + _this.name + "</div>");
                    }
                }
            });
            $$b(this.domElements.edit).on("keyup change paste", 'input[name="name"]', function (e) {
                if (e.target.value) {
                    if (e.target.value.match(/[^a-zA-Z0-9_]/g)) {
                        e.target.value = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
                        $$b(e.target).trigger("change");
                    }
                    if (e.target.value[0].match(/[^a-zA-Z_]/g)) {
                        e.target.value =
                            e.target.value[0].replace(/[^a-zA-Z_]/g, "") + e.target.value.slice(1);
                        $$b(e.target).trigger("change");
                    }
                }
                if (_this.type != "region")
                    _this.name = e.target.value;
                $$b(_this.domElements.main)
                    .find("label")
                    .html(_this.label + '<div class="field-name">' + _this.name + "</div>");
                _this.nameChanged = true;
            });
            $$b(this.domElements.edit).on("keyup change paste", 'textarea[name="help"]', function (e) {
                $$b(_this.domElements.main).find(".form-text").text(e.target.value);
            });
        }
        getEditor() {
            if (!this.filtersMode) {
                this.templates.edit =
                    this.templates.edit ||
                        Handlebars.compile($$b("#mapsvg-data-tmpl-" + this.type + "-control").html());
            }
            else {
                this.templates.edit =
                    this.templates.edit ||
                        Handlebars.compile($$b("#mapsvg-filters-tmpl-" + this.type + "-control").html());
            }
            this.domElements.edit = $$b("<div>" + this.templates.edit(this.getDataForTemplate()) + "</div>")[0];
            return this.domElements.edit;
        }
        destroyEditor() {
            $$b(this.domElements.edit).empty().remove();
        }
        initEditor() {
            $$b(this.domElements.edit).find("input").first().select();
            if ($$b().colorpicker) {
                $$b(this.domElements.edit)
                    .find(".cpicker")
                    .colorpicker()
                    .on("changeColor.colorpicker", function (event) {
                    const input = $$b(this).find("input");
                    if (input.val() == "")
                        $$b(this).find("i").css({ "background-color": "" });
                });
            }
            if ($$b().mselect2) {
                if (this.type !== "distance") {
                    $$b(this.domElements.edit)
                        .find("select")
                        .css({ width: "100%", display: "block" })
                        .mselect2();
                }
            }
            this.setEditorEventHandlers();
        }
        getSchema() {
            let data;
            data = {
                type: this.type,
                db_type: this.db_type,
                label: this.label,
                name: this.name,
                value: this.value,
                searchable: this.searchable,
                help: this.help,
                visible: this.visible === undefined ? true : this.visible,
                readonly: this.readonly,
                placeholder: this.placeholder,
                protected: this.protected,
                auto_increment: this.auto_increment,
                not_null: this.not_null,
            };
            if (this.options) {
                data.options = this.getSchemaFieldOptionsList();
            }
            if (this.filtersMode) {
                data.parameterName = this.parameterName;
                data.parameterNameShort = this.parameterName.split(".")[1];
            }
            return data;
        }
        getSchemaFieldOptionsList() {
            const options = [];
            this.options.forEach((option, index) => {
                if (this.options[index].value !== "") {
                    options.push(this.options[index]);
                }
            });
            return options;
        }
        getDataForTemplate() {
            const data = this.getSchema();
            data._name = data.name;
            if (this.namespace) {
                data.name = this.name.split("[")[0];
                let suffix = this.name.split("[")[1] || "";
                if (suffix)
                    suffix = "[" + suffix;
                data.name = this.namespace + "[" + data.name + "]" + suffix;
            }
            data.external = this.external;
            return data;
        }
        update(prop, value) {
            const _this = this;
            if (prop == "options") {
                const options = [];
                value = value.split("\n").forEach(function (row) {
                    row = row.trim().split(":");
                    if (_this.type == "checkbox" && row.length == 3) {
                        options.push({
                            label: row[0],
                            name: row[1],
                            value: row[2],
                        });
                    }
                    else if ((_this.type == "radio" ||
                        _this.type == "select" ||
                        _this.type == "checkboxes") &&
                        row.length == 2) {
                        options.push({
                            label: row[0],
                            value: row[1],
                        });
                    }
                });
                this.options = options;
            }
            else {
                this[prop] = value;
            }
            if (prop == "parameterName") {
                $$b(this.domElements.edit).find(".mapsvg-filter-param-name").text(value);
            }
        }
        redraw() {
            const newView = $$b(this.templates.main(this.getDataForTemplate()));
            $$b(this.domElements.main).html(newView.html());
            if ($$b().mselect2) {
                if (this.type !== "distance") {
                    $$b(this.domElements.main)
                        .find("select")
                        .css({ width: "100%", display: "block" })
                        .mselect2()
                        .on("select2:focus", function () {
                        $$b(this).mselect2("open");
                    });
                }
                else {
                    $$b(this.domElements.main)
                        .find("select")
                        .mselect2()
                        .on("select2:focus", function () {
                        $$b(this).mselect2("open");
                    });
                }
            }
        }
        redrawEditor() {
            if (this.domElements.edit) {
                $$b(this.domElements.edit).empty();
                $$b(this.domElements.edit).html("<div>" + this.templates.edit(this.getDataForTemplate()) + "</div>");
                this.initEditor();
            }
        }
        setOptions(options) {
            if (options) {
                this.options = [];
                this.optionsDict = {};
                options.forEach((value, key) => {
                    this.options.push(value);
                    this.optionsDict[key] = value;
                });
                return this.options;
            }
            else {
                return this.setOptions([
                    { label: "Option one", name: "option_one", value: 1 },
                    { label: "Option two", name: "option_two", value: 2 },
                ]);
            }
        }
        getData() {
            return { name: this.name, value: this.getValue() };
        }
        destroy() {
            if ($$b().mselect2) {
                const sel = $$b(this.domElements.main).find(".mapsvg-select2");
                if (sel.length) {
                    sel.mselect2("destroy");
                }
            }
        }
        show() {
            $$b(this.domElements.main).show();
        }
        hide() {
            $$b(this.domElements.main).hide();
        }
        setExternal(params) {
            this.external = params;
            if (typeof this.external.mapIsGeo !== "undefined") {
                this.mapIsGeo = this.external.mapIsGeo;
            }
            if (typeof this.external.editMode !== "undefined") {
                this.editMode = this.external.editMode;
            }
            if (typeof this.external.filtersMode !== "undefined") {
                this.filtersMode = this.external.filtersMode;
            }
            if (typeof this.external.namespace !== "undefined") {
                this.namespace = this.external.namespace;
            }
        }
        getValue() {
            return this.value;
        }
        setValue(value, updateInput = true) {
            this.value = value;
            if (updateInput) {
                this.setInputValue(value);
            }
        }
        setInputValue(value) {
            return;
        }
        triggerChanged() {
            this.events.trigger("changed", this, [this]);
        }
    }

    const $$c = jQuery;
    class CheckboxFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            if (typeof options.showAsSwitch === "undefined") {
                this.showAsSwitch = true;
            }
            else {
                this.showAsSwitch = options.showAsSwitch;
            }
            this.db_type = "tinyint(1)";
            this.checkboxLabel = options.checkboxLabel;
            this.checkboxValue = options.checkboxValue;
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.checkbox = $$c(this.domElements.main).find("input")[0];
            this.inputs.switch = $$c(this.domElements.main).find("input")[0];
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$c(this.inputs.checkbox).on("change", (e) => {
                this.setValue(e.target.checked, false);
                this.triggerChanged();
            });
        }
        setEditorEventHandlers() {
            super.setEditorEventHandlers();
            $$c(this.domElements.edit).on("change", "[name='showAsSwitch']", (e) => {
                if (this.showAsSwitch) {
                    $$c(this.domElements.main)
                        .find("[name='checkboxToSwitch']")
                        .addClass("form-switch form-switch-md");
                }
                if (!this.showAsSwitch) {
                    $$c(this.domElements.main)
                        .find("[name='checkboxToSwitch']")
                        .removeClass("form-switch form-switch-md");
                }
            });
            $$c(this.domElements.edit).on("keyup change paste", '[name="checkboxLabel"]', (e) => {
                $$c(this.domElements.main).find(".form-check-label").text(e.target.value);
            });
        }
        getSchema() {
            const schema = super.getSchema();
            if (this.checkboxLabel) {
                schema.checkboxLabel = this.checkboxLabel;
            }
            if (this.checkboxValue) {
                schema.checkboxValue = this.checkboxValue;
            }
            schema.showAsSwitch = this.showAsSwitch;
            return schema;
        }
        setInputValue(value) {
            this.inputs.checkbox.checked = value === true;
        }
    }

    const $$d = jQuery;
    class CheckboxesFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.db_type = "text";
            this.checkboxLabel = options.checkboxLabel;
            this.setOptions(options.options);
        }
        setDomElements() {
            super.setDomElements();
            this.$checkboxes = $$d(this.domElements.main).find('input[type="checkbox"]');
            this.setInputValue(this.value || []);
        }
        setEventHandlers() {
            super.setEventHandlers();
            this.$checkboxes.on("change", (e) => {
                const values = [];
                $$d(this.domElements.main)
                    .find("input:checked")
                    .each((i, el) => {
                    values.push(jQuery(el).attr("value"));
                });
                this.setValue(values, false);
                this.triggerChanged();
            });
        }
        setInputValue(values) {
            if (values === null) {
                $$d(this.domElements.main).find(`input`).prop("checked", false);
            }
            else {
                values.forEach((value) => {
                    $$d(this.domElements.main).find(`input[value="${value}"]`).prop("checked", true);
                });
            }
        }
    }

    const $$e = jQuery;
    class DateFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            if (this.formBuilder.admin) {
                this.languages = [
                    "en-GB",
                    "ar",
                    "az",
                    "bg",
                    "bs",
                    "ca",
                    "cs",
                    "cy",
                    "da",
                    "de",
                    "el",
                    "es",
                    "et",
                    "eu",
                    "fa",
                    "fi",
                    "fo",
                    "fr",
                    "gl",
                    "he",
                    "hr",
                    "hu",
                    "hy",
                    "id",
                    "is",
                    "it",
                    "ja",
                    "ka",
                    "kh",
                    "kk",
                    "kr",
                    "lt",
                    "lv",
                    "mk",
                    "ms",
                    "nb",
                    "nl",
                    "nl-BE",
                    "no",
                    "pl",
                    "pt-BR",
                    "pt",
                    "ro",
                    "rs",
                    "rs-latin",
                    "ru",
                    "sk",
                    "sl",
                    "sq",
                    "sr",
                    "sr-latin",
                    "sv",
                    "sw",
                    "th",
                    "tr",
                    "uk",
                    "vi",
                    "zh-CN",
                    "zh-TW",
                ];
            }
            this.db_type = "varchar(50)";
            this.language = options.language;
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.date = $$e(this.domElements.main).find("input")[0];
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$e(this.inputs.date).on("change", (e) => {
                this.setValue(e.target.value, false);
                this.triggerChanged();
            });
        }
        getSchema() {
            const schema = super.getSchema();
            schema.language = this.language;
            return schema;
        }
        getDataForTemplate() {
            const data = super.getDataForTemplate();
            if (this.formBuilder.admin)
                data.languages = this.languages;
            data.language = this.language;
            return data;
        }
    }

    const $$f = jQuery;
    class DistanceFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.name = "distance";
            this.label = this.label || (options.label === undefined ? "Search radius" : options.label);
            this.distanceControl = options.distanceControl || "select";
            this.distanceUnits = options.distanceUnits || "km";
            this.distanceUnitsLabel = options.distanceUnitsLabel || "km";
            this.fromLabel = options.fromLabel || "from";
            this.placeholder = options.placeholder;
            this.userLocationButton = options.userLocationButton || false;
            this.type = options.type;
            this.addressField = options.addressField || true;
            this.addressFieldPlaceholder = options.addressFieldPlaceholder || "Address";
            this.languages = [
                { value: "sq", label: "Albanian" },
                { value: "ar", label: "Arabic" },
                {
                    value: "eu",
                    label: "Basque",
                },
                { value: "be", label: "Belarusian" },
                { value: "bg", label: "Bulgarian" },
                {
                    value: "my",
                    label: "Burmese",
                },
                { value: "bn", label: "Bengali" },
                { value: "ca", label: "Catalan" },
                {
                    value: "zh-cn",
                    label: "Chinese (simplified)",
                },
                { value: "zh-tw", label: "Chinese (traditional)" },
                {
                    value: "hr",
                    label: "Croatian",
                },
                { value: "cs", label: "Czech" },
                { value: "da", label: "Danish" },
                {
                    value: "nl",
                    label: "Dutch",
                },
                { value: "en", label: "English" },
                {
                    value: "en-au",
                    label: "English (australian)",
                },
                { value: "en-gb", label: "English (great Britain)" },
                {
                    value: "fa",
                    label: "Farsi",
                },
                { value: "fi", label: "Finnish" },
                { value: "fil", label: "Filipino" },
                {
                    value: "fr",
                    label: "French",
                },
                { value: "gl", label: "Galician" },
                { value: "de", label: "German" },
                {
                    value: "el",
                    label: "Greek",
                },
                { value: "gu", label: "Gujarati" },
                { value: "iw", label: "Hebrew" },
                {
                    value: "hi",
                    label: "Hindi",
                },
                { value: "hu", label: "Hungarian" },
                { value: "id", label: "Indonesian" },
                {
                    value: "it",
                    label: "Italian",
                },
                { value: "ja", label: "Japanese" },
                { value: "kn", label: "Kannada" },
                {
                    value: "kk",
                    label: "Kazakh",
                },
                { value: "ko", label: "Korean" },
                { value: "ky", label: "Kyrgyz" },
                {
                    value: "lt",
                    label: "Lithuanian",
                },
                { value: "lv", label: "Latvian" },
                { value: "mk", label: "Macedonian" },
                {
                    value: "ml",
                    label: "Malayalam",
                },
                { value: "mr", label: "Marathi" },
                { value: "no", label: "Norwegian" },
                {
                    value: "pl",
                    label: "Polish",
                },
                { value: "pt", label: "Portuguese" },
                {
                    value: "pt-br",
                    label: "Portuguese (brazil)",
                },
                { value: "pt-pt", label: "Portuguese (portugal)" },
                {
                    value: "pa",
                    label: "Punjabi",
                },
                { value: "ro", label: "Romanian" },
                { value: "ru", label: "Russian" },
                {
                    value: "sr",
                    label: "Serbian",
                },
                { value: "sk", label: "Slovak" },
                { value: "sl", label: "Slovenian" },
                {
                    value: "es",
                    label: "Spanish",
                },
                { value: "sv", label: "Swedish" },
                { value: "tl", label: "Tagalog" },
                {
                    value: "ta",
                    label: "Tamil",
                },
                { value: "te", label: "Telugu" },
                { value: "th", label: "Thai" },
                {
                    value: "tr",
                    label: "Turkish",
                },
                { value: "uk", label: "Ukrainian" },
                { value: "uz", label: "Uzbek" },
                {
                    value: "vi",
                    label: "Vietnamese",
                },
            ];
            this.countries = MapSVG.countries;
            this.country = options.country;
            this.language = options.language;
            this.searchByZip = options.searchByZip;
            this.zipLength = parseInt(options.zipLength) || 5;
            this.userLocationButton = MapSVG.parseBoolean(options.userLocationButton);
            this.options = options.options || [
                { value: "10", default: true },
                { value: "30", default: false },
                { value: "50", default: false },
                { value: "100", default: false },
            ];
            let defOption;
            if (this.value) {
                this.options.forEach((option) => {
                    if (option.value === this.value.length) {
                        defOption = option;
                    }
                });
            }
            if (!defOption) {
                defOption = this.options.find(function (option) {
                    return option.default === true;
                });
            }
            if (!defOption) {
                defOption = this.options[0];
            }
            const defLengthOption = this.options.find((opt) => opt.selected === true);
            this.defaultLength = defOption.value;
            this.setDefaultValue();
        }
        setDefaultValue() {
            this.value = {
                units: this.distanceUnits,
                geoPoint: { lat: null, lng: null },
                length: this.defaultLength,
                address: "",
                country: this.country,
            };
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.units = ($$f(this.domElements.main).find('[name="distanceUnits"]')[0]);
            this.inputs.geoPoint = ($$f(this.domElements.main).find('[name="distanceGeoPoint"]')[0]);
            this.inputs.length = ($$f(this.domElements.main).find('[name="distanceLength"]')[0]);
            this.inputs.address = ($$f(this.domElements.main).find('[name="distance"]')[0]);
        }
        getSchema() {
            const schema = super.getSchema();
            schema.distanceControl = this.distanceControl;
            schema.distanceUnits = this.distanceUnits;
            schema.distanceUnitsLabel = this.distanceUnitsLabel;
            schema.fromLabel = this.fromLabel;
            schema.addressField = this.addressField;
            schema.addressFieldPlaceholder = this.addressFieldPlaceholder;
            schema.userLocationButton = this.userLocationButton;
            schema.placeholder = this.placeholder;
            schema.language = this.language;
            schema.country = this.country;
            schema.searchByZip = this.searchByZip;
            schema.zipLength = parseInt(this.zipLength + "");
            schema.userLocationButton = MapSVG.parseBoolean(this.userLocationButton);
            if (schema.distanceControl === "none") {
                schema.distanceDefault = schema.options.filter(function (o) {
                    return o.default;
                })[0].value;
            }
            schema.options.forEach(function (option, index) {
                if (schema.options[index].value === "") {
                    schema.options.splice(index, 1);
                }
                else {
                    schema.options[index].default = MapSVG.parseBoolean(schema.options[index].default);
                }
            });
            return schema;
        }
        getDataForTemplate() {
            const data = super.getDataForTemplate();
            if (this.formBuilder.admin) {
                data.languages = this.languages;
                data.countries = this.countries;
            }
            data.language = this.language;
            data.country = this.country;
            data.searchByZip = this.searchByZip;
            data.zipLength = this.zipLength;
            data.userLocationButton = MapSVG.parseBoolean(this.userLocationButton);
            return data;
        }
        destroy() {
            if ($$f().mselect2) {
                const sel = $$f(this.domElements.main).find(".mapsvg-select2");
                if (sel.length) {
                    sel.mselect2("destroy");
                }
            }
        }
        initEditor() {
            super.initEditor();
            this.mayBeAddDistanceRow();
            if ($$f().mselect2) {
                $$f(this.domElements.edit).find("select").mselect2();
            }
        }
        setEventHandlers() {
            super.setEventHandlers();
            const _this = this;
            $$f(this.domElements.edit).on("keyup change paste", ".mapsvg-edit-distance-row input", function () {
                _this.mayBeAddDistanceRow();
            });
            const server = new Server();
            const locations = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace("formatted_address"),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                remote: {
                    url: server.getUrl("geocoding") +
                        "?address=" +
                        (this.searchByZip === true ? "zip%20" : "") +
                        "%QUERY%&language=" +
                        this.language +
                        (this.country ? "&country=" + this.country : ""),
                    wildcard: "%QUERY%",
                    transform: function (response) {
                        if (response.error_message) {
                            alert(response.error_message);
                        }
                        return response.results;
                    },
                    rateLimitWait: 600,
                },
            });
            const thContainer = $$f(this.domElements.main).find(".typeahead");
            this.spinner = $$f("<span class='spinner-border spinner-border-sm'></span>")[0];
            if (this.searchByZip) {
                $$f(this.domElements.main).find(".mapsvg-distance-fields").addClass("search-by-zip");
                thContainer.on("change keyup", (e) => {
                    const zip = $$f(e.target).val().toString();
                    if (zip.length === _this.zipLength) {
                        $$f(this.spinner).appendTo($$f(e.target).closest(".distance-search-wrap"));
                        locations.search($$f(e.target).val(), (data) => this.handleAddressFieldChange(zip, data), (data) => this.handleAddressFieldChange(zip, data, true));
                    }
                });
            }
            else {
                const tH = thContainer
                    .typeahead({ minLength: 3 }, {
                    name: "mapsvg-addresses",
                    display: "formatted_address",
                    limit: 5,
                    async: true,
                    source: (query, sync, async) => {
                        const request = { address: query };
                        if (this.country) {
                            request.componentRestrictions = { country: this.country };
                        }
                        MapSVG.geocode(request, async);
                    },
                })
                    .on("typeahead:asyncrequest", (e) => {
                    $$f(this.spinner).appendTo($$f(e.target).closest(".twitter-typeahead"));
                })
                    .on("typeahead:asynccancel typeahead:asyncreceive", (e) => {
                    $$f(this.spinner).remove();
                });
                $$f(this.domElements.main).find(".mapsvg-distance-fields").removeClass("search-by-zip");
            }
            if (_this.userLocationButton) {
                const userLocationButton = $$f(this.domElements.main).find(".user-location-button");
                userLocationButton.on("click", () => {
                    _this.formBuilder.mapsvg.showUserLocation((location) => {
                        locations.search(location.geoPoint.lat + "," + location.geoPoint.lng, (data) => this.setAddressByUserLocation(data, location), (data) => this.setAddressByUserLocation(data, location));
                        this.setValue({ geoPoint: location.geoPoint });
                        this.triggerChanged();
                    });
                });
            }
            thContainer.on("change keyup", (e) => {
                const input = e.target;
                if (input.value === "" && this.getValue() !== null) {
                    this.setValue(null);
                    this.triggerChanged();
                }
            });
            thContainer.on("typeahead:select", (ev, item) => {
                this.setValue({
                    address: item.formatted_address,
                    geoPoint: item.geometry.location.toJSON(),
                });
                this.triggerChanged();
                thContainer.blur();
            });
            $$f(this.inputs.geoPoint).on("change", (e) => {
                const geoPoint = e.target.value.split(",").map((value) => parseFloat(value));
                this.setValue({ geoPoint: { lat: geoPoint[0], lng: geoPoint[1] } }, false);
                this.triggerChanged();
            });
            $$f(this.inputs.length).on("change", (e) => {
                this.setLength(parseInt(e.target.value), false);
                this.triggerChanged();
            });
        }
        setAddressByUserLocation(data, location) {
            if (data && data[0]) {
                this.setAddress(data[0].formatted_address);
            }
            else {
                this.setAddress(location.geoPoint.lat + "," + location.geoPoint.lng);
            }
        }
        handleAddressFieldChange(zip, data, removeSpinner = false) {
            if (removeSpinner) {
                $$f(this.spinner).remove();
            }
            if (data && data[0]) {
                this.setValue({ address: zip, geoPoint: data[0].geometry.location }, false);
                this.triggerChanged();
            }
        }
        addSelect2() {
            if ($$f().mselect2) {
                $$f(this.domElements.main)
                    .find("select")
                    .mselect2()
                    .on("select2:focus", function () {
                    $$f(this).mselect2("open");
                });
            }
        }
        mayBeAddDistanceRow() {
            const _this = this;
            const editDistanceRow = $$f($$f("#mapsvg-edit-distance-row").html());
            const z = $$f(_this.domElements.edit).find(".mapsvg-edit-distance-row:last-child input");
            if (z && z.last() && z.last().val() && z.last().val().toString().trim().length) {
                const newRow = editDistanceRow.clone();
                newRow.insertAfter($$f(_this.domElements.edit).find(".mapsvg-edit-distance-row:last-child"));
            }
            const rows = $$f(_this.domElements.edit).find(".mapsvg-edit-distance-row");
            const row1 = rows.eq(rows.length - 2);
            const row2 = rows.eq(rows.length - 1);
            if (row1.length &&
                row2.length &&
                !row1.find("input:eq(0)").val().toString().trim() &&
                !row2.find("input:eq(0)").val().toString().trim()) {
                row2.remove();
            }
        }
        setValue(value, updateInput = true) {
            if (value === null) {
                this.setGeoPoint(null);
                this.setAddress("");
            }
            else {
                for (const key in value) {
                    if (typeof this.value[key] !== undefined) {
                        const method = "set" + MapSVG.ucfirst(key);
                        if (typeof this[method] === "function") {
                            this[method](value[key], updateInput);
                        }
                    }
                }
            }
        }
        setGeoPoint(geoPoint, updateInput = true) {
            this.value.geoPoint = geoPoint === null ? { lat: null, lng: null } : geoPoint;
            if (updateInput) {
                this.setInputGeoPointValue(geoPoint);
            }
        }
        setInputGeoPointValue(geoPoint) {
            this.inputs.geoPoint.value = geoPoint ? geoPoint.lat + "," + geoPoint.lng : "";
        }
        setLength(length, updateInput = true) {
            this.value.length = parseInt(length.toString());
            this.defaultLength = this.value.length;
            if (updateInput) {
                this.setInputLengthValue(this.value.length);
            }
        }
        setInputLengthValue(length) {
            this.inputs.length.value = length.toString();
        }
        setAddress(address, updateInput = true) {
            this.value.address = address !== null ? address : "";
            if (updateInput) {
                this.setInputAddressValue(this.value.address);
            }
        }
        setInputAddressValue(address) {
            this.inputs.address.value = address;
        }
        getValue() {
            return this.value.geoPoint.lat === null ? null : this.value;
        }
    }

    const $$g = jQuery;
    class EmptyFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.readonly = true;
        }
    }

    class IdFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
        }
        getData() {
            return { name: "id", value: this.value };
        }
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var sortable_min = createCommonjsModule(function (module) {
    /**!
     * Sortable
     * @author	RubaXa   <trash@rubaxa.org>
     * @license MIT
     */

    (function sortableModule(factory) {

        {
            module.exports = factory();
        }
    })(function sortableFactory() {

        if (typeof window == "undefined" || !window.document) {
            return function sortableError() {
                throw new Error("Sortable.js requires a window with a document");
            };
        }

        var dragEl,
            parentEl,
            ghostEl,
            cloneEl,
            rootEl,
            nextEl,
            scrollEl,
            scrollParentEl,
            scrollCustomFn,
            lastEl,
            lastCSS,
            lastParentCSS,
            oldIndex,
            newIndex,
            activeGroup,
            putSortable,
            autoScroll = {},
            tapEvt,
            touchEvt,
            moved,
            /** @const */
            RSPACE = /\s+/g,
            expando = "Sortable" + new Date().getTime(),
            win = window,
            document = win.document,
            parseInt = win.parseInt,
            $ = win.jQuery || win.Zepto,
            Polymer = win.Polymer,
            supportDraggable = !!("draggable" in document.createElement("div")),
            supportCssPointerEvents = (function (el) {
                // false when IE11
                if (navigator.userAgent.match(/Trident.*rv[ :]?11\./)) {
                    return false;
                }
                el = document.createElement("x");
                el.style.cssText = "pointer-events:auto";
                return el.style.pointerEvents === "auto";
            })(),
            _silent = false,
            abs = Math.abs,
            min = Math.min,
            touchDragOverListeners = [],
            _autoScroll = _throttle(function (
                /**Event*/ evt,
                /**Object*/ options,
                /**HTMLElement*/ rootEl
            ) {
                // Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=505521
                if (rootEl && options.scroll) {
                    var el,
                        rect,
                        sens = options.scrollSensitivity,
                        speed = options.scrollSpeed,
                        x = evt.clientX,
                        y = evt.clientY,
                        winWidth = window.innerWidth,
                        winHeight = window.innerHeight,
                        vx,
                        vy,
                        scrollOffsetX,
                        scrollOffsetY;

                    // Delect scrollEl
                    if (scrollParentEl !== rootEl) {
                        scrollEl = options.scroll;
                        scrollParentEl = rootEl;
                        scrollCustomFn = options.scrollFn;

                        if (scrollEl === true) {
                            scrollEl = rootEl;

                            do {
                                if (
                                    scrollEl.offsetWidth < scrollEl.scrollWidth ||
                                    scrollEl.offsetHeight < scrollEl.scrollHeight
                                ) {
                                    break;
                                }
                                /* jshint boss:true */
                            } while ((scrollEl = scrollEl.parentNode));
                        }
                    }

                    if (scrollEl) {
                        el = scrollEl;
                        rect = scrollEl.getBoundingClientRect();
                        vx = (abs(rect.right - x) <= sens) - (abs(rect.left - x) <= sens);
                        vy = (abs(rect.bottom - y) <= sens) - (abs(rect.top - y) <= sens);
                    }

                    if (!(vx || vy)) {
                        vx = (winWidth - x <= sens) - (x <= sens);
                        vy = (winHeight - y <= sens) - (y <= sens);

                        /* jshint expr:true */
                        (vx || vy) && (el = win);
                    }

                    if (autoScroll.vx !== vx || autoScroll.vy !== vy || autoScroll.el !== el) {
                        autoScroll.el = el;
                        autoScroll.vx = vx;
                        autoScroll.vy = vy;

                        clearInterval(autoScroll.pid);

                        if (el) {
                            autoScroll.pid = setInterval(function () {
                                scrollOffsetY = vy ? vy * speed : 0;
                                scrollOffsetX = vx ? vx * speed : 0;

                                if ("function" === typeof scrollCustomFn) {
                                    return scrollCustomFn.call(
                                        _this,
                                        scrollOffsetX,
                                        scrollOffsetY,
                                        evt
                                    );
                                }

                                if (el === win) {
                                    win.scrollTo(
                                        win.pageXOffset + scrollOffsetX,
                                        win.pageYOffset + scrollOffsetY
                                    );
                                } else {
                                    el.scrollTop += scrollOffsetY;
                                    el.scrollLeft += scrollOffsetX;
                                }
                            }, 24);
                        }
                    }
                }
            },
            30),
            _prepareGroup = function (options) {
                function toFn(value, pull) {
                    if (value === void 0 || value === true) {
                        value = group.name;
                    }

                    if (typeof value === "function") {
                        return value;
                    } else {
                        return function (to, from) {
                            var fromGroup = from.options.group.name;

                            return pull
                                ? value
                                : value &&
                                      (value.join ? value.indexOf(fromGroup) > -1 : fromGroup == value);
                        };
                    }
                }

                var group = {};
                var originalGroup = options.group;

                if (!originalGroup || typeof originalGroup != "object") {
                    originalGroup = { name: originalGroup };
                }

                group.name = originalGroup.name;
                group.checkPull = toFn(originalGroup.pull, true);
                group.checkPut = toFn(originalGroup.put);

                options.group = group;
            };
        /**
         * @class  Sortable
         * @param  {HTMLElement}  el
         * @param  {Object}       [options]
         */
        function Sortable(el, options) {
            if (!(el && el.nodeType && el.nodeType === 1)) {
                throw "Sortable: `el` must be HTMLElement, and not " + {}.toString.call(el);
            }

            this.el = el; // root element
            this.options = options = _extend({}, options);

            // Export instance
            el[expando] = this;

            // Default options
            var defaults = {
                group: Math.random(),
                sort: true,
                disabled: false,
                store: null,
                handle: null,
                scroll: true,
                scrollSensitivity: 30,
                scrollSpeed: 10,
                draggable: /[uo]l/i.test(el.nodeName) ? "li" : ">*",
                ghostClass: "sortable-ghost",
                chosenClass: "sortable-chosen",
                dragClass: "sortable-drag",
                ignore: "a, img",
                filter: null,
                animation: 0,
                setData: function (dataTransfer, dragEl) {
                    dataTransfer.setData("Text", dragEl.textContent);
                },
                dropBubble: false,
                dragoverBubble: false,
                dataIdAttr: "data-id",
                delay: 0,
                forceFallback: false,
                fallbackClass: "sortable-fallback",
                fallbackOnBody: false,
                fallbackTolerance: 0,
                fallbackOffset: { x: 0, y: 0 },
            };

            // Set default options
            for (var name in defaults) {
                !(name in options) && (options[name] = defaults[name]);
            }

            _prepareGroup(options);

            // Bind all private methods
            for (var fn in this) {
                if (fn.charAt(0) === "_" && typeof this[fn] === "function") {
                    this[fn] = this[fn].bind(this);
                }
            }

            // Setup drag mode
            this.nativeDraggable = options.forceFallback ? false : supportDraggable;

            // Bind events
            _on(el, "mousedown", this._onTapStart);
            _on(el, "touchstart", this._onTapStart);

            if (this.nativeDraggable) {
                _on(el, "dragover", this);
                _on(el, "dragenter", this);
            }

            touchDragOverListeners.push(this._onDragOver);

            // Restore sorting
            options.store && this.sort(options.store.get(this));
        }

        Sortable.prototype = /** @lends Sortable.prototype */ {
            constructor: Sortable,

            _onTapStart: function (/** Event|TouchEvent */ evt) {
                if (evt.target.tagName == "i" || evt.target.tagName == "I") {
                    evt.target.click();
                    return;
                }
                var _this = this,
                    el = this.el,
                    options = this.options,
                    type = evt.type,
                    touch = evt.touches && evt.touches[0],
                    target = (touch || evt).target,
                    originalTarget = (evt.target.shadowRoot && evt.path[0]) || target,
                    filter = options.filter,
                    startIndex;

                // Don't trigger start event when an element is been dragged, otherwise the evt.oldindex always wrong when set option.group.
                if (dragEl) {
                    return;
                }

                if ((type === "mousedown" && evt.button !== 0) || options.disabled) {
                    return; // only left button or enabled
                }

                if (options.handle && !_closest(originalTarget, options.handle, el)) {
                    return;
                }

                target = _closest(target, options.draggable, el);

                if (!target) {
                    return;
                }

                // Get the index of the dragged element within its parent
                startIndex = _index(target, options.draggable);

                // Check filter
                if (typeof filter === "function") {
                    if (filter.call(this, evt, target, this)) {
                        _dispatchEvent(_this, originalTarget, "filter", target, el, startIndex);
                        evt.preventDefault();
                        return; // cancel dnd
                    }
                } else if (filter) {
                    filter = filter.split(",").some(function (criteria) {
                        criteria = _closest(originalTarget, criteria.trim(), el);

                        if (criteria) {
                            _dispatchEvent(_this, criteria, "filter", target, el, startIndex);
                            return true;
                        }
                    });

                    if (filter) {
                        evt.preventDefault();
                        return; // cancel dnd
                    }
                }

                // Prepare `dragstart`
                this._prepareDragStart(evt, touch, target, startIndex);
            },

            _prepareDragStart: function (
                /** Event */ evt,
                /** Touch */ touch,
                /** HTMLElement */ target,
                /** Number */ startIndex
            ) {
                var _this = this,
                    el = _this.el,
                    options = _this.options,
                    ownerDocument = el.ownerDocument,
                    dragStartFn;

                if (target && !dragEl && target.parentNode === el) {
                    tapEvt = evt;

                    rootEl = el;
                    dragEl = target;
                    parentEl = dragEl.parentNode;
                    nextEl = dragEl.nextSibling;
                    activeGroup = options.group;
                    oldIndex = startIndex;

                    this._lastX = (touch || evt).clientX;
                    this._lastY = (touch || evt).clientY;

                    dragEl.style["will-change"] = "transform";

                    dragStartFn = function () {
                        // Delayed drag has been triggered
                        // we can re-enable the events: touchmove/mousemove
                        _this._disableDelayedDrag();

                        // Make the element draggable
                        dragEl.draggable = _this.nativeDraggable;

                        // Chosen item
                        _toggleClass(dragEl, options.chosenClass, true);

                        // Bind the events: dragstart/dragend
                        _this._triggerDragStart(touch);

                        // Drag start event
                        _dispatchEvent(_this, rootEl, "choose", dragEl, rootEl, oldIndex);
                    };

                    // Disable "draggable"
                    options.ignore.split(",").forEach(function (criteria) {
                        _find(dragEl, criteria.trim(), _disableDraggable);
                    });

                    _on(ownerDocument, "mouseup", _this._onDrop);
                    _on(ownerDocument, "touchend", _this._onDrop);
                    _on(ownerDocument, "touchcancel", _this._onDrop);

                    if (options.delay) {
                        // If the user moves the pointer or let go the click or touch
                        // before the delay has been reached:
                        // disable the delayed drag
                        _on(ownerDocument, "mouseup", _this._disableDelayedDrag);
                        _on(ownerDocument, "touchend", _this._disableDelayedDrag);
                        _on(ownerDocument, "touchcancel", _this._disableDelayedDrag);
                        _on(ownerDocument, "mousemove", _this._disableDelayedDrag);
                        _on(ownerDocument, "touchmove", _this._disableDelayedDrag);

                        _this._dragStartTimer = setTimeout(dragStartFn, options.delay);
                    } else {
                        dragStartFn();
                    }
                }
            },

            _disableDelayedDrag: function () {
                var ownerDocument = this.el.ownerDocument;

                clearTimeout(this._dragStartTimer);
                _off(ownerDocument, "mouseup", this._disableDelayedDrag);
                _off(ownerDocument, "touchend", this._disableDelayedDrag);
                _off(ownerDocument, "touchcancel", this._disableDelayedDrag);
                _off(ownerDocument, "mousemove", this._disableDelayedDrag);
                _off(ownerDocument, "touchmove", this._disableDelayedDrag);
            },

            _triggerDragStart: function (/** Touch */ touch) {
                if (touch) {
                    // Touch device support
                    tapEvt = {
                        target: dragEl,
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                    };

                    this._onDragStart(tapEvt, "touch");
                } else if (!this.nativeDraggable) {
                    this._onDragStart(tapEvt, true);
                } else {
                    _on(dragEl, "dragend", this);
                    _on(rootEl, "dragstart", this._onDragStart);
                }

                try {
                    if (document.selection) {
                        // Timeout neccessary for IE9
                        setTimeout(function () {
                            document.selection.empty();
                        });
                    } else {
                        window.getSelection().removeAllRanges();
                    }
                } catch (err) {}
            },

            _dragStarted: function () {
                if (rootEl && dragEl) {
                    var options = this.options;

                    // Apply effect
                    _toggleClass(dragEl, options.ghostClass, true);
                    _toggleClass(dragEl, options.dragClass, false);

                    Sortable.active = this;

                    // Drag start event
                    _dispatchEvent(this, rootEl, "start", dragEl, rootEl, oldIndex);
                }
            },

            _emulateDragOver: function () {
                if (touchEvt) {
                    if (this._lastX === touchEvt.clientX && this._lastY === touchEvt.clientY) {
                        return;
                    }

                    this._lastX = touchEvt.clientX;
                    this._lastY = touchEvt.clientY;

                    if (!supportCssPointerEvents) {
                        _css(ghostEl, "display", "none");
                    }

                    var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY),
                        parent = target,
                        i = touchDragOverListeners.length;

                    if (parent) {
                        do {
                            if (parent[expando]) {
                                while (i--) {
                                    touchDragOverListeners[i]({
                                        clientX: touchEvt.clientX,
                                        clientY: touchEvt.clientY,
                                        target: target,
                                        rootEl: parent,
                                    });
                                }

                                break;
                            }

                            target = parent; // store last element
                        } while (
                            /* jshint boss:true */
                            (parent = parent.parentNode)
                        );
                    }

                    if (!supportCssPointerEvents) {
                        _css(ghostEl, "display", "");
                    }
                }
            },

            _onTouchMove: function (/**TouchEvent*/ evt) {
                if (tapEvt) {
                    var options = this.options,
                        fallbackTolerance = options.fallbackTolerance,
                        fallbackOffset = options.fallbackOffset,
                        touch = evt.touches ? evt.touches[0] : evt,
                        dx = touch.clientX - tapEvt.clientX + fallbackOffset.x,
                        dy = touch.clientY - tapEvt.clientY + fallbackOffset.y,
                        translate3d = evt.touches
                            ? "translate3d(" + dx + "px," + dy + "px,0)"
                            : "translate(" + dx + "px," + dy + "px)";

                    // only set the status to dragging, when we are actually dragging
                    if (!Sortable.active) {
                        if (
                            fallbackTolerance &&
                            min(abs(touch.clientX - this._lastX), abs(touch.clientY - this._lastY)) <
                                fallbackTolerance
                        ) {
                            return;
                        }

                        this._dragStarted();
                    }

                    // as well as creating the ghost element on the document body
                    this._appendGhost();

                    moved = true;
                    touchEvt = touch;

                    _css(ghostEl, "webkitTransform", translate3d);
                    _css(ghostEl, "mozTransform", translate3d);
                    _css(ghostEl, "msTransform", translate3d);
                    _css(ghostEl, "transform", translate3d);

                    evt.preventDefault();
                }
            },

            _appendGhost: function () {
                if (!ghostEl) {
                    var rect = dragEl.getBoundingClientRect(),
                        css = _css(dragEl),
                        options = this.options,
                        ghostRect;

                    ghostEl = dragEl.cloneNode(true);

                    _toggleClass(ghostEl, options.ghostClass, false);
                    _toggleClass(ghostEl, options.fallbackClass, true);
                    _toggleClass(ghostEl, options.dragClass, true);

                    _css(ghostEl, "top", rect.top - parseInt(css.marginTop, 10));
                    _css(ghostEl, "left", rect.left - parseInt(css.marginLeft, 10));
                    _css(ghostEl, "width", rect.width);
                    _css(ghostEl, "height", rect.height);
                    _css(ghostEl, "opacity", "0.8");
                    _css(ghostEl, "position", "fixed");
                    _css(ghostEl, "zIndex", "100000");
                    _css(ghostEl, "pointerEvents", "none");

                    (options.fallbackOnBody && document.body.appendChild(ghostEl)) ||
                        rootEl.appendChild(ghostEl);

                    // Fixing dimensions.
                    ghostRect = ghostEl.getBoundingClientRect();
                    _css(ghostEl, "width", rect.width * 2 - ghostRect.width);
                    _css(ghostEl, "height", rect.height * 2 - ghostRect.height);
                }
            },

            _onDragStart: function (/**Event*/ evt, /**boolean*/ useFallback) {
                var dataTransfer = evt.dataTransfer,
                    options = this.options;

                this._offUpEvents();

                if (activeGroup.checkPull(this, this, dragEl, evt) == "clone") {
                    cloneEl = _clone(dragEl);
                    _css(cloneEl, "display", "none");
                    rootEl.insertBefore(cloneEl, dragEl);
                    _dispatchEvent(this, rootEl, "clone", dragEl);
                }

                _toggleClass(dragEl, options.dragClass, true);

                if (useFallback) {
                    if (useFallback === "touch") {
                        // Bind touch events
                        _on(document, "touchmove", this._onTouchMove);
                        _on(document, "touchend", this._onDrop);
                        _on(document, "touchcancel", this._onDrop);
                    } else {
                        // Old brwoser
                        _on(document, "mousemove", this._onTouchMove);
                        _on(document, "mouseup", this._onDrop);
                    }

                    this._loopId = setInterval(this._emulateDragOver, 50);
                } else {
                    if (dataTransfer) {
                        dataTransfer.effectAllowed = "move";
                        options.setData && options.setData.call(this, dataTransfer, dragEl);
                    }

                    _on(document, "drop", this);
                    setTimeout(this._dragStarted, 0);
                }
            },

            _onDragOver: function (/**Event*/ evt) {
                var el = this.el,
                    target,
                    dragRect,
                    targetRect,
                    revert,
                    options = this.options,
                    group = options.group,
                    activeSortable = Sortable.active,
                    isOwner = activeGroup === group,
                    canSort = options.sort;

                if (evt.preventDefault !== void 0) {
                    evt.preventDefault();
                    !options.dragoverBubble && evt.stopPropagation();
                }

                moved = true;

                if (
                    activeGroup &&
                    !options.disabled &&
                    (isOwner
                        ? canSort || (revert = !rootEl.contains(dragEl)) // Reverting item into the original list
                        : putSortable === this ||
                          (activeGroup.checkPull(this, activeSortable, dragEl, evt) &&
                              group.checkPut(this, activeSortable, dragEl, evt))) &&
                    (evt.rootEl === void 0 || evt.rootEl === this.el) // touch fallback
                ) {
                    // Smart auto-scrolling
                    _autoScroll(evt, options, this.el);

                    if (_silent) {
                        return;
                    }

                    target = _closest(evt.target, options.draggable, el);
                    dragRect = dragEl.getBoundingClientRect();
                    putSortable = this;

                    if (revert) {
                        _cloneHide(true);
                        parentEl = rootEl; // actualization

                        if (cloneEl || nextEl) {
                            rootEl.insertBefore(dragEl, cloneEl || nextEl);
                        } else if (!canSort) {
                            rootEl.appendChild(dragEl);
                        }

                        return;
                    }

                    if (
                        el.children.length === 0 ||
                        el.children[0] === ghostEl ||
                        (el === evt.target && (target = _ghostIsLast(el, evt)))
                    ) {
                        if (target) {
                            if (target.animated) {
                                return;
                            }

                            targetRect = target.getBoundingClientRect();
                        }

                        _cloneHide(isOwner);

                        if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt) !== false) {
                            if (!dragEl.contains(el)) {
                                el.appendChild(dragEl);
                                parentEl = el; // actualization
                            }

                            this._animate(dragRect, dragEl);
                            target && this._animate(targetRect, target);
                        }
                    } else if (
                        target &&
                        !target.animated &&
                        target !== dragEl &&
                        target.parentNode[expando] !== void 0
                    ) {
                        if (lastEl !== target) {
                            lastEl = target;
                            lastCSS = _css(target);
                            lastParentCSS = _css(target.parentNode);
                        }

                        targetRect = target.getBoundingClientRect();

                        var width = targetRect.right - targetRect.left,
                            height = targetRect.bottom - targetRect.top,
                            floating =
                                /left|right|inline/.test(lastCSS.cssFloat + lastCSS.display) ||
                                (lastParentCSS.display == "flex" &&
                                    lastParentCSS["flex-direction"].indexOf("row") === 0),
                            isWide = target.offsetWidth > dragEl.offsetWidth,
                            isLong = target.offsetHeight > dragEl.offsetHeight,
                            halfway =
                                (floating
                                    ? (evt.clientX - targetRect.left) / width
                                    : (evt.clientY - targetRect.top) / height) > 0.5,
                            nextSibling = target.nextElementSibling,
                            moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt),
                            after;

                        if (moveVector !== false) {
                            _silent = true;
                            setTimeout(_unsilent, 30);

                            _cloneHide(isOwner);

                            if (moveVector === 1 || moveVector === -1) {
                                after = moveVector === 1;
                            } else if (floating) {
                                var elTop = dragEl.offsetTop,
                                    tgTop = target.offsetTop;

                                if (elTop === tgTop) {
                                    after =
                                        (target.previousElementSibling === dragEl && !isWide) ||
                                        (halfway && isWide);
                                } else if (
                                    target.previousElementSibling === dragEl ||
                                    dragEl.previousElementSibling === target
                                ) {
                                    after = (evt.clientY - targetRect.top) / height > 0.5;
                                } else {
                                    after = tgTop > elTop;
                                }
                            } else {
                                after = (nextSibling !== dragEl && !isLong) || (halfway && isLong);
                            }

                            if (!dragEl.contains(el)) {
                                if (after && !nextSibling) {
                                    el.appendChild(dragEl);
                                } else {
                                    target.parentNode.insertBefore(
                                        dragEl,
                                        after ? nextSibling : target
                                    );
                                }
                            }

                            parentEl = dragEl.parentNode; // actualization

                            this._animate(dragRect, dragEl);
                            this._animate(targetRect, target);
                        }
                    }
                }
            },

            _animate: function (prevRect, target) {
                var ms = this.options.animation;

                if (ms) {
                    var currentRect = target.getBoundingClientRect();

                    _css(target, "transition", "none");
                    _css(
                        target,
                        "transform",
                        "translate3d(" +
                            (prevRect.left - currentRect.left) +
                            "px," +
                            (prevRect.top - currentRect.top) +
                            "px,0)"
                    );

                    target.offsetWidth; // repaint

                    _css(target, "transition", "all " + ms + "ms");
                    _css(target, "transform", "translate3d(0,0,0)");

                    clearTimeout(target.animated);
                    target.animated = setTimeout(function () {
                        _css(target, "transition", "");
                        _css(target, "transform", "");
                        target.animated = false;
                    }, ms);
                }
            },

            _offUpEvents: function () {
                var ownerDocument = this.el.ownerDocument;

                _off(document, "touchmove", this._onTouchMove);
                _off(ownerDocument, "mouseup", this._onDrop);
                _off(ownerDocument, "touchend", this._onDrop);
                _off(ownerDocument, "touchcancel", this._onDrop);
            },

            _onDrop: function (/**Event*/ evt) {
                var el = this.el,
                    options = this.options;

                clearInterval(this._loopId);
                clearInterval(autoScroll.pid);
                clearTimeout(this._dragStartTimer);

                // Unbind events
                _off(document, "mousemove", this._onTouchMove);

                if (this.nativeDraggable) {
                    _off(document, "drop", this);
                    _off(el, "dragstart", this._onDragStart);
                }

                this._offUpEvents();

                if (evt) {
                    if (moved) {
                        evt.preventDefault();
                        !options.dropBubble && evt.stopPropagation();
                    }

                    ghostEl && ghostEl.parentNode.removeChild(ghostEl);

                    if (dragEl) {
                        if (this.nativeDraggable) {
                            _off(dragEl, "dragend", this);
                        }

                        _disableDraggable(dragEl);
                        dragEl.style["will-change"] = "";

                        // Remove class's
                        _toggleClass(dragEl, this.options.ghostClass, false);
                        _toggleClass(dragEl, this.options.chosenClass, false);

                        if (rootEl !== parentEl) {
                            newIndex = _index(dragEl, options.draggable);

                            if (newIndex >= 0) {
                                // Add event
                                _dispatchEvent(
                                    null,
                                    parentEl,
                                    "add",
                                    dragEl,
                                    rootEl,
                                    oldIndex,
                                    newIndex
                                );

                                // Remove event
                                _dispatchEvent(
                                    this,
                                    rootEl,
                                    "remove",
                                    dragEl,
                                    rootEl,
                                    oldIndex,
                                    newIndex
                                );

                                // drag from one list and drop into another
                                _dispatchEvent(
                                    null,
                                    parentEl,
                                    "sort",
                                    dragEl,
                                    rootEl,
                                    oldIndex,
                                    newIndex
                                );
                                _dispatchEvent(
                                    this,
                                    rootEl,
                                    "sort",
                                    dragEl,
                                    rootEl,
                                    oldIndex,
                                    newIndex
                                );
                            }
                        } else {
                            // Remove clone
                            cloneEl && cloneEl.parentNode.removeChild(cloneEl);

                            if (dragEl.nextSibling !== nextEl) {
                                // Get the index of the dragged element within its parent
                                newIndex = _index(dragEl, options.draggable);

                                if (newIndex >= 0) {
                                    // drag & drop within the same list
                                    _dispatchEvent(
                                        this,
                                        rootEl,
                                        "update",
                                        dragEl,
                                        rootEl,
                                        oldIndex,
                                        newIndex
                                    );
                                    _dispatchEvent(
                                        this,
                                        rootEl,
                                        "sort",
                                        dragEl,
                                        rootEl,
                                        oldIndex,
                                        newIndex
                                    );
                                }
                            }
                        }

                        if (Sortable.active) {
                            /* jshint eqnull:true */
                            if (newIndex == null || newIndex === -1) {
                                newIndex = oldIndex;
                            }

                            _dispatchEvent(this, rootEl, "end", dragEl, rootEl, oldIndex, newIndex);

                            // Save sorting
                            this.save();
                        }
                    }
                }

                this._nulling();
            },

            _nulling: function () {
                rootEl = dragEl = parentEl = ghostEl = nextEl = cloneEl = scrollEl = scrollParentEl = tapEvt = touchEvt = moved = newIndex = lastEl = lastCSS = putSortable = activeGroup = Sortable.active = null;
            },

            handleEvent: function (/**Event*/ evt) {
                var type = evt.type;

                if (type === "dragover" || type === "dragenter") {
                    if (dragEl) {
                        this._onDragOver(evt);
                        _globalDragOver(evt);
                    }
                } else if (type === "drop" || type === "dragend") {
                    this._onDrop(evt);
                }
            },

            /**
             * Serializes the item into an array of string.
             * @returns {String[]}
             */
            toArray: function () {
                var order = [],
                    el,
                    children = this.el.children,
                    i = 0,
                    n = children.length,
                    options = this.options;

                for (; i < n; i++) {
                    el = children[i];
                    if (_closest(el, options.draggable, this.el)) {
                        order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
                    }
                }

                return order;
            },

            /**
             * Sorts the elements according to the array.
             * @param  {String[]}  order  order of the items
             */
            sort: function (order) {
                var items = {},
                    rootEl = this.el;

                this.toArray().forEach(function (id, i) {
                    var el = rootEl.children[i];

                    if (_closest(el, this.options.draggable, rootEl)) {
                        items[id] = el;
                    }
                }, this);

                order.forEach(function (id) {
                    if (items[id]) {
                        rootEl.removeChild(items[id]);
                        rootEl.appendChild(items[id]);
                    }
                });
            },

            /**
             * Save the current sorting
             */
            save: function () {
                var store = this.options.store;
                store && store.set(this);
            },

            /**
             * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
             * @param   {HTMLElement}  el
             * @param   {String}       [selector]  default: `options.draggable`
             * @returns {HTMLElement|null}
             */
            closest: function (el, selector) {
                return _closest(el, selector || this.options.draggable, this.el);
            },

            /**
             * Set/get option
             * @param   {string} name
             * @param   {*}      [value]
             * @returns {*}
             */
            option: function (name, value) {
                var options = this.options;

                if (value === void 0) {
                    return options[name];
                } else {
                    options[name] = value;

                    if (name === "group") {
                        _prepareGroup(options);
                    }
                }
            },

            /**
             * Destroy
             */
            destroy: function () {
                var el = this.el;

                el[expando] = null;

                _off(el, "mousedown", this._onTapStart);
                _off(el, "touchstart", this._onTapStart);

                if (this.nativeDraggable) {
                    _off(el, "dragover", this);
                    _off(el, "dragenter", this);
                }

                // Remove draggable attributes
                Array.prototype.forEach.call(el.querySelectorAll("[draggable]"), function (el) {
                    el.removeAttribute("draggable");
                });

                touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1);

                this._onDrop();

                this.el = el = null;
            },
        };

        function _cloneHide(state) {
            if (cloneEl && cloneEl.state !== state) {
                _css(cloneEl, "display", state ? "none" : "");
                !state && cloneEl.state && rootEl.insertBefore(cloneEl, dragEl);
                cloneEl.state = state;
            }
        }

        function _closest(/**HTMLElement*/ el, /**String*/ selector, /**HTMLElement*/ ctx) {
            if (el) {
                ctx = ctx || document;

                do {
                    if ((selector === ">*" && el.parentNode === ctx) || _matches(el, selector)) {
                        return el;
                    }
                    /* jshint boss:true */
                } while ((el = _getParentOrHost(el)));
            }

            return null;
        }

        function _getParentOrHost(el) {
            var parent = el.host;

            return parent && parent.nodeType ? parent : el.parentNode;
        }

        function _globalDragOver(/**Event*/ evt) {
            if (evt.dataTransfer) {
                evt.dataTransfer.dropEffect = "move";
            }
            evt.preventDefault();
        }

        function _on(el, event, fn) {
            el.addEventListener(event, fn, false);
        }

        function _off(el, event, fn) {
            el.removeEventListener(event, fn, false);
        }

        function _toggleClass(el, name, state) {
            if (el) {
                if (el.classList) {
                    el.classList[state ? "add" : "remove"](name);
                } else {
                    var className = (" " + el.className + " ")
                        .replace(RSPACE, " ")
                        .replace(" " + name + " ", " ");
                    el.className = (className + (state ? " " + name : "")).replace(RSPACE, " ");
                }
            }
        }

        function _css(el, prop, val) {
            var style = el && el.style;

            if (style) {
                if (val === void 0) {
                    if (document.defaultView && document.defaultView.getComputedStyle) {
                        val = document.defaultView.getComputedStyle(el, "");
                    } else if (el.currentStyle) {
                        val = el.currentStyle;
                    }

                    return prop === void 0 ? val : val[prop];
                } else {
                    if (!(prop in style)) {
                        prop = "-webkit-" + prop;
                    }

                    style[prop] = val + (typeof val === "string" ? "" : "px");
                }
            }
        }

        function _find(ctx, tagName, iterator) {
            if (ctx) {
                var list = ctx.getElementsByTagName(tagName),
                    i = 0,
                    n = list.length;

                if (iterator) {
                    for (; i < n; i++) {
                        iterator(list[i], i);
                    }
                }

                return list;
            }

            return [];
        }

        function _dispatchEvent(sortable, rootEl, name, targetEl, fromEl, startIndex, newIndex) {
            sortable = sortable || rootEl[expando];

            var evt = document.createEvent("Event"),
                options = sortable.options,
                onName = "on" + name.charAt(0).toUpperCase() + name.substr(1);

            evt.initEvent(name, true, true);

            evt.to = rootEl;
            evt.from = fromEl || rootEl;
            evt.item = targetEl || rootEl;
            evt.clone = cloneEl;

            evt.oldIndex = startIndex;
            evt.newIndex = newIndex;

            rootEl.dispatchEvent(evt);

            if (options[onName]) {
                options[onName].call(sortable, evt);
            }
        }

        function _onMove(fromEl, toEl, dragEl, dragRect, targetEl, targetRect, originalEvt) {
            var evt,
                sortable = fromEl[expando],
                onMoveFn = sortable.options.onMove,
                retVal;

            evt = document.createEvent("Event");
            evt.initEvent("move", true, true);

            evt.to = toEl;
            evt.from = fromEl;
            evt.dragged = dragEl;
            evt.draggedRect = dragRect;
            evt.related = targetEl || toEl;
            evt.relatedRect = targetRect || toEl.getBoundingClientRect();

            fromEl.dispatchEvent(evt);

            if (onMoveFn) {
                retVal = onMoveFn.call(sortable, evt, originalEvt);
            }

            return retVal;
        }

        function _disableDraggable(el) {
            el.draggable = false;
        }

        function _unsilent() {
            _silent = false;
        }

        /** @returns {HTMLElement|false} */
        function _ghostIsLast(el, evt) {
            var lastEl = el.lastElementChild,
                rect = lastEl.getBoundingClientRect();

            // 5 — min delta
            // abs — нельзя добавлять, а то глюки при наведении сверху
            return (
                (evt.clientY - (rect.top + rect.height) > 5 ||
                    evt.clientX - (rect.right + rect.width) > 5) &&
                lastEl
            );
        }

        /**
         * Generate id
         * @param   {HTMLElement} el
         * @returns {String}
         * @private
         */
        function _generateId(el) {
            var str = el.tagName + el.className + el.src + el.href + el.textContent,
                i = str.length,
                sum = 0;

            while (i--) {
                sum += str.charCodeAt(i);
            }

            return sum.toString(36);
        }

        /**
         * Returns the index of an element within its parent for a selected set of
         * elements
         * @param  {HTMLElement} el
         * @param  {selector} selector
         * @return {number}
         */
        function _index(el, selector) {
            var index = 0;

            if (!el || !el.parentNode) {
                return -1;
            }

            while (el && (el = el.previousElementSibling)) {
                if (
                    el.nodeName.toUpperCase() !== "TEMPLATE" &&
                    (selector === ">*" || _matches(el, selector))
                ) {
                    index++;
                }
            }

            return index;
        }

        function _matches(/**HTMLElement*/ el, /**String*/ selector) {
            if (el) {
                selector = selector.split(".");

                var tag = selector.shift().toUpperCase(),
                    re = new RegExp("\\s(" + selector.join("|") + ")(?=\\s)", "g");

                return (
                    (tag === "" || el.nodeName.toUpperCase() == tag) &&
                    (!selector.length ||
                        ((" " + el.className + " ").match(re) || []).length == selector.length)
                );
            }

            return false;
        }

        function _throttle(callback, ms) {
            var args, _this;

            return function () {
                if (args === void 0) {
                    args = arguments;
                    _this = this;

                    setTimeout(function () {
                        if (args.length === 1) {
                            callback.call(_this, args[0]);
                        } else {
                            callback.apply(_this, args);
                        }

                        args = void 0;
                    }, ms);
                }
            };
        }

        function _extend(dst, src) {
            if (dst && src) {
                for (var key in src) {
                    if (src.hasOwnProperty(key)) {
                        dst[key] = src[key];
                    }
                }
            }

            return dst;
        }

        function _clone(el) {
            return $
                ? $(el).clone(true)[0]
                : Polymer && Polymer.dom
                ? Polymer.dom(el).cloneNode(true)
                : el.cloneNode(true);
        }

        // Export utils
        Sortable.utils = {
            on: _on,
            off: _off,
            css: _css,
            find: _find,
            is: function (el, selector) {
                return !!_closest(el, selector, el);
            },
            extend: _extend,
            throttle: _throttle,
            closest: _closest,
            toggleClass: _toggleClass,
            clone: _clone,
            index: _index,
        };

        /**
         * Create sortable instance
         * @param {HTMLElement}  el
         * @param {Object}      [options]
         */
        Sortable.create = function (el, options) {
            return new Sortable(el, options);
        };

        // Export
        Sortable.version = "1.4.2";
        return Sortable;
    });
    });

    const $$h = jQuery;
    class ImagesFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.searchType = options.searchType || "fulltext";
            this.mediaUploader = external.mediaUploader;
            this.button_text = options.button_text || "Browse...";
            this.db_type = "text";
            this.label = options.label || "Images";
            this.name = options.name || "images";
            this.images = this.value || [];
            this.value = JSON.stringify(this.value);
        }
        init() {
            super.init();
            this.redrawImages();
        }
        setDomElements() {
            super.setDomElements();
        }
        getData() {
            this.updateData();
            return { name: this.name, value: this.images };
        }
        getSchema() {
            const schema = super.getSchema();
            schema.button_text = this.button_text;
            return schema;
        }
        updateData() {
            const newListOfImages = [];
            $$h(this.domElements.main)
                .find(".mapsvg-thumbnail-wrap")
                .each(function (index, el) {
                const imageData = $$h(el).data("image");
                newListOfImages.push(imageData);
            });
            this.images = newListOfImages;
            this.value = JSON.stringify(this.images);
            $$h(this.domElements.main).find("input").val(this.value);
        }
        setEventHandlers() {
            super.setEventHandlers();
            if (this.formBuilder.editMode) {
                return;
            }
            const _this = this;
            const imageDOM = $$h(this.domElements.main).find(".mapsvg-data-images");
            this.external.mediaUploader.on("select", () => {
                if (_this.formBuilder.mediaUploaderisOpenedFor !== _this)
                    return false;
                const attachments = _this.external.mediaUploader.state().get("selection").toJSON();
                attachments.forEach(function (img) {
                    const image = { sizes: {} };
                    for (const type in img.sizes) {
                        image[type] = img.sizes[type].url
                            .replace("http://", "//")
                            .replace("https://", "//");
                        image.sizes[type] = {
                            width: img.sizes[type].width,
                            height: img.sizes[type].height,
                        };
                    }
                    if (!image.thumbnail) {
                        image.thumbnail = image.full;
                        image.sizes.thumbnail = {
                            width: img.sizes.full.width,
                            height: img.sizes.full.height,
                        };
                    }
                    if (!image.medium) {
                        image.medium = image.full;
                        image.sizes.medium = {
                            width: img.sizes.full.width,
                            height: img.sizes.full.height,
                        };
                    }
                    image.caption = img.caption;
                    image.description = img.description;
                    _this.images.push(image);
                });
                this.setValue(this.images);
                _this.redrawImages();
            });
            $$h(_this.domElements.main).on("click", ".mapsvg-upload-image", function (e) {
                e.preventDefault();
                _this.formBuilder.mediaUploaderisOpenedFor = _this;
                _this.external.mediaUploader.open();
            });
            $$h(_this.domElements.main).on("click", ".mapsvg-image-delete", function (e) {
                e.preventDefault();
                $$h(this).closest(".mapsvg-thumbnail-wrap").remove();
                _this.updateData();
            });
            _this.sortable = new sortable_min(imageDOM[0], {
                animation: 150,
                onStart: function () {
                    $$h(_this.domElements.main).addClass("sorting");
                },
                onEnd: function (evt) {
                    _this.images = [];
                    $$h(_this.domElements.main)
                        .find("img")
                        .each(function (i, image) {
                        _this.images.push($$h(image).data("image"));
                    });
                    this.value = JSON.stringify(_this.images);
                    $$h(_this.domElements.main).find("input").val(this.value);
                    $$h(_this.domElements.main).removeClass("sorting");
                },
            });
        }
        redrawImages() {
            const imageDOM = $$h(this.domElements.main).find(".mapsvg-data-images");
            imageDOM.empty();
            this.images &&
                this.images.forEach(function (image) {
                    const img = $$h('<img class="mapsvg-data-thumbnail" />')
                        .attr("src", image.thumbnail)
                        .data("image", image);
                    const imgContainer = $$h('<div class="mapsvg-thumbnail-wrap"></div>').data("image", image);
                    imgContainer.append(img);
                    imgContainer.append('<i class="mfa mfa-times  mapsvg-image-delete"></i>');
                    imageDOM.append(imgContainer);
                });
            $$h(this.domElements.main).find("input").val(this.value);
        }
        destroy() {
            super.destroy();
            this.external.mediaUploader.off("select");
        }
    }

    const $$i = jQuery;
    class LocationFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.label = this.label || (options.label === undefined ? "Location" : options.label);
            this.name = "location";
            this.db_type = "text";
            this.languages = [
                { value: "sq", label: "Albanian" },
                { value: "ar", label: "Arabic" },
                {
                    value: "eu",
                    label: "Basque",
                },
                { value: "be", label: "Belarusian" },
                { value: "bg", label: "Bulgarian" },
                {
                    value: "my",
                    label: "Burmese",
                },
                { value: "bn", label: "Bengali" },
                { value: "ca", label: "Catalan" },
                {
                    value: "zh-cn",
                    label: "Chinese (simplified)",
                },
                { value: "zh-tw", label: "Chinese (traditional)" },
                {
                    value: "hr",
                    label: "Croatian",
                },
                { value: "cs", label: "Czech" },
                { value: "da", label: "Danish" },
                {
                    value: "nl",
                    label: "Dutch",
                },
                { value: "en", label: "English" },
                {
                    value: "en-au",
                    label: "English (australian)",
                },
                { value: "en-gb", label: "English (great Britain)" },
                {
                    value: "fa",
                    label: "Farsi",
                },
                { value: "fi", label: "Finnish" },
                { value: "fil", label: "Filipino" },
                {
                    value: "fr",
                    label: "French",
                },
                { value: "gl", label: "Galician" },
                { value: "de", label: "German" },
                {
                    value: "el",
                    label: "Greek",
                },
                { value: "gu", label: "Gujarati" },
                { value: "iw", label: "Hebrew" },
                {
                    value: "hi",
                    label: "Hindi",
                },
                { value: "hu", label: "Hungarian" },
                { value: "id", label: "Indonesian" },
                {
                    value: "it",
                    label: "Italian",
                },
                { value: "ja", label: "Japanese" },
                { value: "kn", label: "Kannada" },
                {
                    value: "kk",
                    label: "Kazakh",
                },
                { value: "ko", label: "Korean" },
                { value: "ky", label: "Kyrgyz" },
                {
                    value: "lt",
                    label: "Lithuanian",
                },
                { value: "lv", label: "Latvian" },
                { value: "mk", label: "Macedonian" },
                {
                    value: "ml",
                    label: "Malayalam",
                },
                { value: "mr", label: "Marathi" },
                { value: "no", label: "Norwegian" },
                {
                    value: "pl",
                    label: "Polish",
                },
                { value: "pt", label: "Portuguese" },
                {
                    value: "pt-br",
                    label: "Portuguese (brazil)",
                },
                { value: "pt-pt", label: "Portuguese (portugal)" },
                {
                    value: "pa",
                    label: "Punjabi",
                },
                { value: "ro", label: "Romanian" },
                { value: "ru", label: "Russian" },
                {
                    value: "sr",
                    label: "Serbian",
                },
                { value: "sk", label: "Slovak" },
                { value: "sl", label: "Slovenian" },
                {
                    value: "es",
                    label: "Spanish",
                },
                { value: "sv", label: "Swedish" },
                { value: "tl", label: "Tagalog" },
                {
                    value: "ta",
                    label: "Tamil",
                },
                { value: "te", label: "Telugu" },
                { value: "th", label: "Thai" },
                {
                    value: "tr",
                    label: "Turkish",
                },
                { value: "uk", label: "Ukrainian" },
                { value: "uz", label: "Uzbek" },
                {
                    value: "vi",
                    label: "Vietnamese",
                },
            ];
            this.language = options.language;
            this.markerImages = MapSVG.markerImages;
            this.markersByField = options.markersByField;
            this.markerField = options.markerField;
            this.markersByFieldEnabled = MapSVG.parseBoolean(options.markersByFieldEnabled);
            this.defaultMarkerPath =
                options.defaultMarkerPath ||
                    this.formBuilder.mapsvg.getData().options.defaultMarkerImage;
            this.templates.marker = Handlebars.compile($$i("#mapsvg-data-tmpl-marker").html());
        }
        init() {
            super.init();
            if (this.value) {
                this.renderMarker();
            }
            this.renderMarkerSelector();
        }
        getSchema() {
            const schema = super.getSchema();
            schema.language = this.language;
            schema.defaultMarkerPath = this.defaultMarkerPath;
            schema.markersByField = this.markersByField;
            schema.markerField = this.markerField;
            schema.markersByFieldEnabled = MapSVG.parseBoolean(this.markersByFieldEnabled);
            return schema;
        }
        getData() {
            return { name: this.name, value: this.value };
        }
        getDataForTemplate() {
            const data = super.getDataForTemplate();
            if (this.formBuilder.admin) {
                data.languages = this.languages;
                data.markerImages = MapSVG.markerImages;
                data.markersByField = this.markersByField;
                data.markerField = this.markerField;
                data.markersByFieldEnabled = MapSVG.parseBoolean(this.markersByFieldEnabled);
                const _this = this;
                data.markerImages.forEach(function (m) {
                    if (m.relativeUrl === _this.defaultMarkerPath) {
                        m.default = true;
                    }
                    else {
                        m.default = false;
                    }
                });
            }
            data.language = this.language;
            if (this.value) {
                data.location = this.value;
                if (data.location.marker) {
                    data.location.img =
                        (this.value.marker.src.indexOf(MapSVG.urls.uploads) === 0 ? "uploads/" : "") +
                            this.value.marker.src.split("/").pop();
                }
            }
            data.showUploadBtn = data.external.filtersMode;
            return data;
        }
        initEditor() {
            super.initEditor();
            this.renderMarkerSelector();
            this.fillMarkersByFieldOptions(this.markerField);
        }
        setDomElements() {
            super.setDomElements();
            this.domElements.markerImageButton = $$i(this.domElements.main).find("img")[0];
        }
        setEventHandlers() {
            super.setEventHandlers();
            const _this = this;
            const server = new Server();
            if (_this.formBuilder.mapsvg.isGeo()) {
                const locations = new Bloodhound({
                    datumTokenizer: Bloodhound.tokenizers.obj.whitespace("formatted_address"),
                    queryTokenizer: Bloodhound.tokenizers.whitespace,
                    remote: {
                        url: server.getUrl("geocoding") + "?address=%QUERY%&language=" + this.language,
                        wildcard: "%QUERY%",
                        transform: function (response) {
                            if (response.error_message) {
                                alert(response.error_message);
                            }
                            return response.results;
                        },
                        rateLimitWait: 600,
                    },
                });
                const thContainer = $$i(this.domElements.main).find(".typeahead");
                const tH = thContainer
                    .typeahead({ minLength: 3 }, {
                    name: "mapsvg-addresses",
                    display: "formatted_address",
                    async: true,
                    source: (query, sync, async) => {
                        const preg = new RegExp(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/);
                        if (preg.test(query)) {
                            const latlng = query.split(",").map((item) => item.trim());
                            const item = {
                                formatted_address: latlng.join(","),
                                address_components: [],
                                geometry: {
                                    location: {
                                        lat: () => latlng[0],
                                        lng: () => latlng[1],
                                    },
                                },
                            };
                            sync([item]);
                            return;
                        }
                        MapSVG.geocode({ address: query }, async);
                    },
                })
                    .on("typeahead:asyncrequest", function (e) {
                    $$i(e.target).addClass("tt-loading");
                })
                    .on("typeahead:asynccancel typeahead:asyncreceive", function (e) {
                    $$i(e.target).removeClass("tt-loading");
                });
                thContainer.on("typeahead:select", (ev, item) => {
                    this.setValue(null, false);
                    const address = {};
                    address.formatted = item.formatted_address;
                    item.address_components.forEach((addr_item) => {
                        const type = addr_item.types[0];
                        address[type] = addr_item.long_name;
                        if (addr_item.short_name != addr_item.long_name) {
                            address[type + "_short"] = addr_item.short_name;
                        }
                    });
                    const locationData = {
                        address: address,
                        geoPoint: new GeoPoint(item.geometry.location.lat(), item.geometry.location.lng()),
                        img: this.getMarkerImage(this.formBuilder.getData()),
                        imagePath: this.getMarkerImage(this.formBuilder.getData()),
                    };
                    this.setValue(locationData, false);
                    thContainer.typeahead("val", "");
                    this.triggerChanged();
                });
            }
            $$i(this.domElements.main).on("change", ".marker-file-uploader", function () {
                _this.markerIconUpload(this);
            });
            $$i(this.domElements.main).on("click", ".mapsvg-marker-image-btn-trigger", function (e) {
                e.preventDefault();
                $$i(this).toggleClass("active");
                _this.toggleMarkerSelector();
            });
            $$i(this.domElements.main).on("click", ".mapsvg-marker-delete", function (e) {
                e.preventDefault();
                _this.setValue(null);
                _this.triggerChanged();
            });
        }
        setEditorEventHandlers() {
            super.setEditorEventHandlers();
            const _this = this;
            $$i(this.domElements.edit).on("change", ".marker-file-uploader", function () {
                _this.markerIconUpload(this);
            });
            $$i(this.domElements.edit).on("change", 'select[name="markerField"]', function () {
                const fieldName = $$i(this).val();
                _this.resetMarkersByField();
                const newOptions = _this.fillMarkersByFieldOptions(fieldName);
                _this.setMarkersByField(newOptions);
            });
            $$i(this.domElements.edit).on("click", ".mapsvg-marker-image-selector button", function (e) {
                e.preventDefault();
                const src = $$i(this).find("img").attr("src");
                $$i(this).parent().find("button").removeClass("active");
                $$i(this).addClass("active");
                _this.setDefaultMarkerPath(src);
            });
            $$i(this.domElements.edit).on("click", ".mapsvg-marker-image-btn-trigger", function (e) {
                $$i(this).toggleClass("active");
                _this.toggleMarkerSelectorInLocationEditor.call(_this, $$i(this), e);
            });
        }
        markerIconUpload(input) {
            const uploadBtn = $$i(input).closest(".btn-file").buttonLoading(true);
            for (let i = 0; i < input.files.length; i++) {
                const data = new FormData();
                data.append("file", input.files[0]);
                const server = new Server();
                server
                    .ajax("markers", {
                    type: "POST",
                    data: data,
                    processData: false,
                    contentType: false,
                })
                    .done((resp) => {
                    if (resp.error) {
                        alert(resp.error);
                    }
                    else {
                        const marker = resp.marker;
                        const newMarker = `
                            <button class="btn btn-outline-secondary mapsvg-marker-image-btn mapsvg-marker-image-btn-choose active">
                                <img src="${marker.relativeUrl}" />
                            </button>
                            </button>
                        `;
                        $$i(this.domElements.markerSelector)
                            .find(".mapsvg-marker-image-btn.active")
                            .removeClass("active");
                        $$i(newMarker).appendTo(this.domElements.markerSelector);
                        this.setMarkerImage(marker.relativeUrl);
                        MapSVG.markerImages.push(marker);
                    }
                })
                    .always(function () {
                    uploadBtn.buttonLoading(false);
                });
            }
        }
        mayBeAddDistanceRow() {
            const _this = this;
            if (!this.domElements.editDistanceRow) {
                this.domElements.editDistanceRow = $$i($$i("#mapsvg-edit-distance-row").html())[0];
            }
            const z = $$i(this.domElements.edit).find(".mapsvg-edit-distance-row:last-child input");
            if (z && z.last() && z.last().val() && (z.last().val() + "").trim().length) {
                const newRow = $$i(this.templates.editDistanceRow).clone();
                newRow.insertAfter($$i(_this.domElements.edit).find(".mapsvg-edit-distance-row:last-child"));
            }
            const rows = $$i(_this.domElements.edit).find(".mapsvg-edit-distance-row");
            const row1 = rows.eq(rows.length - 2);
            const row2 = rows.eq(rows.length - 1);
            if (row1.length &&
                row2.length &&
                !row1.find("input:eq(0)").val().toString().trim() &&
                !row2.find("input:eq(0)").val().toString().trim()) {
                row2.remove();
            }
        }
        fillMarkersByFieldOptions(fieldName) {
            const _this = this;
            const field = _this.formBuilder.mapsvg.objectsRepository.getSchema().getField(fieldName);
            const options = {};
            if (field) {
                const markerImg = _this.formBuilder.mapsvg.options.defaultMarkerImage;
                const rows = [];
                field.options.forEach(function (option) {
                    const value = field.type === "region" ? option.id : option.value;
                    const label = field.type === "region" ? option.title || option.id : option.label;
                    const img = _this.markersByField && _this.markersByField[value]
                        ? _this.markersByField[value]
                        : markerImg;
                    rows.push('<tr data-option-id="' +
                        value +
                        '"><td>' +
                        label +
                        '</td><td><button class="btn dropdown-toggle btn-outline-secondary mapsvg-marker-image-btn-trigger mapsvg-marker-image-btn"><img src="' +
                        img +
                        '" class="new-marker-img" /><span class="caret"></span></button></td></tr>');
                    options[value] = img;
                });
                $$i("#markers-by-field").empty().append(rows);
            }
            return options;
        }
        renderMarker(marker) {
            if (marker && marker.location) {
                this.value = marker.location.getData();
            }
            this.renderMarkerHtml();
        }
        renderMarkerHtml() {
            if (!this.value) {
                $$i(this.domElements.main).find(".mapsvg-new-marker").hide();
            }
            else {
                $$i(this.domElements.main)
                    .find(".mapsvg-new-marker")
                    .show()
                    .html(this.templates.marker(this.value));
            }
        }
        toggleMarkerSelector() {
            if (this.domElements.markerSelectorWrap &&
                $$i(this.domElements.markerSelectorWrap).is(":visible")) {
                $$i(this.domElements.markerSelectorWrap).hide();
                return;
            }
            if (this.domElements.markerSelectorWrap &&
                $$i(this.domElements.markerSelectorWrap).not(":visible")) {
                $$i(this.domElements.markerSelector).find(".active").removeClass("active");
                if (this.value && this.value.markerImagePath) {
                    $$i(this.domElements.markerSelector)
                        .find('[src="' + this.value.markerImagePath + '"]')
                        .parent()
                        .addClass("active");
                }
                $$i(this.domElements.markerSelectorWrap).show();
                return;
            }
        }
        renderMarkerSelector() {
            const _this = this;
            const view = this.formBuilder.editMode ? this.domElements.edit : this.domElements.main;
            if (!view)
                return;
            const currentImage = this.value ? this.value.markerImagePath : null;
            const images = MapSVG.markerImages.map(function (image) {
                return ('<button class="btn btn-outline-secondary mapsvg-marker-image-btn mapsvg-marker-image-btn-choose ' +
                    (currentImage == image.relativeUrl ? "active" : "") +
                    '"><img src="' +
                    image.relativeUrl +
                    '" /></button>');
            });
            this.domElements.markerSelectorWrap = $$i(view).find(".mapsvg-marker-image-selector")[0];
            this.domElements.markerSelector = $$i(this.domElements.markerSelectorWrap).find(".mapsvg-marker-images")[0];
            if (this.domElements.markerSelector) {
                $$i(this.domElements.markerSelector).empty();
            }
            if (!this.formBuilder.editMode) {
                this.domElements.markerSelectorWrap.style.display = "none";
                $$i(this.domElements.markerSelector).on("click", ".mapsvg-marker-image-btn-choose", function (e) {
                    e.preventDefault();
                    const src = $$i(this).find("img").attr("src");
                    $$i(_this.domElements.markerSelectorWrap).hide();
                    $$i(_this.domElements.markerSelector).find(".active").removeClass("active");
                    $$i(this).addClass("active");
                    $$i(_this.domElements.main)
                        .find(".mapsvg-marker-image-btn-trigger")
                        .toggleClass("active", false);
                    $$i(_this.domElements.markerImageButton).attr("src", src);
                    _this.setMarkerImage(src);
                });
            }
            $$i(this.domElements.markerSelector).html(images.join(""));
        }
        setMarkerImage(src) {
            this.setDefaultMarkerPath(src);
            const value = this.value;
            if (value) {
                value.img = src;
                value.imagePath = src;
                this.setValue(value);
                this.triggerChanged();
                this.renderMarker();
            }
        }
        toggleMarkerSelectorInLocationEditor(jQueryObj, e) {
            e.preventDefault();
            const _this = this;
            if (jQueryObj.data("markerSelector") && jQueryObj.data("markerSelector").is(":visible")) {
                jQueryObj.data("markerSelector").hide();
                return;
            }
            if (jQueryObj.data("markerSelector") && jQueryObj.data("markerSelector").not(":visible")) {
                jQueryObj.data("markerSelector").show();
                return;
            }
            const markerBtn = $$i(this).closest("td").find(".mapsvg-marker-image-btn-trigger");
            const currentImage = markerBtn.attr("src");
            const images = MapSVG.markerImages.map(function (image) {
                return ('<button class="btn btn-outline-secondary mapsvg-marker-image-btn mapsvg-marker-image-btn-choose ' +
                    (currentImage == image.relativeUrl ? "active" : "") +
                    '"><img src="' +
                    image.relativeUrl +
                    '" /></button>');
            });
            if (!jQueryObj.data("markerSelector")) {
                const ms = $$i('<div class="mapsvg-marker-image-selector"></div>');
                jQueryObj.closest("td").append(ms);
                jQueryObj.data("markerSelector", ms);
            }
            else {
                jQueryObj.data("markerSelector").empty();
            }
            jQueryObj.data("markerSelector").html(images.join(""));
            jQueryObj
                .data("markerSelector")
                .on("click", ".mapsvg-marker-image-btn-choose", function (e) {
                e.preventDefault();
                const src = $$i(this).find("img").attr("src");
                jQueryObj.data("markerSelector").hide();
                const td = $$i(this).closest("td");
                const fieldId = $$i(this).closest("tr").data("option-id");
                const btn = td.find(".mapsvg-marker-image-btn-trigger");
                btn.toggleClass("active", false);
                btn.find("img").attr("src", src);
                _this.setMarkerByField(fieldId, src);
            });
        }
        setMarkersByField(options) {
            this.markersByField = options;
        }
        resetMarkersByField() {
            this.markersByField = {};
        }
        setMarkerByField(fieldId, markerImg) {
            this.markersByField = this.markersByField || {};
            this.markersByField[fieldId] = markerImg;
        }
        deleteMarker() {
            $$i(this.domElements.main).find(".mapsvg-new-marker").hide();
            $$i(this.domElements.main).find(".mapsvg-marker-id").attr("disabled", "disabled");
        }
        destroy() {
            if ($$i().mselect2) {
                const sel = $$i(this.domElements.main).find(".mapsvg-select2");
                if (sel.length) {
                    sel.mselect2("destroy");
                }
            }
            this.domElements.markerSelector && $$i(this.domElements.markerSelector).popover("dispose");
        }
        setDefaultMarkerPath(path) {
            this.defaultMarkerPath = path;
            this.formBuilder.mapsvg.setDefaultMarkerImage(path);
        }
        getMarkerImage(data) {
            let fieldValue;
            if (this.markersByFieldEnabled) {
                fieldValue = data[this.markerField];
                if (!fieldValue) {
                    return this.defaultMarkerPath || MapSVG.defaultMarkerImage;
                }
                else {
                    if (this.markerField === "regions") {
                        fieldValue = fieldValue[0] && fieldValue[0].id;
                    }
                    else if (typeof fieldValue === "object" && fieldValue.length) {
                        fieldValue = fieldValue[0].value;
                    }
                    if (this.markersByField[fieldValue]) {
                        return (this.markersByField[fieldValue] ||
                            this.defaultMarkerPath ||
                            MapSVG.defaultMarkerImage);
                    }
                }
            }
            else {
                return this.defaultMarkerPath || MapSVG.defaultMarkerImage;
            }
        }
        setValue(value, updateInput = true) {
            this.value = value;
            if (this.value) {
                if (!this.value.address) {
                    this.value.address = {};
                }
                if (Object.keys(this.value.address).length < 2 && this.value.geoPoint) {
                    this.value.address.formatted =
                        this.value.geoPoint.lat + "," + this.value.geoPoint.lng;
                }
            }
            this.renderMarker();
        }
    }

    const $$j = jQuery;
    class ModalFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.showButtonText = options.showButtonText;
        }
        getSchema() {
            const schema = super.getSchema();
            schema.showButtonText = this.showButtonText;
            return schema;
        }
    }

    const $$k = jQuery;
    class PostFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            if (this.formBuilder.admin)
                this.post_types = this.formBuilder.admin.getPostTypes();
            this.post_type = options.post_type || this.post_types[0];
            this.add_fields = MapSVG.parseBoolean(options.add_fields);
            this.db_type = "int(11)";
            this.name = "post";
            this.post = options.post;
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.postSelect = ($$k(this.domElements.main).find(".mapsvg-find-post")[0]);
        }
        getSchema() {
            const schema = super.getSchema();
            schema.post_type = this.post_type;
            schema.add_fields = this.add_fields;
            return schema;
        }
        destroy() {
            if ($$k().mselect2) {
                const sel = $$k(this.domElements.main).find(".mapsvg-select2");
                if (sel.length) {
                    sel.mselect2("destroy");
                }
            }
        }
        getDataForTemplate() {
            const data = super.getDataForTemplate();
            if (this.formBuilder.admin)
                data.post_types = this.formBuilder.admin.getPostTypes();
            data.post_type = this.post_type;
            data.post = this.post;
            data.add_fields = this.add_fields || 0;
            return data;
        }
        setEventHandlers() {
            super.setEventHandlers();
            const server = new Server();
            $$k(this.inputs.postSelect)
                .mselect2({
                placeholder: "Search post by title",
                allowClear: true,
                disabled: this.readonly,
                ajax: {
                    url: server.getUrl("posts"),
                    dataType: "json",
                    delay: 250,
                    data: (params) => {
                        return {
                            filters: { post_type: this.post_type },
                            search: params.term,
                            page: params.page,
                        };
                    },
                    processResults: (data, params) => {
                        params.page = params.page || 1;
                        return {
                            results: data.posts ? data.posts : [],
                            pagination: {
                                more: false,
                            },
                        };
                    },
                    cache: true,
                },
                escapeMarkup: (markup) => {
                    return markup;
                },
                minimumInputLength: 1,
                templateResult: this.formatRepo,
                templateSelection: this.formatRepoSelection,
            })
                .on("select2:select", (e) => {
                const post = e.params.data;
                this.setValue(post);
                this.setInputValue(post);
                this.triggerChanged();
            })
                .on("change", (e) => {
                if (e.target.value === "") {
                    $$k(this.domElements.main).find(".mapsvg-post-id").text("");
                    $$k(this.domElements.main).find(".mapsvg-post-url").text("");
                    this.setValue(null, false);
                    this.triggerChanged();
                }
            });
        }
        formatRepo(repo) {
            if (repo.loading) {
                return repo.text;
            }
            else {
                return "<div class='select2-result-repository clearfix'>" + repo.post_title + "</div>";
            }
        }
        formatRepoSelection(repo) {
            return repo.post_title || repo.text;
        }
        setValue(post, updateInput = true) {
            this.value = post;
            if (updateInput) {
                this.setInputValue(post);
            }
        }
        setInputValue(post) {
            $$k(this.domElements.main).find(".mapsvg-post-id").text(post.id);
            $$k(this.domElements.main).find(".mapsvg-post-url").text(post.url).attr("href", post.url);
        }
    }

    const $$l = jQuery;
    class RadioFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.setOptions(options.options);
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.radios = this.formBuilder.getForm().elements[this.name];
            this.$radios = $$l(this.domElements.main).find('input[type="radio"]');
        }
        setEventHandlers() {
            super.setEventHandlers();
            this.$radios.on("change", (e) => {
                this.setValue(e.target.value, false);
                this.triggerChanged();
            });
        }
        setInputValue(value) {
            if (value === null) {
                this.$radios.prop("checked", false);
            }
            else {
                this.inputs.radios.value = value;
            }
        }
    }

    const $$m = jQuery;
    class RegionsFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.searchable = MapSVG.parseBoolean(options.searchable);
            this.options = this.formBuilder.getRegionsList();
            this.label = options.label === undefined ? "Regions" : options.label;
            this.name = "regions";
            this.db_type = "text";
            if (typeof this.value === "undefined") {
                this.value = [];
            }
            this.regionsTableName = this.formBuilder.mapsvg.regionsRepository.getSchema().name;
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.select = $$m(this.domElements.main).find("select")[0];
        }
        getData() {
            return { name: "regions", value: this.value };
        }
        getSchema() {
            const schema = super.getSchema();
            if (schema.multiselect)
                schema.db_type = "text";
            const opts = $$m.extend(true, {}, { options: this.options });
            schema.options = opts.options;
            schema.optionsDict = {};
            schema.options.forEach(function (option) {
                schema.optionsDict[option.id] = option.title || option.id;
            });
            return schema;
        }
        getDataForTemplate() {
            const data = super.getDataForTemplate();
            data.regionsTableName = this.regionsTableName;
            data.regionsFromCurrentTable = this.getRegionsForCurrentTable();
            return data;
        }
        getRegionsForCurrentTable() {
            return this.value
                ? this.value.filter((region) => region.tableName === this.regionsTableName)
                : [];
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$m(this.inputs.select).on("change", (e) => {
                const selectedOptions = Array.from(this.inputs.select.selectedOptions);
                const selectedValues = selectedOptions.map((option) => option.value);
                this.setValue(selectedValues, false);
                this.triggerChanged();
            });
        }
        destroy() {
            if ($$m().mselect2) {
                const sel = $$m(this.domElements.main).find(".mapsvg-select2");
                if (sel.length) {
                    sel.mselect2("destroy");
                }
            }
        }
        setValue(regionIds, updateInput = true) {
            const regionsFromOtherTables = this.value.filter((region) => region.tableName !== this.regionsTableName);
            const regions = [];
            regionIds.forEach((regionId) => {
                const region = this.formBuilder.mapsvg.getRegion(regionId);
                regions.push({ id: region.id, title: region.title, tableName: this.regionsTableName });
            });
            this.value = regions.concat(regionsFromOtherTables);
            if (updateInput) {
                this.setInputValue(regionIds);
            }
        }
    }

    const $$n = jQuery;
    class SaveFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.readonly = true;
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.btnSave = $$n(this.domElements.main).find(".btn-save")[0];
            this.inputs.btnClose = $$n(this.domElements.main).find(".mapsvg-close")[0];
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$n(this.inputs.btnSave).on("click", (e) => {
                e.preventDefault();
                this.events.trigger("click.btn.save");
            });
            $$n(this.inputs.btnClose).on("click", (e) => {
                e.preventDefault();
                this.events.trigger("click.btn.close");
            });
        }
    }

    const $$o = jQuery;
    class SearchFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.searchFallback = MapSVG.parseBoolean(options.searchFallback) || false;
            this.width = options.width || "100%";
            this.name = "search";
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.text = $$o(this.domElements.main).find("input")[0];
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$o(this.inputs.text).on("change keyup paste", (e) => {
                this.setValue(e.target.value, false);
                this.triggerChanged();
            });
        }
        setInputValue(value) {
            this.inputs.text.value = value;
        }
        getSchema() {
            const schema = super.getSchema();
            schema.searchFallback = MapSVG.parseBoolean(this.searchFallback);
            schema.placeholder = this.placeholder;
            schema.width = this.width;
            return schema;
        }
    }

    const $$p = jQuery;
    class SelectFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.searchable = MapSVG.parseBoolean(options.searchable);
            this.multiselect = MapSVG.parseBoolean(options.multiselect);
            this.optionsGrouped = options.optionsGrouped;
            this.db_type = this.multiselect ? "text" : "varchar(255)";
            this.setOptions(options.options);
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.select = $$p(this.domElements.main).find("select")[0];
        }
        getSchema() {
            const schema = super.getSchema();
            schema.multiselect = MapSVG.parseBoolean(this.multiselect);
            if (schema.multiselect)
                schema.db_type = "text";
            schema.optionsGrouped = this.optionsGrouped;
            const opts = $$p.extend(true, {}, { options: this.options });
            schema.options = opts.options || [];
            schema.optionsDict = {};
            schema.options.forEach(function (option) {
                schema.optionsDict[option.value] = option.label;
            });
            return schema;
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$p(this.inputs.select).on("change", (e) => {
                if (this.multiselect) {
                    const selectedOptions = Array.from(this.inputs.select.selectedOptions);
                    const selectedValues = selectedOptions.map((option) => {
                        return { label: option.label, value: option.value };
                    });
                    this.setValue(selectedValues, false);
                    this.triggerChanged();
                }
                else {
                    this.setValue(this.inputs.select.value, false);
                    this.triggerChanged();
                }
            });
        }
        addSelect2() {
            if ($$p().mselect2) {
                const select2Options = {};
                if (this.formBuilder.filtersMode && this.type == "select") {
                    select2Options.placeholder = this.placeholder;
                    if (!this.multiselect) {
                        select2Options.allowClear = true;
                    }
                }
                $$p(this.domElements.main)
                    .find("select")
                    .css({ width: "100%", display: "block" })
                    .mselect2(select2Options)
                    .on("select2:focus", function () {
                    $$p(this).mselect2("open");
                });
                $$p(this.domElements.main)
                    .find(".select2-selection--multiple .select2-search__field")
                    .css("width", "100%");
            }
        }
        setOptions(options) {
            if (options) {
                this.options = [];
                this.optionsDict = {};
                options.forEach((value, key) => {
                    this.options.push(value);
                    if (this.optionsGrouped) {
                        value.options.forEach((value2, key2) => {
                            this.optionsDict[value2.value] = value2;
                        });
                    }
                    else {
                        this.optionsDict[key] = value;
                    }
                });
                return this.options;
            }
            else {
                return this.setOptions([
                    { label: "Option one", name: "option_one", value: 1 },
                    { label: "Option two", name: "option_two", value: 2 },
                ]);
            }
        }
        setInputValue(value) {
            if (this.multiselect) {
                if (this.value) {
                    $$p(this.inputs.select).val(this.value.map((el) => el.value));
                }
                else {
                    $$p(this.inputs.select).val([]);
                }
            }
            else {
                this.inputs.select.value = this.value;
            }
            $$p(this.inputs.select).trigger("change.select2");
        }
    }

    const $$q = jQuery;
    class StatusFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.label = options.label || "Status";
            this.name = "status";
            this.setOptions(options.options);
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.select = $$q(this.domElements.main).find("select")[0];
            if ($$q().colorpicker) {
                $$q(this.domElements.main)
                    .find(".cpicker")
                    .colorpicker()
                    .on("changeColor.colorpicker", function (event) {
                    const input = $$q(this).find("input");
                    if (input.val() == "")
                        $$q(this).find("i").css({ "background-color": "" });
                });
                this.domElements.edit &&
                    $$q(this.domElements.edit)
                        .find(".cpicker")
                        .colorpicker()
                        .on("changeColor.colorpicker", function (event) {
                        const input = $$q(this).find("input");
                        if (input.val() == "")
                            $$q(this).find("i").css({ "background-color": "" });
                    });
            }
        }
        destroy() {
            if ($$q().mselect2) {
                const sel = $$q(this.domElements.main).find(".mapsvg-select2");
                if (sel.length) {
                    sel.mselect2("destroy");
                }
            }
        }
        setEditorEventHandlers() {
            super.setEditorEventHandlers();
            const _this = this;
            $$q(this.domElements.edit).on("keyup change paste", ".mapsvg-edit-status-row input", function () {
                _this.mayBeAddStatusRow();
            });
        }
        initEditor() {
            super.initEditor();
            const _this = this;
            $$q(_this.domElements.edit)
                .find(".cpicker")
                .colorpicker()
                .on("changeColor.colorpicker", function (event) {
                const input = $$q(this).find("input");
                const index = $$q(this).closest("tr").index();
                if (input.val() == "")
                    $$q(this).find("i").css({ "background-color": "" });
                _this.options[index] = _this.options[index] || {
                    label: "",
                    value: "",
                    color: "",
                    disabled: false,
                };
                _this.options[index]["color"] = input.val();
            });
            _this.mayBeAddStatusRow();
        }
        mayBeAddStatusRow() {
            const _this = this;
            const editStatusRow = $$q($$q("#mapsvg-edit-status-row").html());
            const z = $$q(_this.domElements.edit).find(".mapsvg-edit-status-label:last-child");
            if (z && z.last() && z.last().val() && (z.last().val() + "").trim().length) {
                const newRow = editStatusRow.clone();
                newRow.insertAfter($$q(_this.domElements.edit).find(".mapsvg-edit-status-row:last-child"));
                newRow
                    .find(".cpicker")
                    .colorpicker()
                    .on("changeColor.colorpicker", function (event) {
                    const input = $$q(this).find("input");
                    const index = $$q(this).closest("tr").index();
                    if (input.val() == "")
                        $$q(this).find("i").css({ "background-color": "" });
                    _this.options[index] = _this.options[index] || {
                        label: "",
                        value: "",
                        color: "",
                        disabled: false,
                    };
                    _this.options[index]["color"] = input.val();
                });
            }
            const rows = $$q(_this.domElements.edit).find(".mapsvg-edit-status-row");
            const row1 = rows.eq(rows.length - 2);
            const row2 = rows.eq(rows.length - 1);
            if (row1.length &&
                row2.length &&
                !(row1.find("input:eq(0)").val().toString().trim() ||
                    row1.find("input:eq(1)").val().toString().trim() ||
                    row1.find("input:eq(2)").val().toString().trim()) &&
                !(row2.find("input:eq(0)").val().toString().trim() ||
                    row2.find("input:eq(1)").val().toString().trim() ||
                    row2.find("input:eq(2)").val().toString().trim())) {
                row2.remove();
            }
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$q(this.inputs.select).on("change keyup paste", (e) => {
                this.setValue(e.target.value, false);
                this.triggerChanged();
            });
        }
        getSchema() {
            const schema = super.getSchema();
            const opts = $$q.extend(true, {}, { options: this.options });
            schema.options = opts.options;
            schema.optionsDict = {};
            schema.options.forEach(function (option, index) {
                if (schema.options[index].value === "") {
                    schema.options.splice(index, 1);
                }
                else {
                    schema.options[index].disabled = MapSVG.parseBoolean(schema.options[index].disabled);
                    schema.optionsDict[option.value] = option;
                }
            });
            return schema;
        }
        setInputValue(value) {
            this.inputs.select.value = value;
        }
    }

    const $$r = jQuery;
    class TextareaFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.searchType = options.searchType || "fulltext";
            this.searchable = MapSVG.parseBoolean(options.searchable);
            this.autobr = options.autobr;
            this.html = options.html;
            this.db_type = "text";
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.textarea = $$r(this.domElements.main).find("textarea")[0];
            if (this.html) {
                this.editor = CodeMirror.fromTextArea(this.inputs.textarea, {
                    mode: { name: "handlebars", base: "text/html" },
                    matchBrackets: true,
                    lineNumbers: true,
                });
                if (this.formBuilder.admin) {
                    this.editor.on("change", this.setTextareaValue);
                }
            }
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$r(this.inputs.textarea).on("change keyup paste", (e) => {
                this.setValue(e.target.value, false);
                this.triggerChanged();
            });
        }
        getSchema() {
            const schema = super.getSchema();
            schema.autobr = this.autobr;
            schema.html = this.html;
            return schema;
        }
        getDataForTemplate() {
            const data = super.getDataForTemplate();
            data.html = this.html;
            return data;
        }
        setTextareaValue(codemirror, changeobj) {
            const handler = codemirror.getValue();
            const textarea = $$r(codemirror.getTextArea());
            textarea.val(handler).trigger("change");
        }
        destroy() {
            const cm = $$r(this.domElements.main).find(".CodeMirror");
            if (cm.length) {
                cm.empty().remove();
            }
        }
    }

    const $$s = jQuery;
    class TextFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.searchFallback = MapSVG.parseBoolean(options.searchFallback);
            this.searchType = options.searchType;
            this.width =
                this.formBuilder.filtersHide && !this.formBuilder.modal
                    ? null
                    : options.width || "100%";
            this.db_type = "varchar(255)";
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.text = $$s(this.domElements.main).find('input[type="text"]')[0];
        }
        getSchema() {
            const schema = super.getSchema();
            schema.searchType = this.searchType;
            return schema;
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$s(this.inputs.text).on("change keyup paste", (e) => {
                this.setValue(e.target.value, false);
                this.triggerChanged();
            });
        }
        setInputValue(value) {
            this.inputs.text.value = value;
        }
    }

    const $$t = jQuery;
    class TitleFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.searchFallback = MapSVG.parseBoolean(options.searchFallback);
            this.width =
                this.formBuilder.filtersHide && !this.formBuilder.modal
                    ? null
                    : options.width || "100%";
            this.db_type = "varchar(255)";
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.text = $$t(this.domElements.main).find('input[type="text"]')[0];
        }
        getSchema() {
            const schema = super.getSchema();
            schema.searchType = this.searchType;
            return schema;
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$t(this.inputs.text).on("change keyup paste", (e) => {
                this.setValue(e.target.value, false);
                this.triggerChanged();
            });
        }
        setInputValue(value) {
            this.inputs.text.value = value;
        }
    }

    const $$u = jQuery;
    class ColorPickerFormElement extends FormElement {
        constructor(options, formBuilder, external) {
            super(options, formBuilder, external);
            this.searchFallback = MapSVG.parseBoolean(options.searchFallback);
            this.width =
                this.formBuilder.filtersHide && !this.formBuilder.modal
                    ? null
                    : options.width || "100%";
            this.db_type = "varchar(255)";
        }
        setDomElements() {
            super.setDomElements();
            this.inputs.text = $$u(this.domElements.main).find("input.cpicker")[0];
            $$u(this.domElements.main).find(".colorpicker-element").colorpicker();
        }
        getSchema() {
            const schema = super.getSchema();
            schema.searchType = this.searchType;
            return schema;
        }
        setEventHandlers() {
            super.setEventHandlers();
            $$u(this.inputs.text).on("change keyup paste", (e) => {
                this.setValue(e.target.value, false);
                this.triggerChanged();
            });
            $$u(this.domElements.main).find(".colorpicker-element").colorpicker().on("changeColor.colorpicker", (e) => {
                this.setValue(this.inputs.text.value, false);
                this.triggerChanged();
            });
        }
        setInputValue(value) {
            this.inputs.text.value = value;
        }
    }

    const $$v = jQuery;
    class FormElementFactory {
        constructor(options) {
            this.mapsvg = options.mapsvg;
            this.editMode = options.editMode;
            this.filtersMode = options.filtersMode;
            this.namespace = options.namespace;
            this.mediaUploader = options.mediaUploader;
            this.formBuilder = options.formBuilder;
            this.showNames = options.showNames !== false;
        }
        create(options) {
            const types = {
                checkbox: CheckboxFormElement,
                checkboxes: CheckboxesFormElement,
                date: DateFormElement,
                distance: DistanceFormElement,
                empty: EmptyFormElement,
                id: IdFormElement,
                image: ImagesFormElement,
                location: LocationFormElement,
                modal: ModalFormElement,
                post: PostFormElement,
                radio: RadioFormElement,
                region: RegionsFormElement,
                save: SaveFormElement,
                search: SearchFormElement,
                select: SelectFormElement,
                status: StatusFormElement,
                text: TextFormElement,
                textarea: TextareaFormElement,
                title: TitleFormElement,
                colorpicker: ColorPickerFormElement,
            };
            const formElement = new types[options.type](options, this.formBuilder, this.getExtraParams());
            formElement.init();
            return formElement;
        }
        getExtraParams() {
            const databaseFields = [];
            const databaseFieldsFilterable = [];
            const databaseFieldsFilterableShort = [];
            const regionFields = [];
            const regionFieldsFilterable = [];
            const regions = new ArrayIndexed("id");
            let mapIsGeo = false;
            if (this.mapsvg) {
                mapIsGeo = this.mapsvg.isGeo();
                const schemaObjects = this.mapsvg.objectsRepository.getSchema();
                if (schemaObjects) {
                    schemaObjects.getFields().forEach(function (obj) {
                        if (obj.type == "text" ||
                            obj.type == "region" ||
                            obj.type == "textarea" ||
                            obj.type == "post" ||
                            obj.type == "select" ||
                            obj.type == "radio" ||
                            obj.type == "checkbox") {
                            if (obj.type == "post") {
                                databaseFields.push("Object.post.post_title");
                            }
                            else {
                                databaseFields.push("Object." + obj.name);
                            }
                        }
                        if (obj.type == "region" || obj.type == "select" || obj.type == "radio") {
                            databaseFieldsFilterable.push("Object." + obj.name);
                            databaseFieldsFilterableShort.push(obj.name);
                        }
                    });
                }
                const schemaRegions = this.mapsvg.regionsRepository.getSchema();
                if (schemaRegions) {
                    schemaRegions.getFieldsAsArray().forEach(function (obj) {
                        if (obj.type == "status" ||
                            obj.type == "text" ||
                            obj.type == "textarea" ||
                            obj.type == "post" ||
                            obj.type == "select" ||
                            obj.type == "radio" ||
                            obj.type == "checkbox") {
                            if (obj.type == "post") {
                                regionFields.push("Region.post.post_title");
                            }
                            else {
                                regionFields.push("Region." + obj.name);
                            }
                        }
                        if (obj.type == "status" || obj.type == "select" || obj.type == "radio") {
                            regionFieldsFilterable.push("Region." + obj.name);
                        }
                    });
                }
                this.mapsvg.regions.forEach((region) => {
                    regions.push({ id: region.id, title: region.title });
                });
            }
            return {
                databaseFields: databaseFields,
                databaseFieldsFilterable: databaseFieldsFilterable,
                databaseFieldsFilterableShort: databaseFieldsFilterableShort,
                regionFields: regionFields,
                regionFieldsFilterable: regionFieldsFilterable,
                regions: regions,
                mapIsGeo: mapIsGeo,
                mediaUploader: this.mediaUploader,
                filtersMode: this.filtersMode,
                showNames: this.showNames,
            };
        }
    }

    const $$w = jQuery;
    class FormBuilder {
        constructor(options) {
            const _this = this;
            this.events = new Events();
            this.container = options.container;
            this.namespace = options.namespace;
            this.mediaUploader = options.mediaUploader;
            this.schema = options.schema || [];
            this.editMode = options.editMode == undefined ? false : options.editMode;
            this.filtersMode = options.filtersMode == undefined ? false : options.filtersMode;
            this.filtersHide = options.filtersHide == undefined ? false : options.filtersHide;
            this.modal = options.modal == undefined ? false : options.modal;
            this.admin = options.admin;
            this.mapsvg = options.mapsvg;
            this.data = options.data || {};
            this.clearButton = options.clearButton || false;
            this.clearButtonText = options.clearButtonText || "";
            this.searchButton = options.searchButton || false;
            this.searchButtonText = options.searchButtonText || "";
            this.showButtonText = options.showButtonText || "";
            this.scrollable =
                typeof options.scrollable !== "undefined"
                    ? options.scrollable
                    : !_this.editMode && !_this.filtersMode;
            this.showNames = typeof options.showNames !== "undefined" ? options.showNames : true;
            this.formElementFactory = new FormElementFactory({
                mapsvg: this.mapsvg,
                formBuilder: this,
                mediaUploader: this.mediaUploader,
                editMode: this.editMode,
                filtersMode: this.filtersMode,
                namespace: this.namespace,
                showNames: this.showNames,
            });
            this.events = new Events(this);
            if (options.events && Object.keys(options.events).length > 0) {
                for (const eventName in options.events) {
                    this.events.on(eventName, options.events[eventName]);
                }
            }
            this.template = "form-builder";
            this.closeOnSave = options.closeOnSave === true;
            this.newRecord = options.newRecord === true;
            this.types = options.types || [
                "text",
                "textarea",
                "checkbox",
                "radio",
                "select",
                "image",
                "region",
                "location",
                "post",
                "date",
            ];
            this.templates = {};
            this.elements = {};
            this.view = $$w("<div />").addClass("mapsvg-form-builder")[0];
            if (this.editMode)
                $$w(this.view).addClass("full-flex");
            if (!this.showNames) {
                $$w(this.view).addClass("hide-names");
            }
            this.formElements = new ArrayIndexed("name");
            if (!MapSVG.templatesLoaded[this.template]) {
                this.loadTemplates(() => this.init());
            }
            else {
                this.init();
            }
        }
        loadTemplates(callback) {
            $$w.get(MapSVG.urls.root + "dist/" + this.template + ".html", (data) => {
                $$w(data).appendTo("body");
                MapSVG.templatesLoaded[this.template] = true;
                Handlebars.registerPartial("dataMarkerPartial", $$w("#mapsvg-data-tmpl-marker").html());
                if (this.editMode) {
                    Handlebars.registerPartial("markerByFieldPartial", $$w("#mapsvg-markers-by-field-tmpl-partial").html());
                }
                callback();
            });
        }
        init() {
            const _this = this;
            MapSVG.formBuilder = this;
            this.form = document.createElement("form");
            this.form.className = "mapsvg-data-form-view";
            if (!this.filtersMode) {
                this.form.classList.add("form-horizontal");
            }
            if (this.editMode) {
                const template = document.getElementById("mapsvg-form-editor-tmpl-ui").innerHTML;
                const templateCompiled = Handlebars.compile(template);
                this.view.innerHTML = templateCompiled({ types: this.types });
                this.view.classList.add("edit");
                this.form.classList.add("mapsvg-data-flex-full");
                this.form.classList.add("mapsvg-data-container");
                $$w(this.view).find(".mapsvg-data-preview").prepend(this.form);
                this.formEditor = $$w(this.view).find("#mapsvg-data-form-edit")[0];
            }
            else {
                this.view.appendChild(this.form);
            }
            _this.elements = {
                buttons: {
                    text: $$w(_this.view).find("#mapsvg-data-btn-text")[0],
                    textarea: $$w(_this.view).find("#mapsvg-data-btn-textarea")[0],
                    checkbox: $$w(_this.view).find("#mapsvg-data-btn-checkbox")[0],
                    radio: $$w(_this.view).find("#mapsvg-data-btn-radio")[0],
                    select: $$w(_this.view).find("#mapsvg-data-btn-select")[0],
                    image: $$w(_this.view).find("#mapsvg-data-btn-image")[0],
                    region: $$w(_this.view).find("#mapsvg-data-btn-region")[0],
                    marker: $$w(_this.view).find("#mapsvg-data-btn-marker")[0],
                    saveSchema: $$w(_this.view).find("#mapsvg-data-btn-save-schema")[0],
                },
                containers: {
                    buttons_add: $$w(_this.view).find("#mapsvg-data-buttons-add")[0],
                },
            };
            _this.redraw();
        }
        getForm() {
            return this.form;
        }
        getFormEditor() {
            return this.formEditor;
        }
        viewDidLoad() { }
        setEventHandlers() {
            const _this = this;
            $$w(this.getForm()).on("submit", (e) => {
                e.preventDefault();
            });
            if (this.filtersMode && this.clearButton) {
                $$w(this.elements.buttons.clearButton).on("click", (e) => {
                    e.preventDefault();
                    this.clearAllFields();
                });
            }
            $$w(window)
                .off("keydown.form.mapsvg")
                .on("keydown.form.mapsvg", function (e) {
                if (MapSVG.formBuilder) {
                    if ((e.metaKey || e.ctrlKey) && e.keyCode == 13)
                        MapSVG.formBuilder.save();
                    else if (e.keyCode == 27)
                        MapSVG.formBuilder.close();
                }
            });
            if (this.editMode) {
                $$w(this.view).on("click", "#mapsvg-data-buttons-add button", function (e) {
                    e.preventDefault();
                    const type = $$w(this).data("create");
                    const formElement = _this.formElementFactory.create({ type: type });
                    _this.addField(formElement);
                });
                $$w(this.view).on("click", "#mapsvg-data-btn-save-schema", function (e) {
                    e.preventDefault();
                    const fields = _this.getSchema();
                    const counts = {};
                    _this.formElements.forEach(function (elem) {
                        counts[elem.name] = (counts[elem.name] || 0) + 1;
                    });
                    $$w(_this.getForm()).find(".form-group").removeClass("has-error");
                    const errors = [];
                    const reservedFields = [
                        "lat",
                        "lon",
                        "lng",
                        "location",
                        "location_lat",
                        "location_lon",
                        "location_lng",
                        "location_address",
                        "location_img",
                        "marker",
                        "marker_id",
                        "regions",
                        "region_id",
                        "post",
                        "post_title",
                        "post_url",
                        "keywords",
                        "status",
                    ];
                    const reservedFieldsToTypes = {
                        regions: "region",
                        status: "status",
                        post: "post",
                        marker: "marker",
                        location: "location",
                    };
                    let errUnique, errEmpty;
                    _this.formElements.forEach(function (formElement, index) {
                        let err = false;
                        if (!_this.filtersMode) {
                            if (counts[formElement.name] > 1) {
                                if (!errUnique) {
                                    errUnique = "Field names should be unique";
                                    errors.push(errUnique);
                                    err = true;
                                }
                            }
                            else if (formElement.name.length === 0) {
                                if (!errEmpty) {
                                    errEmpty = "Field name can't be empty";
                                    errors.push(errEmpty);
                                    err = true;
                                }
                            }
                            else if (reservedFields.indexOf(formElement.name) != -1) {
                                if (!reservedFieldsToTypes[formElement.name] ||
                                    (reservedFieldsToTypes[formElement.name] &&
                                        reservedFieldsToTypes[formElement.name] != formElement.type)) {
                                    const msg = 'Field name "' +
                                        formElement.name +
                                        '" is reserved, please set another name';
                                    errors.push(msg);
                                    err = true;
                                }
                            }
                        }
                        if (formElement.options &&
                            formElement.type != "region" &&
                            formElement.type != "marker") {
                            const vals = formElement.options.map(function (obj) {
                                return obj.value;
                            });
                            const uniq = [...Array.from(new Set(vals).values())];
                            if (vals.length != uniq.length) {
                                errors.push('Check "Options" list - values should not repeat');
                                err = true;
                            }
                        }
                        err && $$w(formElement.domElements.main).addClass("has-error");
                    });
                    if (errors.length === 0) {
                        _this.events.trigger("saveSchema", _this, [_this, fields]);
                    }
                    else {
                        jQuery.growl.error({ title: "Errors", message: errors.join("<br />") });
                    }
                });
                setTimeout(function () {
                    const el = _this.getForm();
                    _this.sortable = new Sortable(el, {
                        animation: 150,
                        onStart: function () {
                            $$w(_this.getForm()).addClass("sorting");
                        },
                        onEnd: function () {
                            setTimeout(function () {
                                $$w(_this.getForm()).removeClass("sorting");
                                _this.formElements.clear();
                                $$w(el)
                                    .find(".form-group")
                                    .each(function (index, elem) {
                                    _this.formElements.push($$w(elem).data("formElement"));
                                });
                            }, 500);
                        },
                    });
                }, 1000);
            }
            new ResizeSensor(this.view, function () {
                _this.scrollApi && _this.scrollApi.reinitialise();
            });
        }
        clearAllFields() {
            this.formElements.forEach((f) => f.setValue(null));
            this.events.trigger("cleared");
        }
        setFormElementEventHandlers(formElement) {
            if (this.editMode) {
                formElement.events.on("click", (elem) => {
                    this.edit(elem);
                });
                formElement.events.on("delete", (elem) => {
                    this.deleteField(elem);
                });
            }
            else {
                formElement.events.on("changed", (_formElement) => {
                    const name = _formElement.name;
                    const value = _formElement.getValue();
                    if (_formElement.type !== "search") {
                        this.events.trigger("changed.field", _formElement, [_formElement, name, value]);
                    }
                    else {
                        this.events.trigger("changed.search", _formElement, [_formElement, value]);
                    }
                });
            }
        }
        save() {
            const _this = this;
            if (_this.markerBackup) {
                const marker = _this.mapsvg.getEditingMarker();
                marker.events.off("change");
                _this.markerBackup = marker.getOptions();
                _this.mapsvg.unsetEditingMarker();
            }
            const data = _this.getData();
            _this.saved = true;
            this.events.trigger("save", _this, [_this, data]);
        }
        getFormElementByType(type) {
            return this.formElements.find((el) => el.type === type);
        }
        getData() {
            const data = {};
            this.formElements.forEach((formElement) => {
                if (formElement.readonly === false || formElement.type === "id") {
                    const _formElementData = formElement.getData();
                    data[_formElementData.name] = _formElementData.value;
                }
            });
            return data;
        }
        reset() {
            this.formElements.forEach((formElement) => {
                formElement.setValue(null);
            });
        }
        update(data) {
            this.schema.getFields().forEach((field) => {
                const formElement = this.formElements.get(field.name);
                if (formElement) {
                    if (typeof data[field.name] !== "undefined") {
                        if (formElement.getValue() !== data[field.name]) {
                            formElement.setValue(data[field.name]);
                        }
                    }
                    else {
                        formElement.setValue(null);
                    }
                }
            });
        }
        redraw() {
            const _this = this;
            delete _this.markerBackup;
            $$w(this.container).empty();
            $$w(this.getForm()).empty();
            this.formElements.clear();
            this.schema &&
                this.schema.fields.length > 0 &&
                this.schema.fields.forEach((fieldSettings) => {
                    if (this.filtersMode) {
                        if (fieldSettings.type == "distance") {
                            fieldSettings.value = this.data.distance
                                ? this.data.distance
                                : fieldSettings.value !== undefined
                                    ? fieldSettings.value
                                    : null;
                        }
                        else {
                            fieldSettings.value = this.data[fieldSettings.parameterNameShort];
                        }
                    }
                    else {
                        fieldSettings.value = this.data
                            ? this.data[fieldSettings.name]
                            : fieldSettings.value !== undefined
                                ? fieldSettings.value
                                : null;
                    }
                    if (fieldSettings.type == "location" && !this.editMode) {
                        if (fieldSettings.value &&
                            fieldSettings.value.marker &&
                            fieldSettings.value.marker.id) ;
                        this.admin && this.admin.setMode && this.admin.setMode("editMarkers");
                        this.admin && this.admin.enableMarkersMode(true);
                    }
                    else if (fieldSettings.type == "post") {
                        fieldSettings.post = this.data["post"];
                    }
                    else if (fieldSettings.type === "region") {
                        fieldSettings.options = new ArrayIndexed("id", this.getRegionsList());
                    }
                    const formElement = this.formElementFactory.create(fieldSettings);
                    if (this.filtersMode) {
                        if (!this.filtersHide ||
                            (this.filtersHide && this.modal && fieldSettings.type !== "search") ||
                            (!this.modal && fieldSettings.type === "search")) {
                            this.addField(formElement);
                        }
                    }
                    else {
                        this.addField(formElement);
                    }
                });
            if (!_this.editMode) {
                if (this.schema.fields.length === 0 && !this.filtersMode) {
                    const formElement = this.formElementFactory.create({ type: "empty" });
                    _this.addField(formElement);
                }
                else {
                    if (_this.admin && !_this.admin.isMetabox) {
                        const formElement = this.formElementFactory.create({ type: "save" });
                        formElement.events.on("click.btn.save", () => {
                            this.save();
                        });
                        formElement.events.on("click.btn.close", () => {
                            this.close();
                        });
                        _this.addField(formElement);
                    }
                }
            }
            if (_this.filtersMode && _this.filtersHide && !_this.modal) {
                const formElement = this.formElementFactory.create({
                    type: "modal",
                    showButtonText: _this.showButtonText,
                });
                this.showFiltersButton = _this.addField(formElement);
            }
            if (this.scrollable) {
                const nano = $$w('<div class="nano"></div>');
                const nanoContent = $$w('<div class="nano-content"></div>');
                nano.append(nanoContent);
                nanoContent.append(this.view);
                $$w(_this.container).append(nano);
                nano.jScrollPane({ contentWidth: "0px", mouseWheelSpeed: 30 });
                _this.scrollApi = nano.data("jsp");
            }
            else {
                $$w(_this.container).append(this.view);
            }
            if (_this.filtersMode && _this.clearButton) {
                _this.elements.buttons.clearButton = $$w('<div class="form-group mapsvg-filters-reset-container">' +
                    '<button type="button" class="btn btn-outline-secondary mapsvg-filters-reset">' +
                    _this.clearButtonText +
                    "</button></div>")[0];
                $$w(this.getForm()).append(_this.elements.buttons.clearButton);
            }
            if (_this.filtersMode && _this.searchButton) {
                _this.elements.buttons.searchButton = $$w('<div class="form-group mapsvg-filters-reset-container" id="mapsvg-search-container"><button class="btn btn-outline-secondary mapsvg-filters-reset">' +
                    _this.searchButtonText +
                    "</button></div>")[0];
                $$w(this.getForm()).append(_this.elements.buttons.searchButton);
            }
            if (!this.editMode && !_this.filtersMode)
                $$w(this.view).find("input:visible,textarea:visible").not(".tt-hint").first().focus();
            const cm = $$w(this.container).find(".CodeMirror");
            cm.each(function (index, el) {
                el && el.CodeMirror.refresh();
            });
            _this.setEventHandlers();
            this.events.trigger("init", this, [this, this.getData()]);
            this.events.trigger("loaded", this, [this]);
        }
        updateExtraParamsInFormElements() {
            this.formElements.forEach((formElement) => {
                formElement.setExternal(this.formElementFactory.getExtraParams());
                if (formElement.type === "location") {
                    formElement.redraw();
                }
            });
        }
        deleteField(formElement) {
            const _this = this;
            _this.formElements.delete(formElement.name);
        }
        getExtraParams() {
            const databaseFields = [];
            this.mapsvg.objectsRepository
                .getSchema()
                .getFields()
                .forEach(function (obj) {
                if (obj.type == "text" ||
                    obj.type == "region" ||
                    obj.type == "textarea" ||
                    obj.type == "post" ||
                    obj.type == "select" ||
                    obj.type == "radio" ||
                    obj.type == "checkbox") {
                    if (obj.type == "post") {
                        databaseFields.push("Object.post.post_title");
                    }
                    else {
                        databaseFields.push("Object." + obj.name);
                    }
                }
            });
            let databaseFieldsFilterableShort = [];
            databaseFieldsFilterableShort = this.mapsvg.objectsRepository
                .getSchema()
                .getFieldsAsArray()
                .filter(function (obj) {
                return obj.type == "select" || obj.type == "radio" || obj.type == "region";
            })
                .map(function (obj) {
                return obj.name;
            });
            let markerFieldsShort = [];
            markerFieldsShort = databaseFieldsFilterableShort.filter((o) => o.type === "select" || o.type === "radio");
            const regionFields = this.mapsvg.regionsRepository
                .getSchema()
                .getFieldsAsArray()
                .map(function (obj) {
                if (obj.type == "status" ||
                    obj.type == "text" ||
                    obj.type == "textarea" ||
                    obj.type == "post" ||
                    obj.type == "select" ||
                    obj.type == "radio" ||
                    obj.type == "checkbox") {
                    if (obj.type == "post") {
                        return "Region.post.post_title";
                    }
                    else {
                        return "Region." + obj.name;
                    }
                }
            });
            return {
                databaseFields: databaseFields,
                databaseFieldsFilterableShort: databaseFieldsFilterableShort,
                regionFields: regionFields,
                markerFieldsShort: markerFieldsShort,
            };
        }
        addField(formElement) {
            const _this = this;
            if (["region", "marker", "post", "status", "distance", "location", "search"].indexOf(formElement.type) != -1) {
                let repeat = false;
                _this.formElements.forEach(function (control) {
                    if (control.type == formElement.type)
                        repeat = true;
                });
                if (repeat) {
                    jQuery.growl.error({
                        title: "Error",
                        message: 'You can add only 1 "' + MapSVG.ucfirst(formElement.type) + '" field',
                    });
                    return;
                }
            }
            _this.formElements.push(formElement);
            _this.getForm().append(formElement.domElements.main);
            this.setFormElementEventHandlers(formElement);
            if (this.editMode) {
                if (formElement.protected) {
                    formElement.hide();
                }
                else {
                    this.edit(formElement);
                }
            }
            return formElement;
        }
        edit(formElement) {
            const _this = this;
            _this.currentlyEditing && _this.currentlyEditing.destroyEditor();
            this.getFormEditor().appendChild(formElement.getEditor());
            formElement.initEditor();
            _this.currentlyEditing = formElement;
            $$w(_this.getForm()).find(".form-group.active").removeClass("active");
            $$w(formElement.domElements.main).addClass("active");
        }
        get() {
        }
        getSchema() {
            return this.formElements.map(function (formElement) {
                return formElement.getSchema();
            });
        }
        close() {
            this.formElements.forEach((formElement) => formElement.destroy());
            this.mediaUploader && this.mediaUploader.off("select");
            MapSVG.formBuilder = null;
            this.events.trigger("close", this, [this]);
        }
        destroy() {
            $$w(this.view).empty().remove();
            this.sortable = null;
        }
        toJSON(addEmpty) {
            const obj = {};
            function add(obj, name, value) {
                if (!addEmpty && !value)
                    return false;
                if (name.length == 1) {
                    obj[name[0]] = value;
                }
                else {
                    if (obj[name[0]] == null) {
                        if (name[1] === "") {
                            obj[name[0]] = [];
                        }
                        else {
                            obj[name[0]] = {};
                        }
                    }
                    if (obj[name[0]].length !== undefined) {
                        obj[name[0]].push(value);
                    }
                    else {
                        add(obj[name[0]], name.slice(1), value);
                    }
                }
            }
            $$w(this.elements.containers.formView)
                .find("input, textarea, select")
                .each(function () {
                if (!$$w(this).data("skip") &&
                    !$$w(this).prop("disabled") &&
                    $$w(this).attr("name") &&
                    !(!addEmpty &&
                        $$w(this).attr("type") == "checkbox" &&
                        $$w(this).attr("checked") == undefined) &&
                    !($$w(this).attr("type") == "radio" && $$w(this).attr("checked") == undefined)) {
                    let value;
                    if ($$w(this).attr("type") == "checkbox") {
                        value = $$w(this).prop("checked");
                    }
                    else {
                        value = $$w(this).val();
                    }
                    add(obj, $$w(this).attr("name").replace(/]/g, "").split("["), value);
                }
            });
            return obj;
        }
        getRegionsList() {
            return this.mapsvg.regions.map(function (r) {
                return { id: r.id, title: r.title };
            });
        }
        getRegionsAsArray() {
            return this.mapsvg.regions;
        }
        setRegions(location) {
            const regionsFormElement = this.formElements.get("regions");
            if (this.mapsvg.options.source.indexOf("/geo-calibrated/usa.svg") !== -1) {
                regionsFormElement.setValue(["US-" + location.address.state_short]);
            }
            else if (this.mapsvg.options.source.indexOf("/geo-calibrated/world.svg") !== -1) {
                if (location.address.country_short) {
                    regionsFormElement.setValue([location.address.country_short]);
                }
            }
            else {
                if (location.address.administrative_area_level_1) {
                    this.mapsvg.regions.forEach((_region) => {
                        if (_region.title === location.address.administrative_area_level_1 ||
                            _region.title === location.address.administrative_area_level_2 ||
                            _region.id ===
                                location.address.country_short +
                                    "-" +
                                    location.address.administrative_area_level_1_short) {
                            regionsFormElement.setValue([_region.id]);
                        }
                    });
                }
            }
        }
    }

    const $$x = jQuery;
    class FiltersController extends DetailsController {
        constructor(options) {
            super(options);
            this.showButtonText = options.showButtonText;
            this.clearButton = options.clearButton;
            this.clearButtonText = options.clearButtonText;
            this.searchButton = options.searchButton;
            this.searchButtonText = options.searchButtonText;
            this.padding = options.padding;
            this.schema = options.schema;
            this.hideFilters = options.hide;
            this.query = options.query;
        }
        viewDidLoad() {
            super.viewDidLoad();
            const _this = this;
            this.formBuilder = new FormBuilder({
                container: this.containers.contentView,
                filtersMode: true,
                schema: this.schema,
                modal: this.modal,
                filtersHide: this.hideFilters,
                showButtonText: this.showButtonText,
                clearButton: this.clearButton,
                clearButtonText: this.clearButtonText,
                searchButton: this.searchButton,
                searchButtonText: this.searchButtonText,
                editMode: false,
                mapsvg: this.mapsvg,
                data: {},
                admin: false,
                events: {
                    "changed.field": (formElement, field, value) => {
                        const filters = {};
                        let _value = value;
                        if (field === "regions") {
                            _value = {};
                            _value.region_ids = value instanceof Array ? value : [value];
                            _value.table_name = this.mapsvg.options.database.regionsTableName;
                            if (_value.region_ids.length === 0 || _value.region_ids[0] === "") {
                                _value = null;
                            }
                        }
                        filters[field] = _value;
                        this.query.setFilters(filters);
                        _this.events.trigger("changed.field", _this, [field, value]);
                        _this.events.trigger("changed.fields", _this, [field, value]);
                    },
                    "changed.search": (formElement, value) => {
                        this.query.setSearch(value);
                        _this.events.trigger("changed.search", _this, [value]);
                    },
                    cleared: (formBuilder) => {
                        this.query.clearFilters();
                        this.events.trigger("cleared", _this, []);
                    },
                    loaded: (formBuilder) => {
                        $$x(formBuilder.container).find(".mapsvg-form-builder").css({
                            padding: _this.padding,
                        });
                        this.updateScroll();
                        this.events.trigger("loaded");
                    },
                },
            });
        }
        reset() {
            this.formBuilder && this.formBuilder.reset();
        }
        update(query) {
            const _query = Object.assign({}, query.filters);
            _query.search = query.search;
            this.formBuilder && this.formBuilder.update(_query);
        }
        setFiltersCounter() {
            if (this.hideFilters) {
                const filtersCounter = Object.keys(this.query.filters).length;
                const filtersCounterString = filtersCounter === 0 ? "" : filtersCounter.toString();
                this.formBuilder &&
                    this.formBuilder.showFiltersButton &&
                    $$x(this.formBuilder.showFiltersButton.domElements.main)
                        .find("button")
                        .html(this.showButtonText + " <b>" + filtersCounterString + "</b>");
            }
        }
        setEventHandlers() {
            super.setEventHandlers();
            const _this = this;
            $$x(this.containers.view).on("click", ".mapsvg-btn-show-filters", function () {
                _this.events.trigger("click.btn.showFilters");
            });
            $$x(this.containers.view).on("click", "#mapsvg-search-container", function () {
                _this.events.trigger("click.btn.searchButton");
            });
        }
    }

    const $$y = jQuery;
    class PopoverController extends Controller {
        constructor(options) {
            super(options);
            this.autoresize = true;
            this.point = options.point;
            this.yShift = options.yShift;
            this.mapObject = options.mapObject;
            this.id = this.mapObject.id + "_" + Math.random();
            $$y(this.containers.main).data("popover-id", this.id);
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
                this.mobileCloseBtn = $$y('<button class="mapsvg-mobile-modal-close mapsvg-btn">' +
                    this.mapsvg.getData().options.mobileView.labelClose +
                    "</button>")[0];
                $$y(this.containers.view).append(this.mobileCloseBtn);
            }
            this.adjustScreenPosition();
            $$y(this.containers.main).toggleClass("mapsvg-popover-animate", true);
            $$y(this.containers.main).toggleClass("mapsvg-popover-visible", true);
            this.adjustHeight();
            this.updateScroll();
            this.autoresize && this.resizeSensor.setScroll();
            this.events.trigger("shown", this, [this]);
        }
        adjustHeight() {
            $$y(this.containers.main).height($$y(this.containers.main).find(".mapsvg-auto-height").outerHeight() +
                (this.containers.toolbar ? $$y(this.containers.toolbar).outerHeight() : 0));
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
            $$y(this.containers.main).css({
                transform: "translateX(-50%) translate(" + x + "px," + y + "px)",
            });
        }
        setEventHandlers() {
            $$y("body").off(".popover.mapsvg");
            $$y(this.containers.view).on("click touchend", ".mapsvg-popover-close, .mapsvg-mobile-modal-close", (e) => {
                e.stopImmediatePropagation();
                this.close();
            });
            $$y("body").on("mouseup.popover.mapsvg touchend.popover.mapsvg", (e) => {
                if (this.mapsvg.isScrolling ||
                    $$y(e.target).closest(".mapsvg-directory").length ||
                    $$y(e.target).closest(".mapsvg-popover").length ||
                    $$y(e.target).hasClass("mapsvg-btn-map"))
                    return;
                this.close();
            });
        }
        close() {
            if ($$y(this.containers.main).data("popover-id") != this.id ||
                !$$y(this.containers.main).is(":visible"))
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
            $$y(this.containers.main).toggleClass("mapsvg-popover-animate", false);
            $$y(this.containers.main).toggleClass("mapsvg-popover-visible", false);
            super.destroy.call(this);
        }
        show() {
            $$y(this.containers.main).toggleClass("mapsvg-popover-animate", true);
            $$y(this.containers.main).toggleClass("mapsvg-popover-visible", true);
        }
    }

    const $$z = jQuery;
    class Tooltip extends Controller {
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
            $$z("body")
                .off(event)
                .on(event, (e) => {
                MapSVG.mouse = MapSVG.mouseCoords(e);
                this.containers.main.style.left =
                    e.clientX +
                        $$z(window).scrollLeft() -
                        $$z(this.mapsvg.containers.map).offset().left +
                        "px";
                this.containers.main.style.top =
                    e.clientY +
                        $$z(window).scrollTop() -
                        $$z(this.mapsvg.containers.map).offset().top +
                        "px";
                const m = new ScreenPoint(e.clientX + $$z(window).scrollLeft(), e.clientY + $$z(window).scrollTop());
                const _tbbox = this.containers.main.getBoundingClientRect();
                const _mbbox = this.mapsvg.containers.wrap.getBoundingClientRect();
                const tbbox = {
                    top: _tbbox.top + $$z(window).scrollTop(),
                    bottom: _tbbox.bottom + $$z(window).scrollTop(),
                    left: _tbbox.left + $$z(window).scrollLeft(),
                    right: _tbbox.right + $$z(window).scrollLeft(),
                    width: _tbbox.width,
                    height: _tbbox.height,
                };
                const mbbox = {
                    top: _mbbox.top + $$z(window).scrollTop(),
                    bottom: _mbbox.bottom + $$z(window).scrollTop(),
                    left: _mbbox.left + $$z(window).scrollLeft(),
                    right: _mbbox.right + $$z(window).scrollLeft(),
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
                let pos = $$z.extend({}, this.posOriginal, this.posShifted);
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

    const $$A = jQuery;
    class MapSVGMap {
        constructor(containerId, mapParams, externalParams) {
            this.markerOptions = { src: MapSVG.urls.root + "markers/pin1_red.png" };
            const options = mapParams.options;
            this.updateOutdatedOptions(options);
            this.dirtyFields = [];
            this.containerId = containerId;
            this.options = $$A.extend(true, {}, DefaultOptions, options);
            this.options.source = this.urlToRelativePath(this.options.source);
            this.editMode = this.options.editMode;
            delete this.options.editMode;
            this.id = mapParams.id;
            this.svgFileLastChanged = mapParams.svgFileLastChanged;
            this.regions = new ArrayIndexed("id");
            this.objects = new ArrayIndexed("id");
            this.events = new Events(this);
            this.highlightedRegions = [];
            this.editRegions = { on: false };
            this.editMarkers = { on: false };
            this.editData = { on: false };
            this.controllers = {};
            this.containers = {
                map: document.getElementById(this.containerId),
                scrollpane: $$A('<div class="mapsvg-scrollpane"></div>')[0],
                scrollpaneWrap: $$A('<div class="mapsvg-scrollpane-wrap"></div>')[0],
                layers: $$A('<div class="mapsvg-layers-wrap"></div>')[0],
            };
            this.containers.map.appendChild(this.containers.layers);
            this.containers.map.appendChild(this.containers.scrollpaneWrap);
            this.containers.scrollpaneWrap.appendChild(this.containers.scrollpane);
            this.whRatio = 0;
            this.isScrolling = false;
            this.markerOptions = {};
            this.svgDefault = {};
            this.scale = 1;
            this._scale = 1;
            this.selected_id = [];
            this.regions = new ArrayIndexed("id");
            if (!this.options.database.regionsTableName) {
                this.options.database.regionsTableName = "regions_" + this.id;
            }
            if (!this.options.database.objectsTableName) {
                this.options.database.objectsTableName = "objects_" + this.id;
            }
            this.regionsRepository = new Repository("region", "regions/" + this.options.database.regionsTableName);
            this.regionsRepository.query.update({ perpage: 0 });
            this.objectsRepository = new Repository("object", "objects/" + this.options.database.objectsTableName);
            if (this.options.database.noFiltersNoLoad) {
                this.objectsRepository.setNoFiltersNoLoad(true);
            }
            this.objectsRepository.query.update({
                perpage: this.options.database.pagination.on
                    ? this.options.database.pagination.perpage
                    : 0,
            });
            this.schemaRepository = new SchemaRepository();
            this.markers = new ArrayIndexed("id");
            this.markersClusters = new ArrayIndexed("id");
            this._viewBox = new ViewBox(0, 0, 0, 0);
            this.viewBox = new ViewBox(0, 0, 0, 0);
            this.zoomLevel = 0;
            this.scroll = {
                tx: 0,
                ty: 0,
                vxi: 0,
                vyi: 0,
                x: 0,
                y: 0,
                dx: 0,
                dy: 0,
                vx: 0,
                vy: 0,
                gx: 0,
                gy: 0,
                touchScrollStart: 0,
            };
            this.layers = {};
            this.geoCoordinates = false;
            this.geoViewBox = new GeoViewBox(new GeoPoint(0, 0), new GeoPoint(0, 0));
            this.eventsPreventList = {};
            this.googleMaps = {
                loaded: false,
                initialized: false,
                map: null,
                zoomLimit: true,
                maxZoomService: null,
            };
            this.afterLoadBlockers = 1;
            this.loaded = false;
            if (this.id) {
                this.afterLoadBlockers += 2;
            }
            if (this.options.googleMaps.on) {
                this.afterLoadBlockers++;
            }
            if (this.filtersShouldBeShown()) {
                this.afterLoadBlockers++;
            }
            this.init();
        }
        urlToRelativePath(url) {
            if (url.indexOf("//") === 0)
                url = url.replace(/^\/\/[^/]+/, "").replace("//", "/");
            else
                url = url.replace(/^.*:\/\/[^/]+/, "").replace("//", "/");
            return url;
        }
        setGroups(groups) {
            const _this = this;
            if (!this.groups) {
                _this.groups = new ArrayIndexed("id", _this.options.groups, {
                    autoId: true,
                    unique: true,
                });
            }
            else {
                this.options.groups = this.groups;
            }
            _this.groups.forEach(function (g) {
                g.objects &&
                    g.objects.length &&
                    g.objects.forEach(function (obj) {
                        _this.containers.svg
                            .querySelector("#" + obj.value)
                            .classList.toggle("mapsvg-hidden", !g.visible);
                    });
            });
        }
        getGroupSelectOptions() {
            const _this = this;
            const optionGroups = [];
            const options = [];
            const options2 = [];
            $$A(_this.containers.svg)
                .find("g")
                .each(function (index) {
                const id = $$A(this)[0].getAttribute("id");
                if (id) {
                    const title = $$A(this)[0].getAttribute("title");
                    options.push({ label: title || id, value: id });
                }
            });
            optionGroups.push({ title: "SVG Layers / Groups", options: options });
            $$A(_this.containers.svg)
                .find("path,ellipse,circle,polyline,polygon,rectangle,img,text")
                .each(function (index) {
                const id = $$A(this)[0].getAttribute("id");
                if (id) {
                    const title = $$A(this)[0].getAttribute("title");
                    options2.push({ label: title || id, value: id });
                }
            });
            optionGroups.push({ title: "Other SVG objects", options: options2 });
            return optionGroups;
        }
        setLayersControl(options) {
            const _this = this;
            if (options)
                $$A.extend(true, this.options.layersControl, options);
            if (this.options.layersControl.on) {
                if (!this.containers.layersControl) {
                    this.containers.layersControl = document.createElement("div");
                    this.containers.layersControl.classList.add("mapsvg-layers-control");
                    this.containers.layersControlLabel = document.createElement("div");
                    this.containers.layersControlLabel.classList.add("mapsvg-layers-label");
                    this.containers.layersControl.appendChild(this.containers.layersControlLabel);
                    const layersControlWrap = document.createElement("div");
                    layersControlWrap.classList.add("mapsvg-layers-list-wrap");
                    this.containers.layersControl.appendChild(layersControlWrap);
                    this.containers.layersControlListNano = document.createElement("div");
                    this.containers.layersControlListNano.classList.add("nano");
                    layersControlWrap.appendChild(this.containers.layersControlListNano);
                    this.containers.layersControlList = document.createElement("div");
                    this.containers.layersControlList.classList.add("mapsvg-layers-list");
                    this.containers.layersControlList.classList.add("nano-content");
                    this.containers.layersControlListNano.appendChild(this.containers.layersControlList);
                    this.containers.mapContainer.appendChild(this.containers.layersControl);
                }
                this.containers.layersControl.style.display = "block";
                this.containers.layersControlLabel.innerHTML = this.options.layersControl.label;
                this.containers.layersControlLabel.style.display = "block";
                this.containers.layersControlList.innerHTML = "";
                while (this.containers.layersControlList.firstChild) {
                    this.containers.layersControlList.removeChild(this.containers.layersControlList.firstChild);
                }
                this.containers.layersControl.classList.remove("mapsvg-top-left", "mapsvg-top-right", "mapsvg-bottom-left", "mapsvg-bottom-right");
                this.containers.layersControl.classList.add("mapsvg-" + this.options.layersControl.position);
                if (this.options.menu.on &&
                    !this.options.menu.customContainer &&
                    this.options.layersControl.position.indexOf("left") !== -1) {
                    this.containers.layersControl.style.left = this.options.menu.width;
                }
                this.containers.layersControl.style.maxHeight = this.options.layersControl.maxHeight;
                this.options.groups.forEach((g) => {
                    const item = document.createElement("div");
                    item.classList.add("mapsvg-layers-item");
                    item.setAttribute("data-group-id", g.id);
                    item.innerHTML =
                        '<input type="checkbox" class="ios8-switch ios8-switch-sm" ' +
                            (g.visible ? "checked" : "") +
                            " /><label>" +
                            g.title +
                            "</label>";
                    this.containers.layersControlList.appendChild(item);
                });
                $$A(this.containers.layersControlListNano).nanoScroller({
                    preventPageScrolling: true,
                    iOSNativeScrolling: true,
                });
                $$A(this.containers.layersControl).off();
                $$A(this.containers.layersControl).on("click", ".mapsvg-layers-item", function () {
                    const id = $$A(this).data("group-id");
                    const input = $$A(this).find("input");
                    input.prop("checked", !input.prop("checked"));
                    _this.groups.forEach(function (g) {
                        if (g.id === id)
                            g.visible = !g.visible;
                    });
                    _this.setGroups();
                });
                $$A(this.containers.layersControlLabel).off();
                $$A(this.containers.layersControlLabel).on("click", () => {
                    $$A(_this.containers.layersControl).toggleClass("closed");
                });
                $$A(this.containers.layersControl).toggleClass("closed", !this.options.layersControl.expanded);
            }
            else {
                if (this.containers.layersControl) {
                    this.containers.layersControl.style.display = "none";
                }
            }
        }
        loadDataObjects(params) {
            return this.objectsRepository.find(params);
        }
        loadDirectory() {
            if (!this.editMode &&
                this.options.menu.source === "database" &&
                !this.objectsRepository.loaded) {
                return;
            }
            if (this.options.menu.on) {
                this.controllers.directory.loadItemsToDirectory();
            }
            this.setPagination();
        }
        setPagination() {
            const _this = this;
            this.containers.pagerMap && $$A(this.containers.pagerMap).empty().remove();
            this.containers.pagerDir && $$A(this.containers.pagerDir).empty().remove();
            if (_this.options.database.pagination.on &&
                _this.options.database.pagination.perpage !== 0) {
                this.containers.directory.classList.toggle("mapsvg-with-pagination", ["directory", "both"].indexOf(_this.options.database.pagination.showIn) !== -1);
                this.containers.map.classList.toggle("mapsvg-with-pagination", ["map", "both"].indexOf(_this.options.database.pagination.showIn) !== -1);
                if (_this.options.menu.on) {
                    this.containers.pagerDir = _this.getPagination();
                    _this.controllers.directory.addPagination(this.containers.pagerDir);
                }
                this.containers.pagerMap = _this.getPagination();
                this.containers.map.appendChild(this.containers.pagerMap);
            }
        }
        getPagination(callback) {
            const _this = this;
            const pager = $$A('<nav class="mapsvg-pagination"><ul class="pager"><!--<li class="mapsvg-first"><a href="#">First</a></li>--><li class="mapsvg-prev"><a href="#">&larr; ' +
                _this.options.database.pagination.prev +
                " " +
                _this.options.database.pagination.perpage +
                '</a></li><li class="mapsvg-next"><a href="#">' +
                _this.options.database.pagination.next +
                " " +
                _this.options.database.pagination.perpage +
                ' &rarr;</a></li><!--<li class="mapsvg-last"><a href="#">Last</a></li>--></ul></nav>');
            if (this.objectsRepository.onFirstPage() && this.objectsRepository.onLastPage()) {
                pager.hide();
            }
            else {
                pager.find(".mapsvg-prev").removeClass("disabled");
                pager.find(".mapsvg-first").removeClass("disabled");
                pager.find(".mapsvg-last").removeClass("disabled");
                pager.find(".mapsvg-next").removeClass("disabled");
                this.objectsRepository.onLastPage() &&
                    pager.find(".mapsvg-next").addClass("disabled") &&
                    pager.find(".mapsvg-last").addClass("disabled");
                this.objectsRepository.onFirstPage() &&
                    pager.find(".mapsvg-prev").addClass("disabled") &&
                    pager.find(".mapsvg-first").addClass("disabled");
            }
            pager
                .on("click", ".mapsvg-next:not(.disabled)", (e) => {
                e.preventDefault();
                if (this.objectsRepository.onLastPage())
                    return;
                const query = new Query({ page: this.objectsRepository.query.page + 1 });
                this.objectsRepository.find(query).done(function () {
                    callback && callback();
                });
            })
                .on("click", ".mapsvg-prev:not(.disabled)", function (e) {
                e.preventDefault();
                if (_this.objectsRepository.onFirstPage())
                    return;
                const query = new Query({ page: _this.objectsRepository.query.page - 1 });
                _this.objectsRepository.find(query).done(function () {
                    callback && callback();
                });
            })
                .on("click", ".mapsvg-first:not(.disabled)", function (e) {
                e.preventDefault();
                if (_this.objectsRepository.onFirstPage())
                    return;
                const query = new Query({ page: 1 });
                _this.objectsRepository.find(query).done(function () {
                    callback && callback();
                });
            })
                .on("click", ".mapsvg-last:not(.disabled)", function (e) {
                e.preventDefault();
                if (_this.objectsRepository.onLastPage())
                    return;
                const query = new Query({ lastpage: true });
                _this.objectsRepository.find(query).done(function () {
                    callback && callback();
                });
            });
            return pager[0];
        }
        deleteMarkers() {
            while (this.markers.length) {
                this.markerDelete(this.markers[0]);
            }
        }
        deleteClusters() {
            if (this.markersClusters) {
                this.markersClusters.forEach(function (markerCluster) {
                    markerCluster.destroy();
                });
                this.markersClusters.clear();
            }
        }
        addLocations() {
            const _this = this;
            this.firstDataLoad = this.firstDataLoad === undefined;
            let locationField = this.objectsRepository.getSchema().getFieldByType("location");
            if (!locationField) {
                return;
            }
            locationField = locationField.name;
            if (locationField) {
                if (this.firstDataLoad) {
                    this.setMarkerImagesDependency();
                }
                _this.deleteMarkers();
                _this.deleteClusters();
                _this.clusters = {};
                _this.clustersByZoom = [];
                if (this.objectsRepository.getLoaded().length > 0) {
                    this.objectsRepository.getLoaded().forEach(function (object) {
                        if (object[locationField]) {
                            if (object[locationField].img &&
                                (object[locationField].geoPoint || object[locationField].svgPoint)) {
                                new Marker({
                                    location: object[locationField],
                                    object: object,
                                    mapsvg: _this,
                                });
                            }
                        }
                    });
                    if (_this.options.clustering.on) {
                        _this.startClusterizer();
                    }
                    else {
                        this.objectsRepository.getLoaded().forEach(function (object) {
                            if (object.location && object.location.marker) {
                                _this.markerAdd(object.location.marker);
                            }
                        });
                        _this.mayBeFitMarkers();
                    }
                }
            }
        }
        addClustersFromWorker(zoomLevel, clusters) {
            const _this = this;
            _this.clustersByZoom[zoomLevel] = [];
            for (const cell in clusters) {
                const markers = clusters[cell].markers.map(function (marker) {
                    return _this.objectsRepository.objects.findById(marker.id).location.marker;
                });
                _this.clustersByZoom[zoomLevel].push(new MarkerCluster({
                    markers: markers,
                    svgPoint: new SVGPoint(clusters[cell].x, clusters[cell].y),
                    cellX: clusters[cell].cellX,
                    cellY: clusters[cell].cellY,
                }, _this));
            }
            if (_this.zoomLevel === zoomLevel) {
                _this.clusterizeMarkers();
            }
        }
        startClusterizer() {
            if (!this.objectsRepository || this.objectsRepository.getLoaded().length === 0) {
                return;
            }
            const locationField = this.objectsRepository.getSchema().getFieldByType("location");
            if (!locationField) {
                return false;
            }
            if (!this.clusterizerWorker) {
                this.clusterizerWorker = new Worker(MapSVG.urls.root + "js/mapsvg/Core/clustering.js");
                this.clusterizerWorker.onmessage = (evt) => {
                    if (evt.data.clusters) {
                        this.addClustersFromWorker(evt.data.zoomLevel, evt.data.clusters);
                    }
                };
            }
            const objectsData = [];
            this.objectsRepository
                .getLoaded()
                .filter((o) => {
                return o.location && o.location.marker;
            })
                .forEach((o) => {
                objectsData.push({
                    id: o.id,
                    x: o.location.marker.svgPoint.x,
                    y: o.location.marker.svgPoint.y,
                });
            });
            this.clusterizerWorker.postMessage({
                objects: objectsData,
                cellSize: 50,
                mapWidth: this.containers.map.clientWidth,
                zoomLevels: this.zoomLevels,
                zoomLevel: this.zoomLevel,
                zoomDelta: this.zoomDelta,
                svgViewBox: this.svgDefault.viewBox,
            });
            this.events.on("zoom", () => {
                this.clusterizerWorker.postMessage({
                    message: "zoom",
                    zoomLevel: this.zoomLevel,
                });
            });
        }
        clusterizeMarkers(skipFitMarkers) {
            $$A(this.layers.markers)
                .children()
                .each((i, obj) => {
                $$A(obj).detach();
            });
            this.markers.clear();
            this.markersClusters.clear();
            this.clustersByZoom &&
                this.clustersByZoom[this.zoomLevel] &&
                this.clustersByZoom[this.zoomLevel].forEach((cluster) => {
                    if (this.options.googleMaps.on &&
                        this.googleMaps.map &&
                        this.googleMaps.map.getZoom() >= 17) {
                        this.markerAdd(cluster.markers[0]);
                    }
                    else {
                        if (cluster.markers.length > 1) {
                            this.markersClusterAdd(cluster);
                        }
                        else {
                            this.markerAdd(cluster.markers[0]);
                        }
                    }
                });
            if (this.editingMarker) {
                this.markerAdd(this.editingMarker);
            }
            if (!skipFitMarkers) {
                this.mayBeFitMarkers();
            }
            if (this.options.labelsMarkers.on) {
                this.setLabelsMarkers();
            }
        }
        getCssUrl() {
            return MapSVG.urls.root + "css/mapsvg.css";
        }
        isGeo() {
            return this.mapIsGeo;
        }
        functionFromString(string) {
            let func;
            let error;
            const fn = string.trim();
            if (fn.indexOf("{") == -1 || fn.indexOf("function") !== 0 || fn.indexOf("(") == -1) {
                return new SyntaxError("MapSVG user function error: no function body.");
            }
            const fnBody = fn.substring(fn.indexOf("{") + 1, fn.lastIndexOf("}"));
            const params = fn.substring(fn.indexOf("(") + 1, fn.indexOf(")"));
            try {
                func = new Function(params, fnBody);
            }
            catch (err) {
                error = err;
            }
            if (!error)
                return func;
            else
                return error;
        }
        getOptions(forTemplate, forWeb) {
            const options = $$A.extend(true, {}, this.options);
            function clearEmpties(o) {
                for (const k in o) {
                    if (!o[k] || typeof o[k] !== "object") {
                        continue;
                    }
                    clearEmpties(o[k]);
                    if (Object.keys(o[k]).length === 0) {
                        delete o[k];
                    }
                }
            }
            clearEmpties(options.regions);
            $$A.extend(true, options, this.optionsDelta);
            options.viewBox = this._viewBox.toArray();
            options.filtersSchema = this.filtersSchema.getFieldsAsArray();
            if (options.filtersSchema.length > 0) {
                options.filtersSchema.forEach((field) => {
                    if (field.type === "distance") {
                        field.value = "";
                    }
                });
            }
            delete options.markers;
            if (forTemplate) {
                options.svgFilename = options.source.split("/").pop();
                options.svgFiles = MapSVG.svgFiles;
            }
            if (forWeb)
                $$A.each(options, (key, val) => {
                    if (JSON.stringify(val) == JSON.stringify(this.defaults[key]))
                        delete options[key];
                });
            delete options.backend;
            return options;
        }
        restoreDeltaOptions() {
            this.update(this.optionsDelta);
            this.optionsDelta = {};
        }
        setEvents(functions) {
            let compiledFunction;
            for (const eventName in functions) {
                if (typeof functions[eventName] === "string") {
                    compiledFunction =
                        functions[eventName] != ""
                            ? this.functionFromString(functions[eventName])
                            : null;
                    if (!compiledFunction ||
                        compiledFunction.error ||
                        compiledFunction instanceof TypeError ||
                        compiledFunction instanceof SyntaxError) {
                        continue;
                    }
                }
                else if (typeof functions[eventName] === "function") {
                    compiledFunction = functions[eventName];
                }
                this.events.off(eventName);
                this.events.on(eventName, compiledFunction);
                if (eventName.indexOf("directory") !== -1) {
                    const event = eventName.split(".")[0];
                    if (this.controllers && this.controllers.directory) {
                        this.controllers.directory.events.off(event);
                        this.controllers.directory.events.on(event, compiledFunction);
                    }
                }
            }
            $$A.extend(true, this.options.events, functions);
        }
        setActions(options) {
            $$A.extend(true, this.options.actions, options);
        }
        setDetailsView(options) {
            options = options || this.options.detailsView || {};
            $$A.extend(true, this.options.detailsView, options);
            if (this.options.detailsView.location === "top" && this.options.menu.position === "left") {
                this.options.detailsView.location = "leftSidebar";
            }
            else if (this.options.detailsView.location === "top" &&
                this.options.menu.position === "right") {
                this.options.detailsView.location = "rightSidebar";
            }
            if (this.options.detailsView.location === "near" ||
                this.options.detailsView.location === "mapContainer") {
                this.options.detailsView.location = "map";
            }
            if (!this.containers.detailsView) {
                this.containers.detailsView = $$A('<div class="mapsvg-details-container"></div>')[0];
            }
            $$A(this.containers.detailsView).toggleClass("mapsvg-details-container-relative", !(MapSVG.isPhone && this.options.detailsView.mobileFullscreen) &&
                !this.shouldBeScrollable(this.options.detailsView.location));
            if (this.options.detailsView.location === "custom") {
                $$A("#" + this.options.detailsView.containerId).append($$A(this.containers.detailsView));
            }
            else {
                if (MapSVG.isPhone && this.options.detailsView.mobileFullscreen) {
                    $$A("body").append($$A(this.containers.detailsView));
                    $$A(this.containers.detailsView).addClass("mapsvg-container-fullscreen");
                }
                else {
                    this.containers[this.options.detailsView.location].append(this.containers.detailsView);
                }
                if (this.options.detailsView.margin) {
                    $$A(this.containers.detailsView).css("margin", this.options.detailsView.margin);
                }
                $$A(this.containers.detailsView).css("width", this.options.detailsView.width);
            }
        }
        setMobileView(options) {
            $$A.extend(true, this.options.mobileView, options);
        }
        attachDataToRegions(object) {
            this.regions.forEach(function (region) {
                region.objects = [];
            });
            this.objectsRepository.getLoaded().forEach((obj, index) => {
                const regions = obj.getRegionsForTable(this.options.database.regionsTableName);
                if (regions && regions.length) {
                    regions.forEach((region) => {
                        const r = this.getRegion(region.id);
                        if (r)
                            r.objects.push(obj);
                    });
                }
            });
        }
        setTemplates(templates) {
            this.templates = this.templates || {};
            for (let name in templates) {
                if (name != undefined) {
                    this.options.templates[name] = templates[name];
                    let t = this.options.templates[name];
                    if (name == "directoryItem" || name == "directoryCategoryItem") {
                        const dirItemTemplate = this.options.templates.directoryItem;
                        t =
                            '{{#each items}}<div id="mapsvg-directory-item-{{#if id_no_spaces}}{{id_no_spaces}}{{else}}{{id}}{{/if}}" class="mapsvg-directory-item" data-object-id="{{id}}">' +
                                dirItemTemplate +
                                "</div>{{/each}}";
                        if (this.options.menu.categories &&
                            this.options.menu.categories.on &&
                            this.options.menu.categories.groupBy) {
                            const t2 = this.options.templates["directoryCategoryItem"];
                            t =
                                '{{#each items}}{{#with category}}<div id="mapsvg-category-item-{{value}}" class="mapsvg-category-item" data-category-value="{{value}}">' +
                                    t2 +
                                    '</div><div class="mapsvg-category-block" data-category-id="{{value}}">{{/with}}' +
                                    t +
                                    "</div>{{/each}}";
                        }
                        name = "directory";
                    }
                    try {
                        this.options.templates[name] = t;
                        this.templates[name] = Handlebars.compile(t, { strict: false });
                    }
                    catch (err) {
                        console.error(err);
                        this.templates[name] = Handlebars.compile("", { strict: false });
                    }
                    if (this.editMode &&
                        (name == "directory" || name == "directoryCategoryItem") &&
                        this.controllers &&
                        this.controllers.directory) {
                        this.controllers.directory.templates.main = this.templates[name];
                        this.loadDirectory();
                    }
                }
            }
        }
        update(options) {
            for (const key in options) {
                if (key == "regions") {
                    for (const id in options.regions) {
                        const region = this.getRegion(id);
                        region && region.update(options.regions[id]);
                        if (options.regions[id].disabled != undefined) {
                            this.deselectRegion(region);
                            this.options.regions[id] = this.options.regions[id] || {};
                            this.options.regions[id].disabled = region.disabled;
                        }
                    }
                }
                else {
                    const setter = "set" + MapSVG.ucfirst(key);
                    if (typeof this[setter] == "function")
                        this[setter](options[key]);
                    else {
                        this.options[key] = options[key];
                    }
                }
            }
        }
        getDirtyFields() {
            return this.getData();
        }
        clearDirtyFields() {
            this.dirtyFields = [];
        }
        setTitle(title) {
            title && (this.options.title = title);
        }
        setExtension(extension) {
            if (extension) {
                this.options.extension = extension;
            }
            else {
                delete this.options.extension;
            }
        }
        setDisableLinks(on) {
            on = MapSVG.parseBoolean(on);
            if (on) {
                $$A(this.containers.map).on("click.a.mapsvg", "a", function (e) {
                    e.preventDefault();
                });
            }
            else {
                $$A(this.containers.map).off("click.a.mapsvg");
            }
            this.disableLinks = on;
        }
        setLoadingText(val) {
            this.options.loadingText = val;
        }
        setLockAspectRatio(onoff) {
            this.options.lockAspectRatio = MapSVG.parseBoolean(onoff);
        }
        setMarkerEditHandler(handler) {
            this.markerEditHandler = handler;
        }
        setChoroplethSourceField(field) {
            this.options.choropleth.sourceField = field;
            this.redrawChoropleth();
        }
        setRegionEditHandler(handler) {
            this.regionEditHandler = handler;
        }
        setDisableAll(on) {
            on = MapSVG.parseBoolean(on);
            $$A.extend(true, this.options, { disableAll: on });
            $$A(this.containers.map).toggleClass("mapsvg-disabled-regions", on);
        }
        setRegionStatuses(_statuses) {
            this.options.regionStatuses = {};
            const colors = {};
            _statuses.forEach((statusOptions) => {
                this.options.regionStatuses[statusOptions.value] = statusOptions;
                colors[statusOptions.value] = statusOptions.color.length
                    ? statusOptions.color
                    : undefined;
            });
            this.setColors({ status: colors });
        }
        setColorsIgnore(val) {
            this.options.colorsIgnore = MapSVG.parseBoolean(val);
            this.regionsRedrawColors();
        }
        setColors(colors) {
            for (const i in colors) {
                if (i === "status") {
                    for (const s in colors[i]) {
                        MapSVG.fixColorHash(colors[i][s]);
                    }
                }
                else {
                    if (typeof colors[i] == "string") {
                        MapSVG.fixColorHash(colors[i]);
                    }
                }
            }
            $$A.extend(true, this.options, { colors: colors });
            if (colors && colors.status)
                this.options.colors.status = colors.status;
            if (this.options.colors.markers) {
                for (const z in this.options.colors.markers) {
                    for (const x in this.options.colors.markers[z]) {
                        this.options.colors.markers[z][x] = parseInt(this.options.colors.markers[z][x]);
                    }
                }
            }
            if (this.options.colors.background)
                $$A(this.containers.map).css({ background: this.options.colors.background });
            if (this.options.colors.hover) {
                this.options.colors.hover = !isNaN(this.options.colors.hover)
                    ? parseInt(this.options.colors.hover + "")
                    : this.options.colors.hover;
            }
            if (this.options.colors.selected) {
                this.options.colors.selected = !isNaN(this.options.colors.selected)
                    ? parseInt(this.options.colors.selected + "")
                    : this.options.colors.selected;
            }
            $$A(this.containers.leftSidebar).css({
                "background-color": this.options.colors.leftSidebar,
            });
            $$A(this.containers.rightSidebar).css({
                "background-color": this.options.colors.rightSidebar,
            });
            $$A(this.containers.header).css({ "background-color": this.options.colors.header });
            $$A(this.containers.footer).css({ "background-color": this.options.colors.footer });
            if ($$A(this.containers.detailsView) && this.options.colors.detailsView !== undefined) {
                $$A(this.containers.detailsView).css({
                    "background-color": this.options.colors.detailsView,
                });
            }
            if ($$A(this.containers.directory) && this.options.colors.directory !== undefined) {
                $$A(this.containers.directory).css({
                    "background-color": this.options.colors.directory,
                });
            }
            if ($$A(this.containers.filtersModal) && this.options.colors.modalFilters !== undefined) {
                $$A(this.containers.filtersModal).css({
                    "background-color": this.options.colors.modalFilters,
                });
            }
            if ($$A(this.containers.filters) && this.options.colors.directorySearch) {
                $$A(this.containers.filters).css({
                    "background-color": this.options.colors.directorySearch,
                });
            }
            else if ($$A(this.containers.filters)) {
                $$A(this.containers.filters).css({
                    "background-color": "",
                });
            }
            if (!this.containers.clustersCss) {
                this.containers.clustersCss = ($$A("<style></style>").appendTo("body")[0]);
            }
            let css = "";
            if (this.options.colors.clusters) {
                css += "background-color: " + this.options.colors.clusters + ";";
            }
            if (this.options.colors.clustersBorders) {
                css += "border-color: " + this.options.colors.clustersBorders + ";";
            }
            if (this.options.colors.clustersText) {
                css += "color: " + this.options.colors.clustersText + ";";
            }
            $$A(this.containers.clustersCss).html(".mapsvg-marker-cluster {" + css + "}");
            if (!this.containers.clustersHoverCss) {
                this.containers.clustersHoverCss = ($$A("<style></style>").appendTo("body")[0]);
            }
            let cssHover = "";
            if (this.options.colors.clustersHover) {
                cssHover += "background-color: " + this.options.colors.clustersHover + ";";
            }
            if (this.options.colors.clustersHoverBorders) {
                cssHover += "border-color: " + this.options.colors.clustersHoverBorders + ";";
            }
            if (this.options.colors.clustersHoverText) {
                cssHover += "color: " + this.options.colors.clustersHoverText + ";";
            }
            $$A(this.containers.clustersHoverCss).html(".mapsvg-marker-cluster:hover {" + cssHover + "}");
            if (!this.containers.markersCss) {
                this.containers.markersCss = $$A("<style></style>").appendTo("head")[0];
            }
            const markerCssText = ".mapsvg-with-marker-active .mapsvg-marker {\n" +
                "  opacity: " +
                this.options.colors.markers.inactive.opacity / 100 +
                ";\n" +
                "  -webkit-filter: grayscale(" +
                (100 - this.options.colors.markers.inactive.saturation) +
                "%);\n" +
                "  filter: grayscale(" +
                (100 - this.options.colors.markers.inactive.saturation) +
                "%);\n" +
                "}\n" +
                ".mapsvg-with-marker-active .mapsvg-marker-active {\n" +
                "  opacity: " +
                this.options.colors.markers.active.opacity / 100 +
                ";\n" +
                "  -webkit-filter: grayscale(" +
                (100 - this.options.colors.markers.active.saturation) +
                "%);\n" +
                "  filter: grayscale(" +
                (100 - this.options.colors.markers.active.saturation) +
                "%);\n" +
                "}\n" +
                ".mapsvg-with-marker-hover .mapsvg-marker {\n" +
                "  opacity: " +
                this.options.colors.markers.unhovered.opacity / 100 +
                ";\n" +
                "  -webkit-filter: grayscale(" +
                (100 - this.options.colors.markers.unhovered.saturation) +
                "%);\n" +
                "  filter: grayscale(" +
                (100 - this.options.colors.markers.unhovered.saturation) +
                "%);\n" +
                "}\n" +
                ".mapsvg-with-marker-hover .mapsvg-marker-hover {\n" +
                "  opacity: " +
                this.options.colors.markers.hovered.opacity / 100 +
                ";\n" +
                "  -webkit-filter: grayscale(" +
                (100 - this.options.colors.markers.hovered.saturation) +
                "%);\n" +
                "  filter: grayscale(" +
                (100 - this.options.colors.markers.hovered.saturation) +
                "%);\n" +
                "}\n";
            $$A(this.containers.markersCss).html(markerCssText);
            $$A.each(this.options.colors, (key, color) => {
                if (color === null || color == "")
                    delete this.options.colors[key];
            });
            this.regionsRedrawColors();
        }
        setTooltips(options) {
            if (options.on !== undefined)
                options.on = MapSVG.parseBoolean(options.on);
            $$A.extend(true, this.options, { tooltips: options });
            if (!this.containers.tooltip) {
                this.containers.tooltip = $$A("<div />").addClass("mapsvg-tooltip")[0];
                $$A(this.containers.map).append(this.containers.tooltip);
                this.controllers.tooltip = new Tooltip({
                    mapsvg: this,
                    container: this.containers.tooltip,
                    position: this.options.tooltips.position,
                    maxWidth: this.options.tooltips.maxWidth,
                    minWidth: this.options.tooltips.minWidth,
                });
                this.controllers.tooltip._init();
            }
            if (typeof this.options.tooltips.position !== "undefined") {
                this.controllers.tooltip.setPosition(this.options.tooltips.position);
            }
            if (typeof this.options.tooltips.maxWidth !== "undefined" ||
                typeof this.options.tooltips.minWidth !== "undefined") {
                this.controllers.tooltip.setSize(this.options.tooltips.minWidth, this.options.tooltips.maxWidth);
            }
        }
        setPopovers(options) {
            if (options.on !== undefined)
                options.on = MapSVG.parseBoolean(options.on);
            $$A.extend(this.options.popovers, options);
            if (!this.containers.popover) {
                this.containers.popover = $$A("<div />").addClass("mapsvg-popover")[0];
                this.layers.popovers.append(this.containers.popover);
            }
            $$A(this.containers.popover).css({
                width: this.options.popovers.width + (this.options.popovers.width == "auto" ? "" : "px"),
                "max-width": this.options.popovers.maxWidth + "%",
                "max-height": (this.options.popovers.maxHeight * $$A(this.containers.wrap).outerHeight()) / 100 +
                    "px",
            });
            if (this.options.popovers.mobileFullscreen && MapSVG.isPhone) {
                $$A("body").toggleClass("mapsvg-fullscreen-popovers", true);
                $$A(this.containers.popover).appendTo("body");
            }
        }
        setRegionPrefix(prefix) {
            this.options.regionPrefix = prefix;
        }
        setInitialViewBox(v) {
            if (typeof v == "string")
                v = v
                    .trim()
                    .split(" ")
                    .map(function (v) {
                    return parseFloat(v);
                });
            this._viewBox.update(new ViewBox(v));
            if (this.options.googleMaps.on) {
                this.options.googleMaps.center = this.googleMaps.map.getCenter().toJSON();
                this.options.googleMaps.zoom = this.googleMaps.map.getZoom();
            }
            this.zoomLevel = 0;
            this.setZoomLevels();
        }
        setViewBoxOnStart() {
            this.viewBoxFull = this.svgDefault.viewBox;
            this.viewBoxFake = this.viewBox;
            this.whRatioFull = this.viewBoxFull.width / this.viewBox.width;
            this.containers.svg.setAttribute("viewBox", this.viewBoxFull.toString());
            if ((MapSVG.device.ios || MapSVG.device.android) && this.svgDefault.viewBox.width > 1500) {
                this.iosDownscaleFactor = this.svgDefault.viewBox.width > 9999 ? 100 : 10;
                this.containers.svg.style.width =
                    (this.svgDefault.viewBox.width / this.iosDownscaleFactor).toString() + "px";
            }
            else {
                this.containers.svg.style.width = this.svgDefault.viewBox.width + "px";
            }
            this.vbStart = true;
        }
        setViewBox(viewBox, adjustGoogleMap = true) {
            let initial = false;
            if (typeof viewBox === "undefined" || (viewBox.width === 0 && viewBox.height === 0)) {
                viewBox = this.svgDefault.viewBox;
                initial = true;
            }
            const isZooming = viewBox.width != this.viewBox.width || viewBox.height != this.viewBox.height;
            this.viewBox.update(viewBox);
            this.whRatio = this.viewBox.width / this.viewBox.height;
            !this.vbStart && this.setViewBoxOnStart();
            if (initial) {
                if (this._viewBox.width === 0 && this._viewBox.height === 0) {
                    this._viewBox.update(this.viewBox);
                }
                this._scale = 1;
            }
            this.scale = this.getScale();
            this.superScale = (this.whRatioFull * this.svgDefault.viewBox.width) / this.viewBox.width;
            const w = this.svgDefault.viewBox.width / this.containers.map.clientWidth;
            this.superScale = this.superScale / w;
            if ((MapSVG.device.ios || MapSVG.device.android) && this.svgDefault.viewBox.width > 1500) {
                this.superScale *= this.iosDownscaleFactor;
            }
            this.scroll.tx = Math.round((this.svgDefault.viewBox.x - this.viewBox.x) * this.scale);
            this.scroll.ty = Math.round((this.svgDefault.viewBox.y - this.viewBox.y) * this.scale);
            if (this.googleMaps.map && adjustGoogleMap !== false) {
                const googlePrevZoom = this.googleMaps.map.getZoom();
                this.googleMaps.map.setCenter(this.getCenterGeoPoint());
                this.googleMaps.map.setZoom(this.getZoomForGoogle());
            }
            else {
                this.containers.scrollpane.style.transform =
                    "translate(" + this.scroll.tx + "px," + this.scroll.ty + "px)";
                this.containers.svg.style.transform = "scale(" + this.superScale + ")";
                this.syncZoomLevelWithGoogle();
            }
            this.movingItemsAdjustScreenPosition();
            if (isZooming) {
                this.adjustStrokes();
                this.toggleSvgLayerOnZoom();
                if (this.options.clustering.on) {
                    this.throttle(this.clusterizeOnZoom, 400, this);
                }
                else {
                    this.events.trigger("zoom");
                }
            }
            return true;
        }
        syncZoomLevelWithGoogle() {
            if (this.googleMaps.map &&
                this.googleMaps.map.getZoom() !== this.getZoomForGoogle() &&
                typeof this.zoomDelta !== "undefined") {
                this.zoomLevel = this.googleMaps.map.getZoom() - this.zoomDelta;
            }
        }
        getCenterGeoPoint() {
            return this.converter.convertSVGToGeo(this.getCenterSvgPoint());
        }
        getCenterSvgPoint() {
            return new SVGPoint(this.viewBox.x + this.viewBox.width / 2, this.viewBox.y + this.viewBox.height / 2);
        }
        getZoomForGoogle() {
            if (typeof this.zoomLevel === "string") {
                this.zoomLevel = parseInt(this.zoomLevel);
            }
            return this.zoomLevel + this.zoomDelta;
        }
        getZoomRange() {
            const range = { min: 0, max: 0 };
            if (this.options.googleMaps.on) {
                range.min = Math.max(0, this.options.zoom.limit[0] + this.zoomDelta) - this.zoomDelta;
                range.max = Math.min(22, this.options.zoom.limit[1] + this.zoomDelta) - this.zoomDelta;
            }
            else {
                range.min = this.options.zoom.limit[0];
                range.max = this.options.zoom.limit[1];
            }
            return range;
        }
        enableMovingElementsAnimation() {
            $$A(this.containers.map).removeClass("no-transitions-markers no-transitions-labels no-transitions-bubbles");
        }
        disableMovingElementsAnimation() {
            $$A(this.containers.map).addClass("no-transitions-markers no-transitions-labels no-transitions-bubbles");
        }
        clusterizeOnZoom() {
            if (this.options.googleMaps.on && this.googleMaps.map && this.zoomDelta) {
                this.zoomLevel = this.googleMaps.map.getZoom() - this.zoomDelta;
            }
            this.events.trigger("zoom");
            this.clusterizeMarkers(true);
        }
        throttle(method, delay, scope, params) {
            clearTimeout(method._tId);
            method._tId = setTimeout(function () {
                method.apply(scope, params);
            }, delay);
        }
        setViewBoxByGoogleMapBounds() {
            const googleMapBounds = this.googleMaps.map.getBounds();
            if (!googleMapBounds)
                return;
            const googleMapBoundsJSON = googleMapBounds.toJSON();
            if (googleMapBoundsJSON.west == -180 && googleMapBoundsJSON.east == 180) {
                const center = this.googleMaps.map.getCenter().toJSON();
            }
            const ne = new GeoPoint(googleMapBounds.getNorthEast().lat(), googleMapBounds.getNorthEast().lng());
            const sw = new GeoPoint(googleMapBounds.getSouthWest().lat(), googleMapBounds.getSouthWest().lng());
            const xyNE = this.converter.convertGeoToSVG(ne);
            const xySW = this.converter.convertGeoToSVG(sw);
            if (xyNE.x < xySW.y) {
                const mapPointsWidth = (this.svgDefault.viewBox.width / this.converter.mapLonDelta) * 360;
                xySW.x = -(mapPointsWidth - xySW.y);
            }
            const width = xyNE.x - xySW.x;
            const height = xySW.y - xyNE.y;
            const viewBox = new ViewBox(xySW.x, xyNE.y, width, height);
            this.setViewBox(viewBox);
        }
        redraw() {
            this.disableAnimation();
            if (MapSVG.browser.ie) {
                $$A(this.containers.svg).css({ height: this.svgDefault.viewBox.height });
            }
            if (this.options.googleMaps.on && this.googleMaps.map) {
                google.maps.event.trigger(this.googleMaps.map, "resize");
            }
            else {
                this.setViewBox(this.viewBox);
            }
            $$A(this.containers.popover) &&
                $$A(this.containers.popover).css({
                    "max-height": (this.options.popovers.maxHeight * $$A(this.containers.wrap).outerHeight()) /
                        100 +
                        "px",
                });
            if (this.controllers && this.controllers.directory) {
                this.controllers.directory.updateTopShift();
                this.controllers.directory.updateScroll();
            }
            this.movingItemsAdjustScreenPosition();
            this.adjustStrokes();
            this.enableAnimation();
        }
        setSize(width, height, responsive) {
            this.options.width = width;
            this.options.height = height;
            this.options.responsive =
                responsive != null && responsive != undefined
                    ? MapSVG.parseBoolean(responsive)
                    : this.options.responsive;
            if (!this.options.width && !this.options.height) {
                this.options.width = this.svgDefault.width;
                this.options.height = this.svgDefault.height;
            }
            else if (!this.options.width && this.options.height) {
                this.options.width =
                    (this.options.height * this.svgDefault.width) / this.svgDefault.height;
            }
            else if (this.options.width && !this.options.height) {
                this.options.height =
                    (this.options.width * this.svgDefault.height) / this.svgDefault.width;
            }
            this.whRatio = this.options.width / this.options.height;
            this.scale = this.getScale();
            this.setResponsive(responsive);
            if (this.options.choropleth.on && this.options.choropleth.bubbleMode) {
                this.redrawBubbles();
            }
            this.movingItemsAdjustScreenPosition();
        }
        setResponsive(on) {
            on = on != undefined ? MapSVG.parseBoolean(on) : this.options.responsive;
            $$A(this.containers.map).css({
                width: "100%",
                height: "0",
                "padding-bottom": (this.viewBox.height * 100) / this.viewBox.width + "%",
            });
            if (on) {
                $$A(this.containers.wrap).css({
                    width: "100%",
                    height: "auto",
                });
            }
            else {
                $$A(this.containers.wrap).css({
                    width: this.options.width + "px",
                    height: this.options.height + "px",
                });
            }
            $$A.extend(true, this.options, { responsive: on });
            if (!this.resizeSensor) {
                this.resizeSensor = new ResizeSensor(this.containers.map, () => {
                    this.redraw();
                });
            }
            this.redraw();
        }
        setScroll(options, skipEvents) {
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            options.limit != undefined && (options.limit = MapSVG.parseBoolean(options.limit));
            $$A.extend(true, this.options, { scroll: options });
            !skipEvents && this.setEventHandlers();
        }
        setZoom(options) {
            options = options || {};
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            options.fingers != undefined && (options.fingers = MapSVG.parseBoolean(options.fingers));
            options.mousewheel != undefined &&
                (options.mousewheel = MapSVG.parseBoolean(options.mousewheel));
            options.delta = 2;
            if (options.limit) {
                if (typeof options.limit == "string")
                    options.limit = options.limit.split(";");
                options.limit = [parseInt(options.limit[0]), parseInt(options.limit[1])];
            }
            if (!this.zoomLevels) {
                this.setZoomLevels();
            }
            $$A.extend(true, this.options, { zoom: options });
            $$A(this.containers.scrollpaneWrap).off("wheel.mapsvg");
            if (this.options.zoom.mousewheel) {
                if (MapSVG.browser.firefox) {
                    this.firefoxScroll = { insideIframe: false, scrollX: 0, scrollY: 0 };
                    $$A(this.containers.scrollpaneWrap)
                        .on("mouseenter", () => {
                        this.firefoxScroll.insideIframe = true;
                        this.firefoxScroll.scrollX = window.scrollX;
                        this.firefoxScroll.scrollY = window.scrollY;
                    })
                        .on("mouseleave", () => {
                        this.firefoxScroll.insideIframe = false;
                    });
                    $$A(document).scroll(() => {
                        if (this.firefoxScroll.insideIframe)
                            window.scrollTo(this.firefoxScroll.scrollX, this.firefoxScroll.scrollY);
                    });
                }
                $$A(this.containers.scrollpaneWrap).on("wheel.mapsvg", (event) => {
                    event.preventDefault();
                    this.mouseWheelZoom(event);
                    return false;
                });
                $$A(this.layers.markers).on("wheel.mapsvg", (event) => {
                    event.preventDefault();
                    this.mouseWheelZoom(event);
                    return false;
                });
            }
            this.canZoom = true;
        }
        mouseWheelZoom(event) {
            event.preventDefault();
            const d = Math.sign(-event.originalEvent.deltaY);
            const center = this.getSvgPointAtClick(event.originalEvent);
            d > 0 ? this.zoomIn(center) : this.zoomOut(center);
        }
        setControls(options) {
            options = options || {};
            $$A.extend(true, this.options, { controls: options });
            this.options.controls.zoom = MapSVG.parseBoolean(this.options.controls.zoom);
            this.options.controls.zoomReset = MapSVG.parseBoolean(this.options.controls.zoomReset);
            this.options.controls.userLocation = MapSVG.parseBoolean(this.options.controls.userLocation);
            this.options.controls.previousMap = MapSVG.parseBoolean(this.options.controls.previousMap);
            const loc = this.options.controls.location || "right";
            if (!this.containers.controls) {
                const buttons = $$A("<div />").addClass("mapsvg-buttons");
                const zoomGroup = $$A("<div />").addClass("mapsvg-btn-group").appendTo(buttons);
                const zoomIn = $$A("<div />").addClass("mapsvg-btn-map mapsvg-in");
                zoomIn.on("touchend click", (e) => {
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    e.stopPropagation();
                    this.zoomIn();
                });
                const zoomOut = $$A("<div />").addClass("mapsvg-btn-map mapsvg-out");
                zoomOut.on("touchend click", (e) => {
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    e.stopPropagation();
                    this.zoomOut();
                });
                zoomGroup.append(zoomIn).append(zoomOut);
                const location = $$A("<div />").addClass("mapsvg-btn-map mapsvg-btn-location");
                location.on("touchend click", (e) => {
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    e.stopPropagation();
                    this.showUserLocation((location) => {
                        if (this.options.scroll.on) {
                            this.centerOn(location.marker);
                        }
                    });
                });
                const userLocationIcon = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 447.342 447.342" style="enable-background:new 0 0 447.342 447.342;" xml:space="preserve"><path d="M443.537,3.805c-3.84-3.84-9.686-4.893-14.625-2.613L7.553,195.239c-4.827,2.215-7.807,7.153-7.535,12.459 c0.254,5.305,3.727,9.908,8.762,11.63l129.476,44.289c21.349,7.314,38.125,24.089,45.438,45.438l44.321,129.509 c1.72,5.018,6.325,8.491,11.63,8.762c5.306,0.271,10.244-2.725,12.458-7.535L446.15,18.429 C448.428,13.491,447.377,7.644,443.537,3.805z"/></svg>';
                location.html(userLocationIcon);
                const locationGroup = $$A("<div />").addClass("mapsvg-btn-group").appendTo(buttons);
                locationGroup.append(location);
                const zoomResetIcon = '<svg height="14px" version="1.1" viewBox="0 0 14 14" width="14px" xmlns="http://www.w3.org/2000/svg" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" xmlns:xlink="http://www.w3.org/1999/xlink"><g fill="none" fill-rule="evenodd" id="Page-1" stroke="none" stroke-width="1"><g fill="#000000" transform="translate(-215.000000, -257.000000)"><g id="fullscreen" transform="translate(215.000000, 257.000000)"><path d="M2,9 L0,9 L0,14 L5,14 L5,12 L2,12 L2,9 L2,9 Z M0,5 L2,5 L2,2 L5,2 L5,0 L0,0 L0,5 L0,5 Z M12,12 L9,12 L9,14 L14,14 L14,9 L12,9 L12,12 L12,12 Z M9,0 L9,2 L12,2 L12,5 L14,5 L14,0 L9,0 L9,0 Z" /></g></g></g></svg>';
                const zoomResetButton = $$A("<div />")
                    .html(zoomResetIcon)
                    .addClass("mapsvg-btn-map mapsvg-btn-zoom-reset");
                zoomResetButton.on("touchend click", (e) => {
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    e.stopPropagation();
                    this.viewBoxReset(true);
                });
                const zoomResetGroup = $$A("<div />").addClass("mapsvg-btn-group").appendTo(buttons);
                zoomResetGroup.append(zoomResetButton);
                const previousMapIcon = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" version="1.1" id="mapsvg-previous-map-icon" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve" sodipodi:docname="undo.svg" inkscape:version="0.92.4 (5da689c313, 2019-01-14)"><metadata id="metadata19"><rdf:RDF><cc:Work rdf:about="">' +
                    '<dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /></cc:Work></rdf:RDF></metadata><defs id="defs17" /><sodipodi:namedview pagecolor="#ffffff" bordercolor="#666666" borderopacity="1" objecttolerance="10" gridtolerance="10" guidetolerance="10" inkscape:pageopacity="0" inkscape:pageshadow="2" inkscape:window-width="1920" inkscape:window-height="1017" id="namedview15" showgrid="false" inkscape:zoom="1.0103686" inkscape:cx="181.33521" inkscape:cy="211.70893" inkscape:window-x="-8" inkscape:window-y="-8" inkscape:window-maximized="1" inkscape:current-layer="Capa_1" /> <g id="g6" transform="matrix(0.53219423,0,0,0.52547259,122.72749,106.63302)">' +
                    '<g id="g4"><path d="m 142.716,293.147 -94,-107.602 94,-107.602 c 7.596,-8.705 6.71,-21.924 -1.995,-29.527 -8.705,-7.596 -21.917,-6.703 -29.527,1.995 L 5.169,171.782 c -6.892,7.882 -6.892,19.65 0,27.532 l 106.026,121.372 c 4.143,4.729 9.94,7.157 15.771,7.157 4.883,0 9.786,-1.702 13.755,-5.169 8.706,-7.603 9.598,-20.822 1.995,-29.527 z" id="path2" inkscape:connector-curvature="0" /></g></g><g id="g12" transform="matrix(0.53219423,0,0,0.52547259,122.72749,106.63302)"><g id="g10"> <path d="M 359.93,164.619 H 20.926 C 9.368,164.619 0,173.986 0,185.545 c 0,11.558 9.368,20.926 20.926,20.926 H 359.93 c 60.776,0 110.218,49.441 110.218,110.211 0,60.77 -49.442,110.211 -110.218,110.211 H 48.828 c -11.558,0 -20.926,9.368 -20.926,20.926 0,11.558 9.368,20.926 20.926,20.926 H 359.93 C 443.774,468.745 512,400.526 512,316.682 512,232.838 443.781,164.619 359.93,164.619 Z" ' +
                    'id="path8" inkscape:connector-curvature="0" /></g></g></svg>';
                const previousMapButton = $$A("<div />")
                    .html(previousMapIcon)
                    .addClass("mapsvg-btn-map mapsvg-btn-previous-map");
                previousMapButton.on("touchend click", (e) => {
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    e.stopPropagation();
                    this.loadPreviousMap();
                });
                const previousMapGroup = $$A("<div />").addClass("mapsvg-btn-group").appendTo(buttons);
                previousMapGroup.append(previousMapButton);
                this.containers.controls = buttons[0];
                this.controls = {
                    zoom: zoomGroup[0],
                    userLocation: locationGroup[0],
                    zoomReset: zoomResetGroup[0],
                    previousMap: previousMapGroup[0],
                };
                $$A(this.containers.map).append($$A(this.containers.controls));
            }
            $$A(this.controls.zoom).toggle(this.options.controls.zoom);
            $$A(this.controls.userLocation).toggle(this.options.controls.userLocation);
            $$A(this.controls.zoomReset).toggle(this.options.controls.zoomReset);
            $$A(this.controls.previousMap).toggle(this.options.controls.previousMap && this.options.previousMapsIds.length > 0);
            $$A(this.containers.controls).removeClass("left");
            $$A(this.containers.controls).removeClass("right");
            (loc == "right" && $$A(this.containers.controls).addClass("right")) ||
                (loc == "left" && $$A(this.containers.controls).addClass("left"));
        }
        setZoomLevels() {
            if (!this.zoomLevels) {
                this.zoomLevels = new ArrayIndexed("zoomLevel");
            }
            else {
                this.zoomLevels.clear();
            }
            for (let i = -20; i < 0; i++) {
                const _scale = 1 / Math.pow(this.options.zoom.delta, Math.abs(i));
                this.zoomLevels.push({
                    zoomLevel: i,
                    _scale: _scale,
                    viewBox: new ViewBox(0, 0, this._viewBox.width / _scale, this._viewBox.height / _scale),
                });
            }
            for (let z = 0; z <= 20; z++) {
                const _scale = Math.pow(this.options.zoom.delta, Math.abs(z));
                this.zoomLevels.push({
                    zoomLevel: z,
                    _scale: _scale,
                    viewBox: new ViewBox(0, 0, this._viewBox.width / _scale, this._viewBox.height / _scale),
                });
            }
        }
        setCursor(type) {
            type = type == "pointer" ? "pointer" : "default";
            this.options.cursor = type;
            if (type == "pointer")
                $$A(this.containers.map).addClass("mapsvg-cursor-pointer");
            else
                $$A(this.containers.map).removeClass("mapsvg-cursor-pointer");
        }
        setMultiSelect(on, deselect) {
            this.options.multiSelect = MapSVG.parseBoolean(on);
            if (deselect !== false)
                this.deselectAllRegions();
        }
        _new_setChoropleth(options) {
            options = options || this.options.choropleth;
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            if (typeof options.coloring === "undefined" ||
                typeof options.coloring.palette === "undefined" ||
                typeof options.coloring.palette.colors === "undefined") {
                if (typeof options.sourceFieldSelect === "undefined" ||
                    typeof options.sourceFieldSelect.variants === "undefined") {
                    $$A.extend(true, this.options.choropleth, options);
                }
                else {
                    this.options.choropleth.sourceFieldSelect.variants =
                        options.sourceFieldSelect.variants;
                }
            }
            else {
                const paletteColorsIndexes = Object.keys(options.coloring.palette.colors);
                if (paletteColorsIndexes.length > 1 ||
                    (paletteColorsIndexes[0] == "0" &&
                        Object.keys(options.coloring.palette.colors[0]).length > 1)) {
                    this.options.choropleth.coloring.palette.colors = options.coloring.palette.colors;
                }
                else {
                    const paletteColorIndex = Object.keys(options.coloring.palette.colors)[0];
                    $$A.extend(true, this.options.choropleth.coloring.palette.colors[paletteColorIndex], options.coloring.palette.colors[paletteColorIndex]);
                }
            }
            this.updateChoroplethMinMax();
            if (this.options.choropleth.on &&
                this.options.choropleth.sourceFieldSelect.on &&
                this.options.choropleth.sourceFieldSelect.variants) {
                if (!this.containers.choroplethSourceSelect) {
                    const sourceSelectOptions = [];
                    this.options.choropleth.sourceFieldSelect.variants.forEach((variant) => {
                        sourceSelectOptions.push($$A('<option value="' +
                            variant +
                            '" ' +
                            (variant === this.options.choropleth.sourceField
                                ? "selected"
                                : "") +
                            ">" +
                            variant +
                            "</option>"));
                    });
                    this.containers.choroplethSourceSelect = {
                        container: $$A('<div class="mapsvg-choropleth-source-field"></div>')[0],
                        select: $$A('<select id="mapsvg-choropleth-source-field-select" class="mapsvg-select2"></select>')[0],
                        options: sourceSelectOptions,
                    };
                    $$A(this.containers.choroplethSourceSelect.select).append(this.containers.choroplethSourceSelect.options);
                    $$A(this.containers.choroplethSourceSelect.container).append($$A(this.containers.choroplethSourceSelect.select));
                    $$A(this.containers.map).append($$A(this.containers.choroplethSourceSelect.container));
                    $$A(this.containers.choroplethSourceSelect.select).mselect2();
                    $$A(this.containers.choroplethSourceSelect.select)
                        .mselect2()
                        .on("select2:select select2:unselecting", (e) => {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                        e.stopPropagation();
                        this.setChoropleth({ sourceField: $$A(e.target).mselect2().val() });
                    });
                }
                else {
                    $$A(this.containers.choroplethSourceSelect.select).mselect2("destroy");
                    $$A(this.containers.choroplethSourceSelect.select).find("option").remove();
                    this.containers.choroplethSourceSelect.options = [];
                    this.options.choropleth.sourceFieldSelect.variants.forEach((variant) => {
                        this.containers.choroplethSourceSelect.options.push($$A('<option value="' +
                            variant +
                            '" ' +
                            (variant === this.options.choropleth.sourceField
                                ? "selected"
                                : "") +
                            ">" +
                            variant +
                            "</option>")[0]);
                    });
                    $$A(this.containers.choroplethSourceSelect.select).append(this.containers.choroplethSourceSelect.options);
                    $$A(this.containers.choroplethSourceSelect.select).mselect2({ width: "100%" });
                }
            }
            if ((!this.options.choropleth.on || !this.options.choropleth.sourceFieldSelect.on) &&
                this.containers.choroplethSourceSelect &&
                $$A(this.containers.choroplethSourceSelect.container).is(":visible")) {
                $$A(this.containers.choroplethSourceSelect.container).hide();
            }
            else if (this.options.choropleth.on &&
                this.options.choropleth.sourceFieldSelect.on &&
                this.containers.choroplethSourceSelect &&
                !$$A(this.containers.choroplethSourceSelect.container).is(":visible")) {
                $$A(this.containers.choroplethSourceSelect.container).show();
            }
            $$A(this.containers.map).find(".mapsvg-choropleth-legend").remove();
            if (this.options.choropleth.on && this.options.choropleth.coloring.legend.on) {
                const legend = this.options.choropleth.coloring.legend;
                let coloring = "";
                if (this.options.choropleth.coloring.mode === "gradient") {
                    coloring +=
                        '<div class="mapsvg-choropleth-legend-gradient-no-data">' +
                            this.options.choropleth.coloring.noData.description +
                            "</div>";
                    let legendGradient = "";
                    for (let chunkIdx = 1; chunkIdx < 5; chunkIdx++) {
                        legendGradient +=
                            '<div class="mapsvg-choropleth-legend-gradient-chunk">' +
                                ((this.options.choropleth.coloring.gradient.values.maxAdjusted * chunkIdx) /
                                    5 +
                                    this.options.choropleth.coloring.gradient.values.min) +
                                "</div>";
                    }
                    coloring +=
                        '<div class="mapsvg-choropleth-legend-gradient-colors">' +
                            legendGradient +
                            "</div>";
                }
                else {
                    coloring +=
                        '<div class="mapsvg-choropleth-legend-palette-color-wrap" data-idx="no-data">' +
                            '<div class="mapsvg-choropleth-legend-palette-color"></div>' +
                            '<div class="mapsvg-choropleth-legend-palette-color-description">' +
                            this.options.choropleth.coloring.noData.description +
                            "</div>" +
                            "</div>";
                    coloring +=
                        '<div class="mapsvg-choropleth-legend-palette-color-wrap" data-idx="out-of-range">' +
                            '<div class="mapsvg-choropleth-legend-palette-color"></div>' +
                            '<div class="mapsvg-choropleth-legend-palette-color-description">' +
                            this.options.choropleth.coloring.palette.outOfRange.description +
                            "</div>" +
                            "</div>";
                    const paletteColors = this.options.choropleth.coloring.palette.colors;
                    paletteColors.forEach((paletteColor, idx) => {
                        let paletteColorElementText = "";
                        if (paletteColor.description) {
                            paletteColorElementText = paletteColor.description;
                        }
                        else {
                            if (idx === 0 && !paletteColor.valueFrom && paletteColor.valueFrom !== 0) {
                                if (legend.layout === "vertical") {
                                    paletteColorElementText = "Less then " + paletteColor.valueTo;
                                }
                                else {
                                    paletteColorElementText = "< " + paletteColor.valueTo;
                                }
                            }
                            else if (idx === paletteColors.length - 1 && !paletteColor.valueTo) {
                                if (legend.layout === "vertical") {
                                    paletteColorElementText = paletteColor.valueFrom + " or more";
                                }
                                else {
                                    paletteColorElementText = paletteColor.valueFrom + " <";
                                }
                            }
                            else {
                                paletteColorElementText =
                                    paletteColor.valueFrom + " &#8804; " + paletteColor.valueTo;
                            }
                        }
                        coloring +=
                            '<div class="mapsvg-choropleth-legend-palette-color-wrap" data-idx="' +
                                idx +
                                '">' +
                                '<div class="mapsvg-choropleth-legend-palette-color"></div>' +
                                '<div class="mapsvg-choropleth-legend-palette-color-description">' +
                                paletteColorElementText +
                                "</div>" +
                                "</div>";
                    });
                }
                this.containers.legend = {
                    title: $$A('<div class="mapsvg-choropleth-legend-title">' + legend.title + "</div>")[0],
                    text: $$A('<div class="mapsvg-choropleth-legend-text">' + legend.text + "</div>")[0],
                    coloring: $$A('<div class="mapsvg-choropleth-legend-' +
                        this.options.choropleth.coloring.mode +
                        '">' +
                        coloring +
                        "</div>")[0],
                    description: $$A('<div class="mapsvg-choropleth-legend-description">' +
                        legend.description +
                        "</div>")[0],
                    container: $$A("<div />").addClass("mapsvg-choropleth-legend mapsvg-choropleth-legend-" +
                        legend.layout +
                        " mapsvg-choropleth-legend-container-" +
                        legend.container)[0],
                };
                $$A(this.containers.legend.container)
                    .append(this.containers.legend.title)
                    .append(this.containers.legend.text)
                    .append(this.containers.legend.coloring)
                    .append(this.containers.legend.description);
                $$A(this.containers.map).append(this.containers.legend.container);
                this.setChoroplethLegendCSS();
                this.regionsRepository.events.on("updated", () => {
                    this.redrawChoropleth();
                });
                this.objectsRepository.events.on("updated", () => {
                    this.redrawChoropleth();
                });
            }
            if (this.options.choropleth.on && this.options.choropleth.coloring.mode === "gradient") {
                const colors = this.options.choropleth.coloring.gradient.colors;
                if (colors) {
                    colors.lowRGB = tinycolor(colors.low).toRgb();
                    colors.highRGB = tinycolor(colors.high).toRgb();
                    colors.diffRGB = {
                        r: colors.highRGB.r - colors.lowRGB.r,
                        g: colors.highRGB.g - colors.lowRGB.g,
                        b: colors.highRGB.b - colors.lowRGB.b,
                        a: colors.highRGB.a - colors.lowRGB.a,
                    };
                    this.containers.legend && this.setChoroplethLegendCSS();
                }
            }
            this.redrawChoropleth();
        }
        redrawChoropleth() {
            this.updateChoroplethMinMax();
            this.redrawBubbles();
            this.regionsRedrawColors();
        }
        updateChoroplethMinMax() {
            if (this.options.choropleth.on) {
                const gradient = this.options.choropleth.coloring.gradient, values = [];
                gradient.values.min = 0;
                gradient.values.max = null;
                if (this.options.choropleth.source === "regions") {
                    this.regions.forEach((region) => {
                        const choropleth = region.data && region.data[this.options.choropleth.sourceField];
                        choropleth != undefined && choropleth !== "" && values.push(choropleth);
                    });
                }
                else {
                    this.objectsRepository.objects.forEach((object) => {
                        const choropleth = object[this.options.choropleth.sourceField];
                        choropleth != undefined && choropleth !== "" && values.push(choropleth);
                    });
                }
                if (values.length > 0) {
                    gradient.values.min = Math.min.apply(null, values);
                    gradient.values.max = Math.max.apply(null, values);
                    gradient.values.maxAdjusted = gradient.values.max - gradient.values.min;
                }
            }
        }
        setChoroplethLegendCSS() {
            const gradient = this.options.choropleth.coloring.gradient, legend = this.options.choropleth.coloring.legend, noData = this.options.choropleth.coloring.noData, outOfRange = this.options.choropleth.coloring.palette.outOfRange;
            $$A(".mapsvg-choropleth-legend").css({
                width: legend.width,
                height: legend.height,
            });
            if (this.options.choropleth.coloring.mode === "gradient") {
                if (legend.layout === "horizontal") {
                    $$A(".mapsvg-choropleth-legend-horizontal .mapsvg-choropleth-legend-gradient-colors").css({
                        background: "linear-gradient(to right," +
                            gradient.colors.low +
                            " 1%," +
                            gradient.colors.high +
                            " 100%)",
                    });
                }
                else {
                    $$A(".mapsvg-choropleth-legend-vertical .mapsvg-choropleth-legend-gradient-colors").css({
                        background: "linear-gradient(to bottom," +
                            gradient.colors.low +
                            " 1%," +
                            gradient.colors.high +
                            " 100%)",
                    });
                }
                $$A(".mapsvg-choropleth-legend-gradient-no-data").css({
                    "background-color": noData.color,
                });
            }
            else {
                const paletteColors = this.options.choropleth.coloring.palette.colors;
                paletteColors.forEach(function (paletteColor, idx) {
                    $$A('.mapsvg-choropleth-legend-palette-color-wrap[data-idx="' +
                        idx +
                        '"] .mapsvg-choropleth-legend-palette-color').css({
                        "background-color": paletteColor.color,
                    });
                });
                $$A('.mapsvg-choropleth-legend-palette-color-wrap[data-idx="no-data"] .mapsvg-choropleth-legend-palette-color').css({
                    "background-color": noData.color,
                });
                $$A('.mapsvg-choropleth-legend-palette-color-wrap[data-idx="out-of-range"] .mapsvg-choropleth-legend-palette-color').css({
                    "background-color": outOfRange.color,
                });
            }
        }
        setCss(css) {
            this.options.css =
                css || (this.options.css ? this.options.css.replace(/%id%/g, "" + this.id) : "");
            this.liveCss = this.liveCss || $$A("<style></style>").appendTo("head")[0];
            $$A(this.liveCss).html(this.options.css);
        }
        setFilters(options) {
            options = options || this.options.filters;
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            options.hide != undefined && (options.hide = MapSVG.parseBoolean(options.hide));
            $$A.extend(true, this.options, { filters: options });
            if (["leftSidebar", "rightSidebar", "header", "footer", "custom", "map"].indexOf(this.options.filters.location) === -1) {
                this.options.filters.location = "leftSidebar";
            }
            if (this.options.filters.on) {
                if (this.formBuilder) {
                    this.formBuilder.destroy();
                }
                if (!this.containers.filters) {
                    this.containers.filters = $$A('<div class="mapsvg-filters-wrap"></div>')[0];
                }
                else {
                    $$A(this.containers.filters).empty();
                    $$A(this.containers.filters).show();
                }
                $$A(this.containers.filters).css({
                    "background-color": this.options.colors.directorySearch,
                });
                if ($$A(this.containers.filtersModal)) {
                    $$A(this.containers.filtersModal).css({ width: this.options.filters.width });
                }
                if (this.options.filters.location === "custom") {
                    $$A(this.containers.filters)
                        .removeClass("mapsvg-filter-container-custom")
                        .addClass("mapsvg-filter-container-custom");
                    if ($$A("#" + this.options.filters.containerId).length) {
                        $$A("#" + this.options.filters.containerId).append(this.containers.filters);
                    }
                    else {
                        $$A(this.containers.filters).hide();
                        console.error("MapSVG: filter container #" +
                            this.options.filters.containerId +
                            " does not exists");
                    }
                }
                else {
                    if (MapSVG.isPhone) {
                        $$A(this.containers.header).append($$A(this.containers.filters));
                        this.setContainers({ header: { on: true } });
                    }
                    else {
                        const location = MapSVG.isPhone ? "header" : this.options.filters.location;
                        if (this.options.menu.on &&
                            this.controllers.directory &&
                            this.options.menu.location === this.options.filters.location) {
                            $$A(this.controllers.directory.containers.view)
                                .find(".mapsvg-directory-filter-wrap")
                                .append($$A(this.containers.filters));
                            this.controllers.directory.updateTopShift();
                        }
                        else {
                            $$A(this.containers[location]).append($$A(this.containers.filters));
                            this.controllers.directory && this.controllers.directory.updateTopShift();
                        }
                    }
                }
                this.loadFiltersController(this.containers.filters, false);
                this.updateFiltersState();
            }
            else {
                if ($$A(this.containers.filters)) {
                    $$A(this.containers.filters).empty();
                    $$A(this.containers.filters).hide();
                }
            }
            if (this.options.menu.on &&
                this.controllers.directory &&
                this.options.menu.location === this.options.filters.location) {
                this.controllers.directory.updateTopShift();
            }
        }
        updateFiltersState() {
            if (this.options.filters && this.options.filters.on && this.controllers.filters) {
                this.controllers.filters.update(this.objectsRepository.query);
                this.updateFilterTags();
            }
        }
        setGlobalDistanceFilter() {
            if (this.objectsRepository &&
                this.objectsRepository.query.filters &&
                this.objectsRepository.query.filters.distance) {
                const dist = this.objectsRepository.query.filters.distance;
                MapSVG.distanceSearch = this.objectsRepository.query.filters.distance;
            }
            else {
                MapSVG.distanceSearch = null;
            }
        }
        updateFilterTags() {
            $$A(this.containers.filterTags) && $$A(this.containers.filterTags).empty();
            for (const field_name in this.objectsRepository.query.filters) {
                let field_value = this.objectsRepository.query.filters[field_name];
                let _field_name = field_name;
                const filterField = this.filtersSchema.getField(_field_name);
                if (field_name == "regions") {
                    _field_name = "";
                    field_value = field_value.region_ids.map((id) => this.getRegion(id).title);
                }
                else {
                    _field_name = filterField && filterField.label;
                }
                if (field_name !== "distance") {
                    if (!this.containers.filterTags) {
                        this.containers.filterTags = $$A('<div class="mapsvg-filter-tags"></div>')[0];
                        if ($$A(this.containers.filters)) ;
                        else {
                            if (this.options.menu.on && this.controllers.directory) {
                                $$A(this.controllers.directory.containers.toolbar).append(this.containers.filterTags);
                                this.controllers.directory.updateTopShift();
                            }
                            else {
                                $$A(this.containers.map).append(this.containers.filterTags);
                                if (this.options.zoom.buttons.on) {
                                    if (this.options.layersControl.on) {
                                        if (this.options.layersControl.position == "top-left") {
                                            $$A(this.containers.filterTags).css({
                                                right: 0,
                                                bottom: 0,
                                            });
                                        }
                                        else {
                                            $$A(this.containers.filterTags).css({
                                                bottom: 0,
                                            });
                                        }
                                    }
                                    else {
                                        if (this.options.zoom.buttons.location == "left") {
                                            $$A(this.containers.filterTags).css({
                                                right: 0,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                        $$A(this.containers.filterTags).on("click", ".mapsvg-filter-delete", (e) => {
                            const filterField = $$A(e.target).data("filter");
                            $$A(e.target).parent().remove();
                            this.objectsRepository.query.removeFilter(filterField);
                            this.deselectAllRegions();
                            this.loadDataObjects();
                        });
                    }
                    $$A(this.containers.filterTags).append('<div class="mapsvg-filter-tag">' +
                        (_field_name ? _field_name + ": " : "") +
                        field_value +
                        ' <span class="mapsvg-filter-delete" data-filter="' +
                        field_name +
                        '">×</span></div>');
                }
            }
        }
        setContainers(options) {
            const _this = this;
            if (!this.containersCreated) {
                this.containers.wrapAll = document.createElement("div");
                this.containers.wrapAll.classList.add("mapsvg-wrap-all");
                this.containers.wrapAll.id = "mapsvg-map-" + this.id;
                this.containers.wrapAll.setAttribute("data-map-id", this.id ? this.id.toString() : "");
                this.containers.wrap = document.createElement("div");
                this.containers.wrap.classList.add("mapsvg-wrap");
                this.containers.mapContainer = document.createElement("div");
                this.containers.mapContainer.classList.add("mapsvg-map-container");
                this.containers.leftSidebar = document.createElement("div");
                this.containers.leftSidebar.className =
                    "mapsvg-sidebar mapsvg-top-container mapsvg-sidebar-left";
                this.containers.rightSidebar = document.createElement("div");
                this.containers.rightSidebar.className =
                    "mapsvg-sidebar mapsvg-top-container mapsvg-sidebar-right";
                this.containers.header = document.createElement("div");
                this.containers.header.className = "mapsvg-header mapsvg-top-container";
                this.containers.footer = document.createElement("div");
                this.containers.footer.className = "mapsvg-footer mapsvg-top-container";
                _this.containers.wrapAll = $$A('<div class="mapsvg-wrap-all"></div>')
                    .attr("id", "mapsvg-map-" + this.id)
                    .attr("data-map-id", this.id)[0];
                _this.containers.wrap = $$A('<div class="mapsvg-wrap"></div>')[0];
                _this.containers.mapContainer = $$A('<div class="mapsvg-map-container"></div>')[0];
                _this.containers.leftSidebar = $$A('<div class="mapsvg-sidebar mapsvg-top-container mapsvg-sidebar-left"></div>')[0];
                _this.containers.rightSidebar = $$A('<div class="mapsvg-sidebar mapsvg-top-container mapsvg-sidebar-right"></div>')[0];
                _this.containers.header = $$A('<div class="mapsvg-header mapsvg-top-container"></div>')[0];
                _this.containers.footer = $$A('<div class="mapsvg-footer mapsvg-top-container"></div>')[0];
                $$A(_this.containers.wrapAll).insertBefore(_this.containers.map);
                $$A(_this.containers.wrapAll).append(_this.containers.header);
                $$A(_this.containers.wrapAll).append(_this.containers.wrap);
                $$A(_this.containers.wrapAll).append(_this.containers.footer);
                $$A(_this.containers.mapContainer).append(_this.containers.map);
                $$A(_this.containers.wrap).append(_this.containers.leftSidebar);
                $$A(_this.containers.wrap).append(_this.containers.mapContainer);
                $$A(_this.containers.wrap).append(_this.containers.rightSidebar);
                _this.containersCreated = true;
            }
            options = options || _this.options.containers || {};
            for (const contName in options) {
                if (options[contName].on !== undefined) {
                    options[contName].on = MapSVG.parseBoolean(options[contName].on);
                }
                if (options[contName].width) {
                    if (typeof options[contName].width != "string" ||
                        (options[contName].width.indexOf("px") === -1 &&
                            options[contName].width.indexOf("%") === -1 &&
                            options[contName].width !== "auto")) {
                        options[contName].width = options[contName].width + "px";
                    }
                    $$A(_this.containers[contName]).css({ "flex-basis": options[contName].width });
                }
                if (options[contName].height) {
                    if (typeof options[contName].height != "string" ||
                        (options[contName].height.indexOf("px") === -1 &&
                            options[contName].height.indexOf("%") === -1 &&
                            options[contName].height !== "auto")) {
                        options[contName].height = options[contName].height + "px";
                    }
                    $$A(_this.containers[contName]).css({
                        "flex-basis": options[contName].height,
                        height: options[contName].height,
                    });
                }
                $$A.extend(true, _this.options, { containers: options });
                let on = _this.options.containers[contName].on;
                if (MapSVG.isPhone &&
                    _this.options.menu.hideOnMobile &&
                    _this.options.menu.location === contName &&
                    ["leftSidebar", "rightSidebar"].indexOf(contName) !== -1) {
                    on = false;
                }
                else if (MapSVG.isPhone &&
                    _this.options.menu.location === "custom" &&
                    ["leftSidebar", "rightSidebar"].indexOf(contName) !== -1) {
                    on = false;
                    $$A(_this.containers.wrapAll).addClass("mapsvg-hide-map-list-buttons");
                }
                else if (MapSVG.isPhone &&
                    !_this.options.menu.hideOnMobile &&
                    _this.options.menu.location === contName &&
                    ["leftSidebar", "rightSidebar"].indexOf(contName) !== -1) {
                    $$A(_this.containers.wrapAll).addClass("mapsvg-hide-map-list-buttons");
                    $$A(_this.containers.wrapAll).addClass("mapsvg-directory-visible");
                }
                $$A(_this.containers[contName]).toggle(on);
            }
            _this.setDetailsView();
        }
        shouldBeScrollable(container) {
            const _this = this;
            switch (container) {
                case "map":
                case "leftSidebar":
                case "rightSidebar":
                    return true;
                case "custom":
                    return false;
                case "header":
                case "footer":
                    if (_this.options.containers[container].height &&
                        _this.options.containers[container].height !== "auto" &&
                        _this.options.containers[container].height !== "100%") {
                        return true;
                    }
                    else {
                        return false;
                    }
                default:
                    return false;
            }
        }
        setDirectory(options) {
            return this.setMenu(options);
        }
        setMenu(options) {
            options = options || this.options.menu;
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            options.search != undefined && (options.search = MapSVG.parseBoolean(options.search));
            options.showMapOnClick != undefined &&
                (options.showMapOnClick = MapSVG.parseBoolean(options.showMapOnClick));
            options.searchFallback != undefined &&
                (options.searchFallback = MapSVG.parseBoolean(options.searchFallback));
            options.customContainer != undefined &&
                (options.customContainer = MapSVG.parseBoolean(options.customContainer));
            $$A.extend(true, this.options, { menu: options });
            this.controllers = this.controllers || {};
            if (!this.containers.directory) {
                this.containers.directory = $$A('<div class="mapsvg-directory"></div>')[0];
            }
            $$A(this.containers.directory).toggleClass("flex", this.shouldBeScrollable(this.options.menu.location));
            if (this.options.menu.on) {
                if (!this.controllers.directory) {
                    this.controllers.directory = new DirectoryController({
                        container: this.containers.directory,
                        template: this.options.templates.directory,
                        mapsvg: this,
                        repository: this.options.menu.source === "regions"
                            ? this.regionsRepository
                            : this.objectsRepository,
                        scrollable: this.shouldBeScrollable(this.options.menu.location),
                        events: {
                            click: (e, regionOrObject, mapsvg) => {
                                this.events.trigger("click.directoryItem", this, [
                                    e,
                                    regionOrObject,
                                    mapsvg,
                                ]);
                            },
                            mouseover: (e, regionOrObject, mapsvg) => {
                                this.events.trigger("mouseover.directoryItem", this, [
                                    e,
                                    regionOrObject,
                                    mapsvg,
                                ]);
                            },
                            mouseout: (e, regionOrObject, mapsvg) => {
                                this.events.trigger("mouseout.directoryItem", this, [
                                    e,
                                    regionOrObject,
                                    mapsvg,
                                ]);
                            },
                        },
                    });
                    this.controllers.directory._init();
                }
                if (options.source) {
                    this.controllers.directory.repository =
                        this.options.menu.source === "regions"
                            ? this.regionsRepository
                            : this.objectsRepository;
                }
                if (options.sortBy || options.sortDirection) {
                    this.controllers.directory.repository.query.update({
                        sort: [
                            {
                                field: this.options.menu.sortBy,
                                order: this.options.menu.sortDirection,
                            },
                        ],
                    });
                }
                if (options.filterout) {
                    const f = {};
                    f[this.options.menu.filterout.field] = this.options.menu.filterout.val;
                    this.controllers.directory.repository.query.setFilterOut(f);
                }
                if (options.location) {
                    this.controllers.directory.scrollable = this.shouldBeScrollable(this.options.menu.location);
                }
                let $container;
                if (MapSVG.isPhone && this.options.menu.hideOnMobile) {
                    $container = $$A(this.containers.leftSidebar);
                }
                else {
                    $container =
                        this.options.menu.location !== "custom"
                            ? $$A(this.containers[this.options.menu.location])
                            : $$A("#" + this.options.menu.containerId);
                }
                $container.append(this.containers.directory);
                if (this.options.colors.directory) {
                    $$A(this.containers.directory).css({
                        "background-color": this.options.colors.directory,
                    });
                }
                this.setFilters();
                this.setTemplates({ directoryItem: this.options.templates.directoryItem });
                if ((this.options.menu.source === "regions" && this.regionsRepository.loaded) ||
                    (this.options.menu.source === "database" && this.objectsRepository.loaded)) {
                    if (this.editMode &&
                        (options.sortBy || options.sortDirection || options.filterout)) {
                        this.controllers.directory.repository.reload();
                    }
                    this.loadDirectory();
                }
            }
            else {
                this.controllers.directory && this.controllers.directory.destroy();
                this.controllers.directory = null;
            }
        }
        setDatabase(options) {
            options = options || this.options.database;
            if (options.pagination) {
                if (options.pagination.on != undefined) {
                    options.pagination.on = MapSVG.parseBoolean(options.pagination.on);
                }
                if (options.pagination.perpage != undefined) {
                    options.pagination.perpage = parseInt(options.pagination.perpage);
                }
            }
            $$A.extend(true, this.options, { database: options });
            if (options.pagination) {
                if (options.pagination.on !== undefined || options.pagination.perpage) {
                    const query = new Query({
                        perpage: this.options.database.pagination.on
                            ? this.options.database.pagination.perpage
                            : 0,
                    });
                    this.objectsRepository.find(query);
                }
                else {
                    this.setPagination();
                }
            }
        }
        updateGoogleMapsMaxZoom(geoPoint) {
            this.googleMaps.maxZoomService.getMaxZoomAtLatLng(geoPoint, (result) => {
                if (result.status === "OK") {
                    this.googleMaps.currentMaxZoom = result.zoom;
                }
            });
        }
        setGoogleMaps(options) {
            options = options || this.options.googleMaps;
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            if (!this.googleMaps) {
                this.googleMaps = { loaded: false, initialized: false, map: null, overlay: null };
            }
            $$A.extend(true, this.options, { googleMaps: options });
            if (this.options.googleMaps.on) {
                $$A(this.containers.map).toggleClass("mapsvg-with-google-map", true);
                if (!MapSVG.googleMapsApiLoaded) {
                    this.loadGoogleMapsAPI(() => {
                        this.setGoogleMaps();
                    }, () => {
                        this.setGoogleMaps({ on: false });
                    });
                }
                else {
                    if (!this.googleMaps.map) {
                        this.containers.googleMaps = $$A('<div class="mapsvg-layer mapsvg-layer-gm" id="mapsvg-google-maps-' +
                            this.id +
                            '"></div>').prependTo(this.containers.map)[0];
                        $$A(this.containers.googleMaps).css({
                            position: "absolute",
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            "z-index": "0",
                        });
                        this.googleMaps.map = new google.maps.Map(this.containers.googleMaps, {
                            mapTypeId: options.type,
                            fullscreenControl: false,
                            keyboardShortcuts: false,
                            mapTypeControl: false,
                            scaleControl: false,
                            scrollwheel: false,
                            streetViewControl: false,
                            zoomControl: false,
                            styles: options.styleJSON,
                            tilt: 0,
                        });
                        const southWest = new google.maps.LatLng(this.geoViewBox.sw.lat, this.geoViewBox.sw.lng);
                        const northEast = new google.maps.LatLng(this.geoViewBox.ne.lat, this.geoViewBox.ne.lng);
                        const bounds = new google.maps.LatLngBounds(southWest, northEast);
                        this.googleMaps.overlay = this.createGoogleMapOverlay(bounds, this.googleMaps.map);
                        if (!this.options.googleMaps.center || !this.options.googleMaps.zoom) {
                            this.googleMaps.map.fitBounds(bounds, 0);
                        }
                        else {
                            this.googleMaps.map.setZoom(this.options.googleMaps.zoom);
                            this.googleMaps.map.setCenter(this.options.googleMaps.center);
                        }
                        this.googleMaps.initialized = true;
                        this.googleMaps.maxZoomService = new google.maps.MaxZoomService();
                        this.googleMaps.map.addListener("idle", () => {
                            this.isZooming = false;
                        });
                        google.maps.event.addListenerOnce(this.googleMaps.map, "idle", () => {
                            setTimeout(() => {
                                $$A(this.containers.map).addClass("mapsvg-fade-in");
                                setTimeout(() => {
                                    $$A(this.containers.map).removeClass("mapsvg-google-map-loading");
                                    $$A(this.containers.map).removeClass("mapsvg-fade-in");
                                    if (!this.options.googleMaps.center ||
                                        !this.options.googleMaps.zoom) {
                                        this.options.googleMaps.center = this.googleMaps.map
                                            .getCenter()
                                            .toJSON();
                                        this.options.googleMaps.zoom = this.googleMaps.map.getZoom();
                                    }
                                    this.zoomDelta = this.options.googleMaps.zoom - this.zoomLevel;
                                    this.updateGoogleMapsMaxZoom(this.options.googleMaps.center);
                                    this.setInitialViewBox(this.viewBox);
                                    this.toggleSvgLayerOnZoom();
                                    this.events.trigger("googleMapsLoaded");
                                    this.afterLoadBlockers--;
                                    this.finalizeMapLoading();
                                }, 300);
                            }, 1);
                        });
                        this.events.on("googleMapsBoundsChanged", (bounds) => {
                            this.setViewBoxByGoogleMapsOverlay();
                        });
                    }
                    else {
                        $$A(this.containers.map).toggleClass("mapsvg-with-google-map", true);
                        $$A(this.containers.googleMaps) && $$A(this.containers.googleMaps).show();
                        if (options.type) {
                            this.googleMaps.map.setMapTypeId(options.type);
                        }
                        this.setViewBoxByGoogleMapsOverlay();
                    }
                }
            }
            else {
                $$A(this.containers.map).toggleClass("mapsvg-with-google-map", false);
                $$A(this.containers.googleMaps) && $$A(this.containers.googleMaps).hide();
                this.googleMaps.initialized = false;
            }
            if (this.converter) {
                this.converter.setWorldShift(this.options.googleMaps.on);
            }
        }
        createGoogleMapOverlay(bounds, map) {
            class GoogleMapsOverlay extends google.maps.OverlayView {
                constructor(bounds, googleMapInstance, mapsvg) {
                    super();
                    this.bounds_ = bounds;
                    this.map_ = googleMapInstance;
                    this.mapsvg = mapsvg;
                    this.setMap(googleMapInstance);
                    this.prevCoords = {
                        sw: { x: 0, y: 0 },
                        sw2: { x: 0, y: 0 },
                        ne: { x: 0, y: 0 },
                        ne2: { x: 0, y: 0 },
                    };
                }
                draw() {
                    this.mapsvg.events.trigger("googleMapsBoundsChanged", this.map_, [
                        this.getPixelBounds(),
                        this.map_,
                    ]);
                }
                onAdd() {
                    this.element = document.createElement("div");
                    this.element.style.borderStyle = "none";
                    this.element.style.borderWidth = "0px";
                    this.element.style.position = "absolute";
                    const panes = this.getPanes();
                    panes.overlayLayer.appendChild(this.element);
                }
                getPixelBounds() {
                    const overlayProjection = this.getProjection();
                    if (!overlayProjection)
                        return;
                    const geoSW = this.bounds_.getSouthWest();
                    const geoNE = this.bounds_.getNorthEast();
                    const coords = {
                        sw: overlayProjection.fromLatLngToDivPixel(geoSW),
                        ne: overlayProjection.fromLatLngToDivPixel(geoNE),
                        sw2: overlayProjection.fromLatLngToContainerPixel(geoSW),
                        ne2: overlayProjection.fromLatLngToContainerPixel(geoNE),
                    };
                    const ww = overlayProjection.getWorldWidth();
                    if (this.prevCoords.sw) {
                        if (coords.ne.x < coords.sw.x) {
                            if (Math.abs(this.prevCoords.sw.x - coords.sw.x) >
                                Math.abs(this.prevCoords.ne.x - coords.ne.x)) {
                                coords.sw.x = coords.sw.x - ww;
                            }
                            else {
                                coords.ne.x = coords.ne.x + ww;
                            }
                            if (Math.abs(this.prevCoords.sw2.x - coords.sw2.x) >
                                Math.abs(this.prevCoords.ne2.x - coords.ne2.x)) {
                                coords.sw2.x = coords.sw2.x - ww;
                            }
                            else {
                                coords.ne2.x = coords.ne2.x + ww;
                            }
                        }
                    }
                    this.prevCoords = coords;
                    return { sw: coords.sw2, ne: coords.ne2 };
                }
            }
            return new GoogleMapsOverlay(bounds, map, this);
        }
        loadGoogleMapsAPI(callback, fail) {
            if (window.google !== undefined && google.maps) {
                MapSVG.googleMapsApiLoaded = true;
            }
            if (MapSVG.googleMapsApiLoaded) {
                if (typeof callback == "function") {
                    callback();
                }
                return;
            }
            MapSVG.googleMapsLoadCallbacks = MapSVG.googleMapsLoadCallbacks || [];
            if (typeof callback == "function") {
                MapSVG.googleMapsLoadCallbacks.push(callback);
            }
            if (MapSVG.googleMapsApiIsLoading) {
                return;
            }
            MapSVG.googleMapsApiIsLoading = true;
            window.gm_authFailure = () => {
                if (MapSVG.GoogleMapBadApiKey) {
                    MapSVG.GoogleMapBadApiKey();
                }
                else {
                    if (this.editMode) {
                        alert("Google maps API key is incorrect.");
                    }
                    else {
                        console.error("MapSVG: Google maps API key is incorrect.");
                    }
                }
            };
            this.googleMapsScript = document.createElement("script");
            this.googleMapsScript.onload = () => {
                MapSVG.googleMapsApiLoaded = true;
                MapSVG.googleMapsLoadCallbacks.forEach((_callback) => {
                    if (typeof callback == "function")
                        _callback();
                });
            };
            const gmLibraries = [];
            if (this.options.googleMaps.drawingTools) {
                gmLibraries.push("drawing");
            }
            if (this.options.googleMaps.geometry) {
                gmLibraries.push("geometry");
            }
            let libraries = "";
            if (gmLibraries.length > 0) {
                libraries = "&libraries=" + gmLibraries.join(",");
            }
            this.googleMapsScript.src =
                "https://maps.googleapis.com/maps/api/js?language=" +
                    this.options.googleMaps.language +
                    "&key=" +
                    this.options.googleMaps.apiKey +
                    libraries;
            document.head.appendChild(this.googleMapsScript);
        }
        loadDetailsView(obj) {
            this.controllers.popover && this.controllers.popover.close();
            if (this.controllers.detailsView)
                this.controllers.detailsView.destroy();
            this.controllers.detailsView = new DetailsController({
                autoresize: MapSVG.isPhone &&
                    this.options.detailsView.mobileFullscreen &&
                    this.options.detailsView.location !== "custom"
                    ? false
                    : this.options.detailsView.autoresize,
                container: this.containers.detailsView,
                template: obj instanceof Region
                    ? this.options.templates.detailsViewRegion
                    : this.options.templates.detailsView,
                mapsvg: this,
                data: obj.getData(),
                modal: MapSVG.isPhone &&
                    this.options.detailsView.mobileFullscreen &&
                    this.options.detailsView.location !== "custom",
                scrollable: (MapSVG.isPhone &&
                    this.options.detailsView.mobileFullscreen &&
                    this.options.detailsView.location !== "custom") ||
                    this.shouldBeScrollable(this.options.detailsView.location),
                withToolbar: !(MapSVG.isPhone &&
                    this.options.detailsView.mobileFullscreen &&
                    this.options.detailsView.location !== "custom") && this.shouldBeScrollable(this.options.detailsView.location),
                events: {
                    shown: (detailsController) => {
                        this.events.trigger("shown.detailsView", this, [this, detailsController]);
                        $$A(window).trigger("shown.detailsView", [this, detailsController]);
                    },
                    closed: (detailsController) => {
                        this.deselectAllRegions();
                        this.deselectAllMarkers();
                        this.controllers &&
                            this.controllers.directory &&
                            this.controllers.directory.deselectItems();
                        this.events.trigger("closed.detailsView", [this, detailsController]);
                    },
                },
            });
            this.controllers.detailsView._init();
        }
        loadFiltersModal() {
            if (this.options.filters.modalLocation != "custom") {
                if (!this.containers.filtersModal) {
                    this.containers.filtersModal = $$A('<div class="mapsvg-details-container mapsvg-filters-wrap"></div>')[0];
                }
                this.setColors();
                $$A(this.containers.filtersModal).css({ width: this.options.filters.width });
                if (MapSVG.isPhone) {
                    $$A("body").append($$A(this.containers.filtersModal));
                    $$A(this.containers.filtersModal).css({ width: "" });
                }
                else {
                    $$A(this.containers[this.options.filters.modalLocation]).append($$A(this.containers.filtersModal));
                }
            }
            else {
                this.containers.filtersModal = $$A("#" + this.options.filters.containerId)[0];
                $$A(this.containers.filtersModal).css({ width: "" });
            }
            this.loadFiltersController(this.containers.filtersModal, true);
        }
        loadFiltersController(container, modal = false) {
            if (!this.filtersShouldBeShown()) {
                return;
            }
            let filtersInDirectory, filtersHide;
            if (MapSVG.isPhone) {
                filtersInDirectory = true;
                filtersHide = this.options.filters.hideOnMobile;
            }
            else {
                filtersInDirectory =
                    this.options.menu.on &&
                        this.controllers.directory &&
                        this.options.menu.location === this.options.filters.location;
                filtersHide = this.options.filters.hide;
            }
            const scrollable = modal ||
                (!filtersInDirectory &&
                    ["leftSidebar", "rightSidebar"].indexOf(this.options.filters.location) !== -1);
            this.filtersRepository =
                this.options.filters.source === "regions"
                    ? this.regionsRepository
                    : this.objectsRepository;
            if (this.options.filters.searchButton) {
                this.changedFields = null;
                this.changedSearch = null;
            }
            else {
                this.changedSearch = () => {
                    this.filtersRepository.query.searchFallback = this.filtersSchema.getFieldByType("search").searchFallback;
                    this.throttle(this.filtersRepository.reload, 400, this.filtersRepository);
                };
                this.changedFields = () => {
                    this.throttle(this.filtersRepository.reload, 400, this.filtersRepository);
                };
            }
            this.controllers.filters = new FiltersController({
                container: container,
                query: this.filtersRepository.query,
                mapsvg: this,
                schema: this.filtersSchema,
                template: '<div class="mapsvg-filters-container"></div>',
                scrollable: scrollable,
                modal: modal,
                withToolbar: MapSVG.isPhone ? false : modal,
                width: $$A(container).hasClass("mapsvg-map-container")
                    ? this.options.filters.width
                    : "100%",
                hide: this.options.filters.hide,
                hideOnMobile: this.options.filters.hideOnMobile,
                showButtonText: this.options.filters.showButtonText,
                clearButton: this.options.filters.clearButton,
                clearButtonText: this.options.filters.clearButtonText,
                searchButton: this.options.filters.searchButton,
                searchButtonText: this.options.filters.searchButtonText,
                padding: this.options.filters.padding,
                events: {
                    cleared: () => {
                        this.deselectAllRegions();
                        this.filtersRepository.reload();
                    },
                    "changed.fields": this.changedFields,
                    "changed.search": this.changedSearch,
                    "click.btn.searchButton": () => {
                        this.filtersRepository.reload();
                    },
                    loaded: () => {
                        this.controllers.directory && this.controllers.directory.updateTopShift();
                        this.afterLoadBlockers--;
                        this.finalizeMapLoading();
                    },
                    "click.btn.showFilters": () => {
                        this.loadFiltersModal();
                    },
                },
            });
            this.controllers.filters._init();
        }
        filtersShouldBeShown() {
            return (this.options.filters.on &&
                this.options.filtersSchema &&
                this.options.filtersSchema.length > 0);
        }
        textSearch(text, fallback = false) {
            const query = new Query({
                filters: { search: text },
                searchFallback: fallback,
            });
            this.filtersRepository.find(query);
        }
        getRegion(id) {
            return this.regions.findById(id);
        }
        getRegions() {
            return this.regions;
        }
        getMarker(id) {
            return this.markers.findById(id);
        }
        checkId(id) {
            if (this.getRegion(id))
                return { canUse: false, error: "This ID is already being used by a Region" };
            else if (this.getMarker(id))
                return { canUse: false, error: "This ID is already being used by another Marker" };
            else
                return { canUse: true, error: "" };
        }
        regionsRedrawColors() {
            this.regions.forEach((region) => {
                region.setFill();
            });
        }
        redrawBubbles() {
            $$A(this.containers.map).removeClass("bubbles-regions-on bubbles-database-on");
            if (this.options.choropleth.on && this.options.choropleth.bubbleMode) {
                $$A(this.containers.map).addClass("bubbles-" + this.options.choropleth.source + "-on");
            }
            this.regions.forEach(function (region) {
                region.drawBubble();
            });
            const markersBubbleMode = this.options.choropleth.on &&
                this.options.choropleth.source == "database" &&
                this.options.choropleth.bubbleMode;
            this.markers.forEach(function (marker) {
                marker.setBubbleMode(markersBubbleMode);
            });
        }
        destroy() {
            if (this.controllers && this.controllers.directory) {
                this.controllers.directory.mobileButtons.remove();
            }
            $$A(this.containers.map)
                .empty()
                .insertBefore($$A(this.containers.wrapAll))
                .attr("style", "")
                .removeClass("mapsvg mapsvg-responsive");
            this.controllers.popover && this.controllers.popover.close();
            if (this.controllers.detailsView)
                this.controllers.detailsView.destroy();
            $$A(this.containers.wrapAll).remove();
        }
        getData() {
            return {
                id: this.id,
                title: this.options.title,
                options: this.getOptions(false, false),
            };
        }
        mayBeFitMarkers() {
            if (!this.lastTimeFitWas) {
                this.lastTimeFitWas = Date.now() - 99999;
            }
            this.fitDelta = Date.now() - this.lastTimeFitWas;
            if (this.fitDelta > 1000 &&
                !this.firstDataLoad &&
                !this.fitOnDataLoadDone &&
                this.options.fitMarkers) {
                this.fitMarkers();
                this.fitOnDataLoadDone = true;
            }
            if (this.firstDataLoad &&
                (this.options.fitMarkersOnStart ||
                    (this.options.fitMarkers && this.options.database.loadOnStart === false))) {
                this.firstDataLoad = false;
                if (this.options.googleMaps.on && !this.googleMaps.map) {
                    this.events.on("googleMapsLoaded", () => {
                        this.fitMarkers();
                    });
                }
                else {
                    this.fitMarkers();
                }
            }
            this.lastTimeFitWas = Date.now();
        }
        fitMarkers() {
            const dbObjects = this.objectsRepository.getLoaded();
            if (!dbObjects || dbObjects.length === 0) {
                return;
            }
            if (this.options.googleMaps.on && typeof google !== "undefined") {
                const lats = [];
                const lngs = [];
                if (dbObjects.length > 1) {
                    dbObjects.forEach((object) => {
                        if (object.location && object.location.geoPoint) {
                            lats.push(object.location.geoPoint.lat);
                            lngs.push(object.location.geoPoint.lng);
                        }
                    });
                    const minlat = Math.min.apply(null, lats), maxlat = Math.max.apply(null, lats);
                    const minlng = Math.min.apply(null, lngs), maxlng = Math.max.apply(null, lngs);
                    const bbox = new google.maps.LatLngBounds({ lat: minlat, lng: minlng }, { lat: maxlat, lng: maxlng });
                    this.googleMaps.map.fitBounds(bbox, 0);
                }
                else {
                    if (dbObjects[0].location &&
                        dbObjects[0].location.geoPoint.lat &&
                        dbObjects[0].location.geoPoint.lng) {
                        const coords = {
                            lat: dbObjects[0].location.geoPoint.lat,
                            lng: dbObjects[0].location.geoPoint.lng,
                        };
                        if (this.googleMaps.map) {
                            this.googleMaps.map.setCenter(coords);
                            this.googleMaps.map.setZoom(this.options.fitSingleMarkerZoom);
                        }
                    }
                }
            }
            else {
                if (this.options.clustering.on) {
                    const arr = [];
                    this.markersClusters.forEach((c) => {
                        arr.push(c);
                    });
                    this.markers.forEach((m) => {
                        arr.push(m);
                    });
                    this.zoomTo(arr);
                    return;
                }
                else {
                    this.zoomTo(this.markers);
                    return;
                }
            }
        }
        setFitSingleMarkerZoom(zoom) {
            this.options.fitSingleMarkerZoom = parseInt(zoom);
        }
        showUserLocation(callback) {
            this.getUserLocation((geoPoint) => {
                this.userLocation = null;
                this.userLocation = new Location({
                    geoPoint: geoPoint,
                    img: MapSVG.urls.root + "/markers/user-location.svg",
                });
                this.userLocationMarker && this.userLocationMarker.delete();
                this.userLocationMarker = new Marker({
                    location: this.userLocation,
                    mapsvg: this,
                    width: 15,
                    height: 15,
                });
                $$A(this.userLocationMarker.element).addClass("mapsvg-user-location");
                this.userLocationMarker.centered = true;
                this.getLayer("markers").append(this.userLocationMarker.element);
                this.userLocationMarker.adjustScreenPosition();
                callback && callback(this.userLocation);
            });
        }
        getUserLocation(callback) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    const pos = new GeoPoint(position.coords.latitude, position.coords.longitude);
                    callback && callback(pos);
                });
            }
            else {
                return false;
            }
        }
        getScale() {
            const scale2 = this.containers.map.clientWidth / this.viewBox.width;
            return scale2 || 1;
        }
        getViewBox() {
            return this.viewBox;
        }
        viewBoxSetBySize(width, height) {
            this.setSize(width, height);
            this._viewBox.update(this.viewBoxGetBySize(width, height));
            this.setViewBox(this._viewBox);
            $$A(window).trigger("resize");
            this.setSize(width, height);
            this.setZoomLevels();
            return this.viewBox;
        }
        viewBoxGetBySize(width, height) {
            const new_ratio = width / height;
            const old_ratio = this.svgDefault.viewBox.width / this.svgDefault.viewBox.height;
            const vb = this.svgDefault.viewBox.clone();
            if (new_ratio != old_ratio) {
                if (new_ratio > old_ratio) {
                    vb.width = this.svgDefault.viewBox.height * new_ratio;
                    vb.x = this.svgDefault.viewBox.x - (vb.width - this.svgDefault.viewBox.width) / 2;
                }
                else {
                    vb.height = this.svgDefault.viewBox.width / new_ratio;
                    vb.y = this.svgDefault.viewBox.y - (vb.height - this.svgDefault.viewBox.height) / 2;
                }
            }
            return vb;
        }
        viewBoxReset(toInitial) {
            if (this.options.googleMaps.on && this.googleMaps.map) {
                if (!toInitial) {
                    this.options.googleMaps.center = null;
                    this.options.googleMaps.zoom = null;
                }
                if (!this.options.googleMaps.center || !this.options.googleMaps.zoom) {
                    const southWest = new google.maps.LatLng(this.geoViewBox.sw.lat, this.geoViewBox.sw.lng);
                    const northEast = new google.maps.LatLng(this.geoViewBox.ne.lat, this.geoViewBox.ne.lng);
                    const bounds = new google.maps.LatLngBounds(southWest, northEast);
                    this.googleMaps.map.fitBounds(bounds, 0);
                    this.options.googleMaps.center = this.googleMaps.map.getCenter().toJSON();
                    this.options.googleMaps.zoom = this.googleMaps.map.getZoom();
                }
                else {
                    this.googleMaps.map.setZoom(this.options.googleMaps.zoom);
                    this.googleMaps.map.setCenter(this.options.googleMaps.center);
                }
            }
            else {
                if (toInitial) {
                    const v = this._viewBox || this.svgDefault.viewBox;
                    this.zoomLevel = 0;
                    this._scale = 1;
                    this.setViewBox(v);
                }
                else {
                    this.setViewBox();
                }
            }
            return this.viewBox;
        }
        getGeoViewBox() {
            const v = this.viewBox;
            const p1 = new SVGPoint(v.x, v.y);
            const p2 = new SVGPoint(v.x + v.width, v.y);
            const p3 = new SVGPoint(v.x, v.y);
            const p4 = new SVGPoint(v.x, v.y + v.height);
            const leftLon = this.converter.convertSVGToGeo(p1).lng;
            const rightLon = this.converter.convertSVGToGeo(p2).lng;
            const topLat = this.converter.convertSVGToGeo(p3).lat;
            const bottomLat = this.converter.convertSVGToGeo(p4).lat;
            return [leftLon, topLat, rightLon, bottomLat];
        }
        setStrokes() {
            $$A(this.containers.svg)
                .find("path, polygon, circle, ellipse, rect, line, polyline")
                .each((index, elem) => {
                const width = MapObject.getComputedStyle("stroke-width", elem);
                if (width) {
                    $$A(elem).attr("data-stroke-width", width.replace("px", ""));
                }
            });
        }
        adjustStrokes() {
            $$A(this.containers.svg)
                .find("path, polygon, circle, ellipse, rect, line, polyline")
                .each((index, elem) => {
                const width = elem.getAttribute("data-stroke-width");
                if (width) {
                    $$A(elem).css("stroke-width", Number(width) / this.scale);
                }
            });
        }
        zoomIn(center) {
            if (this.canZoom) {
                this.isZooming = true;
                this.canZoom = false;
                setTimeout(() => {
                    this.isZooming = false;
                    this.canZoom = true;
                }, 700);
                this.zoom(1, center);
            }
        }
        zoomOut(center) {
            if (this.canZoom) {
                this.isZooming = true;
                this.canZoom = false;
                setTimeout(() => {
                    this.isZooming = false;
                    this.canZoom = true;
                }, 700);
                this.zoom(-1, center);
            }
        }
        zoomTo(mapObjects, zoomToLevel) {
            if (mapObjects instanceof Marker || mapObjects instanceof MarkerCluster) {
                return this.zoomToMarkerOrCluster(mapObjects, zoomToLevel);
            }
            else {
                const convertedObjects = !Array.isArray(mapObjects) ? [mapObjects] : mapObjects;
                const bbox = this.getGroupBBox(convertedObjects);
                return this.fitViewBox(bbox, zoomToLevel);
            }
        }
        zoomToMarkerOrCluster(mapObject, zoomToLevel) {
            this.zoomLevel = zoomToLevel || 1;
            const foundZoomLevel = this.zoomLevels.get(this.zoomLevel);
            if (!foundZoomLevel) {
                return false;
            }
            const vb = foundZoomLevel.viewBox;
            if (this.canZoom) {
                this.isZooming = true;
                this.canZoom = false;
                setTimeout(() => {
                    this.isZooming = false;
                    this.canZoom = true;
                }, 700);
                const vbNew = new ViewBox(mapObject.svgPoint.x - vb.width / 2, mapObject.svgPoint.y - vb.height / 2, vb.width, vb.height);
                this.setViewBox(vbNew);
                this._scale = foundZoomLevel._scale;
                return true;
            }
            return false;
        }
        getGroupBBox(mapObjects) {
            let _bbox;
            const xmax = [];
            const ymax = [];
            const xmin = [];
            const ymin = [];
            for (let i = 0; i < mapObjects.length; i++) {
                _bbox = mapObjects[i].getBBox();
                xmin.push(_bbox.x);
                ymin.push(_bbox.y);
                const _w = _bbox.x + _bbox.width;
                const _h = _bbox.y + _bbox.height;
                xmax.push(_w);
                ymax.push(_h);
            }
            const _xmin = Math.min(...xmin);
            const _ymin = Math.min(...ymin);
            const width = Math.max(...xmax) - _xmin;
            const height = Math.max(...ymax) - _ymin;
            let padding = 10;
            const point1 = new ScreenPoint(padding, 0);
            const point2 = new ScreenPoint(0, 0);
            padding =
                this.converter.convertPixelToSVG(point1).x - this.converter.convertPixelToSVG(point2).x;
            return new ViewBox(_xmin - padding, _ymin - padding, width + padding * 2, height + padding * 2);
        }
        fitViewBox(fitViewBox, forceZoomLevel) {
            let viewBoxPrev;
            let foundZoomLevelNumber = 0;
            let foundZoomLevel;
            let newViewBox;
            this.zoomLevels.forEach((zoomLevel) => {
                if (viewBoxPrev && viewBoxPrev.x !== undefined) {
                    if (fitViewBox.fitsInViewBox(viewBoxPrev) &&
                        zoomLevel.viewBox.fitsInViewBox(fitViewBox, true)) {
                        foundZoomLevelNumber = forceZoomLevel ? forceZoomLevel : zoomLevel.zoomLevel;
                        foundZoomLevel = this.zoomLevels.get(foundZoomLevelNumber);
                        newViewBox = new ViewBox(fitViewBox.x - foundZoomLevel.viewBox.width / 2 + fitViewBox.width / 2, fitViewBox.y - foundZoomLevel.viewBox.height / 2 + fitViewBox.height / 2, foundZoomLevel.viewBox.width, foundZoomLevel.viewBox.height);
                    }
                }
                viewBoxPrev = zoomLevel && zoomLevel.viewBox;
            });
            if (foundZoomLevel) {
                if (this.canZoom) {
                    this.isZooming = true;
                    this.canZoom = false;
                    setTimeout(() => {
                        this.isZooming = false;
                        this.canZoom = true;
                    }, 700);
                    this.zoomLevel = foundZoomLevelNumber;
                    this._scale = foundZoomLevel._scale;
                    this.setViewBox(newViewBox);
                    return true;
                }
            }
            else {
                return false;
            }
        }
        zoomToRegion(region, zoomToLevel) {
            this.fitViewBox(region.getBBox(), zoomToLevel);
            return true;
        }
        centerOn(region, yShift) {
            if (this.options.googleMaps.on) {
                yShift = yShift ? (yShift + 12) / this.getScale() : 0;
                $$A(this.containers.map).addClass("scrolling");
                const latLng = region.getCenterLatLng(yShift);
                this.googleMaps.map.panTo(latLng);
                setTimeout(() => {
                    $$A(this.containers.map).removeClass("scrolling");
                }, 100);
            }
            else {
                yShift = yShift ? (yShift + 12) / this.getScale() : 0;
                const bbox = region.getBBox();
                const vb = this.viewBox;
                const newViewBox = new ViewBox(bbox.x - vb.width / 2 + bbox.width / 2, bbox.y - vb.height / 2 + bbox.height / 2 - yShift, vb.width, vb.height);
                this.setViewBox(newViewBox);
            }
        }
        zoom(delta, center) {
            let newViewBox = new ViewBox(0, 0, 0, 0);
            const d = delta > 0 ? 1 : -1;
            if (!this.zoomLevels.get(this.zoomLevel + d))
                return;
            const newZoomLevel = this.zoomLevel + d;
            const zoomIn = d > 0;
            const zoomOut = d < 0;
            const zoomRange = this.getZoomRange();
            const isInZoomRange = this.zoomLevel >= zoomRange.min && this.zoomLevel <= zoomRange.max;
            const goingOutOfZoomRange = isInZoomRange && (newZoomLevel > zoomRange.max || newZoomLevel < zoomRange.min);
            const outOfRangeAndMovingAway = !isInZoomRange &&
                ((zoomIn && newZoomLevel > zoomRange.max) || (zoomOut && newZoomLevel < zoomRange.min));
            if (goingOutOfZoomRange || outOfRangeAndMovingAway) {
                return;
            }
            this.zoomLevel = newZoomLevel;
            const z = this.zoomLevels.get(this.zoomLevel);
            this._scale = z._scale;
            newViewBox = z.viewBox;
            let shift = [];
            if (center) {
                const koef = zoomIn ? 0.5 : -1;
                newViewBox.x = this.viewBox.x + (center.x - this.viewBox.x) * koef;
                newViewBox.y = this.viewBox.y + (center.y - this.viewBox.y) * koef;
            }
            else {
                shift = [
                    (this.viewBox.width - newViewBox.width) / 2,
                    (this.viewBox.height - newViewBox.height) / 2,
                ];
                newViewBox.x = this.viewBox.x + shift[0];
                newViewBox.y = this.viewBox.y + shift[1];
            }
            this.shiftViewBoxToScrollBoundaries(newViewBox);
            this.setViewBox(newViewBox);
        }
        toggleSvgLayerOnZoom() {
            if (this.options.googleMaps.on &&
                this.googleMaps.map &&
                this.options.zoom.hideSvg &&
                this.googleMaps.map.getZoom() >= this.options.zoom.hideSvgZoomLevel) {
                if (!$$A(this.containers.svg).hasClass("mapsvg-invisible")) {
                    $$A(this.containers.svg).animate({ opacity: 0 }, 400, "linear", () => {
                        $$A(this.containers.svg).addClass("mapsvg-invisible");
                    });
                }
            }
            else {
                if ($$A(this.containers.svg).hasClass("mapsvg-invisible")) {
                    $$A(this.containers.svg).animate({ opacity: 1 }, 400, "linear", () => {
                        $$A(this.containers.svg).removeClass("mapsvg-invisible");
                    });
                }
            }
        }
        shiftViewBoxToScrollBoundaries(newViewBox) {
            if (this.options.scroll.limit) {
                if (newViewBox.x < this.svgDefault.viewBox.x)
                    newViewBox.x = this.svgDefault.viewBox.x;
                else if (newViewBox.x + newViewBox.width >
                    this.svgDefault.viewBox.x + this.svgDefault.viewBox.width)
                    newViewBox.x =
                        this.svgDefault.viewBox.x + this.svgDefault.viewBox.width - newViewBox.width;
                if (newViewBox.y < this.svgDefault.viewBox.y)
                    newViewBox.y = this.svgDefault.viewBox.y;
                else if (newViewBox.y + newViewBox.height >
                    this.svgDefault.viewBox.y + this.svgDefault.viewBox.height)
                    newViewBox.y =
                        this.svgDefault.viewBox.y + this.svgDefault.viewBox.height - newViewBox.height;
            }
            return newViewBox;
        }
        markerDelete(marker) {
            if (this.editingMarker && this.editingMarker.id == marker.id) {
                this.unsetEditingMarker();
            }
            if (this.markers.findById(marker.id)) {
                this.markers.delete(marker.id);
            }
            marker.delete();
            marker = null;
            if (this.markers.length === 0)
                this.options.markerLastID = 0;
        }
        markersClusterAdd(markersCluster) {
            this.layers.markers.append(markersCluster.elem);
            this.markersClusters.push(markersCluster);
            markersCluster.adjustScreenPosition();
        }
        markerAdd(marker) {
            $$A(marker.element).hide();
            marker.adjustScreenPosition();
            this.layers.markers.append(marker.element);
            this.markers.push(marker);
            marker.mapped = true;
            setTimeout(function () {
                $$A(marker.element).show();
            }, 100);
        }
        markerRemove(marker) {
            if (this.editingMarker && this.editingMarker.id == marker.id) {
                this.editingMarker = null;
                delete this.editingMarker;
            }
            if (this.markers.findById(marker.id)) {
                this.markers.findById(marker.id).element.remove();
                this.markers.delete(marker.id);
                marker = null;
            }
            if (this.markers.length === 0)
                this.options.markerLastID = 0;
        }
        markerId() {
            this.options.markerLastID = this.options.markerLastID + 1;
            const id = "marker_" + this.options.markerLastID;
            if (this.getMarker(id))
                return this.markerId();
            else
                return id;
        }
        movingItemsAdjustScreenPosition() {
            this.markersAdjustScreenPosition();
            this.popoverAdjustScreenPosition();
            this.bubblesRegionsAdjustScreenPosition();
            this.labelsRegionsAdjustScreenPosition();
        }
        movingItemsMoveScreenPositionBy(deltaX, deltaY) {
            this.markersMoveScreenPositionBy(deltaX, deltaY);
            this.popoverMoveScreenPositionBy(deltaX, deltaY);
            this.bubblesRegionsMoveScreenPositionBy(deltaX, deltaY);
            this.labelsRegionsMoveScreenPositionBy(deltaX, deltaY);
        }
        labelsRegionsAdjustScreenPosition() {
            if ($$A(this.containers.map).is(":visible")) {
                this.regions.forEach(function (region) {
                    region.adjustLabelScreenPosition();
                });
            }
        }
        bubblesRegionsAdjustScreenPosition() {
            if ($$A(this.containers.map).is(":visible")) {
                this.regions.forEach(function (region) {
                    region.adjustBubbleScreenPosition();
                });
            }
        }
        labelsRegionsMoveScreenPositionBy(deltaX, deltaY) {
            if ($$A(this.containers.map).is(":visible")) {
                this.regions.forEach(function (region) {
                    region.moveLabelScreenPositionBy(deltaX, deltaY);
                });
            }
        }
        bubblesRegionsMoveScreenPositionBy(deltaX, deltaY) {
            if ($$A(this.containers.map).is(":visible")) {
                this.regions.forEach((region) => {
                    region.moveBubbleScreenPositionBy(deltaX, deltaY);
                });
            }
        }
        markersAdjustScreenPosition() {
            this.markers.forEach((marker) => {
                marker.adjustScreenPosition();
            });
            this.markersClusters.forEach((cluster) => {
                cluster.adjustScreenPosition();
            });
            if (this.userLocationMarker) {
                this.userLocationMarker.adjustScreenPosition();
            }
        }
        markersMoveScreenPositionBy(deltaX, deltaY) {
            this.markers.forEach((marker) => {
                marker.moveSrceenPositionBy(deltaX, deltaY);
            });
            this.markersClusters.forEach((cluster) => {
                cluster.moveSrceenPositionBy(deltaX, deltaY);
            });
            if (this.userLocationMarker) {
                this.userLocationMarker.moveSrceenPositionBy(deltaX, deltaY);
            }
        }
        setEditingMarker(marker) {
            this.editingMarker = marker;
            if (!this.editingMarker.mapped) {
                this.editingMarker.needToRemove = true;
                this.markerAdd(this.editingMarker);
            }
        }
        unsetEditingMarker() {
            if (this.editingMarker && this.editingMarker.needToRemove) {
                this.markerRemove(this.editingMarker);
            }
            this.editingMarker = null;
        }
        getEditingMarker() {
            return this.editingMarker;
        }
        scrollStart(e, mapsvg) {
            if ($$A(e.target).hasClass("mapsvg-btn-map") ||
                $$A(e.target).closest(".mapsvg-choropleth").length)
                return;
            if (this.editMarkers.on && $$A(e.target).hasClass("mapsvg-marker"))
                return;
            e.preventDefault();
            $$A(this.containers.map).addClass("no-transitions");
            const ce = e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0]
                ? e.originalEvent.touches[0]
                : e;
            this.scrollStarted = true;
            this.scroll = {
                tx: this.scroll.tx || 0,
                ty: this.scroll.ty || 0,
                vxi: this.viewBox.x,
                vyi: this.viewBox.y,
                x: ce.clientX,
                y: ce.clientY,
                dx: 0,
                dy: 0,
                vx: 0,
                vy: 0,
                gx: ce.clientX,
                gy: ce.clientY,
                touchScrollStart: 0,
            };
            if (e.type.indexOf("mouse") === 0) {
                $$A(document).on("mousemove.scroll.mapsvg", (e) => {
                    this.scrollMove(e);
                });
                if (this.options.scroll.spacebar) {
                    $$A(document).on("keyup.scroll.mapsvg", (e) => {
                        if (e.keyCode == 32) {
                            this.scrollEnd(e, mapsvg);
                        }
                    });
                }
                else {
                    $$A(document).on("mouseup.scroll.mapsvg", (e) => {
                        this.scrollEnd(e, mapsvg);
                    });
                }
            }
        }
        scrollMove(e) {
            e.preventDefault();
            if (!this.isScrolling) {
                this.isScrolling = true;
                $$A(this.containers.map).addClass("scrolling");
            }
            const ce = e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0]
                ? e.originalEvent.touches[0]
                : e;
            this.panBy(this.scroll.gx - ce.clientX, this.scroll.gy - ce.clientY);
            this.scroll.gx = ce.clientX;
            this.scroll.gy = ce.clientY;
            this.scroll.dx = this.scroll.x - ce.clientX;
            this.scroll.dy = this.scroll.y - ce.clientY;
            let vx = this.scroll.vxi + this.scroll.dx / this.scale;
            let vy = this.scroll.vyi + this.scroll.dy / this.scale;
            if (this.options.scroll.limit) {
                if (vx < this.svgDefault.viewBox.x)
                    vx = this.svgDefault.viewBox.x;
                else if (this.viewBox.width + vx >
                    this.svgDefault.viewBox.x + this.svgDefault.viewBox.width)
                    vx = this.svgDefault.viewBox.x + this.svgDefault.viewBox.width - this.viewBox.width;
                if (vy < this.svgDefault.viewBox.y)
                    vy = this.svgDefault.viewBox.y;
                else if (this.viewBox.height + vy >
                    this.svgDefault.viewBox.y + this.svgDefault.viewBox.height)
                    vy =
                        this.svgDefault.viewBox.y +
                            this.svgDefault.viewBox.height -
                            this.viewBox.height;
            }
            this.scroll.vx = vx;
            this.scroll.vy = vy;
        }
        scrollEnd(e, mapsvg, noClick) {
            setTimeout(() => {
                this.enableAnimation();
                this.scrollStarted = false;
                this.isScrolling = false;
            }, 100);
            if (this.googleMaps && this.googleMaps.overlay) {
                this.googleMaps.overlay.draw();
            }
            $$A(this.containers.map).removeClass("scrolling");
            $$A(document).off("keyup.scroll.mapsvg");
            $$A(document).off("mousemove.scroll.mapsvg");
            $$A(document).off("mouseup.scroll.mapsvg");
            if (noClick !== true && Math.abs(this.scroll.dx) < 5 && Math.abs(this.scroll.dy) < 5) {
                if (this.editMarkers.on)
                    this.clickAddsMarker && this.markerAddClickHandler(e);
                else if (this.objectClickedBeforeScroll)
                    if (this.objectClickedBeforeScroll instanceof Marker) {
                        this.markerClickHandler(e, this.objectClickedBeforeScroll);
                    }
                    else if (this.objectClickedBeforeScroll instanceof Region) {
                        this.regionClickHandler(e, this.objectClickedBeforeScroll);
                    }
                    else if (this.objectClickedBeforeScroll instanceof MarkerCluster) {
                        this.markerClusterClickHandler(e, this.objectClickedBeforeScroll);
                    }
            }
            this.viewBox.x = this.scroll.vx || this.viewBox.x;
            this.viewBox.y = this.scroll.vy || this.viewBox.y;
        }
        setViewBoxByGoogleMapsOverlay() {
            const bounds = this.googleMaps.overlay.getPixelBounds();
            const scale = (bounds.ne.x - bounds.sw.x) / this.svgDefault.viewBox.width;
            const vb = new ViewBox(this.svgDefault.viewBox.x - bounds.sw.x / scale, this.svgDefault.viewBox.y - bounds.ne.y / scale, this.containers.map.offsetWidth / scale, this.containers.map.offsetHeight / scale);
            this.setViewBox(vb, false);
        }
        panBy(x, y) {
            let tx = this.scroll.tx - x;
            let ty = this.scroll.ty - y;
            const scrolled = { x: true, y: true };
            if (this.options.scroll.limit) {
                const svg = $$A(this.containers.svg)[0].getBoundingClientRect();
                const bounds = $$A(this.containers.map)[0].getBoundingClientRect();
                if ((svg.left - x > bounds.left && x < 0) || (svg.right - x < bounds.right && x > 0)) {
                    tx = this.scroll.tx;
                    scrolled.x = false;
                }
                if ((svg.top - y > bounds.top && y < 0) || (svg.bottom - y < bounds.bottom && y > 0)) {
                    ty = this.scroll.ty;
                    scrolled.y = false;
                }
            }
            $$A(this.containers.scrollpane).css({
                transform: "translate(" + tx + "px," + ty + "px)",
            });
            this.scroll.tx = tx;
            this.scroll.ty = ty;
            if (scrolled.x || scrolled.y) {
                const moveX = scrolled.x ? x : 0;
                const moveY = scrolled.y ? y : 0;
                this.movingItemsMoveScreenPositionBy(moveX, moveY);
                if (this.googleMaps.map) {
                    let point = this.googleMaps.map.getCenter();
                    const projection = this.googleMaps.overlay.getProjection();
                    const pixelpoint = projection.fromLatLngToDivPixel(point);
                    pixelpoint.x += moveX;
                    pixelpoint.y += moveY;
                    point = projection.fromDivPixelToLatLng(pixelpoint);
                    this.googleMaps.map.setCenter(point);
                }
            }
            return scrolled;
        }
        setObjectClickedBeforeScroll(object) {
            this.objectClickedBeforeScroll = object;
        }
        touchStart(_e, mapsvg) {
            _e.preventDefault();
            if (this.scrollStarted) {
                this.scrollEnd(_e, mapsvg, true);
            }
            const e = _e.originalEvent;
            if (this.options.zoom.fingers && e.touches && e.touches.length == 2) {
                this.touchZoomStart = true;
                this.scaleDistStart = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
            }
            else if (e.touches && e.touches.length == 1) {
                this.scrollStart(_e, mapsvg);
            }
            $$A(document)
                .on("touchmove.scroll.mapsvg", (e) => {
                e.preventDefault();
                this.touchMove(e, this);
            })
                .on("touchend.scroll.mapsvg", (e) => {
                e.preventDefault();
                this.touchEnd(e, this);
            });
        }
        touchMove(_e, mapsvg) {
            _e.preventDefault();
            const e = _e.originalEvent;
            if (this.options.zoom.fingers && e.touches && e.touches.length == 2) {
                if (!MapSVG.ios) {
                    e.scale =
                        Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY) / this.scaleDistStart;
                }
                if (e.scale != 1 && this.canZoom) {
                    const d = e.scale > 1 ? 1 : -1;
                    const cx = e.touches[0].pageX >= e.touches[1].pageX
                        ? e.touches[0].pageX -
                            (e.touches[0].pageX - e.touches[1].pageX) / 2 -
                            $$A(this.containers.map).offset().left
                        : e.touches[1].pageX -
                            (e.touches[1].pageX - e.touches[0].pageX) / 2 -
                            $$A(this.containers.map).offset().left;
                    const cy = e.touches[0].pageY >= e.touches[1].pageY
                        ? e.touches[0].pageY -
                            (e.touches[0].pageY - e.touches[1].pageY) -
                            $$A(this.containers.map).offset().top
                        : e.touches[1].pageY -
                            (e.touches[1].pageY - e.touches[0].pageY) -
                            $$A(this.containers.map).offset().top;
                    const center = this.converter.convertPixelToSVG(new ScreenPoint(cx, cy));
                    if (d > 0)
                        this.zoomIn(center);
                    else
                        this.zoomOut(center);
                }
            }
            else if (e.touches && e.touches.length == 1) {
                this.scrollMove(_e);
            }
        }
        touchEnd(_e, mapsvg) {
            _e.preventDefault();
            const e = _e.originalEvent;
            if (this.touchZoomStart) {
                this.touchZoomStart = false;
            }
            else if (this.scrollStarted) {
                this.scrollEnd(_e, mapsvg);
            }
            $$A(document).off("touchmove.scroll.mapsvg");
            $$A(document).off("touchend.scroll.mapsvg");
        }
        getSelected() {
            return this.selected_id;
        }
        selectRegion(id, skipDirectorySelection) {
            let region;
            if (typeof id == "string") {
                region = this.getRegion(id);
            }
            else {
                region = id;
            }
            if (!region)
                return;
            let ids;
            if (this.options.multiSelect && !this.editRegions.on) {
                if (region.selected) {
                    this.deselectRegion(region);
                    if (!skipDirectorySelection && this.options.menu.on) {
                        if (this.options.menu.source == "database") {
                            if (region.objects && region.objects.length) {
                                ids = region.objects.map((obj) => {
                                    return obj.id.toString();
                                });
                            }
                        }
                        else {
                            ids = [region.id];
                        }
                        this.controllers.directory.deselectItems();
                    }
                    return;
                }
            }
            else if (this.selected_id.length > 0) {
                this.deselectAllRegions();
                if (!skipDirectorySelection && this.options.menu.on) {
                    if (this.options.menu.source == "database") {
                        if (region.objects && region.objects.length) {
                            ids = region.objects.map((obj) => {
                                return obj.id.toString();
                            });
                        }
                    }
                    else {
                        ids = [region.id];
                    }
                    this.controllers.directory.deselectItems();
                }
            }
            this.selected_id.push(region.id);
            region.select();
            const skip = this.options.actions.region.click.filterDirectory;
            if (!skip &&
                !skipDirectorySelection &&
                this.options.menu.on &&
                this.controllers &&
                this.controllers.directory) {
                if (this.options.menu.source == "database") {
                    if (region.objects && region.objects.length) {
                        ids = region.objects.map((obj) => {
                            return obj.id.toString();
                        });
                    }
                    else {
                        ids = [region.id];
                    }
                }
                else {
                    ids = [region.id];
                }
                this.controllers.directory.selectItems(ids);
            }
            if (this.options.actions.region.click.addIdToUrl &&
                !this.options.actions.region.click.showAnotherMap) {
                window.location.hash = "/m/" + region.id;
            }
        }
        deselectAllRegions() {
            $$A.each(this.selected_id, (index, id) => {
                this.deselectRegion(this.getRegion(id));
            });
        }
        deselectRegion(region) {
            if (!region)
                region = this.getRegion(this.selected_id[0]);
            if (region) {
                region.deselect();
                const i = $$A.inArray(region.id, this.selected_id);
                this.selected_id.splice(i, 1);
            }
            if (this.options.actions.region.click.addIdToUrl) {
                if (window.location.hash.indexOf(region.id) !== -1) {
                    history.replaceState(null, null, " ");
                }
            }
        }
        highlightRegions(regions) {
            regions.forEach((region) => {
                if (region && !region.selected && !region.disabled) {
                    this.highlightedRegions.push(region);
                    region.highlight();
                }
            });
        }
        unhighlightRegions() {
            this.highlightedRegions.forEach((region) => {
                if (region && !region.selected && !region.disabled)
                    region.unhighlight();
            });
            this.highlightedRegions = [];
        }
        selectMarker(marker) {
            if (!(marker instanceof Marker))
                return;
            this.deselectAllMarkers();
            marker.select();
            this.selected_marker = marker;
            $$A(this.layers.markers).addClass("mapsvg-with-marker-active");
            if (this.options.menu.on && this.options.menu.source == "database") {
                this.controllers.directory.deselectItems();
                this.controllers.directory.selectItems(marker.object.id);
            }
        }
        deselectAllMarkers() {
            this.selected_marker && this.selected_marker.deselect();
            $$A(this.layers.markers).removeClass("mapsvg-with-marker-active");
        }
        deselectMarker(marker) {
            if (marker) {
                marker.deselect();
            }
        }
        highlightMarker(marker) {
            $$A(this.layers.markers).addClass("mapsvg-with-marker-hover");
            marker.highlight();
            this.highlighted_marker = marker;
        }
        unhighlightMarker() {
            $$A(this.layers.markers).removeClass("mapsvg-with-marker-hover");
            this.highlighted_marker && this.highlighted_marker.unhighlight();
        }
        convertMouseToSVG(e) {
            const mc = MapSVG.mouseCoords(e);
            const x = mc.x - $$A(this.containers.map).offset().left;
            const y = mc.y - $$A(this.containers.map).offset().top;
            const screenPoint = new ScreenPoint(x, y);
            return this.converter.convertPixelToSVG(screenPoint);
        }
        pickChoroplethColor(choroplethValue) {
            const w = (choroplethValue - this.options.choropleth.coloring.gradient.values.min) /
                this.options.choropleth.coloring.gradient.values.maxAdjusted;
            const rgba = {
                r: Math.round(this.options.choropleth.coloring.gradient.colors.diffRGB.r * w +
                    this.options.choropleth.coloring.gradient.colors.lowRGB.r),
                g: Math.round(this.options.choropleth.coloring.gradient.colors.diffRGB.g * w +
                    this.options.choropleth.coloring.gradient.colors.lowRGB.g),
                b: Math.round(this.options.choropleth.coloring.gradient.colors.diffRGB.b * w +
                    this.options.choropleth.coloring.gradient.colors.lowRGB.b),
                a: Math.round(this.options.choropleth.coloring.gradient.colors.diffRGB.a * w +
                    this.options.choropleth.coloring.gradient.colors.lowRGB.a),
            };
            return rgba;
        }
        isRegionDisabled(id, svgfill) {
            if (this.options.regions[id] && (this.options.regions[id].disabled || svgfill == "none")) {
                return true;
            }
            else if ((this.options.regions[id] == undefined ||
                MapSVG.parseBoolean(this.options.regions[id].disabled)) &&
                (this.options.disableAll || svgfill == "none" || id == "labels" || id == "Labels")) {
                return true;
            }
            else {
                return false;
            }
        }
        loadMap(id, container) {
            if (!(container instanceof HTMLElement)) {
                console.error("Can't load a new map: container was not provided.");
                return;
            }
            const previousMapsIds = [...this.options.previousMapsIds];
            const currentMapId = this.id;
            if (previousMapsIds[previousMapsIds.length - 1] !== id) {
                previousMapsIds.push(currentMapId);
            }
            else {
                previousMapsIds.pop();
            }
            let showPreviousMapButton;
            if (this.options.actions.region.click.showAnotherMapContainerId !== "undefined") {
                showPreviousMapButton = false;
            }
            else {
                showPreviousMapButton = this.options.controls.previousMap;
            }
            const mapsRepo = new MapsRepository();
            mapsRepo.findById(id).done((map) => {
                this.destroy();
                const newMap = new MapSVGMap(container.getAttribute("id"), map);
                newMap.options.previousMapsIds = previousMapsIds;
                newMap.options.controls.previousMap = showPreviousMapButton;
                newMap.setControls(newMap.options.controls);
            });
        }
        loadPreviousMap() {
            const previousMapId = this.options.previousMapsIds[this.options.previousMapsIds.length - 1];
            const container = document.getElementById(this.containerId);
            this.loadMap(previousMapId, container);
        }
        markerClusterClickHandler(e, markerCluster) {
            this.objectClickedBeforeScroll = null;
            if (this.eventsPreventList["click"])
                return;
            this.zoomTo(markerCluster.markers);
            return;
        }
        regionClickHandler(e, region) {
            this.objectClickedBeforeScroll = null;
            if (this.eventsPreventList["click"])
                return;
            this.selectRegion(region.id);
            if (this.editRegions.on) {
                this.regionEditHandler.call(region);
                return;
            }
            const actions = this.options.actions;
            if (actions.region.click.zoom) {
                this.zoomTo(region, parseInt(actions.region.click.zoomToLevel));
            }
            if (actions.region.click.filterDirectory) {
                const query = new Query({
                    filters: {
                        regions: {
                            table_name: this.regionsRepository.getSchema().name,
                            region_ids: [region.id],
                        },
                    },
                });
                this.objectsRepository.find(query).done(() => {
                    if (this.controllers.popover) {
                        this.controllers.popover.redraw(region.forTemplate());
                    }
                    if (this.controllers.detailsView) {
                        this.controllers.detailsView.redraw(region.forTemplate());
                    }
                });
                this.updateFiltersState();
            }
            if (actions.region.click.showDetails) {
                this.loadDetailsView(region);
            }
            if (actions.region.click.showPopover) {
                if (actions.region.click.zoom) {
                    setTimeout(() => {
                        this.showPopover(region);
                    }, 400);
                }
                else {
                    this.showPopover(region);
                }
            }
            else if (e && e.type.indexOf("touch") !== -1 && actions.region.touch.showPopover) {
                if (actions.region.click.zoom) {
                    setTimeout(() => {
                        this.showPopover(region);
                    }, 400);
                }
                else {
                    this.showPopover(region);
                }
            }
            if (actions.region.click.goToLink) {
                const linkParts = actions.region.click.linkField.split(".");
                let url;
                if (linkParts.length > 1) {
                    const obj = linkParts.shift();
                    const attr = "." + linkParts.join(".");
                    if (obj == "Region") {
                        if (region.data) {
                            try {
                                url = eval("region.data" + attr);
                            }
                            catch (err) {
                                console.log("No such field as region.data" + attr);
                            }
                        }
                    }
                    else {
                        if (region.objects && region.objects[0]) {
                            try {
                                url = eval("region.objects[0]" + attr);
                            }
                            catch (err) {
                                console.log("No such field as region.objects[0]" + attr);
                            }
                        }
                    }
                    if (url && !this.disableLinks) {
                        if (this.editMode) {
                            alert("Redirect: " + url + "\nLinks are disabled in the preview.");
                            return;
                        }
                        if (actions.region.click.newTab) {
                            const win = window.open(url, "_blank");
                            win.focus();
                        }
                        else {
                            window.location.href = url;
                        }
                    }
                }
            }
            if (actions.region.click.showAnotherMap) {
                if (this.editMode) {
                    alert('"Show another map" action is disabled in the preview');
                    return;
                }
                const linkParts = actions.region.click.showAnotherMapField.split(".");
                if (linkParts.length > 1) {
                    const obj = linkParts.shift();
                    const attr = "." + linkParts.join(".");
                    let map_id;
                    if (obj == "Region") {
                        if (region.data)
                            map_id = eval("region.data" + attr);
                    }
                    else {
                        if (region.objects && region.objects[0])
                            map_id = eval("region.objects[0]" + attr);
                    }
                    if (map_id) {
                        const container = actions.region.click.showAnotherMapContainerId
                            ? $$A("#" + actions.region.click.showAnotherMapContainerId)[0]
                            : $$A(this.containers.map)[0];
                        this.loadMap(map_id, container);
                    }
                }
            }
            this.events.trigger("click.region", region, [e, region, this]);
        }
        markerClickHandler(e, marker) {
            this.objectClickedBeforeScroll = null;
            if (this.eventsPreventList["click"])
                return;
            const actions = this.options.actions;
            this.selectMarker(marker);
            const passingObject = marker.object;
            if (actions.marker.click.zoom) {
                this.zoomTo(marker, parseInt(actions.marker.click.zoomToLevel));
            }
            if (actions.marker.click.filterDirectory) {
                const query = new Query({ filters: { id: marker.object.id } });
                this.objectsRepository.find(query);
                this.updateFiltersState();
            }
            if (actions.marker.click.showDetails)
                this.loadDetailsView(passingObject);
            if (actions.marker.click.showPopover) {
                if (actions.marker.click.zoom) {
                    setTimeout(() => {
                        this.showPopover(passingObject);
                    }, 500);
                }
                else {
                    this.showPopover(passingObject);
                }
            }
            else if (e && e.type.indexOf("touch") !== -1 && actions.marker.touch.showPopover) {
                if (actions.marker.click.zoom) {
                    setTimeout(() => {
                        this.showPopover(passingObject);
                    }, 500);
                }
                else {
                    this.showPopover(passingObject);
                }
            }
            if (actions.marker.click.goToLink) {
                const linkParts = actions.marker.click.linkField.split(".");
                let url;
                if (linkParts.length > 1) {
                    const obj = linkParts.shift();
                    const attr = "." + linkParts.join(".");
                    try {
                        url = eval("passingObject" + attr);
                    }
                    catch (err) {
                        console.log("MapSVG: No such field as passingObject" + attr);
                    }
                    if (url && !this.disableLinks)
                        if (this.editMode) {
                            alert("Redirect: " + url + "\nLinks are disabled in the preview.");
                            return;
                        }
                    if (actions.marker.click.newTab) {
                        const win = window.open(url, "_blank");
                        win.focus();
                    }
                    else {
                        window.location.href = url;
                    }
                }
            }
            this.events.trigger("click.marker", marker, [e, marker, this]);
        }
        fileExists(url) {
            if (url.substr(0, 4) == "data")
                return true;
            const http = new XMLHttpRequest();
            http.open("HEAD", url, false);
            http.send();
            return http.status != 404;
        }
        hideMarkers() {
            this.markers.forEach(function (marker) {
                marker.hide();
            });
            $$A(this.containers.wrap).addClass("mapsvg-edit-marker-mode");
        }
        hideMarkersExceptOne(id) {
            this.markers.forEach(function (marker) {
                if (typeof id === "undefined" || (marker.object && id != marker.object.id)) {
                    marker.hide();
                }
            });
            $$A(this.containers.wrap).addClass("mapsvg-edit-marker-mode");
        }
        showMarkers() {
            this.markers.forEach(function (m) {
                m.show();
            });
            this.deselectAllMarkers();
            $$A(this.containers.wrap).removeClass("mapsvg-edit-marker-mode");
        }
        markerAddClickHandler(e) {
            if ($$A(e.target).hasClass("mapsvg-marker"))
                return;
            const svgPoint = this.getSvgPointAtClick(e);
            const geoPoint = this.isGeo() ? this.converter.convertSVGToGeo(svgPoint) : null;
            if (!$$A.isNumeric(svgPoint.x) || !$$A.isNumeric(svgPoint.y))
                return;
            if (this.editingMarker) {
                if (geoPoint) {
                    this.editingMarker.location.setGeoPoint(geoPoint);
                }
                else {
                    this.editingMarker.location.setSvgPoint(svgPoint);
                }
                return;
            }
            const location = new Location({
                svgPoint: svgPoint,
                geoPoint: geoPoint,
                img: this.options.defaultMarkerImage,
            });
            const marker = new Marker({
                location: location,
                mapsvg: this,
            });
            this.markerAdd(marker);
            this.markerEditHandler && this.markerEditHandler.call(location, location);
        }
        getSvgPointAtClick(e) {
            const mc = MapSVG.mouseCoords(e);
            const x = mc.x - $$A(this.containers.map).offset().left;
            const y = mc.y - $$A(this.containers.map).offset().top;
            const screenPoint = new ScreenPoint(x, y);
            return this.converter.convertPixelToSVG(screenPoint);
        }
        setDefaultMarkerImage(src) {
            this.options.defaultMarkerImage = src;
        }
        setMarkerImagesDependency() {
            this.locationField = this.objectsRepository.schema.getFieldByType("location");
            if (this.locationField &&
                this.locationField.markersByFieldEnabled &&
                this.locationField.markerField &&
                Object.values(this.locationField.markersByField).length > 0) {
                this.setMarkersByField = true;
            }
            else {
                this.setMarkersByField = false;
            }
        }
        getMarkerImage(fieldValueOrObject, location) {
            let fieldValue;
            if (this.setMarkersByField) {
                if (typeof fieldValueOrObject === "object") {
                    fieldValue = fieldValueOrObject[this.locationField.markerField];
                    if (this.locationField.markerField === "regions") {
                        fieldValue = fieldValue[0] && fieldValue[0].id;
                    }
                    else if (typeof fieldValue === "object" && fieldValue.length) {
                        fieldValue = fieldValue[0].value;
                    }
                }
                else {
                    fieldValue = fieldValueOrObject;
                }
                if (this.locationField.markersByField[fieldValue]) {
                    return this.locationField.markersByField[fieldValue];
                }
            }
            return location && location.imagePath
                ? location.imagePath
                : this.options.defaultMarkerImage
                    ? this.options.defaultMarkerImage
                    : MapSVG.urls.root + "markers/_pin_default.png";
        }
        setMarkersEditMode(on, clickAddsMarker) {
            this.editMarkers.on = MapSVG.parseBoolean(on);
            this.clickAddsMarker = this.editMarkers.on;
            this.setEventHandlers();
        }
        setRegionsEditMode(on) {
            this.editRegions.on = MapSVG.parseBoolean(on);
            this.deselectAllRegions();
            this.setEventHandlers();
        }
        setEditMode(on) {
            this.editMode = on;
        }
        setDataEditMode(on) {
            this.editData.on = MapSVG.parseBoolean(on);
            this.deselectAllRegions();
            this.setEventHandlers();
        }
        popoverAdjustScreenPosition() {
            if (this.controllers.popover instanceof PopoverController) {
                this.controllers.popover.adjustScreenPosition();
            }
        }
        popoverMoveScreenPositionBy(deltaX, deltaY) {
            if (this.controllers.popover instanceof PopoverController) {
                this.controllers.popover.moveSrceenPositionBy(deltaX, deltaY);
            }
        }
        showPopover(object) {
            const mapObject = object instanceof Region
                ? object
                : object.location && object.location.marker
                    ? object.location.marker
                    : null;
            if (!mapObject)
                return;
            let point;
            if (mapObject instanceof Marker) {
                point = mapObject.svgPoint;
            }
            else {
                point = mapObject.getCenterSVG();
            }
            this.controllers.popover && this.controllers.popover.destroy();
            this.controllers.popover = new PopoverController({
                container: this.containers.popover,
                point: point,
                yShift: mapObject instanceof Marker ? mapObject.height : 0,
                template: object instanceof Region
                    ? this.options.templates.popoverRegion
                    : this.options.templates.popoverMarker,
                mapsvg: this,
                data: object.getData(),
                mapObject: mapObject,
                scrollable: true,
                withToolbar: !(MapSVG.isPhone && this.options.popovers.mobileFullscreen),
                events: {
                    shown: (popover) => {
                        if (this.options.popovers.centerOn) {
                            const shift = popover.containers.main.offsetHeight / 2;
                            if (this.options.popovers.centerOn &&
                                !(MapSVG.isPhone && this.options.popovers.mobileFullscreen)) {
                                this.centerOn(mapObject, shift);
                            }
                        }
                        this.popoverShowingFor = mapObject;
                        this.events.trigger("shown.popover", this, [this, popover]);
                        $$A(window).trigger("shown.popover", [this, popover]);
                    },
                    closed: (popover) => {
                        this.options.popovers.resetViewboxOnClose && this.viewBoxReset(true);
                        this.popoverShowingFor = null;
                        this.events.trigger("closed.popover", this, [this, popover]);
                    },
                    resize: (popover) => {
                        if (this.options.popovers.centerOn) {
                            const shift = popover.containers.main.offsetHeight / 2;
                            if (this.options.popovers.centerOn &&
                                !(MapSVG.isPhone && this.options.popovers.mobileFullscreen)) {
                                this.centerOn(mapObject, shift);
                            }
                        }
                    },
                },
            });
            this.controllers.popover._init();
        }
        hidePopover() {
            this.controllers.popover && this.controllers.popover.close();
        }
        popoverOffHandler(e) {
            if (this.isScrolling ||
                $$A(e.target).closest(".mapsvg-popover").length ||
                $$A(e.target).hasClass("mapsvg-btn-map"))
                return;
            this.controllers.popover && this.controllers.popover.close();
        }
        mouseOverHandler(e, object) {
            if (this.eventsPreventList["mouseover"]) {
                return;
            }
            if (object instanceof Marker) {
                if (this.options.actions.marker.mouseover.showTooltip) {
                    this.showTooltip(object);
                }
            }
            if (object instanceof Region) {
                if (this.options.actions.region.mouseover.showTooltip) {
                    this.showTooltip(object);
                }
            }
            let ids;
            if (this.options.menu.on) {
                if (this.options.menu.source == "database") {
                    if (object instanceof Region && object.objects.length) {
                        ids = object.objects.map((obj) => {
                            return obj.id;
                        });
                    }
                    if (object instanceof Marker) {
                        ids = object.object ? [object.object.id] : [];
                    }
                }
                else {
                    if (object instanceof Region) {
                        ids = [object.id];
                    }
                    if (this instanceof Marker &&
                        object.object.regions &&
                        object.object.regions.length) {
                        ids = object.object.regions.map((obj) => {
                            return obj.id;
                        });
                    }
                }
                this.controllers.directory.highlightItems(ids);
            }
            if (object instanceof Region) {
                if (!object.selected)
                    object.highlight();
                this.events.trigger("mouseover.region", object, [e, this]);
            }
            else {
                this.highlightMarker(object);
                this.events.trigger("mouseover.marker", object, [e, this]);
            }
        }
        showTooltip(object) {
            let name, _object;
            if (object instanceof Region) {
                name = "tooltipRegion";
                _object = object;
            }
            else if (object instanceof Marker) {
                name = "tooltipMarker";
                _object = object.object;
            }
            else {
                name = "tooltipMarker";
                _object = object;
            }
            if (_object != null && this.popoverShowingFor !== object) {
                this.controllers.tooltip.setMainTemplate(this.options.templates[name]);
                this.controllers.tooltip.redraw(_object.getData());
                this.controllers.tooltip.show();
            }
        }
        mouseOutHandler(e, object) {
            if (this.eventsPreventList["mouseout"]) {
                return;
            }
            if (this.controllers.tooltip)
                this.controllers.tooltip.hide();
            if (object instanceof Region) {
                if (!object.selected)
                    object.unhighlight();
                this.events.trigger("mouseout.region", object, [e, this]);
            }
            else {
                this.unhighlightMarker();
                this.events.trigger("mouseout.marker", object, [e, this]);
            }
            let ids;
            if (this.options.menu.on) {
                if (this.options.menu.source == "database") {
                    if (object instanceof Marker) {
                        const marker = object;
                        ids = marker.object ? [marker.object.id] : [];
                    }
                }
                this.controllers.directory.unhighlightItems();
            }
        }
        eventsPrevent(event) {
            this.eventsPreventList[event] = true;
        }
        eventsRestore(event) {
            if (event) {
                this.eventsPreventList[event] = false;
            }
            else {
                this.eventsPreventList = {};
            }
        }
        setEventHandlers() {
            const _this = this;
            $$A(_this.containers.map).off(".common.mapsvg");
            $$A(_this.containers.scrollpane).off(".common.mapsvg");
            $$A(document).off(".scroll.mapsvg");
            $$A(document).off(".scrollInit.mapsvg");
            if (_this.editMarkers.on) {
                $$A(_this.containers.map).on("touchstart.common.mapsvg mousedown.common.mapsvg", ".mapsvg-marker", function (e) {
                    e.originalEvent.preventDefault();
                    const marker = _this.getMarker($$A(this).attr("id"));
                    const startCoords = MapSVG.mouseCoords(e);
                    marker.drag(startCoords, _this.scale);
                });
            }
            if (!_this.editMarkers.on) {
                $$A(_this.containers.map)
                    .on("mouseover.common.mapsvg", ".mapsvg-region", function (e) {
                    const id = $$A(this).attr("id");
                    _this.mouseOverHandler.call(_this, e, _this.getRegion(id));
                })
                    .on("mouseleave.common.mapsvg", ".mapsvg-region", function (e) {
                    const id = $$A(this).attr("id");
                    _this.mouseOutHandler.call(_this, e, _this.getRegion(id));
                });
            }
            if (!_this.editRegions.on) {
                $$A(_this.containers.map)
                    .on("mouseover.common.mapsvg", ".mapsvg-marker", function (e) {
                    const id = $$A(this).attr("id");
                    _this.mouseOverHandler.call(_this, e, _this.getMarker(id));
                })
                    .on("mouseleave.common.mapsvg", ".mapsvg-marker", function (e) {
                    const id = $$A(this).attr("id");
                    _this.mouseOutHandler.call(_this, e, _this.getMarker(id));
                });
            }
            if (_this.options.scroll.spacebar) {
                $$A(document).on("keydown.scroll.mapsvg", function (e) {
                    if (!(document.activeElement.tagName === "INPUT" &&
                        $$A(document.activeElement).attr("type") === "text") &&
                        !_this.isScrolling &&
                        e.keyCode == 32) {
                        e.preventDefault();
                        $$A(_this.containers.map).addClass("mapsvg-scrollable");
                        $$A(document)
                            .on("mousemove.scrollInit.mapsvg", function (e) {
                            _this.isScrolling = true;
                            $$A(document).off("mousemove.scrollInit.mapsvg");
                            _this.scrollStart(e, _this);
                        })
                            .on("keyup.scroll.mapsvg", function (e) {
                            if (e.keyCode == 32) {
                                $$A(document).off("mousemove.scrollInit.mapsvg");
                                $$A(_this.containers.map).removeClass("mapsvg-scrollable");
                            }
                        });
                    }
                });
            }
            else if (!_this.options.scroll.on) {
                if (!_this.editMarkers.on) {
                    $$A(_this.containers.map).on("touchstart.common.mapsvg", ".mapsvg-region", function (e) {
                        _this.scroll.touchScrollStart = $$A(window).scrollTop();
                    });
                    $$A(_this.containers.map).on("touchstart.common.mapsvg", ".mapsvg-marker", function (e) {
                        _this.scroll.touchScrollStart = $$A(window).scrollTop();
                    });
                    $$A(_this.containers.map).on("touchend.common.mapsvg mouseup.common.mapsvg", ".mapsvg-region", function (e) {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                        if (!_this.scroll.touchScrollStart ||
                            _this.scroll.touchScrollStart === $$A(window).scrollTop()) {
                            _this.regionClickHandler(e, _this.getRegion($$A(this).attr("id")));
                        }
                    });
                    $$A(_this.containers.map).on("touchend.common.mapsvg mouseup.common.mapsvg", ".mapsvg-marker", function (e) {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                        if (!_this.scroll.touchScrollStart ||
                            _this.scroll.touchScrollStart === $$A(window).scrollTop()) {
                            _this.markerClickHandler.call(_this, e, _this.getMarker($$A(this).attr("id")));
                        }
                    });
                    $$A(_this.containers.map).on("touchend.common.mapsvg mouseup.common.mapsvg", ".mapsvg-marker-cluster", function (e) {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                        if (!_this.scroll.touchScrollStart ||
                            _this.scroll.touchScrollStart == $$A(window).scrollTop()) {
                            const cluster = $$A(this).data("cluster");
                            _this.zoomTo(cluster.markers);
                        }
                    });
                }
                else {
                    if (_this.clickAddsMarker)
                        $$A(_this.containers.map).on("touchend.common.mapsvg mouseup.common.mapsvg", function (e) {
                            if (e.cancelable) {
                                e.preventDefault();
                            }
                            _this.markerAddClickHandler(e);
                        });
                }
            }
            else {
                $$A(_this.containers.map).on("touchstart.common.mapsvg mousedown.common.mapsvg", function (e) {
                    if ($$A(e.target).hasClass("mapsvg-popover") ||
                        $$A(e.target).closest(".mapsvg-popover").length) {
                        if ($$A(e.target).hasClass("mapsvg-popover-close")) {
                            if (e.type == "touchstart") {
                                if (e.cancelable) {
                                    e.preventDefault();
                                }
                            }
                        }
                        return;
                    }
                    if (e.type == "touchstart") {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                    }
                    let obj;
                    if (e.target &&
                        $$A(e.target).attr("class") &&
                        $$A(e.target).attr("class").indexOf("mapsvg-region") != -1) {
                        obj = _this.getRegion($$A(e.target).attr("id"));
                        _this.setObjectClickedBeforeScroll(obj);
                    }
                    else if (e.target &&
                        $$A(e.target).attr("class") &&
                        $$A(e.target).attr("class").indexOf("mapsvg-marker") != -1 &&
                        $$A(e.target).attr("class").indexOf("mapsvg-marker-cluster") === -1) {
                        if (_this.editMarkers.on) {
                            return;
                        }
                        obj = _this.getMarker($$A(e.target).attr("id"));
                        _this.setObjectClickedBeforeScroll(obj);
                    }
                    else if (e.target &&
                        $$A(e.target).attr("class") &&
                        $$A(e.target).attr("class").indexOf("mapsvg-marker-cluster") != -1) {
                        if (_this.editMarkers.on) {
                            return;
                        }
                        obj = $$A(e.target).data("cluster");
                        _this.setObjectClickedBeforeScroll(obj);
                    }
                    if (e.type == "mousedown") {
                        _this.scrollStart(e, _this);
                    }
                    else {
                        _this.touchStart(e, _this);
                    }
                });
            }
            $$A(_this.containers.map).on("mouseleave.common.mapsvg", ".mapsvg-choropleth-gradient-wrap", (e) => {
                this.controllers.tooltip.hide();
            });
        }
        setLabelsRegions(options) {
            options = options || this.options.labelsRegions;
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            $$A.extend(true, this.options, { labelsRegions: options });
            if (this.options.labelsRegions.on) {
                this.regions.forEach((region) => {
                    if (!region.label) {
                        region.label = jQuery('<div class="mapsvg-region-label" />')[0];
                        $$A(this.layers.labels).append(region.label);
                    }
                    try {
                        $$A(region.label).html(this.templates.labelRegion(region.forTemplate()));
                    }
                    catch (err) {
                        console.error('MapSVG: Error in the "Region Label" template');
                    }
                });
                this.labelsRegionsAdjustScreenPosition();
            }
            else {
                this.regions.forEach((region) => {
                    if (region.label) {
                        $$A(region.label).remove();
                        region.label = null;
                        delete region.label;
                    }
                });
            }
        }
        setLabelsMarkers(options) {
            options = options || this.options.labelsMarkers;
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            $$A.extend(true, this.options, { labelsMarkers: options });
            if (this.options.labelsMarkers.on) {
                this.markers.forEach((marker) => {
                    try {
                        marker.setLabel(this.templates.labelMarker(marker.object));
                    }
                    catch (err) {
                        console.error('MapSVG: Error in the "Marker Label" template');
                    }
                });
            }
            else {
                this.markers.forEach((marker) => {
                    marker.setLabel("");
                });
            }
        }
        addLayer(name) {
            this.layers[name] = $$A('<div class="mapsvg-layer mapsvg-layer-' + name + '"></div>')[0];
            this.containers.layers.appendChild(this.layers[name]);
            return this.layers[name];
        }
        getLayer(name) {
            return this.layers[name];
        }
        getDb() {
            return this.objectsRepository;
        }
        getDbRegions() {
            return this.regionsRepository;
        }
        regionAdd(svgObject) {
            const region = new Region(svgObject, this);
            region.setStatus(1);
            this.regions.push(region);
            this.regions.sort(function (a, b) {
                return a.id == b.id ? 0 : +(a.id > b.id) || -1;
            });
            return region;
        }
        regionDelete(id) {
            if (this.regions.findById(id)) {
                this.regions.findById(id).elem.remove();
                this.regions.delete(id);
            }
            else if ($$A("#" + id).length) {
                $$A("#" + id).remove();
            }
        }
        reloadRegions() {
            this.regions.clear();
            $$A(this.containers.svg).find(".mapsvg-region").removeClass("mapsvg-region");
            $$A(this.containers.svg)
                .find(".mapsvg-region-disabled")
                .removeClass("mapsvg-region-disabled");
            $$A(this.containers.svg)
                .find("path, polygon, circle, ellipse, rect")
                .each((index, element) => {
                const elem = element;
                if ($$A(elem).closest("defs").length)
                    return;
                if (elem.getAttribute("data-stroke-width")) {
                    elem.style["stroke-width"] = elem.getAttribute("data-stroke-width");
                }
                if (elem.getAttribute("id")) {
                    if (!this.options.regionPrefix ||
                        (this.options.regionPrefix &&
                            elem.getAttribute("id").indexOf(this.options.regionPrefix) === 0)) {
                        const region = new Region(elem, this);
                        this.regions.push(region);
                    }
                }
            });
        }
        reloadRegionsFull() {
            const statuses = this.regionsRepository.getSchema().getFieldByType("status");
            this.regions.forEach((region) => {
                const _region = this.regionsRepository.getLoaded().findById(region.id);
                if (_region) {
                    region.setData(_region);
                    if (statuses && _region.status !== undefined && _region.status !== null) {
                        region.setStatus(_region.status);
                    }
                }
                else {
                    if (this.options.filters.filteredRegionsStatus ||
                        this.options.filters.filteredRegionsStatus === 0 ||
                        (this.options.menu.source === "regions" &&
                            this.options.menu.filterout &&
                            this.options.menu.filterout.field === "status" &&
                            this.options.menu.filterout.val) ||
                        this.options.menu.filterout.val === 0) {
                        const status = this.options.filters.filteredRegionsStatus ||
                            this.options.filters.filteredRegionsStatus === 0
                            ? this.options.filters.filteredRegionsStatus
                            : this.options.menu.filterout.val;
                        region.setStatus(status);
                    }
                }
            });
            this.loadDirectory();
            this.setChoropleth();
            this.setLayersControl();
            this.setGroups();
            if (this.options.labelsRegions.on) {
                this.setLabelsRegions();
            }
        }
        fixMarkersWorldScreen() {
            if (this.googleMaps.map)
                setTimeout(() => {
                    const markers = { left: 0, right: 0, leftOut: 0, rightOut: 0 };
                    if (this.markers.length > 1) {
                        this.markers.forEach((m) => {
                            if ($$A(m.element).offset().left <
                                $$A(this.containers.map).offset().left +
                                    this.containers.map.clientWidth / 2) {
                                markers.left++;
                                if ($$A(m.element).offset().left < $$A(this.containers.map).offset().left) {
                                    markers.leftOut++;
                                }
                            }
                            else {
                                markers.right++;
                                if ($$A(m.element).offset().left >
                                    $$A(this.containers.map).offset().left +
                                        this.containers.map.clientWidth) {
                                    markers.rightOut++;
                                }
                            }
                        });
                        if ((markers.left === 0 && markers.rightOut) ||
                            (markers.right === 0 && markers.leftOut)) {
                            const k = markers.left === 0 ? 1 : -1;
                            const ww = (this.svgDefault.viewBox.width / this.converter.mapLonDelta) *
                                360 *
                                this.getScale();
                            this.googleMaps.map.panBy(k * ww, 0);
                        }
                    }
                }, 600);
        }
        updateOutdatedOptions(options) {
            if (options.menu && (options.menu.position || options.menu.customContainer)) {
                if (options.menu.customContainer) {
                    options.menu.location = "custom";
                }
                else {
                    options.menu.position = options.menu.position === "left" ? "left" : "right";
                    options.menu.location =
                        options.menu.position === "left" ? "leftSidebar" : "rightSidebar";
                    if (!options.containers || !options.containers[options.menu.location]) {
                        options.containers = options.containers || {};
                        options.containers[options.menu.location] = { on: false, width: "200px" };
                    }
                    options.containers[options.menu.location].width = options.menu.width;
                    if (MapSVG.parseBoolean(options.menu.on)) {
                        options.containers[options.menu.location].on = true;
                    }
                }
                delete options.menu.position;
                delete options.menu.width;
                delete options.menu.customContainer;
            }
            if (options.detailsView &&
                (options.detailsView.location === "mapContainer" ||
                    options.detailsView.location === "near" ||
                    options.detailsView.location === "top")) {
                options.detailsView.location = "map";
            }
            if (!options.controls) {
                options.controls = {};
                options.controls.zoom =
                    options.zoom &&
                        options.zoom.on &&
                        (!options.zoom.buttons || options.zoom.buttons.location !== "hide");
                options.controls.location =
                    options.zoom && options.zoom.buttons && options.zoom.buttons.location !== "hide"
                        ? options.zoom.buttons.location
                        : "right";
            }
            if (options.colors && !options.colors.markers) {
                options.colors.markers = {
                    base: { opacity: 100, saturation: 100 },
                    hovered: { opacity: 100, saturation: 100 },
                    unhovered: { opacity: 100, saturation: 100 },
                    active: { opacity: 100, saturation: 100 },
                    inactive: { opacity: 100, saturation: 100 },
                };
            }
            if (options.tooltipsMode) {
                options.tooltips.mode = options.tooltipsMode;
                delete options.tooltipsMode;
            }
            if (options.popover) {
                options.popovers = options.popover;
                delete options.popover;
            }
        }
        init() {
            MapSVG.addInstance(this);
            if (this.options.source === "") {
                throw new Error("MapSVG: please provide SVG file source.");
            }
            this.disableAnimation();
            this.setEvents(this.options.events);
            this.events.trigger("beforeLoad");
            this.loadGoogleMapsAPI(() => { }, () => { });
            this.containers.map.classList.add("mapsvg");
            this.setCss();
            if (this.options.colors && this.options.colors.background) {
                this.containers.map.style.background = this.options.colors.background;
            }
            this.setContainers(this.options.containers);
            this.setColors();
            this.addLoadingMessage();
            this.addLayer("markers");
            this.addLayer("labels");
            this.addLayer("bubbles");
            this.addLayer("popovers");
            this.addLayer("scrollpane");
            this.loadExtensions();
            $$A.ajax({ url: this.options.source + "?v=" + this.svgFileLastChanged })
                .fail((resp) => {
                this.svgLoadingFailed(resp);
            })
                .done((xmlData) => {
                this.renderSvgData(xmlData);
            });
            return this;
        }
        getContainer(name) {
            return this.containers[name];
        }
        renderSvgData(xmlData) {
            const svgTag = $$A(xmlData).find("svg");
            this.containers.svg = svgTag[0];
            if (svgTag.attr("width") && svgTag.attr("height")) {
                this.svgDefault.width = parseFloat(svgTag.attr("width").replace(/px/g, ""));
                this.svgDefault.height = parseFloat(svgTag.attr("height").replace(/px/g, ""));
                this.svgDefault.viewBox = svgTag.attr("viewBox")
                    ? new ViewBox(svgTag.attr("viewBox").split(" "))
                    : new ViewBox(0, 0, this.svgDefault.width, this.svgDefault.height);
            }
            else if (svgTag.attr("viewBox")) {
                this.svgDefault.viewBox = new ViewBox(svgTag.attr("viewBox").split(" "));
                this.svgDefault.width = this.svgDefault.viewBox.width;
                this.svgDefault.height = this.svgDefault.viewBox.height;
            }
            else {
                const msg = "MapSVG: width/height and viewBox are missing in the SVG file. Can't parse the file because of that.";
                if (this.editMode) {
                    alert(msg);
                }
                else {
                    console.error(msg);
                }
                return false;
            }
            this.geoViewBox = this.getGeoViewBoxFromSvgTag(this.containers.svg);
            if (this.options.viewBox && this.options.viewBox.length == 4) {
                this._viewBox = new ViewBox(this.options.viewBox);
            }
            else {
                this._viewBox = new ViewBox(this.svgDefault.viewBox);
            }
            svgTag.attr("preserveAspectRatio", "xMidYMid meet");
            svgTag.removeAttr("width");
            svgTag.removeAttr("height");
            $$A(this.containers.scrollpane).append(svgTag);
            this.setStrokes();
            this.reloadRegions();
            this.setSize(this.options.width, this.options.height, this.options.responsive);
            if (this.options.disableAll) {
                this.setDisableAll(true);
            }
            this.setViewBox(this._viewBox);
            this.converter = new Converter(this.containers.map, this.svgDefault.viewBox, this.viewBox);
            if (this.geoViewBox) {
                this.converter.setGeoViewBox(this.geoViewBox);
            }
            this.setResponsive(this.options.responsive);
            this.setScroll(this.options.scroll, true);
            this.setZoom(this.options.zoom);
            this.setControls(this.options.controls);
            this.setGoogleMaps();
            this.setTooltips(this.options.tooltips);
            this.setPopovers(this.options.popovers);
            if (this.options.cursor)
                this.setCursor(this.options.cursor);
            this.setTemplates(this.options.templates);
            this.loadExtensions();
            this.filtersSchema = new Schema({ fields: this.options.filtersSchema });
            this.objectsRepository.events.on("load", () => {
                this.showLoadingMessage();
            });
            this.objectsRepository.events.on("loaded", () => {
                this.setGlobalDistanceFilter();
                this.fitOnDataLoadDone = false;
                this.addLocations();
                this.fixMarkersWorldScreen();
                this.attachDataToRegions();
                this.loadDirectory();
                if (this.options.labelsMarkers.on) {
                    this.setLabelsMarkers();
                }
                if (this.options.templates.labelRegion.indexOf("{{objects") !== -1) {
                    this.setLabelsRegions();
                }
                if (this.options.filters.on &&
                    this.options.filters.source === "database" &&
                    this.controllers.filters &&
                    this.controllers.filters.hideFilters) {
                    this.controllers.filters.setFiltersCounter();
                }
                this.hideLoadingMessage();
                this.events.trigger("databaseLoaded");
                this.updateFiltersState();
                this.setChoropleth();
            });
            this.objectsRepository.events.on("schemaChanged", () => {
                this.objectsRepository.reload();
            });
            this.objectsRepository.events.on("updated", (obj) => {
                this.attachDataToRegions(obj);
                this.reloadRegionsFull();
            });
            this.objectsRepository.events.on("created", (obj) => {
                this.attachDataToRegions(obj);
                this.reloadRegionsFull();
            });
            this.objectsRepository.events.on("deleted", (id) => {
                this.attachDataToRegions();
                this.reloadRegionsFull();
            });
            this.regionsRepository.events.on("load", () => {
                this.showLoadingMessage();
            });
            this.regionsRepository.events.on("loaded", () => {
                this.hideLoadingMessage();
                this.reloadRegionsFull();
                if (this.options.filters.on &&
                    this.options.filters.source === "regions" &&
                    this.controllers.filters &&
                    this.controllers.filters.hideFilters) {
                    this.controllers.filters.setFiltersCounter();
                }
                this.events.trigger("regionsLoaded");
            });
            this.regionsRepository.events.on("updated", (regionData) => {
                this.reloadRegionsFull();
            });
            this.regionsRepository.events.on("created", (regionData) => {
                this.reloadRegionsFull();
            });
            this.regionsRepository.events.on("deleted", (regionData) => {
                this.reloadRegionsFull();
            });
            this.setMenu();
            this.setFilters();
            if (this.options.menu.filterout.field) {
                const f = {};
                f[this.options.menu.filterout.field] = this.options.menu.filterout.val;
                if (this.options.menu.source == "regions") ;
                else {
                    this.objectsRepository.query.setFilterOut(f);
                }
            }
            this.setEventHandlers();
            this.afterLoadBlockers--;
            if (!this.id) {
                this.finalizeMapLoading();
                return;
            }
            if (!this.options.data_regions) {
                this.regionsRepository.find().done((data) => {
                    this.afterLoadBlockers--;
                    this.finalizeMapLoading();
                });
            }
            else {
                this.regionsRepository.loadDataFromResponse(this.options.data_regions);
                this.afterLoadBlockers--;
            }
            if (!this.options.data_objects) {
                if (this.options.database.loadOnStart || this.editMode) {
                    this.objectsRepository.find().done((data) => {
                        this.afterLoadBlockers--;
                        this.finalizeMapLoading();
                    });
                }
                else {
                    this.afterLoadBlockers--;
                    this.finalizeMapLoading();
                }
            }
            else {
                if (this.editMode || this.options.database.loadOnStart) {
                    this.objectsRepository.loadDataFromResponse(this.options.data_objects);
                    this.afterLoadBlockers--;
                }
                else {
                    this.afterLoadBlockers--;
                }
                delete this.options.data_regions;
                delete this.options.data_objects;
                this.finalizeMapLoading();
            }
        }
        getGeoViewBoxFromSvgTag(svgTag) {
            const geo = $$A(svgTag).attr("mapsvg:geoViewBox") || $$A(svgTag).attr("mapsvg:geoviewbox");
            if (geo) {
                const geoParts = geo.split(" ").map((p) => parseFloat(p));
                if (geoParts.length == 4) {
                    this.mapIsGeo = true;
                    this.geoCoordinates = true;
                    const sw = new GeoPoint(geoParts[3], geoParts[0]);
                    const ne = new GeoPoint(geoParts[1], geoParts[2]);
                    return new GeoViewBox(sw, ne);
                }
            }
            else {
                return null;
            }
        }
        svgLoadingFailed(resp) {
            if (resp.status == 404) {
                let msg = "MapSVG: file not found - " +
                    this.options.source +
                    "\n\nIf you moved MapSVG from another server please read the following docs page: https://mapsvg.com/docs/installation/moving";
                if (this.editMode) {
                    msg +=
                        "\n\nIf you know the correct path for the SVG file, please write it and press OK:";
                    const oldSvgPath = this.options.source;
                    const userSvgPath = prompt(msg, oldSvgPath);
                    if (userSvgPath !== null) {
                        $$A.ajax({ url: userSvgPath + "?v=" + this.svgFileLastChanged })
                            .fail(function () {
                            location.reload();
                        })
                            .done((xmlData) => {
                            this.options.source = userSvgPath;
                            this.renderSvgData(xmlData);
                            const mapsRepo = new MapsRepository();
                            mapsRepo.update(this);
                        });
                    }
                    else {
                        location.reload();
                    }
                }
                else {
                    console.error(msg);
                }
            }
            else {
                const msg = "MapSVG: can't load SVG file for unknown reason. Please contact support: https://mapsvg.ticksy.com";
                if (this.editMode) {
                    alert(msg);
                }
                else {
                    console.error(msg);
                }
            }
        }
        addLoadingMessage() {
            this.containers.loading = document.createElement("div");
            this.containers.loading.className = "mapsvg-loading";
            const loadingTextBlock = document.createElement("div");
            loadingTextBlock.className = "mapsvg-loading-text";
            loadingTextBlock.innerHTML = this.options.loadingText;
            const spinner = document.createElement("div");
            spinner.className = "spinner-border spinner-border-sm";
            this.containers.loading.appendChild(spinner);
            this.containers.loading.appendChild(loadingTextBlock);
            this.containers.map.appendChild(this.containers.loading);
            if (this.options.googleMaps.on) {
                $$A(this.containers.map).addClass("mapsvg-google-map-loading");
            }
        }
        hideLoadingMessage() {
            $$A(this.containers.loading).hide();
        }
        showLoadingMessage() {
            $$A(this.containers.loading).show();
        }
        disableAnimation() {
            this.containers.map.classList.add("no-transitions");
        }
        enableAnimation() {
            $$A(this.containers.map).removeClass("no-transitions");
        }
        loadExtensions() {
            if (this.options.extension &&
                $$A().mapSvg.extensions &&
                $$A().mapSvg.extensions[_this.options.extension]) {
                const ext = $$A().mapSvg.extensions[_this.options.extension];
                ext && ext.common(this);
            }
        }
        finalizeMapLoading() {
            if (this.afterLoadBlockers > 0 || this.loaded) {
                return;
            }
            this.selectRegionByIdFromUrl();
            setTimeout(() => {
                this.movingItemsAdjustScreenPosition();
                this.adjustStrokes();
                setTimeout(() => {
                    this.hideLoadingMessage();
                    $$A(this.containers.loading).find(".mapsvg-loading-text").hide();
                    this.enableAnimation();
                }, 200);
            }, 100);
            this.loaded = true;
            this.events.trigger("afterLoad");
        }
        selectRegionByIdFromUrl() {
            const match = RegExp("[?&]mapsvg_select=([^&]*)").exec(window.location.search);
            if (match) {
                const select = decodeURIComponent(match[1].replace(/\+/g, " "));
                this.selectRegion(select);
            }
            if (window.location.hash) {
                const query = window.location.hash.replace("#/m/", "");
                const region = this.getRegion(query);
                if (region && this.options.actions.map.afterLoad.selectRegion) {
                    this.regionClickHandler(null, region);
                }
            }
        }
        createForm(options) {
            return new FormBuilder(options);
        }
        getApiUrl(path) {
            const server = new Server();
            return server.getUrl(path);
        }
        getConverter() {
            return this.converter;
        }
        setChoropleth(options) {
            const _this = this;
            options = options || _this.options.choropleth;
            options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
            $$A.extend(true, _this.options, { choropleth: options });
            let needsRedraw = false;
            if (!_this.$gauge) {
                _this.$gauge = {};
                _this.$gauge.gradient = $$A("<td>&nbsp;</td>").addClass("mapsvg-gauge-gradient");
                _this.setGaugeGradientCSS();
                _this.$gauge.container = $$A("<div />").addClass("mapsvg-gauge").hide();
                _this.$gauge.table = $$A("<table />");
                const tr = $$A("<tr />");
                _this.$gauge.labelLow = $$A("<td>" + _this.options.choropleth.labels.low + "</td>");
                _this.$gauge.labelHigh = $$A("<td>" + _this.options.choropleth.labels.high + "</td>");
                tr.append(_this.$gauge.labelLow);
                tr.append(_this.$gauge.gradient);
                tr.append(_this.$gauge.labelHigh);
                _this.$gauge.table.append(tr);
                _this.$gauge.container.append(_this.$gauge.table);
                $$A(_this.containers.map).append(_this.$gauge.container);
            }
            if (!_this.options.choropleth.on && _this.$gauge.container.is(":visible")) {
                _this.$gauge.container.hide();
                needsRedraw = true;
            }
            else if (_this.options.choropleth.on && !_this.$gauge.container.is(":visible")) {
                _this.$gauge.container.show();
                needsRedraw = true;
                _this.regionsRepository.events.on("change", function () {
                    _this.redrawGauge();
                });
            }
            if (options.colors) {
                _this.options.choropleth.colors.lowRGB = tinycolor(_this.options.choropleth.colors.low).toRgb();
                _this.options.choropleth.colors.highRGB = tinycolor(_this.options.choropleth.colors.high).toRgb();
                _this.options.choropleth.colors.diffRGB = {
                    r: _this.options.choropleth.colors.highRGB.r -
                        _this.options.choropleth.colors.lowRGB.r,
                    g: _this.options.choropleth.colors.highRGB.g -
                        _this.options.choropleth.colors.lowRGB.g,
                    b: _this.options.choropleth.colors.highRGB.b -
                        _this.options.choropleth.colors.lowRGB.b,
                    a: _this.options.choropleth.colors.highRGB.a -
                        _this.options.choropleth.colors.lowRGB.a,
                };
                needsRedraw = true;
                _this.$gauge && _this.setGaugeGradientCSS();
            }
            if (options.labels) {
                _this.$gauge.labelLow.html(_this.options.choropleth.labels.low);
                _this.$gauge.labelHigh.html(_this.options.choropleth.labels.high);
            }
            needsRedraw && _this.redrawGauge();
        }
        redrawGauge() {
            const _this = this;
            _this.updateGaugeMinMax();
            _this.regionsRedrawColors();
        }
        updateGaugeMinMax() {
            const _this = this;
            _this.options.choropleth.min = 0;
            _this.options.choropleth.max = false;
            const values = [];
            _this.regions.forEach(function (r) {
                const gauge = r.data && r.data[_this.options.regionChoroplethField];
                gauge != undefined && values.push(gauge);
            });
            if (values.length > 0) {
                _this.options.choropleth.min = values.length == 1 ? 0 : Math.min.apply(null, values);
                _this.options.choropleth.max = Math.max.apply(null, values);
                _this.options.choropleth.maxAdjusted =
                    _this.options.choropleth.max - _this.options.choropleth.min;
            }
        }
        setGaugeGradientCSS() {
            const _this = this;
            _this.$gauge.gradient.css({
                background: "linear-gradient(to right," +
                    _this.options.choropleth.colors.low +
                    " 1%," +
                    _this.options.choropleth.colors.high +
                    " 100%)",
                filter: 'progid:DXImageTransform.Microsoft.gradient( startColorstr="' +
                    _this.options.choropleth.colors.low +
                    '", endColorstr="' +
                    _this.options.choropleth.colors.high +
                    '",GradientType=1 )',
            });
        }
        get $map() {
            return $$A(this.getContainer("map"));
        }
        get $svg() {
            return $$A(this.getContainer("svg"));
        }
        get $popover() {
            return $$A(this.getContainer("popover"));
        }
        get $details() {
            return $$A(this.getContainer("detailsView"));
        }
        get $directory() {
            return $$A(this.getContainer("directory"));
        }
        get database() {
            return this.objectsRepository;
        }
        get regionsDatabase() {
            return this.regionsRepository;
        }
    }

    exports.MapSVGMap = MapSVGMap;
    exports.arrayIndexed = ArrayIndexed;
    exports.customObject = CustomObject;
    exports.formBuilder = FormBuilder;
    exports.geoPoint = GeoPoint;
    exports.globals = MapSVG;
    exports.location = Location;
    exports.map = MapSVGMap;
    exports.mapsRepository = MapsRepository;
    exports.mapsV2Repository = MapsV2Repository;
    exports.marker = Marker;
    exports.query = Query;
    exports.repository = Repository;
    exports.schema = Schema;
    exports.schemaRepository = SchemaRepository;
    exports.screenPoint = ScreenPoint;
    exports.server = Server;
    exports.svgPoint = SVGPoint;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=mapsvg-front.umd.js.map
