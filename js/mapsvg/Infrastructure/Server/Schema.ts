import { MapSVG } from "../../Core/globals.js";
import { Events } from "../../Core/Events";
import { SchemaField } from "./SchemaField";
import { ArrayIndexed } from "../../Core/ArrayIndexed";

export class Schema {
    id: number;
    type: string;
    name: string;
    title?: string;
    fields?: ArrayIndexed<SchemaField>;
    lastChangeTime: number;
    events: Events;

    constructor(options: {
        id?: number;
        type?: string;
        name?: string;
        title?: string;
        fields?: Array<{ [key: string]: any }>;
    }) {
        this.fields = new ArrayIndexed("name");

        this.build(options);

        this.lastChangeTime = Date.now();
        this.events = new Events(this);
    }

    build(options) {
        const allowedParams = ["id", "title", "type", "name", "fields"];
        allowedParams.forEach((paramName) => {
            const setter = "set" + MapSVG.ucfirst(paramName);
            if (typeof options[paramName] !== "undefined" && typeof this[setter] == "function") {
                this[setter](options[paramName]);
            }
        });
    }

    update(options) {
        this.build(options);
    }

    setId(id: number) {
        this.id = id;
    }
    setTitle(title: string) {
        this.title = title;
    }
    setName(name: string) {
        this.name = name;
    }

    loaded() {
        return this.fields.length !== 0;
    }

    setFields(fields: any[]) {
        if (fields) {
            this.fields.clear();

            fields.forEach((fieldParams) => {
                this.fields.push(new SchemaField(fieldParams));

                // TODO move this outside of the Schema class:
                // if(field.type == 'region'){
                //     field.options = new Map();
                //     _this.mapsvg.regions.forEach(function(region){
                //         field.options.set(region.id, {id: region.id, title: region.title});
                //     });
                // }
            });
        }
    }

    getFields(): ArrayIndexed<SchemaField> {
        return this.fields;
    }
    getFieldsAsArray(): Array<SchemaField> {
        // let res: Array<SchemaFieldInterface>;
        // res = [];
        // this.fields.forEach((field) => {
        //     res.push(field);
        // })
        // return res;
        return this.fields;
    }
    getFieldNames(): Array<string> {
        return this.fields.map((f) => f.name);
    }
    getField(field) {
        // if(field === 'id'){
        //     return {name: 'id', visible: true, type: 'id'};
        // }
        return this.fields.findById(field);
    }
    getFieldByType(type) {
        let f = null;
        this.fields.forEach(function (field) {
            if (field.type === type) f = field;
        });
        return f;
    }
    getColumns(filters) {
        filters = filters || {};

        const columns = this.fields;

        const needfilters = Object.keys(filters).length !== 0;
        let results = [];

        if (needfilters) {
            let filterpass;
            columns.forEach(function (obj) {
                filterpass = true;
                for (const param in filters) {
                    filterpass = obj[param] == filters[param];
                }
                filterpass && results.push(obj);
            });
        } else {
            results = columns;
        }

        return results;
    }

    getData() {
        const data = {
            id: this.id,
            title: this.title,
            name: this.name,
            fields: this.fields,
            type: this.type,
        };
        return data;
    }
}
