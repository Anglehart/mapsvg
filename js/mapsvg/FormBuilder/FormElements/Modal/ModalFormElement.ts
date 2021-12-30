import { FormElement } from "../FormElement";
import { FormBuilder } from "../../FormBuilder";
import { SchemaField } from "../../../Infrastructure/Server/SchemaField";

const $ = jQuery;

export class ModalFormElement extends FormElement {
    showButtonText: boolean;

    constructor(options: SchemaField, formBuilder: FormBuilder, external: { [key: string]: any }) {
        super(options, formBuilder, external);

        this.showButtonText = options.showButtonText;
    }

    getSchema(): { [p: string]: any } {
        const schema = super.getSchema();
        schema.showButtonText = this.showButtonText;
        return schema;
    }
}
