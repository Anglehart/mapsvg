import { FormElement } from "../FormElement.js";
import { MapSVG } from "../../../Core/globals.js";
const $ = jQuery;
export class RegionsFormElement extends FormElement {
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
        this.inputs.select = $(this.domElements.main).find("select")[0];
    }
    getData() {
        return { name: "regions", value: this.value };
    }
    getSchema() {
        const schema = super.getSchema();
        if (schema.multiselect)
            schema.db_type = "text";
        const opts = $.extend(true, {}, { options: this.options });
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
        $(this.inputs.select).on("change", (e) => {
            const selectedOptions = Array.from(this.inputs.select.selectedOptions);
            const selectedValues = selectedOptions.map((option) => option.value);
            this.setValue(selectedValues, false);
            this.triggerChanged();
        });
    }
    destroy() {
        if ($().mselect2) {
            const sel = $(this.domElements.main).find(".mapsvg-select2");
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
//# sourceMappingURL=RegionsFormElement.js.map