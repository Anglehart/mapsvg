import { Server } from "../Infrastructure/Server/Server";
import { Schema } from "../Infrastructure/Server/Schema";
import { Query } from "../Infrastructure/Server/Query";
import { CustomObject } from "../Object/CustomObject";
import { Events } from "./Events";
import { ArrayIndexed } from "./ArrayIndexed";
import { MapSVGMap } from "../Map/Map";
const $ = jQuery;

export interface RepositoryInterface {
    server: Server;
    query: Query;
    hasMoreRecords: boolean;
    className: string;

    path: string;
    loaded: boolean;
    schema: Schema;
    objects: ArrayIndexed<CustomObject>;
    completeChunks: number;

    objectNameSingle: string;
    objectNameMany: string;

    events: Events;

    noFiltersNoLoad: boolean;

    setSchema(schema: Schema): void;
    getSchema(): Schema;

    getLoaded(): ArrayIndexed<CustomObject>;
    getLoadedAsArray(): ArrayIndexed<CustomObject>;
    create(object: any): JQueryDeferred<any>;
    find(params?: Query): JQueryDeferred<any>;
    findById(id: number | string): JQueryDeferred<any>;
    getLoadedObject(id: number | string): CustomObject;
    update(object: any): JQueryDeferred<any>;
    delete(id: string | number): JQueryDeferred<any>;

    loadDataFromResponse(data: { [key: string]: any } | string): void;
    reload(): void;

    encodeData(params: any): { [key: string]: any };
    decodeData(dataJSON: string): { [key: string]: any };

    onFirstPage(): boolean;
    onLastPage(): boolean;
}

export class Repository implements RepositoryInterface {
    server: Server;
    query: Query;
    hasMoreRecords: boolean;
    className: string;

    objectNameSingle: string;
    objectNameMany: string;

    path: string;
    loaded: boolean;
    schema: Schema;
    objects: ArrayIndexed<CustomObject>;
    completeChunks: number;

    noFiltersNoLoad: boolean;

    events: Events;

    constructor(objectName: string, path: string) {
        this.server = new Server();
        this.query = new Query();
        this.events = new Events(this);
        this.className = "";
        this.objectNameSingle = objectName;
        this.objectNameMany = objectName + "s";
        this.setPath(path);
        this.objects = new ArrayIndexed("id");
        this.completeChunks = 0;
    }

    setNoFiltersNoLoad(value: boolean): void {
        this.noFiltersNoLoad = value;
    }

    setDataSource(path: string) {
        this.setPath(path);
        this.query = new Query({ withSchema: true });
        return this.find().done(() => {
            this.query.update({ withSchema: false });
        });
    }

    setPath(path: string) {
        this.path = path.replace(/\/+$/, "") + "/";
    }

    setSchema(schema: Schema): void {
        this.schema = schema;
    }
    getSchema(): Schema {
        return this.schema;
    }

    loadDataFromResponse(response: { [key: string]: any } | string): void {
        let data: any;
        data = this.decodeData(response);
        this.objects.clear();

        if (data[this.objectNameMany] && data[this.objectNameMany].length) {
            this.hasMoreRecords =
                this.query.perpage && data[this.objectNameMany].length > this.query.perpage;
            if (this.hasMoreRecords) {
                data[this.objectNameMany].pop();
            }
            data[this.objectNameMany].forEach((obj) => {
                this.objects.push(obj);
            });
        } else {
            this.hasMoreRecords = false;
        }

        this.loaded = true;
        this.events.trigger("loaded");
    }
    reload(): JQueryDeferred<any> {
        return this.find();
    }

    create(object: object): JQueryDeferred<any> {
        const defer = jQuery.Deferred();
        defer.promise();

        const data = {};
        data[this.objectNameSingle] = this.encodeData(object);

        this.server
            .post(this.path, data)
            .done((response: any) => {
                const data = this.decodeData(response);
                const object = data[this.objectNameSingle];
                this.objects.push(object);
                defer.resolve(object);
                this.events.trigger("created", this, [object]);
            })
            .fail((response) => {
                defer.reject(response);
            });

        return defer;
    }

    findById(id: number | string, nocache = false): JQueryDeferred<any> {
        const defer = jQuery.Deferred();
        defer.promise();

        let object;

        if (!nocache) {
            object = this.objects.findById(id.toString());
        }
        if (!nocache && object) {
            defer.resolve(object);
        } else {
            this.server
                .get(this.path + id)
                .done((response: string) => {
                    const data = this.decodeData(response);
                    defer.resolve(data[this.objectNameSingle]);
                })
                .fail((response) => {
                    defer.reject(response);
                });
        }

        return defer;
    }

