(function ($, window, MapSVG) {
    var MapSVGAdminRegionsStructureController = function (
        container,
        admin,
        mapsvg,
        databaseService
    ) {
        this.name = "regions-structure";
        this.scrollable = false;
        this.database = mapsvg.regionsRepository;
        //this.schemaRepository
        MapSVGAdminController.call(this, container, admin, mapsvg);
    };
    window.MapSVGAdminRegionsStructureController = MapSVGAdminRegionsStructureController;
    MapSVG.extend(MapSVGAdminRegionsStructureController, window.MapSVGAdminController);

    MapSVGAdminRegionsStructureController.prototype.viewDidAppear = function () {
        MapSVGAdminController.prototype.viewDidAppear.call(this);
        this.formBuilder = this.mapsvg.createForm({
            schema: this.database.getSchema(),
            editMode: true,
            mapsvg: this.mapsvg,
            admin: this.admin,
            container: this.contentView,
            types: [
                "text",
                "textarea",
                "checkbox",
                "radio",
                "select",
                "image",
                "status",
                "date",
                "post",
            ],
            events: {
                saveSchema: (formBuilder, options) => {
                    var schema = this.database.getSchema();
                    schema.update({ fields: options });
                    let schemRepo = new mapsvg.schemaRepository();
                    schemRepo
                        .update(schema)
                        .done(() => {
                            let _status = this.database.getSchema().getField("status");
                            if (_status) {
                                // TODO check if the code below can be commented out. It was not working propertly anyway
                                // this.mapsvg.getRegions().forEach((region) => {
                                //     region.setStatus();
                                // });
                                this.mapsvg.setRegionStatuses(_status.options);
                                this.admin.save(true);
                            }
                            $.growl.notice({ title: "", message: "Settings saved", duration: 700 });
                        })
                        .fail(() => {
                            $.growl.error({
                                title: "Server error",
                                message: "Can't save settings",
                            });
                        });
                },
                load: (formBuilder) => {
                    setTimeout(() => {
                        $("#mapsvg-btn-regions-structure").tooltip("show").tooltip("hide");
                    }, 200);
                },
            },
        });
    };
    MapSVGAdminRegionsStructureController.prototype.viewDidDisappear = function () {
        MapSVGAdminController.prototype.viewDidDisappear.call(this);
        this.formBuilder && this.formBuilder.destroy();
    };

    MapSVGAdminRegionsStructureController.prototype.setEventHandlers = function(){
        var _this = this;
    };

})(jQuery, window, mapsvg.globals);
