import { Schema } from "../Infrastructure/Server/Schema.js";
import { GeoPoint, Location, LocationOptionsInterface, SVGPoint } from "../Location/Location.js";
import { LocationAddress } from "../Location/LocationAddress.js";
import { Region } from "../Region/Region.js";

export class CustomObject {
    id: number;
    fields: Array<string>;
    schema: Schema;
    location?: Location;
    regions?: Array<{ id: string; title: string; tableName: string }>;
    private _regions?: { [key: string]: Array<{ id: string; title: string }> };
    dirtyFields: string[];
    [key: string]: any;
    initialLoad = true;

    constructor(params: any, schema: Schema) {
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

    build(params: any) {
        for (const fieldName in params) {
            const field = this.schema.getField(fieldName);
            if (field) {
                if (!this.initialLoad) {
                    this.dirtyFields.push(fieldName);
                }
                switch (field.type) {
                    case "region":
                        this.regions = params[fieldName];

                        // if(params[fieldName].hasOwnProperty('length')){
                        //     // If got regions just for current regions table
                        //     // this._regions[this.schema.name] = this.regions;
                        // } else {
                        //     // If got regions for multiple tables
                        //     // this._regions = params[fieldName];
                        //     this.regions = typeof this._regions[this.schema.name] != null ? this._regions[this.schema.name] : [];
                        // }
                        break;
                    case "location":
                        if (
                            params[fieldName] != null &&
                            params[fieldName] != "" &&
                            Object.keys(params[fieldName]).length !== 0
                        ) {
                            const data: LocationOptionsInterface = {
                                img: params[fieldName].img, // TODO getMarkerImage()
                                address: new LocationAddress(params[fieldName].address),
                            };
                            if (
                                params[fieldName].geoPoint &&
                                params[fieldName].geoPoint.lat &&
                                params[fieldName].geoPoint.lng
                            ) {
                                data.geoPoint = new GeoPoint(params[fieldName].geoPoint);
                            } else if (
                                params[fieldName].svgPoint &&
                                params[fieldName].svgPoint.x &&
                                params[fieldName].svgPoint.y
                            ) {
                                data.svgPoint = new SVGPoint(params[fieldName].svgPoint);
                            }
                            if (this.location != null) {
                                this.location.update(data);
                            } else {
                                this.location = new Location(data);
                            }
                        } else {
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

    private getEnumLabel(field, params: any, fieldName: string): string {
        const value = field.options.get(params[fieldName]);
        if (typeof value !== "undefined") {
            return value.label;
        } else {
            return "";
        }
    }

    update(params: { [key: string]: any }): void {
        this.build(params);
    }

    getDirtyFields(): { [key: string]: any } {
        const data: any = {};
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
    clearDirtyFields(): void {
        this.dirtyFields = [];
    }

    getData(): { [key: string]: any } {
        const data: { [key: string]: any } = {};

        const fields = this.schema.getFields();
        fields.forEach((field) => {
            switch (field.type) {
                case "region":
                    data[field.name] = this[field.name];
                    // data.regions = this.getRegions(regionsTableName);
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

    getRegions(regionsTableName: string): Array<{ id: string; title: string }> {
        return this.regions;
    }
    getRegionsForTable(regionsTableName: string): Array<{ id: string; title: string }> {
        return this.regions
            ? this.regions.filter(
                  // !region.tableName is a fix for broken settings after v6 release
                  (region) => !region.tableName || region.tableName === regionsTableName
              )
            : [];
    }
}