    find(query?: Query | { [key: string]: any }): JQueryDeferred<any> {
        this.events.trigger("load");

        const defer = jQuery.Deferred();

        defer.promise();

        if (typeof query !== "undefined") {
            this.query.update(query);
        }

        if (this.noFiltersNoLoad && !this.query.hasFilters()) {
            this.objects.clear();
            this.events.trigger("loaded");
            defer.resolve(this.getLoaded());
            return defer;
        }

        if (!this.schema) {
            this.query.update({ withSchema: true });
        }

        this.server
            .get(this.path, this.query)
            .done((response: string) => {
                if (!this.schema) {
                    this.query.update({ withSchema: false });
                }
                this.loadDataFromResponse(response);
                defer.resolve(this.getLoaded());
            })
            .fail((response) => {
                defer.reject(response);
            });

        return defer;
    }

    getLoaded(): ArrayIndexed<CustomObject> {
        return this.objects;
    }
    getLoadedObject(id: number | string): CustomObject {
        return this.objects.findById(id.toString());
    }
    getLoadedAsArray(): ArrayIndexed<CustomObject> {
        return this.objects;
    }

    update(object: any): JQueryDeferred<any> {
        const defer = jQuery.Deferred();
        defer.promise();

        const data = {};
        const objectUpdatedFields = "getDirtyFields" in object ? object.getDirtyFields() : object;
        data[this.objectNameSingle] = this.encodeData(objectUpdatedFields);

        this.server
            .put(this.path + objectUpdatedFields.id, data)
            .done((response: string) => {
                if ("clearDirtyFields" in object) {
                    object.clearDirtyFields();
                }

                defer.resolve(object);
                this.events.trigger("updated", this, object);
            })
            .fail((response, stat) => {
                defer.reject(response, stat);
            });
        return defer;
    }

    delete(id: number): JQueryDeferred<any> {
        const defer = jQuery.Deferred();
        defer.promise();

        this.server
            .delete(this.path + id)
            .done((response: string) => {
                this.objects.delete(id.toString());
                this.events.trigger("deleted");
                defer.resolve();
            })
            .fail((response) => {
                defer.reject(response);
            });

        return defer;
    }

    clear(): JQueryDeferred<any> {
        const defer = jQuery.Deferred();
        defer.promise();
        this.server
            .delete(this.path)
            .done((response: string) => {
                this.objects.clear();
                this.events.trigger("loaded");
                this.events.trigger("cleared");
                defer.resolve();
            })
            .fail((response) => {
                defer.reject(response);
            });

        return defer;
    }

    onFirstPage(): boolean {
        return this.query.page === 1;
    }

    onLastPage(): boolean {
        return this.hasMoreRecords === false;
    }

    encodeData(params: any): { [key: string]: any } {
        return params;
    }

    decodeData(dataJSON: string | { [key: string]: any }): { [key: string]: any } {
        let data;

        if (typeof dataJSON === "string") {
            data = JSON.parse(dataJSON);
        } else {
            data = dataJSON;
        }

        if ((data.object || data.region || data.regions || data.objects) && data.schema) {
            this.setSchema(new Schema(data.schema));
        }

        const dataFormatted: any = {};
        for (const key in data) {
            if (data[key]) {
                switch (key) {
                    case "object":
                    case "region":
                        dataFormatted[key] = new CustomObject(data[key], this.schema);
                        break;
                    case "objects":
                    case "regions":
                        dataFormatted[key] = data[key].map(
                            (obj) => new CustomObject(obj, this.schema)
                        );
                        break;
                    case "schema":
                        dataFormatted[key] = this.schema || new Schema(data[key]);
                        break;
                    case "schemas":
                        dataFormatted[key] = data[key].map((obj) => new Schema(obj));
                        break;
                    default:
                        break;
                }
            }
        }
        return dataFormatted;
    }

    /**
     * Imports data from a CSV file.
     *
     * @param data
     * @param convertLatlngToAddress
     * @param mapsvg
     */
    import(data: { [key: string]: any }, convertLatlngToAddress: boolean, mapsvg: MapSVGMap) {
        const _this = this;

        const locationField = _this.schema.getFieldByType("location");
        let language = "en";
        if (locationField && locationField.language) {
            language = locationField.language;
        }

        data = this.formatCSV(data, mapsvg);

        return this.importByChunks(data, language, convertLatlngToAddress).done(function () {
            _this.find();
        });
    }

