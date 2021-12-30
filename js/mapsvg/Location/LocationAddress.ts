/**
 * LocationAddress class stores address field from Google Geocoding service
 * @param {object} fields
 * @constructor
 */
export class LocationAddress {
    route?: string;
    address_formatted?: string;
    administrative_area_level_1?: string;
    administrative_area_level_1_short?: string;
    administrative_area_level_2?: string;
    administrative_area_level_2_short?: string;
    country?: string;
    country_short?: string;
    postal_code?: string;

    constructor(fields: object) {
        for (const i in fields) {
            this[i] = fields[i];
        }
    }

    getData(): { [key: string]: string } {
        const copy: { [key: string]: string } = {};

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
