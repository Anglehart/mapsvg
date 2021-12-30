import Handlebars from "Handlebars";
import { Events } from "../../Core/Events";
const $ = jQuery;
export class FormElement {
    constructor(options, formBuilder, external) {
        this.readonly = typeof options.readonly !== "undefined" ? options.readonly : false;
        this.protected = typeof options.protected !== "undefined" ? options.protected : false;
        this.auto_increment =
            typeof options.auto_increment !== "undefined" ? options.auto_increment : false;
        this.not_null = typeof options.not_null !== "undefined" ? options.not_null : false;
        this.searchable = typeof options.searchable !== "undefined" ? options.searchable : false;
        this.visible = typeof options.visible !== "undefined" ? options.visible : true;
        this.formBuilder = formBuilder;
        this.events = new Events(this);
        this.type = options.type;
        this.value = options.value;
        this.db_type = options.db_type || "varchar(255)";
        this.label = this.label || (options.label === undefined ? "Label" : options.label);
        this.name = this.name || options.name || "label";
        this.help = options.help || "";
        this.placeholder = options.placeholder;
        this.setExternal(external);
        let t = this.type;
        if (t === "marker" && this.mapIsGeo) {
            t = "marker-geo";
        }
        if (t === "location" && this.mapIsGeo) {
            t = "location-geo";
        }
        if (this.filtersMode) {
            this.parameterName = options.parameterName || "";
            this.parameterNameShort = this.parameterName.split(".")[1];
            this.name = this.parameterNameShort;
            this.placeholder = options.placeholder || "";
            this.templates = {
                main: Handlebars.compile($("#mapsvg-filters-tmpl-" + t + "-view").html()),
            };
        }
        else {
            this.templates = {
                main: Handlebars.compile($("#mapsvg-data-tmpl-" + t + "-view").html()),
            };
        }
        this.inputs = {};
    }
    init() {
        this.setDomElements();
        this.setEventHandlers();
    }
    setDomElements() {
        this.domElements = {
            main: $(this.templates.main(this.getDataForTemplate()))[0],
        };
        $(this.domElements.main).data("formElement", this);
        this.addSelect2();
    }
    setEventHandlers() {
        const _this = this;
        if (this.formBuilder.editMode) {
            $(this.domElements.main).on("click", function () {
                _this.events.trigger("click", _this, [_this]);
            });
        }
    }
    addSelect2() {
        if ($().mselect2) {
            $(this.domElements.main)
                .find("select")
                .css({ width: "100%", display: "block" })
                .mselect2()
                .on("select2:focus", function () {
                $(this).mselect2("open");
            });
            $(this.domElements.main)
                .find(".select2-selection--multiple .select2-search__field")
                .css("width", "100%");
        }
    }
    setEditorEventHandlers() {
        const _this = this;
        $(this.domElements.edit).on("click", "button.mapsvg-remove", function () {
            $(_this.domElements.main).empty().remove();
            $(_this.domElements.edit).empty().remove();
            _this.events.trigger("delete", _this, [_this]);
        });
        $(this.domElements.edit).on("click", ".mapsvg-filter-insert-options", function () {
            const objType = _this.parameterName.split(".")[0];
            const fieldName = _this.parameterName.split(".")[1];
            let field;
            if (objType == "Object") {
                field = _this.formBuilder.mapsvg.objectsRepository.getSchema().getField(fieldName);
            }
            else {
                if (fieldName == "id") {
                    const options = [];
                    _this.formBuilder.mapsvg.regions.forEach(function (r) {
                        options.push({ label: r.id, value: r.id });
                    });
                    field = {
                        options: options,
                    };
                }
                else if (fieldName === "title") {
                    const options = [];
                    _this.formBuilder.mapsvg.regions.forEach(function (r) {
                        options.push({ label: r.title, value: r.title });
                    });
                    field = { options: options };
                }
                else {
                    field = _this.formBuilder.mapsvg.regionsRepository
                        .getSchema()
                        .getField(fieldName);
                }
            }
            if ((field && field.options) || fieldName === "regions") {
                let options;
                if (fieldName == "regions") {
                    const _options = _this.formBuilder.mapsvg.regions.map((r) => {
                        return { id: r.id, title: r.title };
                    });
                    _options.sort(function (a, b) {
                        if (a.title < b.title)
                            return -1;
                        if (a.title > b.title)
                            return 1;
                        return 0;
                    });
                    options = _options.map(function (o) {
                        return (o.title || o.id) + ":" + o.id;
                    });
                }
                else {
                    options = field.options.map(function (o) {
                        return o.label + ":" + o.value;
                    });
                }
                $(this)
                    .closest(".form-group")
                    .find("textarea")
                    .val(options.join("\n"))
                    .trigger("change");
            }
        });
        $(this.domElements.edit).on("keyup change paste", "input, textarea, select", function () {
            const prop = $(this).attr("name");
            const array = $(this).data("array");
            if (_this.type === "status" && array) {
                const param = $(this).data("param");
                const index = $(this).closest("tr").index();
                _this.options[index] = _this.options[index] || {
                    label: "",
                    value: "",
                    color: "",
                    disabled: false,
                };
                _this.options[index][param] = $(this).is(":checkbox")
                    ? $(this).prop("checked")
                    : $(this).val();
                _this.redraw();
            }
            else if (_this.type === "distance" && array) {
                const param = $(this).data("param");
                const index = $(this).closest("tr").index();
                if (!_this.options[index]) {
                    _this.options[index] = { value: "", default: false };
                }
                if (param === "default") {
                    _this.options.forEach(function (option) {
                        option.default = false;
                    });
                    _this.options[index].default = $(this).prop("checked");
                }
                else {
                    _this.options[index].value = $(this).val();
                }
                _this.redraw();
            }
            else if (prop == "label" || prop == "name") {
                return false;
            }
            else {
                let value;
                value =
                    $(this).attr("type") == "checkbox" ? $(this).prop("checked") : $(this).val();
                if ($(this).attr("type") == "radio") {
                    const name = $(this).attr("name");
                    value = $('input[name="' + name + '"]:checked').val();
                }
                _this.update(prop, value);
            }
        });
        $(this.domElements.edit).on("keyup change paste", 'input[name="label"]', function () {
            if (!_this.nameChanged) {
                _this.label = $(this).val() + "";
                if (_this.type != "region" && _this.type != "location" && _this.type != "title") {
                    let str = $(this).val() + "";
                    str = str.toLowerCase().replace(/ /g, "_").replace(/\W/g, "");
                    if (str.length < 64) {
                        $(_this.domElements.edit).find('input[name="name"]').val(str);
                    }
                    _this.name = str + "";
                }
                $(_this.domElements.main).find("label").first().html(_this.label);
                if (!_this.filtersMode) {
                    $(_this.domElements.main)
                        .find("label")
                        .first()
                        .append('<div class="field-name">' + _this.name + "</div>");
                }
            }
        });
        $(this.domElements.edit).on("keyup change paste", 'input[name="name"]', function (e) {
            if (e.target.value) {
                if (e.target.value.match(/[^a-zA-Z0-9_]/g)) {
                    e.target.value = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
                    $(e.target).trigger("change");
                }
                if (e.target.value[0].match(/[^a-zA-Z_]/g)) {
                    e.target.value =
                        e.target.value[0].replace(/[^a-zA-Z_]/g, "") + e.target.value.slice(1);
                    $(e.target).trigger("change");
                }
            }
            if (_this.type != "region")
                _this.name = e.target.value;
            $(_this.domElements.main)
                .find("label")
                .html(_this.label + '<div class="field-name">' + _this.name + "</div>");
            _this.nameChanged = true;
        });
        $(this.domElements.edit).on("keyup change paste", 'textarea[name="help"]', function (e) {
            $(_this.domElements.main).find(".form-text").text(e.target.value);
        });
    }
    getEditor() {
        if (!this.filtersMode) {
            this.templates.edit =
                this.templates.edit ||
                    Handlebars.compile($("#mapsvg-data-tmpl-" + this.type + "-control").html());
        }
        else {
            this.templates.edit =
                this.templates.edit ||
                    Handlebars.compile($("#mapsvg-filters-tmpl-" + this.type + "-control").html());
        }
        this.domElements.edit = $("<div>" + this.templates.edit(this.getDataForTemplate()) + "</div>")[0];
        return this.domElements.edit;
    }
    destroyEditor() {
        $(this.domElements.edit).empty().remove();
    }
    initEditor() {
        $(this.domElements.edit).find("input").first().select();
        if ($().colorpicker) {
            $(this.domElements.edit)
                .find(".cpicker")
                .colorpicker()
                .on("changeColor.colorpicker", function (event) {
                const input = $(this).find("input");
                if (input.val() == "")
                    $(this).find("i").css({ "background-color": "" });
            });
        }
        if ($().mselect2) {
            if (this.type !== "distance") {
                $(this.domElements.edit)
                    .find("select")
                    .css({ width: "100%", display: "block" })
                    .mselect2();
            }
        }
        this.setEditorEventHandlers();
    }
    getSchema() {
        let data;
        data = {
            type: this.type,
            db_type: this.db_type,
            label: this.label,
            name: this.name,
            value: this.value,
            searchable: this.searchable,
            help: this.help,
            visible: this.visible === undefined ? true : this.visible,
            readonly: this.readonly,
            placeholder: this.placeholder,
            protected: this.protected,
            auto_increment: this.auto_increment,
            not_null: this.not_null,
        };
        if (this.options) {
            data.options = this.getSchemaFieldOptionsList();
        }
        if (this.filtersMode) {
            data.parameterName = this.parameterName;
            data.parameterNameShort = this.parameterName.split(".")[1];
        }
        return data;
    }
    getSchemaFieldOptionsList() {
        const _this = this;
        const options = [];
        this.options.forEach((option, index) => {
            if (this.options[index].value !== "") {
                options.push(this.options[index]);
            }
        });
        return options;
    }
    getDataForTemplate() {
        const data = this.getSchema();
        data._name = data.name;
        if (this.namespace) {
            data.name = this.name.split("[")[0];
            let suffix = this.name.split("[")[1] || "";
            if (suffix)
                suffix = "[" + suffix;
            data.name = this.namespace + "[" + data.name + "]" + suffix;
        }
        data.external = this.external;
        return data;
    }
    update(prop, value) {
        const _this = this;
        if (prop == "options") {
            const options = [];
            value = value.split("\n").forEach(function (row) {
                row = row.trim().split(":");
                if (_this.type == "checkbox" && row.length == 3) {
                    options.push({
                        label: row[0],
                        name: row[1],
                        value: row[2],
                    });
                }
                else if ((_this.type == "radio" ||
                    _this.type == "select" ||
                    _this.type == "checkboxes") &&
                    row.length == 2) {
                    options.push({
                        label: row[0],
                        value: row[1],
                    });
                }
            });
            this.options = options;
        }
        else {
            this[prop] = value;
        }
        if (prop == "parameterName") {
            $(this.domElements.edit).find(".mapsvg-filter-param-name").text(value);
        }
    }
    redraw() {
        const _this = this;
        const newView = $(this.templates.main(this.getDataForTemplate()));
        $(this.domElements.main).html(newView.html());
        if ($().mselect2) {
            if (this.type !== "distance") {
                $(this.domElements.main)
                    .find("select")
                    .css({ width: "100%", display: "block" })
                    .mselect2()
                    .on("select2:focus", function () {
                    $(this).mselect2("open");
                });
            }
            else {
                $(this.domElements.main)
                    .find("select")
                    .mselect2()
                    .on("select2:focus", function () {
                    $(this).mselect2("open");
                });
            }
        }
    }
    redrawEditor() {
        if (this.domElements.edit) {
            $(this.domElements.edit).empty();
            $(this.domElements.edit).html("<div>" + this.templates.edit(this.getDataForTemplate()) + "</div>");
            this.initEditor();
        }
    }
    setOptions(options) {
        if (options) {
            this.options = [];
            this.optionsDict = {};
            options.forEach((value, key) => {
                this.options.push(value);
                this.optionsDict[key] = value;
            });
            return this.options;
        }
        else {
            return this.setOptions([
                { label: "Option one", name: "option_one", value: 1 },
                { label: "Option two", name: "option_two", value: 2 },
            ]);
        }
    }
    getData() {
        return { name: this.name, value: this.getValue() };
    }
    destroy() {
        if ($().mselect2) {
            const sel = $(this.domElements.main).find(".mapsvg-select2");
            if (sel.length) {
                sel.mselect2("destroy");
            }
        }
    }
    show() {
        $(this.domElements.main).show();
    }
    hide() {
        $(this.domElements.main).hide();
    }
    setExternal(params) {
        this.external = params;
        if (typeof this.external.mapIsGeo !== "undefined") {
            this.mapIsGeo = this.external.mapIsGeo;
        }
        if (typeof this.external.editMode !== "undefined") {
            this.editMode = this.external.editMode;
        }
        if (typeof this.external.filtersMode !== "undefined") {
            this.filtersMode = this.external.filtersMode;
        }
        if (typeof this.external.namespace !== "undefined") {
            this.namespace = this.external.namespace;
        }
    }
    getValue() {
        return this.value;
    }
    setValue(value, updateInput = true) {
        this.value = value;
        if (updateInput) {
            this.setInputValue(value);
        }
    }
    setInputValue(value) {
        return;
    }
    triggerChanged() {
        this.events.trigger("changed", this, [this]);
    }
}
//# sourceMappingURL=FormElement.js.map