    /**
     * Splits data to small chunks and sends every chunk separately to the server
     *
     * @param data - Data to import
     * @param language - Language for Geocoding conversions
     * @param convertLatlngToAddress - Whether lat/lng coordinates should be converted to addresses via Geocoding service
     */
    importByChunks(
        data: { [key: string]: any },
        language: string,
        convertLatlngToAddress: boolean
    ) {
        const _this = this;

        let i,
            j,
            temparray,
            chunk = 50;
        const chunks = [];

        for (i = 0, j = data.length; i < j; i += chunk) {
            temparray = data.slice(i, i + chunk);
            chunks.push(temparray);
        }

        if (chunks.length > 0) {
            let delay = 0;
            const delayPlus = chunks[0][0] && chunks[0][0].location ? 1000 : 0;

            var defer = $.Deferred();
            defer.promise();

            _this.completeChunks = 0;

            chunks.forEach(function (chunk) {
                delay += delayPlus;
                setTimeout(function () {
                    const data = {
                        language: language,
                        convertLatlngToAddress: convertLatlngToAddress,
                    };

                    data[_this.objectNameMany] = JSON.stringify(chunk);

                    _this.server
                        .post(_this.path + "import", data)
                        .done(function (_data) {
                            _this.completeChunk(chunks, defer);
                        })
                        .fail((response) => {
                            console.error(response);
                        });
                }, delay);
            });
        }
        return defer;
    }

    completeChunk(chunks, defer) {
        const _this = this;
        _this.completeChunks++;
        if (_this.completeChunks === chunks.length) {
            defer.resolve();
        }
    }

    formatCSV(data: { [key: string]: any }, mapsvg: MapSVGMap) {
        const _this = this;
        const newdata = [];
        const latLngRegex = /^(\-?\d+(\.\d+)?),\s*(\-?\d+(\.\d+)?)$/g;

        const regionsTable = mapsvg.regionsRepository.getSchema().name;

        data.forEach(function (object, index) {
            const newObject = {};
            for (const key in object) {
                let field = _this.schema.getField(key);
                if (key === "post") {
                    field = { type: "post" };
                }
                if (field !== undefined) {
                    switch (field.type) {
                        case "region":
                            newObject[key] = {};
                            newObject[key] = object[key]
                                .split(",")
                                .map(function (regionId) {
                                    return regionId.trim();
                                })
                                .filter(function (rId) {
                                    return (
                                        mapsvg.getRegion(rId) !== undefined ||
                                        mapsvg.regions.find(function (item) {
                                            return item.title === rId;
                                        }) !== undefined
                                    );
                                })
                                .map(function (rId) {
                                    let r = mapsvg.getRegion(rId);
                                    if (typeof r === "undefined") {
                                        r = mapsvg.regions.find(function (item) {
                                            return item.title === rId;
                                        });
                                    }
                                    return { id: r.id, title: r.title, tableName: regionsTable };
                                });
                            break;
                        case "location":
                            if (object[key].match(latLngRegex)) {
                                const coords = object[key].split(",").map(function (n) {
                                    return parseFloat(n);
                                });
                                if (
                                    coords.length == 2 &&
                                    coords[0] > -90 &&
                                    coords[0] < 90 &&
                                    coords[1] > -180 &&
                                    coords[1] < 180
                                ) {
                                    newObject[key] = {
                                        geoPoint: { lat: coords[0], lng: coords[1] },
                                    };
                                } else {
                                    newObject[key] = "";
                                }
                            } else if (object[key]) {
                                newObject[key] = { address: object[key] };
                            }

                            if (typeof newObject[key] == "object") {
                                newObject[key].img = mapsvg.options.defaultMarkerImage;
                            }

                            break;
                        case "select":
                            const field = _this.schema.getField(key);
                            if (field.multiselect) {
                                const labels = _this.schema.getField(key).options.map(function (f) {
                                    return f.label;
                                });
                                newObject[key] = object[key]
                                    .split(",")
                                    .map(function (label) {
                                        return label.trim();
                                    })
                                    .filter(function (label) {
                                        return labels.indexOf(label) !== -1;
                                    })
                                    .map(function (label) {
                                        return _this.schema
                                            .getField(key)
                                            .options.filter(function (option) {
                                                return option.label == label;
                                            })[0];
                                    });
                                if (newObject[key].length === 0) {
                                    const values = _this.schema
                                        .getField(key)
                                        .options.map(function (f) {
                                            return f.value + "";
                                        });
                                    newObject[key] = object[key]
                                        .split(",")
                                        .map(function (value) {
                                            return value.trim();
                                        })
                                        .filter(function (value) {
                                            return values.indexOf(value) !== -1;
                                        })
                                        .map(function (value) {
                                            return _this.schema
                                                .getField(key)
                                                .options.filter(function (option) {
                                                    return option.value == value;
                                                })[0];
                                        });
                                }
                            } else {
                                newObject[key] = object[key];
                            }
                            break;
                        case "radio":
                        case "text":
                        case "textarea":
                        case "status":
                        default:
                            newObject[key] = object[key];
                            break;
                    }
                }
            }
            data[index] = newObject;
        });

        return data;
    }
}
