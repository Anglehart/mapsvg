import { FormElement } from "../FormElement";
import { FormBuilder } from "../../FormBuilder";
import { MapSVG } from "../../../Core/globals.js";
import { SchemaField } from "../../../Infrastructure/Server/SchemaField";

const $ = jQuery;

export class SearchFormElement extends FormElement {
    searchType: string;
    searchFallback: boolean;
    noResultsText: string;
    width: string;

    constructor(options: SchemaField, formBuilder: FormBuilder, external: { [key: string]: any }) {
        super(options, formBuilder, external);

        this.searchType = options.searchType || "fulltext";
    }

    setDomElements() {
        super.setDomElements();
        this.inputs.text = $(this.domElements.main).find("input")[0];
    }

    setEventHandlers() {
        super.setEventHandlers();
        $(this.inputs.text).on("change keyup paste", (e) => {
            this.setValue(e.target.value, false);
            this.triggerChanged();
        });
    }

    getSchema(): { [p: string]: any } {
        const schema = super.getSchema();
        schema.searchFallback = MapSVG.parseBoolean(this.searchFallback);
        schema.placeholder = this.placeholder;
        schema.noResultsText = this.noResultsText;
        schema.width = this.width;
        return schema;
    }
}
