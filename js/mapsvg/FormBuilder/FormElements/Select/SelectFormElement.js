import { FormElement } from "../FormElement.js";
import { MapSVG } from "../../../Core/globals.js";
const $ = jQuery;
export class SelectFormElement extends FormElement {
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
        this.inputs.select = $(this.domElements.main).find("select")[0];
    }
    getSchema() {
        const schema = super.getSchema();
        schema.multiselect = MapSVG.parseBoolean(this.multiselect);
        if (schema.multiselect)
            schema.db_type = "text";
        schema.optionsGrouped = this.optionsGrouped;
        const opts = $.extend(true, {}, { options: this.options });
        schema.options = opts.options || [];
        schema.optionsDict = {};
        schema.options.forEach(function (option) {
            schema.optionsDict[option.value] = option.label;
        });
        return schema;
    }
    setEventHandlers() {
        super.setEventHandlers();
        $(this.inputs.select).on("change", (e) => {
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
        if ($().mselect2) {
            const select2Options = {};
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
                $(this.inputs.select).val(this.value.map((el) => el.value));
            }
            else {
                $(this.inputs.select).val([]);
            }
        }
        else {
            this.inputs.select.value = this.value;
        }
        $(this.inputs.select).trigger("change.select2");
    }
}
//# sourceMappingURL=SelectFormElement.js.map