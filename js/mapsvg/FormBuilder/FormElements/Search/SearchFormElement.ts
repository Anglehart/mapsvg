import { FormElement } from "../FormElement";
import { FormBuilder } from "../../FormBuilder";
import { MapSVG } from "../../../Core/globals.js";
import { SchemaField } from "../../../Infrastructure/Server/SchemaField";

const $ = jQuery;

export class SearchFormElement extends FormElement {
    searchFallback: boolean;
    width: string;

    constructor(options: SchemaField, formBuilder: FormBuilder, external: { [key: string]: any }) {
        super(options, formBuilder, external);

        this.searchFallback = MapSVG.parseBoolean(options.searchFallback) || false;
        this.width = options.width || "100%";
        this.name = "search";
    }

    setDomElements() {
        super.setDomElements();
        this.inputs.text = $(this.domElements.main).find("input")[0];
    }

    setEventHandlers(): void {
        super.setEventHandlers();
        $(this.inputs.text).on("change keyup paste", (e) => {
            this.setValue(e.target.value, false);
            this.triggerChanged();
        });
    }

    setInputValue(value: string | null): void {
        this.inputs.text.value = value;
    }

    getSchema(): { [p: string]: any } {
        const schema = super.getSchema();
        schema.searchFallback = MapSVG.parseBoolean(this.searchFallback);
        schema.placeholder = this.placeholder;
        schema.width = this.width;
        return schema;
    }
}
