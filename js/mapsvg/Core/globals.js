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

    return string.join(",");
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
                null;
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

export { MapSVG };
