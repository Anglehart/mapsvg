import { MapSVG } from "../../Core/globals.js";
import { ArrayIndexed } from "../../Core/ArrayIndexed";
export class SchemaField {
    constructor(field) {
        const booleans = ["visible", "searchable", "readonly", "protected"];
        for (const key in field) {
            this[key] = field[key];
        }
        booleans.forEach((paramName) => {
            if (typeof this[paramName] !== "undefined") {
                this[paramName] = MapSVG.parseBoolean(this[paramName]);
            }
            else {
                this[paramName] = false;
            }
        });
        if (typeof this.options !== "undefined") {
            if (!(this.options instanceof ArrayIndexed)) {
                this.options = new ArrayIndexed("value", this.options);
            }
        }
    }
}
//# sourceMappingURL=SchemaField.js.map