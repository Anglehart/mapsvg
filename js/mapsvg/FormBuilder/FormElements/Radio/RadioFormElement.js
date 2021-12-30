import { FormElement } from "../FormElement";
const $ = jQuery;
export class RadioFormElement extends FormElement {
    constructor(options, formBuilder, external) {
        super(options, formBuilder, external);
        this.setOptions(options.options);
    }
    setDomElements() {
        super.setDomElements();
        this.inputs.radios = this.formBuilder.getForm().elements[this.name];
        this.$radios = $(this.domElements.main).find('input[type="radio"]');
    }
    setEventHandlers() {
        super.setEventHandlers();
        this.$radios.on("change", (e) => {
            this.setValue(e.target.value, false);
            this.triggerChanged();
        });
    }
    setInputValue(value) {
        if (value === null) {
            this.$radios.prop("checked", false);
        }
        else {
            this.inputs.radios.value = value;
        }
    }
}
//# sourceMappingURL=RadioFormElement.js.map