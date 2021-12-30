import { Repository } from "../Core/Repository.js";
export class MapsRepository extends Repository {
    constructor() {
        super("map", "maps");
        this.path = "maps/";
    }
    encodeData(params) {
        const data = {};
        if (typeof params.options !== "undefined") {
            data.options = JSON.stringify(params.options);
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
    decodeData(dataJSON) {
        let data;
        if (typeof dataJSON === "string") {
            data = JSON.parse(dataJSON);
        }
        else {
            data = dataJSON;
        }
        return data;
    }
    copy(id, title) {
        const defer = jQuery.Deferred();
        defer.promise();
        const data = { options: { title: title } };
        this.server
            .post(this.path + id + "/copy", this.encodeData(data))
            .done((response) => {
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
    createFromV2(object) {
        const defer = jQuery.Deferred();
        defer.promise();
        const data = {};
        data[this.objectNameSingle] = this.encodeData(object);
        this.server
            .post(this.path + "/createFromV2", data)
            .done((response) => {
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
    delete(id) {
        const defer = jQuery.Deferred();
        defer.promise();
        this.server
            .delete(this.path + id)
            .done((response) => {
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
//# sourceMappingURL=MapsRepository.js.map