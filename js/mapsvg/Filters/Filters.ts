/**
 * FiltersController class adds filters for the database.
 * @param options
 * @constructor
 */
import { DetailsController } from "../Details/Details.js";
import { FormBuilder } from "../FormBuilder/FormBuilder.js";
import { Schema } from "../Infrastructure/Server/Schema.js";
import { Query } from "../Infrastructure/Server/Query.js";
// import {RepositoryInterface} from "../Core/Repository.js";
const $ = jQuery;

export class FiltersController extends DetailsController {
    schema: Schema;
    hideFilters: boolean;
    query: Query;
    source: string;
    location: string;
    width: string;
    filteredRegionsStatus: number;
    modalLocation: string;
    hideOnMobile: boolean;
    hide: boolean;
    padding: string;
    showButtonText: boolean;
    clearButton: boolean;
    clearButtonText: string;
    searchButton: boolean;
    searchButtonText: string;

    // repository: RepositoryInterface;
    formBuilder: FormBuilder;

    constructor(options: { [key: string]: any }) {
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

    viewDidLoad(): void {
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
            data: {}, //this.query,
            admin: false,
            events: {
                "changed.field": (formElement, field, value) => {
                    const filters: any = {};
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

    reset(): void {
        this.formBuilder && this.formBuilder.reset();
    }

    update(query: Query): void {
        const _query = Object.assign({}, query.filters);
        _query.search = query.search;
        this.formBuilder && this.formBuilder.update(_query);
    }

    /**
     * Sets filters counter on the "Show filters" button when compact mode is enabled and filters are hidden
     */
    setFiltersCounter(): void {
        if (this.hideFilters) {
            // Don't include "search" filter into counter since it's always outside of the modal
            const filtersCounter = Object.keys(this.query.filters).length;

            const filtersCounterString = filtersCounter === 0 ? "" : filtersCounter.toString();
            this.formBuilder &&
                this.formBuilder.showFiltersButton &&
                $(this.formBuilder.showFiltersButton.domElements.main)
                    .find("button")
                    .html(this.showButtonText + " <b>" + filtersCounterString + "</b>");
        }
    }

    setEventHandlers(): void {
        super.setEventHandlers();

        const _this = this;

        $(this.containers.view).on("click", ".mapsvg-btn-show-filters", function () {
            _this.events.trigger("click.btn.showFilters");
        });
        $(this.containers.view).on("click", "#mapsvg-search-container", function () {
            _this.events.trigger("click.btn.searchButton");
        });

        // var filterDatabase = _this.repository;

        // Handle search separately with throttle 400ms
        // $(this.containers.view).on('paste keyup','input[data-parameter-name="search"]',function(){
        //     _this.throttle(_this.textSearch, 600, _this, $(this));
        // });

        // TODO may need the code below
        /*
        $(this.containers.view).on('change paste keyup','select,input[type="radio"],input',function(){

            if($(this).data('ignoreSelect2Change')){
                $(this).data('ignoreSelect2Change', false);
                return;
            }

            var filter = {};
            var field = $(this).data('parameter-name');

            if($(this).attr('data-parameter-name')=="search"){
                return;
            }

            if($(this).attr('name') === 'distance' || field == "search"){
                return;
            }
            if($(this).attr('name') === 'distanceLatLng' || $(this).attr('name') === 'distanceLength'){
                // var distanceData = {
                //     units: formBuilder.view.find('[name="distanceUnits"]').val(),
                //     latlng: formBuilder.view.find('[name="distanceLatLng"]').val(),
                //     length: formBuilder.view.find('[name="distanceLength"]').val(),
                //     address: formBuilder.view.find('[name="distance"]').val()
                // };
                // var field = formBuilder.mapsvg.filtersSchema.schema.find(function(field){
                //     return field.type === 'distance';
                // });
                // if(field.country){
                //     distanceData.country = field.country;
                // }
                // if(distanceData.units && distanceData.length && distanceData.latlng){
                //     filter.distance = distanceData;
                //     var latlng = distanceData.latlng.split(',');
                //     latlng = {lat: parseFloat(latlng[0]), lng: parseFloat(latlng[1])};
                //     MapSVG.distanceSearch = {
                //         latlng: latlng,
                //         units: field.distanceUnits,
                //         unitsLabel: field.distanceUnitsLabel
                //     };
                // } else {
                //     filter.distance = null;
                //     MapSVG.distanceSearch = null;
                // }
            } else if ($(this).closest('.mapsvg-checkbox-group').length > 0){

                filter[field] = []
                $(this).closest('.mapsvg-checkbox-group').find('input[type="checkbox"]:checked').each(function(i,el){
                    filter[field].push($(el).val());
                });


            } else {
                filter[field] = $(this).val();
            }

            filterDatabase.query.setFilters(filter);

            // _this.formBuilder.view.find('select,input[type="radio"]').each(function(index){
            //     var field = $(this).data('parameter-name');
            //     var val = $(this).val();
            //     filters[field] = val;
            // });

            // var data = {
            //     filters: filter
            // };
            // if(_this.options.menu.searchFallback){
            //     data.searchFallback = true;
            // }

            // filterDatabase.getAll(data);
        });
        */
    }
}
