export class LocationAddress {
    constructor(fields) {
        for (const i in fields) {
            this[i] = fields[i];
        }
    }
    getData() {
        const copy = {};
        [
            "route",
            "address_formatted",
            "administrative_area_level_1",
            "administrative_area_level_1_short",
            "administrative_area_level_2",
            "administrative_area_level_2_short",
            "country",
            "country_short",
            "postal_code",
        ].forEach((field) => {
            if (this[field]) {
                copy[field] = this[field];
            }
        });
        return copy;
    }
    get state() {
        return this.country_short === "US" ? this.administrative_area_level_1 : null;
    }
    get state_short() {
        return this.country_short === "US" ? this.administrative_area_level_1_short : null;
    }
    get county() {
        return this.country_short === "US" ? this.administrative_area_level_2 : null;
    }
    get zip() {
        return this.postal_code;
    }
}
//# sourceMappingURL=LocationAddress.js.map