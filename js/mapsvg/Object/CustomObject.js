import { GeoPoint, Location, SVGPoint } from "../Location/Location.js";
import { LocationAddress } from "../Location/LocationAddress.js";
export class CustomObject {
    constructor(params, schema) {
        this.initialLoad = true;
        this.schema = schema;
        this.fields = schema.getFieldNames();
        this.dirtyFields = [];
        this.regions = [];
        this._regions = {};
        if (params.id !== undefined) {
            this.id = params.id;
        }
        this.initialLoad = true;
        this.build(params);
        this.initialLoad = false;
        if (this.id) {
            this.clearDirtyFields();
        }
    }
    build(params) {
        for (const fieldName in params) {
            const field = this.schema.getField(fieldName);
            if (field) {
                if (!this.initialLoad) {
                    this.dirtyFields.push(fieldName);
                }
                switch (field.type) {
                    case "region":
                        this.regions = params[fieldName];
                        break;
                    case "location":
                        if (params[fieldName] != null &&
                            params[fieldName] != "" &&
                            Object.keys(params[fieldName]).length !== 0) {
                            const data = {
                                img: params[fieldName].img,
                                address: new LocationAddress(params[fieldName].address),
                            };
                            if (params[fieldName].geoPoint &&
                                params[fieldName].geoPoint.lat &&
                                params[fieldName].geoPoint.lng) {
                                data.geoPoint = new GeoPoint(params[fieldName].geoPoint);
                            }
                            else if (params[fieldName].svgPoint &&
                                params[fieldName].svgPoint.x &&
                                params[fieldName].svgPoint.y) {
                                data.svgPoint = new SVGPoint(params[fieldName].svgPoint);
                            }
                            if (this.location != null) {
                                this.location.update(data);
                            }
                            else {
                                this.location = new Location(data);
                            }
                        }
                        else {
                            this.location = null;
                        }
                        break;
                    case "post":
                        if (params.post) {
                            this.post = params.post;
                        }
                        break;
                    case "select":
                        this[fieldName] = params[fieldName];
                        if (!field.multiselect) {
                            this[fieldName + "_text"] = this.getEnumLabel(field, params, fieldName);
                        }
                        break;
                    case "radio":
                        this[fieldName] = params[fieldName];
                        this[fieldName + "_text"] = this.getEnumLabel(field, params, fieldName);
                        break;
                    default:
                        this[fieldName] = params[fieldName];
                        break;
                }
            }
        }
    }
    clone() {
        const data = this.getData();
        data.id = null;
        return new CustomObject(data, this.schema);
    }
    getEnumLabel(field, params, fieldName) {
        const value = field.options.get(params[fieldName]);
        if (typeof value !== "undefined") {
            return value.label;
        }
        else {
            return "";
        }
    }
    update(params) {
        this.build(params);
    }
    getDirtyFields() {
        const data = {};
        this.dirtyFields.forEach((field) => {
            data[field] = this[field];
        });
        data.id = this.id;
        if (data.location != null) {
            data.location = data.location.getData();
        }
        if (this.schema.getFieldByType("region")) {
            data.regions = this.regions;
        }
        return data;
    }
    clearDirtyFields() {
        this.dirtyFields = [];
    }
    getData() {
        const data = {};
        const fields = this.schema.getFields();
        fields.forEach((field) => {
            switch (field.type) {
                case "region":
                    data[field.name] = this[field.name];
                    break;
                case "select":
                    data[field.name] = this[field.name];
                    if (!field.multiselect) {
                        data[field.name + "_text"] = this[field.name + "_text"];
                    }
                    break;
                case "post":
                    data[field.name] = this[field.name];
                    data["post"] = this.post;
                case "radio":
                    data[field.name] = this[field.name];
                    data[field.name + "_text"] = this[field.name + "_text"];
                    break;
                case "location":
                    data[field.name] = this[field.name] ? this[field.name].getData() : null;
                    break;
                default:
                    data[field.name] = this[field.name];
                    break;
            }
        });
        return data;
    }
    getRegions(regionsTableName) {
        return this.regions;
    }
    getRegionsForTable(regionsTableName) {
        return this.regions
            ? this.regions.filter((region) => !region.tableName || region.tableName === regionsTableName)
            : [];
    }
}
//# sourceMappingURL=CustomObject.js.map