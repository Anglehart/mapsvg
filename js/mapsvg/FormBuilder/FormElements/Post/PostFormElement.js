import { FormElement } from "../FormElement";
import { MapSVG } from "../../../Core/globals.js";
import { Server } from "../../../Infrastructure/Server/Server";
const $ = jQuery;
export class PostFormElement extends FormElement {
    constructor(options, formBuilder, external) {
        super(options, formBuilder, external);
        if (this.formBuilder.admin)
            this.post_types = this.formBuilder.admin.getPostTypes();
        this.post_type = options.post_type || this.post_types[0];
        this.add_fields = MapSVG.parseBoolean(options.add_fields);
        this.db_type = "int(11)";
        this.name = "post";
        this.post = options.post;
    }
    setDomElements() {
        super.setDomElements();
        this.inputs.postSelect = ($(this.domElements.main).find(".mapsvg-find-post")[0]);
    }
    getSchema() {
        const schema = super.getSchema();
        schema.post_type = this.post_type;
        schema.add_fields = this.add_fields;
        return schema;
    }
    destroy() {
        if ($().mselect2) {
            const sel = $(this.domElements.main).find(".mapsvg-select2");
            if (sel.length) {
                sel.mselect2("destroy");
            }
        }
    }
    getDataForTemplate() {
        const data = super.getDataForTemplate();
        if (this.formBuilder.admin)
            data.post_types = this.formBuilder.admin.getPostTypes();
        data.post_type = this.post_type;
        data.post = this.post;
        data.add_fields = this.add_fields || 0;
        return data;
    }
    setEventHandlers() {
        super.setEventHandlers();
        const server = new Server();
        $(this.inputs.postSelect)
            .mselect2({
            placeholder: "Search post by title",
            allowClear: true,
            disabled: this.readonly,
            ajax: {
                url: server.getUrl("posts"),
                dataType: "json",
                delay: 250,
                data: (params) => {
                    return {
                        filters: { post_type: this.post_type },
                        search: params.term,
                        page: params.page,
                    };
                },
                processResults: (data, params) => {
                    params.page = params.page || 1;
                    return {
                        results: data.posts ? data.posts : [],
                        pagination: {
                            more: false,
                        },
                    };
                },
                cache: true,
            },
            escapeMarkup: (markup) => {
                return markup;
            },
            minimumInputLength: 1,
            templateResult: this.formatRepo,
            templateSelection: this.formatRepoSelection,
        })
            .on("select2:select", (e) => {
            const post = e.params.data;
            this.setValue(post);
            this.setInputValue(post);
            this.triggerChanged();
        })
            .on("change", (e) => {
            if (e.target.value === "") {
                $(this.domElements.main).find(".mapsvg-post-id").text("");
                $(this.domElements.main).find(".mapsvg-post-url").text("");
                this.setValue(null, false);
                this.triggerChanged();
            }
        });
    }
    formatRepo(repo) {
        if (repo.loading) {
            return repo.text;
        }
        else {
            return "<div class='select2-result-repository clearfix'>" + repo.post_title + "</div>";
        }
    }
    formatRepoSelection(repo) {
        return repo.post_title || repo.text;
    }
    setValue(post, updateInput = true) {
        this.value = post;
        if (updateInput) {
            this.setInputValue(post);
        }
    }
    setInputValue(post) {
        $(this.domElements.main).find(".mapsvg-post-id").text(post.id);
        $(this.domElements.main).find(".mapsvg-post-url").text(post.url).attr("href", post.url);
    }
}
//# sourceMappingURL=PostFormElement.js.map