/// <reference path="../../../../vendor/jquery-plugins.d.ts" />
import { FormElement } from "../FormElement.js";
import { FormBuilder } from "../../FormBuilder.js";
import { MapSVG } from "../../../Core/globals.js";
import { SchemaField } from "../../../Infrastructure/Server/SchemaField";

const $ = jQuery;

// TODO extract "multiselect" class and make it inherited from SelectFormElement

export class SelectFormElement extends FormElement {
    multiselect: boolean;
    optionsGrouped: any;
    inputs: { select: HTMLSelectElement };

    constructor(options: SchemaField, formBuilder: FormBuilder, external: { [key: string]: any }) {
        super(options, formBuilder, external);
        this.searchable = MapSVG.parseBoolean(options.searchable);
        this.multiselect = MapSVG.parseBoolean(options.multiselect);
        this.optionsGrouped = options.optionsGrouped;
        this.db_type = this.multiselect ? "text" : "varchar(255)";

        this.setOptions(options.options);
    }

    setDomElements() {
        super.setDomElements();
        this.inputs.select = $(this.domElements.main).find("select")[0];
    }

    getSchema(): { [p: string]: any } {
        const schema = super.getSchema();
        schema.multiselect = MapSVG.parseBoolean(this.multiselect);
        if (schema.multiselect) schema.db_type = "text";
        schema.optionsGrouped = this.optionsGrouped;
        const opts = $.extend(true, {}, { options: this.options });
        schema.options = opts.options || [];
        schema.optionsDict = {};
        schema.options.forEach(function (option) {
            schema.optionsDict[option.value] = option.label;
        });

        return schema;
    }

    // getData(){
    // TODO check this and uncomment maybe
    // data[control.name] = data[control.name].map(function(value){
    //     return {value: value, label: control.optionsDict[value]};
    // });

    // TODO: check about multiselect
    // return {value: value, label: control.optionsDict[value]};
    // }

    setEventHandlers() {
        super.setEventHandlers();

        // TODO: check about multiselect
        $(this.inputs.select).on("change", (e) => {
            if (this.multiselect) {
                // Comment by Roman: AirBNB JS guide suggest using a spread operator:
                // [...this.inputs.select.selectedOptions]
                // instead of
                // Array.from(this.inputs.select.selectedOptions)
                // but Typescript compiler thinks it's incorrect and underlines that code
                // with a red line - so I'm using Array.from()
                const selectedOptions = Array.from(this.inputs.select.selectedOptions);
                const selectedValues = selectedOptions.map((option) => {
                    return { label: option.label, value: option.value };
                });
                this.setValue(selectedValues, false);
                this.triggerChanged();
            } else {
                this.setValue(this.inputs.select.value, false);
                this.triggerChanged();
            }
        });
    }

    addSelect2() {
        if ($().mselect2) {
            const select2Options: { placeholder?: string; allowClear?: boolean } = {};
            if (this.formBuilder.filtersMode && this.type == "select") {
                select2Options.placeholder = this.placeholder;
                if (!this.multiselect) {
                    select2Options.allowClear = true;
                }
            }
            $(this.domElements.main)
                .find("select")
                .css({ width: "100%", display: "block" })
                .mselect2(select2Options)
                .on("select2:focus", function () {
                    $(this).mselect2("open");
                });
            $(this.domElements.main)
                .find(".select2-selection--multiple .select2-search__field")
                .css("width", "100%");
        }
    }

    setOptions(options?: any[]): any[] {
        if (options) {
            this.options = [];
            this.optionsDict = {};
            options.forEach((value, key) => {
                this.options.push(value);
                if (this.optionsGrouped) {
                    value.options.forEach((value2, key2) => {
                        this.optionsDict[value2.value] = value2;
                    });
                } else {
                    this.optionsDict[key] = value;
                }
            });
            return this.options;
        } else {
            return this.setOptions([
                { label: "Option one", name: "option_one", value: 1 },
                { label: "Option two", name: "option_two", value: 2 },
            ]);
        }
    }

    setInputValue(value: string): void {
        this.inputs.select.value = value;
        // TODO Vyacheslav - проверить выставление значений после фикса фильтрации объектов по клику на регионе карты
        $(this.inputs.select).trigger("change.select2");
    }
}
