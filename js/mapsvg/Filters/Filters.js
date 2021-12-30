import { DetailsController } from "../Details/Details.js";
import { FormBuilder } from "../FormBuilder/FormBuilder.js";
const $ = jQuery;
export class FiltersController extends DetailsController {
    constructor(options) {
        super(options);
        this.showButtonText = options.showButtonText;
        this.clearButton = options.clearButton;
        this.clearButtonText = options.clearButtonText;
        this.searchButton = options.searchButton;
        this.searchButtonText = options.searchButtonText;
        this.padding = options.padding;
        this.schema = options.schema;
        this.hideFilters = options.hide;
        this.query = options.query;
    }
    viewDidLoad() {
        super.viewDidLoad();
        const _this = this;
        this.formBuilder = new FormBuilder({
            container: this.containers.contentView,
            filtersMode: true,
            schema: this.schema,
            modal: this.modal,
            filtersHide: this.hideFilters,
            showButtonText: this.showButtonText,
            clearButton: this.clearButton,
            clearButtonText: this.clearButtonText,
            searchButton: this.searchButton,
            searchButtonText: this.searchButtonText,
            editMode: false,
            mapsvg: this.mapsvg,
            data: {},
            admin: false,
            events: {
                "changed.field": (formElement, field, value) => {
                    const filters = {};
                    let _value = value;
                    if (field === "regions") {
                        _value = {};
                        _value.region_ids = value instanceof Array ? value : [value];
                        _value.table_name = this.mapsvg.options.database.regionsTableName;
                        if (_value.region_ids.length === 0 || _value.region_ids[0] === "") {
                            _value = null;
                        }
                    }
                    filters[field] = _value;
                    this.query.setFilters(filters);
                    _this.events.trigger("changed.field", _this, [field, value]);
                    _this.events.trigger("changed.fields", _this, [field, value]);
                },
                "changed.search": (formElement, value) => {
                    this.query.setSearch(value);
                    _this.events.trigger("changed.search", _this, [value]);
                },
                cleared: (formBuilder) => {
                    this.query.clearFilters();
                    this.events.trigger("cleared", _this, []);
                },
                loaded: (formBuilder) => {
                    $(formBuilder.container).find(".mapsvg-form-builder").css({
                        padding: _this.padding,
                    });
                    this.updateScroll();
                    this.events.trigger("loaded");
                },
            },
        });
    }
    reset() {
        this.formBuilder && this.formBuilder.reset();
    }
    update(query) {
        const _query = Object.assign({}, query.filters);
        _query.search = query.search;
        this.formBuilder && this.formBuilder.update(_query);
    }
    setFiltersCounter() {
        if (this.hideFilters) {
            const filtersCounter = Object.keys(this.query.filters).length;
            const filtersCounterString = filtersCounter === 0 ? "" : filtersCounter.toString();
            this.formBuilder &&
                this.formBuilder.showFiltersButton &&
                $(this.formBuilder.showFiltersButton.domElements.main)
                    .find("button")
                    .html(this.showButtonText + " <b>" + filtersCounterString + "</b>");
        }
    }
    setEventHandlers() {
        super.setEventHandlers();
        const _this = this;
        $(this.containers.view).on("click", ".mapsvg-btn-show-filters", function () {
            _this.events.trigger("click.btn.showFilters");
        });
        $(this.containers.view).on("click", "#mapsvg-search-container", function () {
            _this.events.trigger("click.btn.searchButton");
        });
    }
}
//# sourceMappingURL=Filters.js.map