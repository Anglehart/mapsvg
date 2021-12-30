/// <reference path="../../vendor/jquery-plugins.d.ts" />
import { MapSVG } from "../Core/globals.js";
import { MapSVGMap } from "../Map/Map";
import { Schema } from "../Infrastructure/Server/Schema";
// import {Handlebars} from "../../handlebars.js"
// @ts-ignore
import Handlebars from "Handlebars";
import { ResizeSensor } from "../Core/ResizeSensor";
import { Events } from "../Core/Events";
import * as FormElementTypes from "./FormElements/index.js";
import { FormElementFactory } from "./FormElements/FormElementFactory.js";
import { GeoPoint, Location, SVGPoint } from "../Location/Location.js";
import { Marker } from "../Marker/Marker.js";
import { Region } from "../Region/Region.js";
import { FormElementInterface, LocationFormElement } from "./FormElements/index.js";
import { ArrayIndexed } from "../Core/ArrayIndexed";
import { SchemaField } from "../Infrastructure/Server/SchemaField";
import { FormElement } from "./FormElements/FormElement";
const $ = jQuery;

export class FormBuilder {
    container: HTMLElement;
    namespace: string;
    mediaUploader: any; // WP Media uploader class
    schema: Schema;
    events: Events;
    formElementFactory: FormElementFactory;

    structureChanged: boolean;

    editMode: boolean;
    filtersMode: boolean;
    filtersHide: boolean;
    showFiltersButton: FormElementTypes.FormElementInterface;
    modal: boolean;
    admin: any; // MapSVG Admin class?
    mapsvg: MapSVGMap;
    data: { [key: string]: any };
    clearButton: boolean;
    clearButtonText: string;
    searchButton: boolean;
    searchButtonText: string;
    showButtonText: string;
    template: string;
    closeOnSave: boolean;
    newRecord: boolean;
    types: string[];
    sortable: any;
    saved: boolean;
    scrollable: boolean;
    showNames: boolean;

    templates: { [key: string]: Function };
    elements: { [key: string]: { [key: string]: HTMLElement } };
    form: HTMLFormElement;
    formEditor: HTMLFormElement;
    view: HTMLElement;

    formElements: ArrayIndexed<FormElementTypes.FormElementInterface>;
    currentlyEditing: FormElementTypes.FormElementInterface;
    markerBackup: { id: string; src: string; svgPoint: SVGPoint; geoPoint: GeoPoint };
    location: Location;
    scrollApi: any; // jScrollPane instance

    backupData?: {
        location: Location;
        marker: Marker;
    };
    editingMarker?: Marker;
    mediaUploaderisOpenedFor: FormElementInterface;

    constructor(options: { [key: string]: any }) {
        // schema, editMode, mapsvg, mediaUploader, data, admin, namespace
        const _this = this;

        this.events = new Events();

        // options
        this.container = options.container;
        this.namespace = options.namespace;
        this.mediaUploader = options.mediaUploader;
        this.schema = options.schema || [];
        this.editMode = options.editMode == undefined ? false : options.editMode;
        this.filtersMode = options.filtersMode == undefined ? false : options.filtersMode;
        this.filtersHide = options.filtersHide == undefined ? false : options.filtersHide;
        this.modal = options.modal == undefined ? false : options.modal;
        this.admin = options.admin;
        this.mapsvg = <MapSVGMap>options.mapsvg;
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
        this.view = $("<div />").addClass("mapsvg-form-builder")[0];
        if (this.editMode) $(this.view).addClass("full-flex");
        if (!this.showNames) {
            $(this.view).addClass("hide-names");
        }

        this.formElements = new ArrayIndexed("name");

        if (!MapSVG.templatesLoaded[this.template]) {
            this.loadTemplates(() => this.init());
        } else {
            this.init();
        }
    }

