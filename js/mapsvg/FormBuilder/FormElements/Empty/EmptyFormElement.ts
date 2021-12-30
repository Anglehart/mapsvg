import { FormElement } from "../FormElement";
import { FormBuilder } from "../../FormBuilder";
import { SchemaField } from "../../../Infrastructure/Server/SchemaField";

const $ = jQuery;

export class EmptyFormElement extends FormElement {
    constructor(options: SchemaField, formBuilder: FormBuilder, external: { [key: string]: any }) {
        super(options, formBuilder, external);
        this.readonly = true;
    }
}
