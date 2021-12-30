import { FormElement } from "./FormElement";
import { MapSVG } from "../../Core/globals.js";
import * as CodeMirror from "CodeMirror";
const $ = jQuery;
export class TextareaFormElement extends FormElement {
    constructor(options, formBuilder, external) {
        super(options, formBuilder, external);
        this.searchType = options.searchType || "fulltext";
        this.searchable = MapSVG.parseBoolean(options.searchable);
        this.autobr = options.autobr;
        this.html = options.html;
        this.db_type = "text";
    }
    setDomElements() {
        super.setDomElements();
        this.inputs.textarea = $(this.domElements.main).find("textarea")[0];
        if (this.html) {
            this.editor = CodeMirror.fromTextArea(this.inputs.textarea, {
                mode: { name: "handlebars", base: "text/html" },
                matchBrackets: true,
                lineNumbers: true,
            });
            if (this.formBuilder.admin) {
                this.editor.on("change", this.setTextareaValue);
            }
        }
    }
    setEventHandlers() {
        super.setEventHandlers();
        $(this.inputs.textarea).on("change keyup paste", (e) => {
            this.setValue(e.target.value);
            this.triggerChanged();
        });
    }
    getSchema() {
        const schema = super.getSchema();
        schema.autobr = this.autobr;
        schema.html = this.html;
        return schema;
    }
    getDataForTemplate() {
        const data = super.getDataForTemplate();
        data.html = this.html;
        return data;
    }
    setTextareaValue(codemirror, changeobj) {
        const handler = codemirror.getValue();
        const textarea = $(codemirror.getTextArea());
        textarea.val(handler).trigger("change");
    }
    destroy() {
        const cm = $(this.domElements.main).find(".CodeMirror");
        if (cm.length) {
            cm.empty().remove();
        }
    }
}
//# sourceMappingURL=TextareaFormElement.js.map