import { MapSVG } from "../../Core/globals.js";
import { ArrayIndexed } from "../../Core/ArrayIndexed";

export class SchemaField {
    type: string;
    label?: string;
    name?: string;
    help?: string;
    options?: ArrayIndexed<{ [key: string]: any }>;
    visible?: boolean;
    readonly?: boolean;
    protected?: boolean;
    searchable?: boolean;
    value?: any;
    placeholder?: string;
    parameterName?: string;
    parameterNameShort?: string;
    db_type?: string;
    db_default?: number | boolean | string;
    [key: string]: any;

    constructor(field: { [key: string]: any }) {
        const booleans = ["visible", "searchable", "readonly", "protected"];

        for (const key in field) {
            this[key] = field[key];
        }

        booleans.forEach((paramName) => {
            if (typeof this[paramName] !== "undefined") {
                this[paramName] = MapSVG.parseBoolean(this[paramName]);
            } else {
                this[paramName] = false;
            }
        });

        if (typeof this.options !== "undefined") {
            if (!(this.options instanceof ArrayIndexed)) {
                this.options = new ArrayIndexed("value", this.options);
            }
        }

        // TODO move this outside of the Schema class:
        // if(field.type == 'region'){
        //     field.options = new Map();
        //     _this.mapsvg.regions.forEach(function(region){
        //         field.options.set(region.id, {id: region.id, title: region.title});
        //     });
        // }
    }
}
