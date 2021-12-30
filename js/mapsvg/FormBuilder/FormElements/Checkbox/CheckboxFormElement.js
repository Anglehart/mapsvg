import { FormElement } from "../FormElement";
const $ = jQuery;
export class CheckboxFormElement extends FormElement {
    constructor(options, formBuilder, external) {
        super(options, formBuilder, external);
        if (typeof options.showAsSwitch === "undefined") {
            this.showAsSwitch = true;
        }
        else {
            this.showAsSwitch = options.showAsSwitch;
        }
        this.db_type = "tinyint(1)";
        this.checkboxLabel = options.checkboxLabel;
        this.checkboxValue = options.checkboxValue;
    }
    setDomElements() {
        super.setDomElements();
        this.inputs.checkbox = $(this.domElements.main).find("input")[0];
        this.inputs.switch = $(this.domElements.main).find("input")[0];
    }
    setEventHandlers() {
        super.setEventHandlers();
        $(this.inputs.checkbox).on("change", (e) => {
            this.setValue(e.target.checked, false);
            this.triggerChanged();
        });
    }
    setEditorEventHandlers() {
        super.setEditorEventHandlers();
        $(this.domElements.edit).on("change", "[name='showAsSwitch']", (e) => {
            if (this.showAsSwitch) {
                $(this.domElements.main)
                    .find("[name='checkboxToSwitch']")
                    .addClass("form-switch form-switch-md");
            }
            if (!this.showAsSwitch) {
                $(this.domElements.main)
                    .find("[name='checkboxToSwitch']")
                    .removeClass("form-switch form-switch-md");
            }
        });
        $(this.domElements.edit).on("keyup change paste", '[name="checkboxLabel"]', (e) => {
            $(this.domElements.main).find(".form-check-label").text(e.target.value);
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
        schema.showAsSwitch = this.showAsSwitch;
        return schema;
    }
    setInputValue(value) {
        this.inputs.checkbox.checked = value === true;
    }
}
//# sourceMappingURL=CheckboxFormElement.js.map