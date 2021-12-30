(function ($, window) {
    var MapSVGAdminDatabaseSourceController = function (container, admin, _mapsvg) {
        var _this = this;
        this.name = "database-source";

        this.schemaDatabase = new mapsvg.schemaRepository();

        this.schemas = [];

        MapSVGAdminController.call(this, container, admin, _mapsvg);
    };
    window.MapSVGAdminDatabaseSourceController = MapSVGAdminDatabaseSourceController;
    MapSVG.extend(MapSVGAdminDatabaseSourceController, window.MapSVGAdminController);

    MapSVGAdminDatabaseSourceController.prototype.setEventHandlers = function () {
        var _this = this;
        this.view.on("click", "#mapsvg-go-to-table", function (e) {
            e.preventDefault();
            _this.admin.slideToController(_this, "database", "forward");
            return false;
        });

        _this.view.on("click", "#mapsvg-btn-add-datasource", function (e) {
            _this.showNewDataSourceModal();
        });

        // $("#mapsvg-btn-data-add").on("click", function (e) {
        //     e.preventDefault();
        //     _this.editDataObject();
        // });

        this.view.on("click", ".mapsvg-data-row", function (e) {
            // if ($(e.target).is("button")) {
            //     return false;
            // }
            // _this.admin.slideToController(_this, "database", "forward");
            // if(!$(this).hasClass('active')){
            //     _this.editDataObject($(this).data('id'));
            // }
        });
        this.view.on("click", '[data-action="set-data-source"]', function () {
            var tableName = $(this).attr("data-table-name");
            // TODO check the line below and adapt it
            _this.mapsvg.update({ database: { objectsTableName: tableName } });
            _this.mapsvg.objectsRepository
                .setDataSource("objects/" + tableName)
                .done(function (data) {
                    _this.redraw();
                    var jsp = _this.contentWrap.data("jsp");
                    jsp.scrollToY(0);
                    _this.admin.slideToController(_this, "database", "forward");
                });
        });
    };

    MapSVGAdminDatabaseSourceController.prototype.viewLoaded = function () {
        var _this = this;
        const query = new mapsvg.query({ perpage: 999999 });
        this.schemaDatabase.find(query).done((schemas) => {
            this.schemas = schemas;
            this.redraw();
        });
        this.btnAdd = $("#mapsvg-btn-add-datasource");
    };

    MapSVGAdminDatabaseSourceController.prototype.getTemplateData = function () {
        var _this = this;
        const tableName = this.mapsvg.objectsRepository.getSchema().name;

        _this.schemas.sort(function (a, b) {
            return a.table_name == tableName ? -1 : b.table_name == tableName ? 1 : 0;
        });
        return {
            schemas: _this.schemas.sort(),
            defaultTable: tableName,
        };
    };

    MapSVGAdminDatabaseSourceController.prototype.addDataRow = function (obj) {
        var _this = this;
        var d = {
            fields: _this.schemaDatabase.getColumns({ visible: true }),
            params: obj,
        };
        for (var i in d.fields) {
            if (d.fields[i].type == "region") {
                d.fields[i].options = [];
                d.fields[i].optionsDict = {};
                _this.mapsvg.getData().regions.forEach(function (region) {
                    d.fields[i].options.push({ id: region.id, title: region.title });
                    d.fields[i].optionsDict[region.id] = region.title ? region.title : region.id;
                });
            }
        }
        var row = $(_this.templates.item(d));
        this.view.find("#mapsvg-data-list-table tbody").prepend(row);
        return row;
    };

    MapSVGAdminDatabaseSourceController.prototype.updateDataRow = function (obj, row) {
        var _this = this;
        var d = {
            fields: _this.schemaDatabase.getColumns({ visible: true }),
            params: obj,
        };
        for (var i in d.fields) {
            if (d.fields[i].type == "region") {
                d.fields[i].options = [];
                d.fields[i].optionsDict = {};
                _this.mapsvg.getData().regions.forEach(function (region) {
                    d.fields[i].options.push({ id: region.id, title: region.title });
                    d.fields[i].optionsDict[region.id] = region.title ? region.title : region.id;
                });
            }
        }

        var newRow = $(_this.templates.item(d));
        row = row || $("#mapsvg-datasource-" + obj.id);
        row.replaceWith(newRow);
        newRow.addClass("mapsvg-row-updated");

        setTimeout(function () {
            newRow.removeClass("mapsvg-row-updated");
        }, 2600);
    };

    MapSVGAdminDatabaseSourceController.prototype.deleteDataRow = function (row) {
        var _this = this;
        var id = row.data("id");
        var object = this.schemaDatabase.getLoadedObject(id);
        if (object.location && object.location.marker) object.location.marker.delete();
        this.schemaDatabase.delete(id);
        row.fadeOut(300, function () {
            row.remove();
        });
    };

    MapSVGAdminDatabaseSourceController.prototype.showNewDataSourceModal = function () {
        var _this = this;

        if (_this.formBuilder) {
            _this.formBuilder.destroy();
            _this.formBuilder = null;
            _this.formBuilderRow && _this.formBuilderRow.remove();
        }
        if (_this.formContainer) _this.formContainer.empty().remove();

        _this.formContainer = $('<div class="mapsvg-modal-edit"></div>');
        this.contentWrap.append(_this.formContainer);

        // var marker_id = object.marker && object.marker.id ? object.marker.id : '';
        // _this.mapsvg.hideMarkersExceptOne(marker_id);

        var post_type_options = MapSVG.admin.getData().options.post_types.map(function (option) {
            return { label: option, value: option };
        });
        var schema = [
            {
                name: "type",
                label: "Type",
                type: "radio",
                options: [
                    { label: "Custom table", value: "custom_table" },
                    { label: "WP Posts", value: "posts" },
                ],
            },
            { name: "post_type", label: "Post type", type: "select", options: post_type_options },
        ];

        _this.formBuilder = new MapSVG.FormBuilder({
            container: _this.formContainer,
            schema: schema,
            editMode: false,
            mapsvg: _this.mapsvg,
            mediaUploader: _this.admin.mediaUploader,
            data: {},
            admin: _this.admin,
            closeOnSave: true,
            events: {
                save: function (data) {
                    var formBuilder = this;

                    _this.saveDataObject(data).done(function (data) {
                        var data = JSON.parse(data);
                        if (data && data.schema) {
                            formBuilder.close();
                        }
                    });

                    // if(newRecord){
                    // }else{
                    // _this.updateDataObject(data).done(function(){
                    // if(closeOnSave){
                    //     formBuilder.close();
                    // } else {
                    //     _this.formBuilder.redraw();
                    //     _this.mapsvg.hideMarkersExceptOne();
                    // }
                    // });
                    // }
                    // if(closeOnSave){
                    //     formBuilder.close();
                    // } else {
                    //     _this.formBuilder.redraw();
                    // }
                },
                close: function () {
                    _this.closeFormHandler();
                },
                init: function (data) {
                    var postTypeField = _this.formContainer
                        .find('[name="post_type"]')
                        .closest(".form-group");
                    postTypeField.hide();
                    _this.formContainer.on("change", 'input[name="type"]', function () {
                        postTypeField.toggle($(this).val() === "posts");
                    });
                },
            },
        });
    };

    MapSVGAdminDatabaseSourceController.prototype.editDataObject = function (
        object,
        scrollTo,
        closeOnSave
    ) {
        var _this = this;

        object = object || {};
        if (typeof object == "string" || typeof object == "number") {
            object = _this.schemaDatabase.getLoadedObject(object);
            newRecord = false;
        } else {
            newRecord = true;
        }

        closeOnSave = closeOnSave !== true ? (newRecord ? false : true) : true;

        _this.btnAdd.addClass("disabled");

        if (_this.tableDataActiveRow) _this.tableDataActiveRow.removeClass("mapsvg-row-selected");

        if (object && object.id) {
            newRecord = false;
            _this.updateScroll();
            _this.tableDataActiveRow = $("#mapsvg-data-" + object.id);
            _this.tableDataActiveRow.addClass("mapsvg-row-selected");
            if (scrollTo)
                _this.contentWrap
                    .data("jsp")
                    .scrollToElement(_this.tableDataActiveRow, true, false);
        }

        if (!_this.admin.mediaUploader) {
            _this.admin.mediaUploader = wp.media.frames.file_frame = wp.media({
                title: "Choose images",
                button: {
                    text: "Choose images",
                },
                multiple: true,
            });
        }

        if (_this.formBuilder) {
            _this.formBuilder.destroy();
            _this.formBuilder = null;
            _this.formBuilderRow && _this.formBuilderRow.remove();
        }
        if (_this.formContainer) _this.formContainer.empty().remove();

        _this.formContainer = $('<div class="mapsvg-modal-edit"></div>');
        this.view.append(_this.formContainer);

        var marker_id = object.marker && object.marker.id ? object.marker.id : "";
        // _this.mapsvg.hideMarkersExceptOne(marker_id);

        var post_type_options = MapSVG.admin.getData().options.post_types.map(function (option) {
            return { label: option, value: option };
        });
        var schema = [
            {
                name: "type",
                label: "Type",
                type: "radio",
                options: [
                    { label: "Custom table", value: "custom_table" },
                    { label: "WP Posts", value: "posts" },
                ],
            },
            { name: "post_type", label: "Post type", type: "select", options: post_type_options },
        ];

        _this.formBuilder = new MapSVG.FormBuilder({
            container: _this.formContainer,
            schema: this.schemaDatabase.getSchema(),
            editMode: false,
            mapsvg: _this.mapsvg,
            mediaUploader: _this.admin.mediaUploader,
            data: object,
            admin: _this.admin,
            closeOnSave: closeOnSave,
            events: {
                save: function (data) {
                    var formBuilder = this;
                    if (newRecord) {
                        if (_this.formBuilder.marker) {
                            _this.unsavedMarker = _this.formBuilder.marker;
                        }
                        _this.saveDataObject(data).done(function () {
                            // if(closeOnSave){
                            //     formBuilder.close();
                            // } else {
                            //     _this.formBuilder.redraw();
                            //     _this.mapsvg.hideMarkersExceptOne();
                            // }
                        });
                    } else {
                        _this.updateDataObject(data).done(function () {
                            // if(closeOnSave){
                            //     formBuilder.close();
                            // } else {
                            //     _this.formBuilder.redraw();
                            //     _this.mapsvg.hideMarkersExceptOne();
                            // }
                        });
                    }
                    if (closeOnSave) {
                        formBuilder.close();
                    } else {
                        _this.formBuilder.redraw();
                        _this.mapsvg.hideMarkersExceptOne();
                    }
                },
                close: function () {
                    _this.closeFormHandler();
                },
                init: function (data) {
                    var id = data.location && data.location.marker ? data.location.marker.id : null;
                    _this.mapsvg.hideMarkersExceptOne(id);
                },
            },
        });
    };

    MapSVGAdminDatabaseSourceController.prototype.copyDataObject = function (id) {
        var _this = this;

        var object = {};
        $.extend(object, _this.schemaDatabase.getLoadedObject(id));
        object.id = null;
        // delete object.id;

        if (object.location && object.location instanceof MapSVG.Location) {
            // TODO fix this shit
            var location = object.location.toJSON();
            object.location = new MapSVG.Location(location);
            new MapSVG.Marker({
                location: object.location,
                mapsvg: _this.mapsvg,
                object: object,
            });
        }

        _this.editDataObject(object, false, true);
    };

    MapSVGAdminDatabaseSourceController.prototype.saveDataObject = function (object) {
        var _this = this;

        var table, source;

        if (object.type == "posts") {
            source = "posts_" + object.post_type;
            table = "posts_" + object.post_type;
        } else {
            source = "custom";
            table = object.type + "_" + _this.mapsvg.id;
        }

        var data = {
            action: "mapsvg_create_table",
            table: table,
            source: source,
        };

        if (object.post_type) {
            data.post_type = object.post_type;
        }

        return jQuery
            .post(ajaxurl, data, function (data) {
                data = JSON.parse(data);
                if (typeof data == "object" && data.schema) {
                    var row = _this.addDataRow(data.schema);
                }
            })
            .fail(function () {
                $.growl.error({ title: "Server error", message: "Can't create object" });
                row.remove();
            });
    };
    MapSVGAdminDatabaseSourceController.prototype.updateDataObject = function (obj) {
        var _this = this;

        if (obj.location && obj.location.marker) {
            // var marker = _this.mapsvg.getMarker(obj.location.marker.id);
            obj.location.marker.setId("marker_" + obj.id);
            obj.location.marker.setObject(obj);
        }
        this.closeFormHandler();
        this.updateDataRow(obj);

        return this.schemaDatabase.update(obj).fail(function () {
            $.growl.error({ title: "Server error", message: "Can't update object" });
        });
    };
    MapSVGAdminDatabaseSourceController.prototype.closeFormHandler = function () {
        var _this = this;
        _this.btnAdd.removeClass("disabled");
        _this.mapsvg.showMarkers();

        // Redraw clusters if clustering is ON
        if (_this.mapsvg.getData().options.clustering.on) {
            _this.mapsvg.addLocations();
        }

        if (_this.formBuilder) {
            _this.formBuilder.destroy();
            _this.formBuilder = null;
            _this.formContainer.empty().remove();
            // _this.formBuilderRow && _this.formBuilderRow.remove();
            _this.tableDataActiveRow && _this.tableDataActiveRow.removeClass("mapsvg-row-selected");
            _this.tableDataActiveRow &&
                !_this.tableDataActiveRow.hasClass("mapsvg-row-updated") &&
                _this.tableDataActiveRow.addClass("mapsvg-row-closed");
            setTimeout(function () {
                _this.tableDataActiveRow &&
                    !_this.tableDataActiveRow.hasClass("mapsvg-row-updated") &&
                    _this.tableDataActiveRow.removeClass("mapsvg-row-closed");
            }, 1600);
            // WP Media Uploader inserts a.browser links, remove them:
            $("a.browser").remove();

            if (_this.admin.getData().mode == "editMarkers") {
                _this.admin.setPreviousMode();
            }
        }

        this.updateScroll();
    };
})(jQuery, window);
