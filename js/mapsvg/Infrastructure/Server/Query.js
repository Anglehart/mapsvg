export class Query {
    constructor(options) {
        this.filters = {};
        this.filterout = {};
        this.page = 1;
        if (options) {
            for (const i in options) {
                if (typeof options[i] !== "undefined") {
                    this[i] = options[i];
                }
            }
        }
    }
    setFields(fields) {
        const _this = this;
        for (const key in fields) {
            if (key == "filters") {
                _this.setFilters(fields[key]);
            }
            else {
                _this[key] = fields[key];
            }
        }
    }
    update(query) {
        for (const i in query) {
            if (typeof query[i] !== "undefined") {
                if (i === "filters") {
                    this.setFilters(query[i]);
                }
                else {
                    this[i] = query[i];
                }
            }
        }
    }
    get() {
        return {
            search: this.search,
            searchField: this.searchField,
            searchFallback: this.searchFallback,
            filters: this.filters,
            filterout: this.filterout,
            page: this.page,
            sort: this.sort,
            perpage: this.perpage,
            lastpage: this.lastpage,
        };
    }
    clearFilters() {
        this.resetFilters();
    }
    setFilters(fields) {
        const _this = this;
        for (const key in fields) {
            if (fields[key] === null || fields[key] === "" || fields[key] === undefined) {
                if (_this.filters[key]) {
                    delete _this.filters[key];
                }
            }
            else {
                _this.filters[key] = fields[key];
            }
        }
    }
    setSearch(search) {
        this.search = search;
    }
    setFilterOut(fields) {
        this.filterout = fields;
    }
    resetFilters(fields) {
        this.filters = {};
        this.setSearch("");
    }
    setFilterField(field, value) {
        this.filters[field] = value;
    }
    hasFilters() {
        return Object.keys(this.filters).length > 0;
    }
    removeFilter(fieldName) {
        this.filters[fieldName] = null;
        delete this.filters[fieldName];
    }
    requestSchema(requestSchema) {
        this.withSchema = requestSchema ? requestSchema : true;
    }
}
//# sourceMappingURL=Query.js.map