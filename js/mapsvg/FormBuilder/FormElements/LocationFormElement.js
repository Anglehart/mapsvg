import { MapSVG } from "../../Core/globals.js";
import { FormElement } from "./FormElement.js";
import { GeoPoint, Location } from "../../Location/Location.js";
import { Marker } from "../../Marker/Marker.js";
import Handlebars from "Handlebars";
import Bloodhound from "Bloodhound";
import { Server } from "../../Infrastructure/Server/Server";
const $ = jQuery;
export class LocationFormElement extends FormElement {
    constructor(options, formBuilder, external) {
        super(options, formBuilder, external);
        this.location = this.value;
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
        this.templates.marker = Handlebars.compile($("#mapsvg-data-tmpl-marker").html());
    }
    init() {
        super.init();
        if (this.location && this.location.marker) {
            this.renderMarker();
        }
    }
    getSchema() {
        const schema = super.getSchema();
        schema.language = this.language;
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
                if (m.path === _this.formBuilder.mapsvg.getData().options.defaultMarkerImage) {
                    m.default = true;
                }
                else {
                    m.default = false;
                }
            });
        }
        data.language = this.language;
        if (this.location) {
            data.location = this.location;
            if (this.location.marker) {
                data.location.img =
                    (this.location.marker.src.indexOf(MapSVG.urls.uploads) === 0
                        ? "uploads/"
                        : "") + this.location.marker.src.split("/").pop();
            }
        }
        return data;
    }
    initEditor() {
        super.initEditor();
        this.fillMarkersByFieldOptions(this.markerField);
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
            const thContainer = $(this.domElements.main).find(".typeahead");
            const tH = thContainer.typeahead({
                minLength: 3,
            }, {
                name: "mapsvg-addresses",
                display: "formatted_address",
                source: locations,
            });
            thContainer.on("typeahead:select", (ev, item) => {
                this.location && this.location.marker && this.deleteMarker();
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
                    geoPoint: new GeoPoint(item.geometry.location.lat, item.geometry.location.lng),
                    img: this.formBuilder.mapsvg.getMarkerImage(this.formBuilder.getData()),
                };
                this.setValue(locationData, false);
                thContainer.typeahead("val", "");
                this.triggerChanged();
            });
        }
        $(this.domElements.main).on("click", ".mapsvg-marker-image-btn-trigger", function (e) {
            $(this).toggleClass("active");
            _this.toggleMarkerSelector.call(_this, $(this), e);
        });
        $(this.domElements.main).on("click", ".mapsvg-marker-delete", function (e) {
            e.preventDefault();
            _this.deleteMarker();
        });
    }
    setEditorEventHandlers() {
        super.setEditorEventHandlers();
        const _this = this;
        const imgSelector = $("#marker-file-uploader")
            .closest(".form-group")
            .find(".mapsvg-marker-image-selector");
        $(this.domElements.edit).on("change", 'select[name="markerField"]', function () {
            const fieldName = $(this).val();
            _this.fillMarkersByFieldOptions(fieldName);
        });
        $(this.domElements.edit).on("click", ".mapsvg-marker-image-btn-trigger", function (e) {
            $(this).toggleClass("active");
            _this.toggleMarkerSelectorInLocationEditor.call(_this, $(this), e);
        });
        $(this.domElements.edit).on("change", "#marker-file-uploader", function () {
            const uploadBtn = $(this).closest(".btn-file").button("loading");
            for (let i = 0; i < this.files.length; i++) {
                const data = new FormData();
                data.append("file", this.files[0]);
                const server = new Server();
                server
                    .ajax("markers", {
                    type: "POST",
                    data: data,
                    processData: false,
                    contentType: false,
                })
                    .done(function (resp) {
                    if (resp.error) {
                        alert(resp.error);
                    }
                    else {
                        const marker = resp.marker;
                        const newMarker = '<button class="btn btn-default mapsvg-marker-image-btn mapsvg-marker-image-btn-choose">' +
                            '<img src="' +
                            marker.path +
                            '" />' +
                            "</button>";
                        $(newMarker).appendTo(imgSelector);
                        MapSVG.markerImages.push(marker);
                    }
                })
                    .always(function () {
                    uploadBtn.buttonLoading(false);
                });
            }
        });
    }
    mayBeAddDistanceRow() {
        const _this = this;
        if (!this.domElements.editDistanceRow) {
            this.domElements.editDistanceRow = $($("#mapsvg-edit-distance-row").html())[0];
        }
        const z = $(this.domElements.edit).find(".mapsvg-edit-distance-row:last-child input");
        if (z && z.last() && z.last().val() && (z.last().val() + "").trim().length) {
            const newRow = $(this.templates.editDistanceRow).clone();
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
    fillMarkersByFieldOptions(fieldName) {
        const _this = this;
        const field = _this.formBuilder.mapsvg.objectsRepository.getSchema().getField(fieldName);
        if (field) {
            const markerImg = _this.formBuilder.mapsvg.options.defaultMarkerImage;
            const rows = [];
            field.options.forEach(function (option) {
                const img = _this.markersByField && _this.markersByField[option.value]
                    ? _this.markersByField[option.value]
                    : markerImg;
                rows.push('<tr data-option-id="' +
                    option.value +
                    '"><td>' +
                    option.label +
                    '</td><td><button class="btn btn-default mapsvg-marker-image-btn-trigger mapsvg-marker-image-btn"><img src="' +
                    img +
                    '" class="new-marker-img" style="margin-right: 4px;"/><span class="caret"></span></button></td></tr>');
            });
            $("#markers-by-field").empty().append(rows);
        }
    }
    renderMarker(marker) {
        const _this = this;
        if (!this.location && !(marker && marker.location)) {
            return false;
        }
        if (marker && marker.location) {
            this.location = marker.location;
        }
        this.renderMarkerHtml();
        this.location.marker.events.on("change", () => {
            this.renderMarkerHtml();
        });
    }
    renderMarkerHtml() {
        if (this.location.marker.dragging) {
            return false;
        }
        $(this.domElements.main)
            .find(".mapsvg-new-marker")
            .show()
            .html(this.templates.marker(this.location));
    }
    toggleMarkerSelector(jQueryObj, e) {
        e.preventDefault();
        const _this = this;
        if (_this.domElements.markerSelector &&
            $(_this.domElements.markerSelector).is(":visible")) {
            $(_this.domElements.markerSelector).hide();
            return;
        }
        if (_this.domElements.markerSelector &&
            $(_this.domElements.markerSelector).not(":visible")) {
            $(_this.domElements.markerSelector).show();
            return;
        }
        _this.domElements.markerImageButton = jQueryObj.find("img")[0];
        const currentImage = $(_this.domElements.markerImageButton).attr("src");
        const images = MapSVG.markerImages.map(function (image) {
            return ('<button class="btn btn-default mapsvg-marker-image-btn mapsvg-marker-image-btn-choose ' +
                (currentImage == image.path ? "active" : "") +
                '"><img src="' +
                image.path +
                '" /></button>');
        });
        if (!_this.domElements.markerSelector) {
            _this.domElements.markerSelector = $(this.domElements.main).find(".mapsvg-marker-image-selector")[0];
        }
        if (_this.domElements.markerSelector) {
            $(_this.domElements.markerSelector).empty();
        }
        if (_this.formBuilder.markerBackup) {
            $(_this.domElements.markerSelector).data("marker", _this.formBuilder.markerBackup);
        }
        else {
            $(_this.domElements.markerSelector).data("marker", null);
        }
        $(_this.domElements.markerSelector).html(images.join(""));
        $(_this.domElements.markerSelector).on("click", ".mapsvg-marker-image-btn-choose", function (e) {
            e.preventDefault();
            const src = $(this).find("img").attr("src");
            if (_this.formBuilder.markerBackup) {
                const marker = _this.formBuilder.mapsvg.getMarker(_this.formBuilder.markerBackup.id);
                marker.setImage(src);
            }
            $(_this.domElements.markerSelector).hide();
            $(_this.domElements.main)
                .find(".mapsvg-marker-image-btn-trigger")
                .toggleClass("active", false);
            $(_this.domElements.markerImageButton).attr("src", src);
            _this.formBuilder.mapsvg.setDefaultMarkerImage(src);
        });
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
        const markerBtn = $(this).closest("td").find(".mapsvg-marker-image-btn-trigger");
        const currentImage = markerBtn.attr("src");
        const images = MapSVG.markerImages.map(function (image) {
            return ('<button class="btn btn-default mapsvg-marker-image-btn mapsvg-marker-image-btn-choose ' +
                (currentImage == image.path ? "active" : "") +
                '"><img src="' +
                image.path +
                '" /></button>');
        });
        if (!jQueryObj.data("markerSelector")) {
            const ms = $('<div class="mapsvg-marker-image-selector"></div>');
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
            const src = $(this).find("img").attr("src");
            jQueryObj.data("markerSelector").hide();
            const td = $(this).closest("td");
            const fieldId = $(this).closest("tr").data("option-id");
            const btn = td.find(".mapsvg-marker-image-btn-trigger");
            btn.toggleClass("active", false);
            btn.find("img").attr("src", src);
            _this.setMarkerByField(fieldId, src);
        });
    }
    setMarkerByField(fieldId, markerImg) {
        this.markersByField = this.markersByField || {};
        this.markersByField[fieldId] = markerImg;
    }
    deleteMarker() {
        const _this = this;
        if (this.formBuilder.backupData) {
            this.formBuilder.backupData.location = this.location;
            this.formBuilder.backupData.marker = this.marker;
        }
        else {
            this.formBuilder.backupData = {
                location: this.location,
                marker: this.marker,
            };
        }
        this.location = null;
        this.marker = null;
        if (this.formBuilder.markerBackup) {
            this.formBuilder.mapsvg.getMarker(this.formBuilder.markerBackup.id).delete();
            _this.formBuilder.mapsvg.editingMarker = null;
        }
        $(this.domElements.main).find(".mapsvg-new-marker").hide();
        $(this.domElements.main).find(".mapsvg-marker-id").attr("disabled", "disabled");
    }
    destroy() {
        if ($().mselect2) {
            const sel = $(this.domElements.main).find(".mapsvg-select2");
            if (sel.length) {
                sel.mselect2("destroy");
            }
        }
        this.domElements.markerSelector && $(this.domElements.markerSelector).popover("destroy");
    }
    setValue(value, updateInput = true) {
        this.value = value;
        this.setLocation(value);
    }
    setLocation(value) {
        this.location = new Location(value);
        this.formBuilder.location = this.location;
        const marker = new Marker({
            location: this.location,
            mapsvg: this.formBuilder.mapsvg,
        });
        this.location.marker = marker;
        this.formBuilder.mapsvg.markerAdd(this.location.marker);
        this.formBuilder.mapsvg.setEditingMarker(marker);
        this.formBuilder.markerBackup = marker.getOptions();
        this.renderMarker();
    }
}
//# sourceMappingURL=LocationFormElement.js.map