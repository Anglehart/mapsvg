import { FormElement } from "./FormElement.js";
import { MapSVG } from "../../Core/globals.js";
import Bloodhound from "Bloodhound";
import { Server } from "../../Infrastructure/Server/Server";
const $ = jQuery;
export class DistanceFormElement extends FormElement {
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
        this.zipLength = options.zipLength || 5;
        this.userLocationButton = MapSVG.parseBoolean(options.userLocationButton);
        this.options = options.options || [
            { value: "10", default: true },
            { value: "30", default: false },
            { value: "50", default: false },
            { value: "100", default: false },
        ];
        let selected = false;
        if (this.value) {
            this.options.forEach((option) => {
                if (option.value === this.value.length) {
                    option.selected = true;
                    selected = true;
                }
            });
        }
        if (!selected) {
            this.options.forEach(function (option) {
                if (option.default) {
                    option.selected = true;
                }
            });
        }
        const defOption = this.options.find((opt) => opt.selected === true);
        const length = defOption.value;
        this.value = {
            units: this.distanceUnits,
            geoPoint: { lat: 0, lng: 0 },
            length: length,
            address: "",
            country: this.country,
        };
    }
    setDomElements() {
        super.setDomElements();
        this.inputs.units = ($(this.domElements.main).find('[name="distanceUnits"]')[0]);
        this.inputs.geoPoint = ($(this.domElements.main).find('[name="distanceGeoPoint"]')[0]);
        this.inputs.length = ($(this.domElements.main).find('[name="distanceLength"]')[0]);
        this.inputs.address = ($(this.domElements.main).find('[name="distance"]')[0]);
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
        schema.zipLength = this.zipLength;
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
        if ($().mselect2) {
            const sel = $(this.domElements.main).find(".mapsvg-select2");
            if (sel.length) {
                sel.mselect2("destroy");
            }
        }
    }
    initEditor() {
        super.initEditor();
        this.mayBeAddDistanceRow();
        if ($().mselect2) {
            $(this.domElements.edit).find("select").mselect2();
        }
    }
    setEventHandlers() {
        super.setEventHandlers();
        const _this = this;
        $(this.domElements.edit).on("keyup change paste", ".mapsvg-edit-distance-row input", function () {
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
        const thContainer = $(this.domElements.main).find(".typeahead");
        if (this.searchByZip) {
            $(this.domElements.main).find(".mapsvg-distance-fields").addClass("search-by-zip");
            thContainer.on("change keyup", (e) => {
                if ($(e.target).val().toString().length === _this.zipLength) {
                    locations.search($(e.target).val(), null, (data) => {
                        if (data && data[0]) {
                            this.setValue({ geoPoint: data[0].geometry.location });
                            this.triggerChanged();
                        }
                    });
                }
            });
        }
        else {
            const tH = thContainer.typeahead({ minLength: 3 }, {
                name: "mapsvg-addresses",
                display: "formatted_address",
                source: locations,
                limit: 5,
            });
            $(this.domElements.main).find(".mapsvg-distance-fields").removeClass("search-by-zip");
        }
        if (_this.userLocationButton) {
            const userLocationButton = $(this.domElements.main).find(".user-location-button");
            userLocationButton.on("click", () => {
                _this.formBuilder.mapsvg.showUserLocation((location) => {
                    locations.search(location.geoPoint.lat + "," + location.geoPoint.lng, null, function (data) {
                        if (data && data[0]) {
                            thContainer.val(data[0].formatted_address);
                        }
                        else {
                            thContainer.val(location.geoPoint.lat + "," + location.geoPoint.lng);
                        }
                    });
                    this.setValue({ geoPoint: location.geoPoint });
                    this.triggerChanged();
                });
            });
        }
        thContainer.on("change keyup", (e) => {
            const input = e.target;
            if (input.value === "") {
                this.setValue({ geoPoint: null });
                this.triggerChanged();
            }
        });
        thContainer.on("typeahead:select", (ev, item) => {
            const address = { formatted: item.formatted_address };
            this.setValue({ address: address, geoPoint: item.geometry.location });
            this.triggerChanged();
            thContainer.blur();
        });
        $(this.inputs.geoPoint).on("change", (e) => {
            const geoPoint = e.target.value.split(",").map((value) => parseFloat(value));
            this.setGeoPoint({ lat: geoPoint[0], lng: geoPoint[1] }, false);
            this.triggerChanged();
        });
        $(this.inputs.length).on("change", (e) => {
            this.setLength(parseInt(e.target.value), false);
            this.triggerChanged();
        });
    }
    addSelect2() {
        if ($().mselect2) {
            $(this.domElements.main)
                .find("select")
                .mselect2()
                .on("select2:focus", function () {
                $(this).mselect2("open");
            });
        }
    }
    mayBeAddDistanceRow() {
        const _this = this;
        const editDistanceRow = $($("#mapsvg-edit-distance-row").html());
        const z = $(_this.domElements.edit).find(".mapsvg-edit-distance-row:last-child input");
        if (z && z.last() && z.last().val() && z.last().val().toString().trim().length) {
            const newRow = editDistanceRow.clone();
            newRow.insertAfter($(_this.domElements.edit).find(".mapsvg-edit-distance-row:last-child"));
        }
        const rows = $(_this.domElements.edit).find(".mapsvg-edit-distance-row");
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
        for (const key in value) {
            if (typeof this.value[key] !== undefined) {
                const method = "set" + MapSVG.ucfirst(key);
                if (typeof this[method] === "function") {
                    this[method](value[key], updateInput);
                }
            }
        }
    }
    setGeoPoint(geoPoint, updateInput = true) {
        this.value.geoPoint = geoPoint;
        if (updateInput) {
            this.setInputGeoPointValue(geoPoint);
        }
    }
    setInputGeoPointValue(geoPoint) {
        this.inputs.geoPoint.value = geoPoint.lat + "," + geoPoint.lng;
    }
    setLength(length, updateInput = true) {
        this.value.length = parseInt(length.toString());
        if (updateInput) {
            this.setInputLengthValue(this.value.length);
        }
    }
    setInputLengthValue(length) {
        this.inputs.length.value = length.toString();
    }
}
//# sourceMappingURL=DistanceFormElement.js.map
