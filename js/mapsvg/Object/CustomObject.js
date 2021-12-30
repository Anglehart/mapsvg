import { GeoPoint, Location, SVGPoint } from "../Location/Location.js";
import { LocationAddress } from "../Location/LocationAddress.js";
import { MapSVG } from "../Core/globals";
export class CustomObject {
    constructor(params, schema) {
        this.initialLoad = true;
        this.setSchema(schema);
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
    setSchema(schema) {
        this.schema = schema;
        this.schema.events.on("changed", () => this.setLocationField());
        this.fields = schema.getFieldNames();
        this.setLocationField();
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
                                img: this.isMarkersByFieldEnabled()
                                    ? this.getMarkerImage()
                                    : params[fieldName].img,
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
        const locationField = this.getLocationField();
        if (locationField && this.isMarkersByFieldEnabled() && this.isMarkerFieldChanged(params)) {
            this.reloadMarkerImage();
        }
    }
    isMarkerFieldChanged(params) {
        return Object.keys(params).indexOf(this.getLocationField().markerField) !== -1;
    }
    setLocationField() {
    }
    getLocationField() {
        return this.schema.getFieldByType("location");
    }
    reloadMarkerImage() {
        this.location && this.location.setImage(this.getMarkerImage());
    }
    getMarkerImage() {
        let fieldValue;
        if (this.isMarkersByFieldEnabled()) {
            const locationField = this.getLocationField();
            fieldValue = this[locationField.markerField];
            if (!fieldValue) {
                return locationField.defaultMarkerPath || MapSVG.defaultMarkerImage;
            }
            else {
                if (locationField.markerField === "regions") {
                    fieldValue = fieldValue[0] && fieldValue[0].id;
                }
                else if (typeof fieldValue === "object" && fieldValue.length) {
                    fieldValue = fieldValue[0].value;
                }
                return (locationField.markersByField[fieldValue] ||
                    locationField.defaultMarkerPath ||
                    MapSVG.defaultMarkerImage);
            }
        }
        else {
            return this.location.imagePath;
        }
    }
    isMarkersByFieldEnabled() {
        const locationField = this.getLocationField();
        if (!locationField) {
            return false;
        }
        if (locationField.markersByFieldEnabled &&
            locationField.markerField &&
            Object.values(locationField.markersByField).length > 0) {
            return true;
        }
        else {
            return false;
        }
    }
    clone() {
        const data = this.getData();
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
                    break;
                case "status":
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