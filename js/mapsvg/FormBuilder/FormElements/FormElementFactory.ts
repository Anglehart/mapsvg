import * as FormElementTypes from "./index.js";
import { MapSVGMap } from "../../Map/Map";
import { FormBuilder } from "../FormBuilder";
import { SchemaField } from "../../Infrastructure/Server/SchemaField";
import { ArrayIndexed } from "../../Core/ArrayIndexed";

const $ = jQuery;

export class FormElementFactory {
    mapsvg: MapSVGMap;
    formBuilder: FormBuilder;
    namespace: string;
    editMode: boolean;
    filtersMode: boolean;
    mediaUploader: any;
    showNames: boolean;

    constructor(options: {
        mapsvg: MapSVGMap;
        formBuilder: FormBuilder;
        editMode: boolean;
        filtersMode: boolean;
        namespace: string;
        mediaUploader: any;
        showNames?: boolean;
    }) {
        this.mapsvg = options.mapsvg;
        this.editMode = options.editMode;
        this.filtersMode = options.filtersMode;
        this.namespace = options.namespace;
        this.mediaUploader = options.mediaUploader;
        this.formBuilder = options.formBuilder;
        this.showNames = options.showNames !== false;
    }

    create(options: SchemaField): FormElementTypes.FormElementInterface {
        const types = {
            checkbox: FormElementTypes.CheckboxFormElement,
            checkboxes: FormElementTypes.CheckboxesFormElement,
            date: FormElementTypes.DateFormElement,
            distance: FormElementTypes.DistanceFormElement,
            empty: FormElementTypes.EmptyFormElement,
            id: FormElementTypes.IdFormElement,
            image: FormElementTypes.ImagesFormElement,
            location: FormElementTypes.LocationFormElement,
            modal: FormElementTypes.ModalFormElement,
            post: FormElementTypes.PostFormElement,
            radio: FormElementTypes.RadioFormElement,
            region: FormElementTypes.RegionsFormElement,
            save: FormElementTypes.SaveFormElement,
            search: FormElementTypes.SearchFormElement,
            select: FormElementTypes.SelectFormElement,
            status: FormElementTypes.StatusFormElement,
            text: FormElementTypes.TextFormElement,
            textarea: FormElementTypes.TextareaFormElement,
            title: FormElementTypes.TitleFormElement,
            colorpicker: FormElementTypes.ColorPickerFormElement,
        };

        const formElement = new types[options.type](
            options,
            this.formBuilder,
            this.getExtraParams()
        );
        formElement.init();
        return formElement;
    }

    getExtraParams() {
        const databaseFields = [];
        let databaseFieldsFilterableShort = [];
        const regionFields = [];
        const regions = [];
        let mapIsGeo = false;

        if (this.mapsvg) {
            mapIsGeo = this.mapsvg.isGeo();
            const schemaObjects = this.mapsvg.objectsRepository.getSchema();
            if (schemaObjects) {
                schemaObjects.getFields().forEach(function (obj) {
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
                databaseFieldsFilterableShort = schemaObjects
                    .getFieldsAsArray()
                    .filter(function (obj) {
                        return obj.type == "select" || obj.type == "radio" || obj.type == "region";
                    })
                    .map(function (obj) {
                        return obj.name;
                    });
            }

            const schemaRegions = this.mapsvg.regionsRepository.getSchema();

            if (schemaRegions) {
                const regionFields = schemaRegions.getFieldsAsArray().map(function (obj) {
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
            }

            const regions = new ArrayIndexed("id");
            this.mapsvg.regions.forEach((region) => {
                regions.push({ id: region.id, title: region.title });
            });
        }

        return {
            databaseFields: databaseFields,
            databaseFieldsFilterableShort: databaseFieldsFilterableShort,
            regionFields: regionFields,
            regions: regions,
            mapIsGeo: mapIsGeo,
            mediaUploader: this.mediaUploader,
            filtersMode: this.filtersMode,
            showNames: this.showNames,
        };
    }
}
