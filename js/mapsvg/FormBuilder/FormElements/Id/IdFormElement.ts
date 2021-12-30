import { FormElement } from "../FormElement";
import { FormBuilder } from "../../FormBuilder";
import { SchemaField } from "../../../Infrastructure/Server/SchemaField";

export class IdFormElement extends FormElement {
    constructor(options: SchemaField, formBuilder: FormBuilder, external: { [key: string]: any }) {
        super(options, formBuilder, external);
    }

    getData(): any {
        return { name: "id", value: this.value };
    }
}
