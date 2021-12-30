import { FormElement } from "./FormElement";
const $ = jQuery;
export class CheckboxFormElement extends FormElement {
    constructor(options, formBuilder, external) {
        super(options, formBuilder, external);
        this.db_type = "tinyint(1)";
        this.checkboxLabel = options.checkboxLabel;
        this.checkboxValue = options.checkboxValue;
    }
    setDomElements() {
        super.setDomElements();
        this.inputs.checkbox = $(this.domElements.main).find("input")[0];
    }
    setEventHandlers() {
        super.setEventHandlers();
        $(this.inputs.checkbox).on("change", (e) => {
            this.setValue(e.target.checked, false);
            this.triggerChanged();
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
        return schema;
    }
    setInputValue(value) {
        this.inputs.checkbox.checked = value === true;
    }
}
//# sourceMappingURL=CheckboxFormElement.js.map