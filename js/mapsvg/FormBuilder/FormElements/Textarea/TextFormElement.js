import { FormElement } from "../FormElement.js";
import { MapSVG } from "../../../Core/globals.js";
const $ = jQuery;
export class TextFormElement extends FormElement {
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
        this.inputs.text = $(this.domElements.main).find('input[type="text"]')[0];
    }
    getSchema() {
        const schema = super.getSchema();
        schema.searchType = this.searchType;
        return schema;
    }
    setEventHandlers() {
        super.setEventHandlers();
        $(this.inputs.text).on("change keyup paste", (e) => {
            this.setValue(e.target.value);
            this.triggerChanged();
        });
    }
    setInputValue(value) {
        this.inputs.text.value = value;
    }
}
//# sourceMappingURL=TextFormElement.js.map