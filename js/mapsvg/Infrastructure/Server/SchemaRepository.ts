import { Repository } from "../../Core/Repository";
import { Schema } from "./Schema";
import { MapSVGMap } from "../../Map/Map";
import { Events } from "../../Core/Events";

export class SchemaRepository extends Repository {
    constructor() {
        const objectName = "schema";
        super(objectName, +objectName + "s");
        this.className = "Schema";
        this.objectNameSingle = objectName;
        this.objectNameMany = objectName + "s";
        this.path = objectName + "s/";
        this.events = new Events(this);
    }

    create(schema: Schema): JQueryDeferred<any> {
        const defer = jQuery.Deferred();
        defer.promise();

        const data = {};
        data[this.objectNameSingle] = this.encodeData(schema);

        this.server
            .post(this.path, data)
            .done((response: string) => {
                const data = this.decodeData(response);
                schema.id = data[this.objectNameSingle].id;
                this.objects.push(schema);

                this.events.trigger("created");
                schema.events.trigger("created");

                defer.resolve(schema);
            })
            .fail(() => {
                defer.reject();
            });

        return defer;
    }

    update(schema: Schema): JQueryDeferred<any> {
        const defer = jQuery.Deferred();
        defer.promise();

        const data = {};
        data[this.objectNameSingle] = this.encodeData(schema);

        this.server
            .put(this.path + schema.id, data)
            .done((response: string) => {
                const data = this.decodeData(response);
                this.objects.push(schema);
                defer.resolve(schema);

                this.events.trigger("changed");
                schema.events.trigger("changed");
            })
            .fail(() => {
                defer.reject();
            });
        return defer;
    }

    encodeData(schema: Schema): { [key: string]: any } {
        const _schema = schema.getData();

        let fieldsJsonString = JSON.stringify(_schema);
        fieldsJsonString = fieldsJsonString.replace(/select/g, "!mapsvg-encoded-slct");
        fieldsJsonString = fieldsJsonString.replace(/table/g, "!mapsvg-encoded-tbl");
        fieldsJsonString = fieldsJsonString.replace(/database/g, "!mapsvg-encoded-db");
        fieldsJsonString = fieldsJsonString.replace(/varchar/g, "!mapsvg-encoded-vc");
        fieldsJsonString = fieldsJsonString.replace(/int\(11\)/g, "!mapsvg-encoded-int");

        const back = JSON.parse(fieldsJsonString);
        back.fields = JSON.stringify(_schema.fields);

        return back;
    }
}
