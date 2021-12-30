import { FormElement } from "../FormElement";
import { FormBuilder } from "../../FormBuilder";
import { MapSVG } from "../../../Core/globals.js";
import * as CodeMirror from "CodeMirror";
import { SchemaField } from "../../../Infrastructure/Server/SchemaField";

const $ = jQuery;

export class TextareaFormElement extends FormElement {
    searchType: string;
    html: boolean;
    htmlEditor: any;
    autobr: boolean;
    editor: CodeMirror.Editor;
    inputs: { textarea: HTMLTextAreaElement };

    constructor(options: SchemaField, formBuilder: FormBuilder, external: { [key: string]: any }) {
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
                //@ts-ignore
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
            this.setValue(e.target.value, false);
            this.triggerChanged();
        });
    }

    getSchema(): { [p: string]: any } {
        const schema = super.getSchema();
        schema.autobr = this.autobr;
        schema.html = this.html;
        return schema;
    }

    getDataForTemplate(): { [p: string]: any } {
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
