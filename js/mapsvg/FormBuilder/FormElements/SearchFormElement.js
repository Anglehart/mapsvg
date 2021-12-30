import { FormElement } from "./FormElement";
import { MapSVG } from "../../Core/globals.js";
const $ = jQuery;
export class SearchFormElement extends FormElement {
    constructor(options, formBuilder, external) {
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
    getSchema() {
        const schema = super.getSchema();
        schema.searchFallback = MapSVG.parseBoolean(this.searchFallback);
        schema.placeholder = this.placeholder;
        schema.noResultsText = this.noResultsText;
        schema.width = this.width;
        return schema;
    }
}
//# sourceMappingURL=SearchFormElement.js.map