    private loadTemplates(callback: () => void): void {
        $.get(MapSVG.urls.root + "dist/" + this.template + ".html", (data) => {
            $(data).appendTo("body");
            MapSVG.templatesLoaded[this.template] = true;
            Handlebars.registerPartial("dataMarkerPartial", $("#mapsvg-data-tmpl-marker").html());
            if (this.editMode) {
                Handlebars.registerPartial(
                    "markerByFieldPartial",
                    $("#mapsvg-markers-by-field-tmpl-partial").html()
                );
            }
            callback();
        });
    }

    init() {
        const _this = this;

        // The global formBuilder property is needed to handle hotkeys (close / OK buttons)
        // @ts-ignore
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
            $(this.view).find(".mapsvg-data-preview").prepend(this.form);
            this.formEditor = <HTMLFormElement>$(this.view).find("#mapsvg-data-form-edit")[0];
        } else {
            this.view.appendChild(this.form);
        }

        _this.elements = {
            buttons: {
                text: $(_this.view).find("#mapsvg-data-btn-text")[0],
                textarea: $(_this.view).find("#mapsvg-data-btn-textarea")[0],
                checkbox: $(_this.view).find("#mapsvg-data-btn-checkbox")[0],
                radio: $(_this.view).find("#mapsvg-data-btn-radio")[0],
                select: $(_this.view).find("#mapsvg-data-btn-select")[0],
                image: $(_this.view).find("#mapsvg-data-btn-image")[0],
                region: $(_this.view).find("#mapsvg-data-btn-region")[0],
                marker: $(_this.view).find("#mapsvg-data-btn-marker")[0],
                saveSchema: $(_this.view).find("#mapsvg-data-btn-save-schema")[0],
            },
            containers: {
                buttons_add: $(_this.view).find("#mapsvg-data-buttons-add")[0],
            },
        };

