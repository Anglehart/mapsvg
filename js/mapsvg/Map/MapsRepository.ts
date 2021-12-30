import { Repository } from "../Core/Repository.js";
import { Schema } from "../Infrastructure/Server/Schema";
import { CustomObject } from "../Object/CustomObject";
import { MapSVGMap } from "./Map";

export class MapsRepository extends Repository {
    path = "maps/";

    constructor() {
        super("map", "maps");
    }

    encodeData(params: any): { [key: string]: any } {
        const data: { [key: string]: any } = {};
        if (typeof params.options !== "undefined") {
            data.options = JSON.stringify(params.options);

            // Apache mod_sec blocks requests with the following words:
            // table, select, database. Encode those words to decode them later in PHP to prevent blocking:
            data.options = data.options.replace(/select/g, "!mapsvg-encoded-slct");
            data.options = data.options.replace(/table/g, "!mapsvg-encoded-tbl");
            data.options = data.options.replace(/database/g, "!mapsvg-encoded-db");
            data.options = data.options.replace(/varchar/g, "!mapsvg-encoded-vc");
            data.options = data.options.replace(/int\(11\)/g, "!mapsvg-encoded-int");
        }
        if (typeof params.title !== "undefined") {
            data.title = params.title;
        }
        if (typeof params.id !== "undefined") {
            data.id = params.id;
        }
        if (typeof params.status !== "undefined") {
            data.status = params.status;
        }

        return data;
    }

    decodeData(dataJSON: string | { [key: string]: any }): { [key: string]: any } {
        let data;

        if (typeof dataJSON === "string") {
            data = JSON.parse(dataJSON);
        } else {
            data = dataJSON;
        }

        return data;
    }

    copy(id: number, title: string): JQueryDeferred<any> {
        const defer = jQuery.Deferred();
        defer.promise();

        const data = { options: { title: title } };

        this.server
            .post(this.path + id + "/copy", this.encodeData(data))
            .done((response: string) => {
                const data = this.decodeData(response);
                this.objects.clear();
                this.events.trigger("loaded");
                this.events.trigger("cleared");
                defer.resolve(data.map);
            })
            .fail(() => {
                defer.reject();
            });

        return defer;
    }

    createFromV2(object: any) {
        const defer = jQuery.Deferred();
        defer.promise();

        const data = {};
        data[this.objectNameSingle] = this.encodeData(object);

        this.server
            .post(this.path + "/createFromV2", data)
            .done((response: any) => {
                const data = this.decodeData(response);
                const object = data[this.objectNameSingle];
                this.objects.push(object);
                defer.resolve(object);
                this.events.trigger("created", this, [object]);
            })
            .fail(() => {
                defer.reject();
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
            .fail(() => {
                defer.reject();
            });

        return defer;
    }
}
