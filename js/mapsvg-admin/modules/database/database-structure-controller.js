(function ($, window, MapSVG) {
    var MapSVGAdminDatabaseStructureController = function (
        container,
        admin,
        mapsvg,
        databaseService
    ) {
        this.name = "database-structure";
        this.scrollable = false;
        this.database = mapsvg.objectsRepository;
        MapSVGAdminController.call(this, container, admin, mapsvg);
    };
    window.MapSVGAdminDatabaseStructureController = MapSVGAdminDatabaseStructureController;
    MapSVG.extend(MapSVGAdminDatabaseStructureController, window.MapSVGAdminController);

    MapSVGAdminDatabaseStructureController.prototype.viewDidAppear = function () {
        var _this = this;
        MapSVGAdminController.prototype.viewDidAppear.call(this);
        this.formBuilder = this.mapsvg.createForm({
            schema: _this.database.getSchema(),
            editMode: true,
            mapsvg: _this.mapsvg,
            admin: _this.admin,
            container: this.contentView,
            events: {
                saveSchema: (formBuilder, options) => {
                    var schema = _this.database.getSchema();
                    schema.update({ fields: options });
                    let schemRepo = new mapsvg.schemaRepository();
                    schemRepo.update(schema).done(function () {
                        formBuilder.updateExtraParamsInFormElements();
                        $.growl.notice({ title: "", message: "Settings saved", duration: 700 });
                    });
                    this.admin.save(true);
                },
                load: (formBuilder) => {
                    setTimeout(() => {
                        $("#mapsvg-btn-database-structure").tooltip("show").tooltip("hide");
                    }, 200);
                },
            },
        });

        // _this.formBuilder.view.appendTo(this.contentView);
    };
    MapSVGAdminDatabaseStructureController.prototype.viewDidDisappear = function () {
        MapSVGAdminController.prototype.viewDidDisappear.call(this);
        this.formBuilder && this.formBuilder.destroy();
    };

    MapSVGAdminDatabaseStructureController.prototype.setEventHandlers = function () {
        var _this = this;
    };
})(jQuery, window, mapsvg.globals);