        _this.redraw();
    }

    getForm(): HTMLFormElement {
        return this.form;
    }
    getFormEditor(): HTMLFormElement {
        return this.formEditor;
    }

    viewDidLoad() {}

    setEventHandlers() {
        const _this = this;

        $(this.getForm()).on("submit", (e) => {
            e.preventDefault();
        });

        if (this.filtersMode && this.clearButton) {
            $(this.elements.buttons.clearButton).on("click", (e) => {
                e.preventDefault();
                this.clearAllFields();
            });
        }

        $(window)
            .off("keydown.form.mapsvg")
            .on("keydown.form.mapsvg", function (e) {
                // @ts-ignore
                if (MapSVG.formBuilder) {
                    if ((e.metaKey || e.ctrlKey) && e.keyCode == 13)
                        // @ts-ignore
                        MapSVG.formBuilder.save();
                    else if (e.keyCode == 27)
                        // @ts-ignore
                        MapSVG.formBuilder.close();
                }
            });

        if (this.editMode) {
            $(this.view).on("click", "#mapsvg-data-buttons-add button", function (e) {
                e.preventDefault();
                const type = $(this).data("create");
                const formElement = _this.formElementFactory.create({ type: type });
                _this.addField(formElement);
            });
            $(this.view).on("click", "#mapsvg-data-btn-save-schema", function (e) {
                e.preventDefault();
                const fields = _this.getSchema();

                const counts = {};
                _this.formElements.forEach(function (elem) {
                    counts[elem.name] = (counts[elem.name] || 0) + 1;
                });

                $(_this.getForm()).find(".form-group").removeClass("has-error");
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

                _this.formElements.forEach(function (
                    formElement: FormElementTypes.FormElementInterface,
                    index
                ) {
                    let err = false;

                    // If that's not Form Builder for Filters (when there is no "name" parameter)
                    // we should check if names are non-empty and unique
                    if (!_this.filtersMode) {
                        if (counts[formElement.name] > 1) {
                            if (!errUnique) {
                                errUnique = "Field names should be unique";
                                errors.push(errUnique);
                                err = true;
                            }
                        } else if (formElement.name.length === 0) {
                            if (!errEmpty) {
                                errEmpty = "Field name can't be empty";
                                errors.push(errEmpty);
                                err = true;
                            }
                        } else if (reservedFields.indexOf(formElement.name) != -1) {
                            // if reserved field name is for proper type of object then it's OK
                            if (
                                !reservedFieldsToTypes[formElement.name] ||
                                (reservedFieldsToTypes[formElement.name] &&
                                    reservedFieldsToTypes[formElement.name] != formElement.type)
                            ) {
                                const msg =
                                    'Field name "' +
                                    formElement.name +
                                    '" is reserved, please set another name';
                                errors.push(msg);
                                err = true;
                            }
                        }
                    }

                    if (
                        formElement.options &&
                        formElement.type != "region" &&
                        formElement.type != "marker"
                    ) {
                        const vals = formElement.options.map(function (obj: {
                            label: string;
                            value: string;
                        }) {
                            return obj.value;
                        });
                        const uniq = [...Array.from(new Set(vals).values())];
                        if (vals.length != uniq.length) {
                            errors.push('Check "Options" list - values should not repeat');
                            err = true;
                        }
                    }

                    err && $(formElement.domElements.main).addClass("has-error");
                });

                if (errors.length === 0) {
                    _this.events.trigger("saveSchema", _this, [_this, fields]);
                } else {
                    jQuery.growl.error({ title: "Errors", message: errors.join("<br />") });
                }
            });
            setTimeout(function () {
                const el = _this.getForm();
                // @ts-ignore
                _this.sortable = new Sortable(el, {
                    animation: 150,
                    onStart: function () {
                        $(_this.getForm()).addClass("sorting");
                    },
                    onEnd: function () {
                        setTimeout(function () {
                            $(_this.getForm()).removeClass("sorting");
                            _this.formElements.clear();
                            $(el)
                                .find(".form-group")
                                .each(function (index, elem) {
                                    _this.formElements.push($(elem).data("formElement"));
                                });
                        }, 500);
                    },
                });
            }, 1000);
        } else {
            // Save
            // $(_this.view).on('click','button.btn-save',function(e){
            //     e.preventDefault();
            //     _this.save();
            // });
            // Close
            // jQuery(_this.view).on('click','button.btn-close', function(){
            //     alert(1);
            // });
            // $(_this.view).on('click','button.btn-close',function(e){
            //     e.preventDefault();
            //     _this.close();
            // });
        }

        new ResizeSensor(this.view, function () {
            _this.scrollApi && _this.scrollApi.reinitialise();
        });
    }

    private clearAllFields() {
        this.formElements.forEach((f) => f.setValue(null));
        // $(this.getForm())
        //     .find("input")
        //     .not(":button, :submit, :reset, :hidden, :checkbox, :radio")
        //     .val("")
        //     .prop("selected", false);
        // $(this.getForm()).find('input[type="radio"]').prop("checked", false);
        // $(this.getForm()).find('input[type="checkbox"]').prop("checked", false);
        // $(this.getForm()).find("select").val("").trigger("change.select2");
        this.events.trigger("cleared");
    }

    setFormElementEventHandlers(formElement: FormElementTypes.FormElementInterface) {
        const _this = this;

        if (this.editMode) {
            formElement.events.on("click", (elem) => {
                this.edit(elem);
            });
            formElement.events.on("delete", (elem) => {
                this.deleteField(elem);
            });
        } else {
            formElement.events.on("changed", (_formElement) => {
                const name = _formElement.name;
                const value = _formElement.getValue();
                // TODO check how this works with names like name[a][b][c]
                if (_formElement.type !== "search") {
                    this.events.trigger("changed.field", _formElement, [_formElement, name, value]);
                } else {
                    this.events.trigger("changed.search", _formElement, [_formElement, value]);
                }
            });

            /*
            const locationField =
                _this.mapsvg &&
                _this.mapsvg.objectsRepository &&
                _this.mapsvg.objectsRepository.getSchema() &&
                _this.mapsvg.objectsRepository.getSchema().getField("location");
            // @ts-ignore
            if (
                locationField &&
                locationField.markersByFieldEnabled &&
                locationField.markerField &&
                formElement.name == locationField.markerField &&
                Object.values(locationField.markersByField).length > 0
            ) {
                formElement.events.on("changed", (_formElement) => {
                    const name = _formElement.name;
                    const value = _formElement.value;
                    // @ts-ignore
                    const src = locationField.markersByField[value];
                    if (src) {
                        if (_this.markerBackup) {
                            const marker = _this.mapsvg.getMarker(_this.markerBackup.id);
                            marker.setImage(src);
                            $(_this.view).find(".mapsvg-marker-image-btn img").attr("src", src);
                        }
                        // _this.markerBackupImageButton.attr('src',src);
                    }
                });
            }

             */
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

    getFormElementByType(type: string): FormElementTypes.FormElementInterface {
        return this.formElements.find((el) => el.type === type);
    }

    getData(): { [key: string]: any } {
        const data = {};
        this.formElements.forEach((formElement) => {
            if (formElement.readonly === false || formElement.type === "id") {
                const _formElementData = formElement.getData();
                data[_formElementData.name] = _formElementData.value;
            }
        });
        return data;
    }

    reset(): void {
        this.formElements.forEach((formElement) => {
            formElement.setValue(null);
        });
    }

    update(data: { [key: string]: any }): void {
        this.schema.getFields().forEach((field) => {
            const formElement = <FormElement>this.formElements.get(field.name);
            if (formElement) {
                if (typeof data[field.name] !== "undefined") {
                    if (formElement.getValue() !== data[field.name]) {
                        formElement.setValue(data[field.name]);
                    }
                } else {
                    formElement.setValue(null);
                }
            }
        });
    }

    redraw(): void {
        const _this = this;

        delete _this.markerBackup;

        $(this.container).empty();
        $(this.getForm()).empty();
        this.formElements.clear();

        this.schema &&
            this.schema.fields.length > 0 &&
            this.schema.fields.forEach((fieldSettings: SchemaField) => {
                if (this.filtersMode) {
                    if (fieldSettings.type == "distance") {
                        fieldSettings.value = this.data.distance
                            ? this.data.distance
                            : fieldSettings.value !== undefined
                            ? fieldSettings.value
                            : null;
                    } else {
                        fieldSettings.value = this.data[fieldSettings.parameterNameShort];
                    }
                } else {
                    fieldSettings.value = this.data
                        ? this.data[fieldSettings.name]
                        : fieldSettings.value !== undefined
                        ? fieldSettings.value
                        : null;
                }

                if (fieldSettings.type == "location" && !this.editMode) {
                    // add Marker Object into formElement
                    if (
                        fieldSettings.value &&
                        fieldSettings.value.marker &&
                        fieldSettings.value.marker.id
                    ) {
                        //this.markerBackup = fieldSettings.value.marker.getOptions();
                        //this.mapsvg.setEditingMarker(fieldSettings.value.marker);
                    }
                    this.admin && this.admin.setMode && this.admin.setMode("editMarkers");
                    this.admin && this.admin.enableMarkersMode(true);
                } else if (fieldSettings.type == "post") {
                    fieldSettings.post = this.data["post"];
                } else if (fieldSettings.type === "region") {
                    fieldSettings.options = new ArrayIndexed("id", this.getRegionsList());
                }

                const formElement = this.formElementFactory.create(fieldSettings);
                if (this.filtersMode) {
                    if (
                        !this.filtersHide ||
                        (this.filtersHide && this.modal && fieldSettings.type !== "search") ||
                        (!this.modal && fieldSettings.type === "search")
                    ) {
                        this.addField(formElement);
                    }
                } else {
                    this.addField(formElement);
                }
            });

        if (!_this.editMode) {
            if (this.schema.fields.length === 0 && !this.filtersMode) {
                const formElement = this.formElementFactory.create({ type: "empty" });
                _this.addField(formElement);
            } else {
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

        // If part of filters is hidden in a modal, and what is showing now is NOT a modal,
        // then add a "Show filters" button that opens a modal with remaining filers.
        if (_this.filtersMode && _this.filtersHide && !_this.modal) {
            const formElement = this.formElementFactory.create({
                type: "modal",
                showButtonText: _this.showButtonText,
            });
            this.showFiltersButton = _this.addField(formElement);
        }

        if (this.scrollable) {
            const nano = $('<div class="nano"></div>');
            const nanoContent = $('<div class="nano-content"></div>');
            nano.append(nanoContent);
            // nanoContent.html(this.view);
            // $(_this.container).html(nano.html());
            nanoContent.append(this.view);
            $(_this.container).append(nano);

            // @ts-ignore
            nano.jScrollPane({ contentWidth: "0px", mouseWheelSpeed: 30 });
            _this.scrollApi = nano.data("jsp");
        } else {
            // $(_this.container).html(this.view);
            $(_this.container).append(this.view);
        }

        // If FormBuilder is used to create filters and "Add clear button" option is "on"
        // then add the "Clear all" button
        if (_this.filtersMode && _this.clearButton) {
            _this.elements.buttons.clearButton = $(
                '<div class="form-group mapsvg-filters-reset-container">' +
                    '<button type="button" class="btn btn-outline-secondary mapsvg-filters-reset">' +
                    _this.clearButtonText +
                    "</button></div>"
            )[0];
            $(this.getForm()).append(_this.elements.buttons.clearButton);
        }
        if (_this.filtersMode && _this.searchButton) {
            _this.elements.buttons.searchButton = $(
                '<div class="form-group mapsvg-filters-reset-container" id="mapsvg-search-container"><button class="btn btn-outline-secondary mapsvg-filters-reset">' +
                    _this.searchButtonText +
                    "</button></div>"
            )[0];
            $(this.getForm()).append(_this.elements.buttons.searchButton);
        }

        if (!this.editMode && !_this.filtersMode)
            $(this.view).find("input:visible,textarea:visible").not(".tt-hint").first().focus();

        const cm = $(this.container).find(".CodeMirror");

        cm.each(function (index, el) {
            // @ts-ignore
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
        // _this.formElements.forEach(function(fc, index){
        //     if(fc === formElement){
        //         _this.formElements.splice(index,1);
        //         _this.structureChanged = true;
        //     }
        // });
    }

    getExtraParams() {
        const databaseFields = [];
        this.mapsvg.objectsRepository
            .getSchema()
            .getFields()
            .forEach(function (obj) {
                if (
                    obj.type == "text" ||
                    obj.type == "region" ||
                    obj.type == "textarea" ||
                    obj.type == "post" ||
                    obj.type == "select" ||
                    obj.type == "radio" ||
                    obj.type == "checkbox"
                ) {
                    if (obj.type == "post") {
                        databaseFields.push("Object.post.post_title");
                    } else {
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
        markerFieldsShort = databaseFieldsFilterableShort.filter(
            (o) => o.type === "select" || o.type === "radio"
        );
        const regionFields = this.mapsvg.regionsRepository
            .getSchema()
            .getFieldsAsArray()
            .map(function (obj) {
                if (
                    obj.type == "status" ||
                    obj.type == "text" ||
                    obj.type == "textarea" ||
                    obj.type == "post" ||
                    obj.type == "select" ||
                    obj.type == "radio" ||
                    obj.type == "checkbox"
                ) {
                    if (obj.type == "post") {
                        return "Region.post.post_title";
                    } else {
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

    addField(formElement: FormElementTypes.FormElementInterface) {
        const _this = this;

        // Check if field can be added - some fields can be added only once:
        if (
            ["region", "marker", "post", "status", "distance", "location", "search"].indexOf(
                formElement.type
            ) != -1
        ) {
            let repeat = false;
            _this.formElements.forEach(function (control) {
                if (control.type == formElement.type) repeat = true;
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
            } else {
                this.edit(formElement);
            }
        }
        return formElement;
    }

    edit(formElement: FormElementTypes.FormElementInterface) {
        const _this = this;

        // destroy previous editor
        _this.currentlyEditing && _this.currentlyEditing.destroyEditor();

        // create new  editor
        this.getFormEditor().appendChild(formElement.getEditor());
        // setTimeout(function(){
        formElement.initEditor();
        _this.currentlyEditing = formElement;
        $(_this.getForm()).find(".form-group.active").removeClass("active");
        $(formElement.domElements.main).addClass("active");
        // }, 500);
    }

    get() {
        // return this.formElements.map(function(c){
        //     return c.get();
        // });
    }

    getSchema() {
        return this.formElements.map(function (formElement) {
            return formElement.getSchema();
        });
    }

    close() {
        const _this = this;

        // $('body').off('keydown.mapsvg');

        this.formElements.forEach((formElement) => formElement.destroy());
        this.mediaUploader && this.mediaUploader.off("select");

        MapSVG.formBuilder = null;
        this.events.trigger("close", this, [this]);
    }

    destroy() {
        $(this.view).empty().remove();
        this.sortable = null;
    }

    toJSON(addEmpty) {
        const obj = {};

        function add(obj, name, value) {
            if (!addEmpty && !value) return false;
            if (name.length == 1) {
                obj[name[0]] = value;
            } else {
                if (obj[name[0]] == null) {
                    if (name[1] === "") {
                        obj[name[0]] = [];
                    } else {
                        obj[name[0]] = {};
                    }
                }

                if (obj[name[0]].length !== undefined) {
                    obj[name[0]].push(value);
                } else {
                    add(obj[name[0]], name.slice(1), value);
                }
            }
        }

        $(this.elements.containers.formView)
            .find("input, textarea, select")
            .each(function () {
                if (
                    !$(this).data("skip") &&
                    !$(this).prop("disabled") &&
                    $(this).attr("name") &&
                    !(
                        !addEmpty &&
                        $(this).attr("type") == "checkbox" &&
                        $(this).attr("checked") == undefined
                    ) &&
                    !($(this).attr("type") == "radio" && $(this).attr("checked") == undefined)
                ) {
                    let value;
                    if ($(this).attr("type") == "checkbox") {
                        value = $(this).prop("checked");
                    } else {
                        value = $(this).val();
                    }
                    add(obj, $(this).attr("name").replace(/]/g, "").split("["), value);
                }
            });

        return obj;
    }

    getRegionsList(): { id: string; title: string }[] {
        return this.mapsvg.regions.map(function (r) {
            return { id: r.id, title: r.title };
        });
    }
    getRegionsAsArray(): Region[] {
        return this.mapsvg.regions;
    }

    private setRegions(location: Location) {
        const regionsFormElement = <FormElementInterface>this.formElements.get("regions");

        if (this.mapsvg.options.source.indexOf("/geo-calibrated/usa.svg") !== -1) {
            // If this is the map of USA, choose the corresponding state by region ID in the "regions" field
            regionsFormElement.setValue(["US-" + location.address.state_short]);
        } else if (this.mapsvg.options.source.indexOf("/geo-calibrated/world.svg") !== -1) {
            // If this is the world.svg map, choose the corresponding country by country ID in the "regions" field
            if (location.address.country_short) {
                regionsFormElement.setValue([location.address.country_short]);
            }
        } else {
            if (location.address.administrative_area_level_1) {
                this.mapsvg.regions.forEach((_region: Region) => {
                    if (
                        _region.title === location.address.administrative_area_level_1 ||
                        _region.title === location.address.administrative_area_level_2 ||
                        _region.id ===
                            location.address.country_short +
                                "-" +
                                location.address.administrative_area_level_1_short
                    ) {
                        regionsFormElement.setValue([_region.id]);
                    }
                });
            }
        }
    }
}
