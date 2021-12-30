/**
 * MapSvg Builder javaScript
 * Version: 2.0.0
 * Author: Roman S. Stepanov
 * http://codecanyon.net/user/RomanCode/portfolio
 */

class ResizeSensor {
    constructor(element, callback) {
        var _this = this;
        _this.element = element;
        _this.callback = callback;
        var style = getComputedStyle(element);
        var zIndex = parseInt(style.zIndex);
        if (isNaN(zIndex)) {
            zIndex = 0;
        }
        zIndex--;
        _this.expand = document.createElement("div");
        _this.expand.style.position = "absolute";
        _this.expand.style.left = "0px";
        _this.expand.style.top = "0px";
        _this.expand.style.right = "0px";
        _this.expand.style.bottom = "0px";
        _this.expand.style.overflow = "hidden";
        _this.expand.style.zIndex = zIndex.toString();
        _this.expand.style.visibility = "hidden";
        var expandChild = document.createElement("div");
        expandChild.style.position = "absolute";
        expandChild.style.left = "0px";
        expandChild.style.top = "0px";
        expandChild.style.width = "10000000px";
        expandChild.style.height = "10000000px";
        _this.expand.appendChild(expandChild);
        _this.shrink = document.createElement("div");
        _this.shrink.style.position = "absolute";
        _this.shrink.style.left = "0px";
        _this.shrink.style.top = "0px";
        _this.shrink.style.right = "0px";
        _this.shrink.style.bottom = "0px";
        _this.shrink.style.overflow = "hidden";
        _this.shrink.style.zIndex = zIndex.toString();
        _this.shrink.style.visibility = "hidden";
        var shrinkChild = document.createElement("div");
        shrinkChild.style.position = "absolute";
        shrinkChild.style.left = "0px";
        shrinkChild.style.top = "0px";
        shrinkChild.style.width = "200%";
        shrinkChild.style.height = "200%";
        _this.shrink.appendChild(shrinkChild);
        _this.element.appendChild(_this.expand);
        _this.element.appendChild(_this.shrink);
        var size = element.getBoundingClientRect();
        _this.currentWidth = size.width;
        _this.currentHeight = size.height;
        _this.setScroll();
        _this.expand.addEventListener("scroll", function () {
            _this.onScroll();
        });
        _this.shrink.addEventListener("scroll", function () {
            _this.onScroll();
        });
    }
    onScroll() {
        var _this = this;
        var size = _this.element.getBoundingClientRect();
        var newWidth = size.width;
        var newHeight = size.height;
        if (newWidth != _this.currentWidth || newHeight != _this.currentHeight) {
            _this.currentWidth = newWidth;
            _this.currentHeight = newHeight;
            _this.callback();
        }
        this.setScroll();
    }
    setScroll() {
        this.expand.scrollLeft = 10000000;
        this.expand.scrollTop = 10000000;
        this.shrink.scrollLeft = 10000000;
        this.shrink.scrollTop = 10000000;
    }
    destroy() {
        this.expand.remove();
        this.shrink.remove();
    }
}
(function ($, MapSVG) {
    $.fn.inputToObject = function (formattedValue) {
        var obj = {};

        function add(obj, name, value) {
            //if(!addEmpty && !value)
            //    return false;
            if (name.length == 1) {
                obj[name[0]] = value;
            } else {
                if (obj[name[0]] == null) obj[name[0]] = {};
                add(obj[name[0]], name.slice(1), value);
            }
        }

        if (
            $(this).attr("name") &&
            !($(this).attr("type") == "radio" && !$(this).prop("checked"))
        ) {
            add(obj, $(this).attr("name").replace(/]/g, "").split("["), formattedValue);
        }

        return obj;
    };

    MapSVG.isMac = function () {
        return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    };
    MapSVG.isValidURL = function (url) {
        return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(
            url
        );
    };

    var WP = true; // required for proper positioning of control panel in WordPress
    var msvg;
    var editingMark;
    var _data = {},
        _this = {};
    _data.optionsMode = {
        preview: {
            responsive: true,
            disableLinks: true,
        },
        editRegions: {
            responsive: true,
            disableLinks: true,
            zoom: { on: true, limit: [-1000, 1000] },
            scroll: { on: true },
            onClick: null,
            mouseOver: null,
            mouseOut: null,
            tooltips: {
                on: true,
            },
            templates: {
                tooltipRegion: "<b>{{id}}</b>{{#if title}}: {{title}} {{/if}}",
            },
            popovers: {
                on: false,
            },
            actions: {
                region: {
                    click: {
                        showDetails: false,
                        filterDirectory: false,
                        loadObjects: false,
                        showPopover: false,
                        goToLink: false,
                    },
                },
                marker: {
                    click: {
                        showDetails: false,
                        showPopover: false,
                        goToLink: false,
                    },
                },
            },
        },
        draw: {
            responsive: true,
            disableLinks: true,
            zoom: { on: true, limit: [-25, 25] },
            scroll: { on: true, spacebar: true },
            mouseOver: null,
            mouseOut: null,
            colorsIgnore: true,
            // colors: {
            //     base: ''
            // },
            tooltips: {
                on: false,
            },
            popovers: {
                on: false,
            },
            actions: {
                region: {
                    click: {
                        showDetails: false,
                        filterDirectory: false,
                        loadObjects: false,
                        showPopover: false,
                        goToLink: false,
                    },
                },
                marker: {
                    click: {
                        showDetails: false,
                        showPopover: false,
                        goToLink: false,
                    },
                },
            },
        },
        editData: {
            responsive: true,
            disableLinks: true,
            zoom: { on: true, limit: [-1000, 1000] },
            scroll: { on: true },
            actions: {
                region: {
                    click: {
                        showDetails: false,
                        filterDirectory: true,
                        loadObjects: false,
                        showPopover: false,
                        goToLink: false,
                    },
                },
                marker: {
                    click: {
                        showDetails: false,
                        showPopover: false,
                        goToLink: false,
                    },
                },
            },
            // onClick: function(){
            //     var region = this;
            //     $('#mapsvg-tabs-menu a[href="#tab_database"]').tab('show');
            //     var filter = {};
            //     if(region.mapsvg_type == 'region'){
            //         filter.region_id = region.id;
            //     }else if(region.mapsvg_type == 'marker'){
            //         filter.id = region.databaseObject.id;
            //
            //     }
            //     _data.controllers.database.setFilters(filter);
            // },
            // mouseOver: null,
            // mouseOut: null,
            tooltips: {
                on: true,
            },
            templates: {
                tooltipRegion: "Click to show linked DB Objects",
                tooltipMarker: "DB Object id: <b>{{id}}</b> (Click to edit)",
            },
            popovers: {
                on: false,
            },
        },
        editMarkers: {
            responsive: true,
            disableLinks: true,
            zoom: { on: true, limit: [-1000, 1000] },
            scroll: { on: true },
            onClick: null,
            mouseOver: null,
            mouseOut: null,
            tooltips: {
                on: true,
            },
            templates: {
                tooltipMarker: "DB Object id: <b>{{id}}</b> (Click to edit)",
            },
            popovers: {
                on: false,
            },
            actions: {
                region: {
                    click: {
                        showDetails: false,
                        filterDirectory: true,
                        loadObjects: false,
                        showPopover: false,
                        goToLink: false,
                    },
                },
                marker: {
                    click: {
                        showDetails: false,
                        showPopover: false,
                        goToLink: false,
                    },
                },
            },
        },
    };

    methods = {
        getData: function () {
            return _data;
        },
        getMapId: function () {
            return _data.options.map_id;
        },
        selectCheckbox: function () {
            c = $(this).attr("checked") ? true : false;
            $(".region_select").removeAttr("checked");
            if (c) $(this).attr("checked", "true");
        },
        setMapTitle: function (title) {
            $("#map-page-title").html(title);
        },
        disableAll: function () {
            c = $(this).attr("checked") ? true : false;
            if (c) $(".region_disable").attr("checked", "true");
            else $(".region_disable").removeAttr("checked");
        },
        save: function (skipMessage) {
            var form = $(this);
            $("#mapsvg-save").buttonLoading(true);

            var mapsRepo = new mapsvg.mapsRepository();

            var mode = this.getData().mode;
            this.setMode("preview");

            return mapsRepo
                .update(msvg)
                .done(function (mapInstance) {
                    var msg = "Settings saved";
                    _this.setMapTitle(mapInstance.options.title);
                    !skipMessage && $.growl.notice({ title: "", message: msg, duration: 700 });
                })
                .always(function () {
                    $("#mapsvg-save").buttonLoading(false);
                    _this.setMode(mode);
                })
                .fail(function (response, xhr, abc) {
                    MapSVG.handleFailedRequest(response);
                });
        },

        mapUndo: function (e) {
            e.preventDefault();

            var nonce = $(this).data("nonce");
            var table_row = $(this).closest("tr");
            var id = table_row.attr("data-id");
            //    table_row.fadeOut();

            $(this).buttonLoading(true);

            const mapsRepo = new mapsvg.mapsRepository();
            const map = { id: id, status: 1 };

            mapsRepo.update(map).done(() => {
                $(this).buttonLoading(false);
                $(this).addClass("hidden");
                $(this).closest("tr").find(".mapsvg-span-deleted").addClass("hidden");
                $(this).closest("tr").find(".mapsvg-delete").removeClass("hidden");
            });
        },

        mapDelete: function (e) {
            e.preventDefault();

            var nonce = $(this).data("nonce");
            var table_row = $(this).closest("tr");
            var id = table_row.attr("data-id");

            $(this).buttonLoading(true);

            var mapsRepo = new mapsvg.mapsRepository();

            mapsRepo.delete(id).done(() => {
                $(this).buttonLoading(false);
                $(this).addClass("hidden");
                $(this).closest("tr").find(".mapsvg-span-deleted").removeClass("hidden");
                $(this).closest("tr").find(".mapsvg-undo").removeClass("hidden");
            });
        },

        mapCopy: function (e) {
            e.preventDefault();

            var mapsRepo = new mapsvg.mapsRepository();

            var nonce = $(this).data("nonce");
            var table_row = $(this).closest("tr");
            var id = table_row.attr("data-id");
            var map_title = table_row.attr("data-title");

            if (!(new_title = prompt("Enter new map title", map_title + " - copy"))) return false;

            mapsRepo.copy(id, new_title).done(function (newMap) {
                var new_row = table_row.clone();

                var map_link = "?page=mapsvg-config&map_id=" + newMap.id;
                new_row.attr("data-id", newMap.id).attr("data-title", newMap.title);
                new_row.find(".mapsvg-map-title a").attr("href", map_link).html(newMap.title);
                new_row.find(".mapsvg-action-buttons a.mapsvg-button-edit").attr("href", map_link);
                new_row
                    .find(".mapsvg-shortcode")
                    .html(
                        '[mapsvg id="' +
                            newMap.id +
                            '"] <button data-shortcode=\'[mapsvg id="' +
                            newMap.id +
                            '"]\' class="toggle-tooltip mapsvg-copy-shortcode btn btn-xs btn-default" title="Copy to clipboard"><i class="mfa mfa-clone"></i></button>'
                    );
                new_row.prependTo(table_row.closest("tbody"));
            });
        },
        mapUpgradeV2: function (e) {
            e.preventDefault();

            var button = $(e.target);
            button.buttonLoading(true);

            var mapsV2Repo = new mapsvg.mapsV2Repository();

            var nonce = $(this).data("nonce");
            var table_row = $(this).closest("tr");
            var id = table_row.attr("data-id");

            mapsV2Repo.findById(id).done(function (map) {
                var mapsRepo = new mapsvg.mapsRepository();

                eval("map.options = " + map.options + ";");

                // Convert functions to strings
                ["afterLoad", "beforeLoad", "onClick", "mouseOver", "mouseOut"].forEach(
                    (eventName) => {
                        if (map.options[eventName]) {
                            map.options[eventName] = map.options[eventName].toString();
                        }
                    }
                );

                map.options.title = map.options.title + " - Upgrade from V2";
                map.title = map.options.title;
                map.version = "2.4.1";

                delete map.id;

                mapsRepo
                    .createFromV2(map)
                    .done(function (newMap) {
                        var new_row = table_row.clone();
                        var map_link = "?page=mapsvg-config&map_id=" + newMap.id;
                        new_row.attr("data-id", newMap.id).attr("data-title", newMap.title);
                        new_row
                            .find(".mapsvg-map-title")
                            .html('<a href="' + map_link + '">' + newMap.title + "</a>");
                        new_row
                            .find(".mapsvg-action-buttons a.mapsvg-button-edit")
                            .attr("href", map_link);
                        new_row
                            .find(".mapsvg-shortcode")
                            .html(
                                '[mapsvg id="' +
                                    newMap.id +
                                    '"] <button data-shortcode=\'[mapsvg id="' +
                                    newMap.id +
                                    '"]\' class="toggle-tooltip mapsvg-copy-shortcode btn btn-xs btn-default" title="Copy to clipboard"><i class="mfa mfa-clone"></i></button>'
                            );
                        new_row.find(".alert").remove();
                        new_row.find(".mapsvg-upgrade-v2").remove();
                        new_row.hide();
                        new_row.prependTo(table_row.closest("tbody")).fadeIn();
                    })
                    .always(function () {
                        button.buttonLoading(false);
                    });
            });
        },
        mapUpdate: function (e) {
            e.preventDefault();
            var btn = $(this);
            var table_row = $(this).closest("tr");
            var map_id = table_row.length ? table_row.attr("data-id") : msvg.id;

            var update_to = $(this).data("update-to");
            jQuery.get(ajaxurl, { action: "mapsvg_get", id: map_id }, function (data) {
                var disabledRegions = [];
                eval("var options = " + data);
                if (options.regions) {
                    for (var id in options.regions) {
                        if (options.regions[id].disabled) disabledRegions.push(id);
                    }
                }
                $.post(
                    ajaxurl,
                    {
                        action: "mapsvg_update",
                        id: map_id,
                        update_to: update_to,
                        disabledRegions: disabledRegions,
                        _wpnonce: MapSVG.nonce,
                        disabledColor:
                            options.colors && options.colors.disabled !== undefined
                                ? options.colors.disabled
                                : "",
                    },
                    function () {
                        btn.fadeOut();
                        if (!table_row.length) window.location.reload();
                    }
                ).fail(function () {
                    $.growl.error({ title: "Server Error", message: "Can't update the map" });
                });
            });
        },
        markerEditHandler: function (updateGeoCoords) {
            editingMark = this.getOptions();
            // var markerForm = $('#table-markers').find('#mapsvg-marker-'+editingMark.id);
            // $('#mapsvg-tabs-menu a[href="#tab_markers"]').tab('show');
            if (hbData.isGeo && updateGeoCoords) {
                // if(markerForm.length)
                //     markerForm.find('.mapsvg-marker-geocoords a').html(this.geoCoords.join(','));
                if (editingMark.object) {
                    var obj = msvg.database.getLoadedObject(editingMark.dataId);
                    msvg.database.update(obj);
                }
                // $('.nano').nanoScroller({scrollTo: markerForm});
            } else {
                // if(!markerForm.length){
                //     editingMark.isSafari = hbData.isSafari;
                // _data.controllers.markers.addMarker(editingMark);
                // _this.updateScroll();
                // $('.nano').nanoScroller({scroll: 'top'});
                // }else{
                //     $('.nano').nanoScroller({scrollTo: markerForm});
                // }
            }
        },
        regionEditHandler: function () {
            var region = this;
            var row = $("#mapsvg-region-" + region.id_no_spaces);
            $('#mapsvg-tabs-menu a[href="#tab_regions"]').tab("show");
            _data.controllers.regions.controllers.list.editRegion(region, true);
        },
        dataEditHandler: function () {
            var region = this;
            $('#mapsvg-tabs-menu a[href="#tab_database"]').tab("show");
            var filter = {};
            if (region instanceof MapSVG.Region) {
                filter.region_id = region.id;
            } else if (region instanceof MapSVG.Marker) {
                filter.id = region.object.id;
            }
            _data.controllers.database.controllers.list.setFilters(filter);
        }, //.
        resizeDashboard: function () {
            // var w = _data.iframeWindow.width();
            var w = $("#wpbody-content").width();
            var top = $("#wpadminbar").height();
            var left = $(window).width() - w;
            var h = $(window).height() - top;
            $("#mapsvg-admin").css({ width: w, height: h, left: left, top: top });
            if (
                $("#mapsvg-sizer").outerWidth() > $("#mapsvg-container").outerWidth() ||
                $("#mapsvg-sizer").outerHeight() > $("#mapsvg-container").outerHeight() ||
                ($("#mapsvg-sizer").outerHeight() < $("#mapsvg-container").outerHeight() &&
                    $("#mapsvg-sizer").outerWidth() < $("#mapsvg-container").outerWidth())
            ) {
                _this.resizeSVGCanvas();
            }
            // _this.updateScroll();
        },
        resizeSVGCanvas: function () {
            if (!msvg) {
                return;
            }

            var containerWidth = $("#mapsvg-container").width();
            var containerHeight = $("#mapsvg-container").height();

            var v = msvg && msvg.viewBox;

            var s = Math.floor($(msvg.containers.leftSidebar).outerWidth());
            var s2 = Math.floor($(msvg.containers.rightSidebar).outerWidth());
            var h = $(msvg.containers.header).is(":hidden")
                ? 0
                : Math.floor($(msvg.containers.header).outerHeight(true));
            var f = 0; //Math.floor(msvg.$footer.outerHeight(true));

            var availWidth = containerWidth - (s + s2);
            var availHeight = containerHeight - h;

            var mapRatio = v.width / v.height;
            var containerRatio = availWidth / availHeight;

            if (mapRatio < containerRatio) {
                var newWidth = mapRatio * availHeight;
                var per = Math.round((newWidth * 100) / availWidth);
                // var totalWidth = containerWidth * (per / 100) + s + s2;
                var totalWidth = newWidth + s + s2;
                $("#mapsvg-sizer").css({ width: totalWidth + "px" });
            } else {
                $("#mapsvg-sizer").css({ width: "auto" });
            }
        },
        setPreviousMode: function () {
            if (_data.previousMode) _this.setMode(_data.previousMode);
        },
        setMode: function (mode, dontSwitchTab) {
            if (_data.mode === mode) return;

            if (_data.mode === "draw") {
                if (
                    _data.controllers.draw.changed &&
                    !confirm("Changes in SVG file will be lost. Continue?")
                ) {
                    jQuery("#mapsvg-map-mode-2 label").toggleClass("active", false);
                    jQuery("#mapsvg-map-mode-2 input").prop("checked", false);
                    jQuery("#editSvgOption").toggleClass("active", true);
                    jQuery("#editSvgOption")[0].previousSibling.checked = true;
                    return;
                } else {
                    _data.controllers.draw.revert();
                }
                _this.unloadController(_data.controllers.draw);
            }

            _data.previousMode = _data.mode;
            _data.mode = mode;
            // save settings from previous "dirty" state
            msvg.restoreDeltaOptions();
            // msvg.update(msvg.optionsDelta);
            // // get current all saved settings
            // msvg.optionsDelta = {};
            var currentOptions = msvg.getOptions();
            // remember all settings which are going to be changed in mode
            // into options delta
            $.each(_data.optionsMode[_data.mode], function (key, options) {
                msvg.optionsDelta[key] =
                    currentOptions[key] !== undefined ? currentOptions[key] : null;
            });

            msvg.update(_data.optionsMode[mode]);
            var _mode = mode;
            $("#mapsvg-map-mode")
                .find("label")
                .removeClass("active")
                .find("input")
                .prop("checked", false);
            var btn = $("#mapsvg-map-mode").find('label[data-mode="' + _mode + '"]');
            if (btn.length) {
                btn[0].previousSibling.checked = true;
                btn.addClass("active");
            }

            $("body").off("click.switchTab");

            msvg.events.off("zoom");

            if (mode == "editRegions") {
                msvg.setMarkersEditMode(false);
                msvg.setRegionsEditMode(true);
                msvg.setDataEditMode(false);
                _this.setDrawMode(false);
                $(msvg.containers.map).addClass("mapsvg-edit-regions");
                // !dontSwitchTab && $('#mapsvg-tabs-menu a[href="#tab_regions"]').tab('show');
                $("body").on("click.switchTab", ".mapsvg-region", function () {
                    $('#mapsvg-tabs-menu a[href="#tab_regions"]').tab("show");
                });
                $(msvg.containers.map).removeClass("mapsvg-edit-objects");
            } else if (mode == "draw") {
                msvg.setMarkersEditMode(false);
                msvg.setRegionsEditMode(false);
                msvg.setDataEditMode(false);
                $(msvg.containers.map).removeClass("mapsvg-edit-regions");
                $(msvg.containers.map).removeClass("mapsvg-edit-objects");
                _this.setDrawMode(true);
            } else if (mode == "editMarkers") {
                msvg.setMarkersEditMode(true);
                msvg.setRegionsEditMode(false);
                msvg.setDataEditMode(false);
                _this.setDrawMode(false);
                $(msvg.containers.map).removeClass("mapsvg-edit-regions");
                $(msvg.containers.map).removeClass("mapsvg-edit-objects");
                // !dontSwitchTab && $('#mapsvg-tabs-menu a[href="#tab_markers"]').tab('show');
            } else if (mode == "editData") {
                msvg.setMarkersEditMode(false);
                msvg.setRegionsEditMode(false);
                msvg.setDataEditMode(true);
                _this.setDrawMode(false);
                $(msvg.containers.map).removeClass("mapsvg-edit-regions");
                $(msvg.containers.map).addClass("mapsvg-edit-objects");
                $("body").on("click.switchTab", ".mapsvg-region", function () {
                    $('#mapsvg-tabs-menu a[href="#tab_database"]').tab("show");
                });
                $("body").on("click.switchTab", ".mapsvg-marker", function () {
                    $('#mapsvg-tabs-menu a[href="#tab_database"]').tab("show");
                    var marker = msvg.getMarker($(this).prop("id"));
                    _data.controllers.database.controllers.list.editDataObject(
                        marker.object.id,
                        true
                    );
                });
            } else {
                msvg.setMarkersEditMode(false);
                msvg.setRegionsEditMode(false);
                msvg.setDataEditMode(false);
                // msvg.viewBoxReset(true);
                _this.setDrawMode(false);
                _this.resizeSVGCanvas();
                $(msvg.containers.map).removeClass("mapsvg-edit-regions");
                $(msvg.containers.map).removeClass("mapsvg-edit-objects");
            }
            $("#mapsvg-admin").attr("data-mode", mode);
            if (_data.previousMode == "draw") {
                _this.loadController("tab_settings", "settings");
            }
        },
        setDrawMode: function (on) {
            var _this = this;
            if (on) {
                _this.toggleContainers(false);
                msvg.hideMarkersExceptOne();
                if (!_data.controllers.draw) {
                    _data.controllers.draw = new MapSVGAdminDrawController(
                        "mapsvg-container",
                        _this,
                        msvg
                    );
                    _data.controllers.draw.viewDidAppear();
                } else {
                    _data.controllers.draw.show();
                    _data.controllers.draw.viewDidAppear();
                }
                msvg.adjustStrokes();
            } else {
                if (_data.previousMode !== "draw") {
                    return;
                }
                _this.toggleContainers();
                msvg.showMarkers();
                _data.controllers.draw && _data.controllers.draw.close();
            }
        },
        enableMarkersMode: function (on) {
            var mode = $("#mapsvg-map-mode").find('[data-mode="editMarkers"]');
            if (on) {
                $("#mapsvg-map-mode").find("label").addClass("disabled");
                mode.removeClass("disabled").find("input");
            } else {
                // if(_data.mode == 'editMarkers')
                //     _this.setMode('preview');
                $("#mapsvg-map-mode").find("label").removeClass("disabled");
                mode.addClass("disabled").find("input");
            }
        },
        addHandlebarsMethods: function () {},
        getPostTypes: function () {
            return _data.options.post_types;
        },
        togglePanel: function (panelName, visibility) {
            if (!visibility) $("#mapsvg-panels").addClass("hide-" + panelName);
            else $("#mapsvg-panels").removeClass("hide-" + panelName);

            var btn = $("#mapsvg-panels-view-" + panelName);
            if (btn.hasClass("active") != visibility) {
                if (visibility) btn.addClass("active");
                else btn.removeClass("active");
                btn[0].previousSibling.checked = visibility;
            }
        },
        rememberPanelsState: function () {
            _data.panelsState = {};
            _data.panelsState.left = !$("#mapsvg-panels").hasClass("hide-left");
            _data.panelsState.right = !$("#mapsvg-panels").hasClass("hide-right");
        },
        restorePanelsState: function () {
            for (var panelName in _data.panelsState) {
                _this.togglePanel(panelName, _data.panelsState[panelName]);
            }
            _data.panelsState = {};
        },
        toggleContainers: function (on) {
            on = on === undefined ? !_this.containersVisible : on;
            $(".mapsvg-top-container").toggleClass("mapsvg-hidden", !on);
            _this.containersVisible = on;
        },

        setEventHandlersMainScreen: function () {
            var _this = this;
            $('[rel="tooltip"]').on("click", function () {
                $(this).tooltip("hide");
            });
            const settingsModal = new bootstrap.Modal(document.getElementById("settingsModal"), {
                keyboard: false,
            });
            $("body").on("click", ".form-check-label", (e) => {
                let input = $(e.target).parent().find("input");
                if (input.length) {
                    $(input).prop("checked", !$(input).prop("checked"));
                    $(input).trigger("change");
                }
            });

            $("#mapsvg-btn-settings-modal").on("click", () => {
                settingsModal.show();
            });

            $("#mapsvg-admin").on("click", "#mapsvg-btn-phpinfo", function () {
                const server = new mapsvg.server();

                server
                    .get("info/php", {})
                    .done(function (data) {
                        const newWindow = window.open();
                        newWindow.document.write(data);
                        newWindow.document.close();
                    })
                    .fail(function (response) {
                        if (response.responseText) {
                            response = JSON.parse(response.responseText);
                            if (response && response.data && response.data.error) {
                                $.growl.error({ title: "", message: response.data.error });
                            }
                        }
                    });
            });

            $("#mapsvg-admin").on("click", "#mapsvg-enter-purchase-code-link", function () {
                $("#mapsvg-alert-activate").show();
            });
            $("#mapsvg-alert-activate").on("click", ".close", function () {
                $("#mapsvg-alert-activate").hide();
            });

            $("#mapsvg-purchase-code-form").on("submit", function (e) {
                e.preventDetault();
            });

            $("#mapsvg-admin").on("click", "#mapsvg-btn-activate", function (e) {
                e.preventDefault();
                $(this).buttonLoading(true);
                var code = $('input[name="purchase_code"]').val();
                var server = new mapsvg.server();
                server
                    .put("purchasecode", { purchase_code: code })
                    .done(function (data) {
                        if (typeof data === "string") {
                            data = JSON.parse(data);
                        }
                        $("#mapsvg-alert-activate").hide();
                        alert(
                            'MapSVG is activated. You will be able to update the plugin on the "WP Admin Menu > Plugins" page.'
                        );
                        $("#mapsvg-btn-activate").buttonLoading(false);
                    })
                    .fail(function (data) {
                        if (data.responseJSON.error_message) {
                            $.growl.error({ title: "", message: data.responseJSON.error_message });
                        }
                        $("#mapsvg-btn-activate").buttonLoading(false);
                    })
                    .always(function () {
                        $("#mapsvg-btn-activate").buttonLoading(false);
                    });
            });
            $("#mapsvg-table").on("click", ".mapsvg-copy-shortcode", function () {
                var str = $(this).data("shortcode");
                var el = document.createElement("textarea");
                el.value = str;
                el.setAttribute("readonly", "");
                el.style.position = "absolute";
                el.style.left = "-9999px";
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
                $.growl.notice({
                    title: "",
                    message: "Shortcode copied to clipboard",
                    duration: 700,
                });
            });
            $(".select-map-list")
                .mselect2()
                .on("select2:select", function () {
                    var elem = $(this).find("option:selected");
                    // var package = elem.data('package');
                    // var path = elem.data('path');
                    var mapsRepo = new mapsvg.mapsRepository();
                    var options = {};
                    // var svg_file_url_path = '';
                    //
                    // if(package === 'default'){
                    //     svg_file_url_path = MapSVG.urls.maps + path;
                    // }else if(package === 'uploads'){
                    //     svg_file_url_path = MapSVG.urls.uploads + path;
                    // }
                    options.source = elem.data("relative-url");

                    mapsRepo.create({ options: options }).done(function (map) {
                        if (map && map.id) {
                            window.location.href = window.location.href + "&map_id=" + map.id;
                        }
                    });
                    // jQuery.post('/wp-json/mapsvg/v1/maps', {map: {package: package, path: path}}, function(data){
                    // if(data.map && data.map.id){
                    //     window.location = window.location.href+'&map_id='+data.map.id;
                    // }
                    // });
                    // var link = $(this).find("option:selected").data('link');
                    // if (link)
                    //     window.location = link+'&noheader=true';
                });

            var files = [];

            $("#svg_file_uploader").on("change", function (event) {
                $.each(event.target.files, function (index, file) {
                    if (file.type.indexOf("svg") == -1) {
                        alert("You can upload only SVG files");
                        return false;
                    }
                    var reader = new FileReader();
                    reader.onload = function (event) {
                        object = {};
                        object.filename = file.name;
                        object.data = event.target.result;
                        var data = $("<div>" + object.data + "</div>");
                        var gm = data.find("#mapsvg-google-map-background");
                        if (gm.length) {
                            var remove = confirm(
                                "Remove Google Maps background image from SVG file?"
                            );
                            if (remove) data.find("#mapsvg-google-map-background").remove();
                        }
                        object.data = data.html();
                        object.data.replace("<!--?xml", "<?xml");
                        object.data.replace('"no"?-->', '"no"?>');
                        object.data.replace("mapsvg:geoviewbox", "mapsvg:geoViewBox");

                        files.push(object);
                        $("#svg_file_uploader_form").submit();
                    };
                    reader.readAsText(file);
                });
            });
            $("#svg_file_uploader_form").on("submit", function (form) {
                var btn = $(this).find(".btn");
                btn.buttonLoading(true);

                const formData = new FormData();

                _this.appendFilesToFormData(formData, files);

                var server = new mapsvg.server();

                server
                    .post("svgfile", formData)
                    .done(function (data) {
                        if (data.file.name) {
                            $.growl.notice({
                                delay: 7000,
                                title: "",
                                message:
                                    "File uploaded:<br>" +
                                    data.file.pathShort +
                                    '<br /><br />Click on "New SVG file" and enter the file name to create a new map.',
                            });
                            var o = $("#mapsvg-svg-file-select").find(
                                '[data-relative-url="' + data.file.relativeUrl + '"]'
                            );
                            if (!o.length)
                                $("#mapsvg-svg-file-select").append(
                                    '<option data-relative-url="' +
                                        data.file.relativeUrl +
                                        '">' +
                                        data.file.pathShort +
                                        "</option>"
                                );
                        }
                    })
                    .fail(function (response) {
                        if (response.responseText) {
                            response = JSON.parse(response.responseText);
                            if (response && response.data && response.data.error) {
                                $.growl.error({ title: "", message: response.data.error });
                            }
                        }
                    })
                    .always(function () {
                        $("#svg_file_uploader").val("");
                        btn.buttonLoading(false);
                    });

                files = [];
                form.preventDefault();
            });

            var imgfiles = [];

            $("#image_file_uploader").on("change", function (event) {
                $.each(event.target.files, function (index, file) {
                    if (["image/png", "image/jpeg"].indexOf(file.type) == -1) {
                        alert("Supported file types: png / jpeg");
                        return false;
                    }

                    var reader = new FileReader();
                    reader.onload = function (event) {
                        var pngBase64 = event.target.result;
                        var image = new Image();

                        image.onload = function () {
                            object = {};
                            var timestamp = new Date().valueOf();
                            object.filename = file.name + "_" + timestamp + ".svg";
                            object.data =
                                '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
                                "\n" +
                                "<svg " +
                                'xmlns:mapsvg="http://mapsvg.com" ' +
                                'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
                                'xmlns:dc="http://purl.org/dc/elements/1.1/" ' +
                                'xmlns:cc="http://creativecommons.org/ns#" ' +
                                'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
                                'xmlns:svg="http://www.w3.org/2000/svg" ' +
                                'xmlns="http://www.w3.org/2000/svg" ' +
                                'version="1.1" ' +
                                'width="' +
                                this.width +
                                '" ' +
                                'height="' +
                                this.height +
                                '"> ' +
                                '<image id="mapsvg-image-background" class="mapsvg-image-background" xlink:href="' +
                                pngBase64 +
                                '"  x="0" y="0" height="' +
                                this.height +
                                '" width="' +
                                this.width +
                                '"></image>' +
                                "</svg>";
                            imgfiles.push(object);
                            $("#image_file_uploader_form").submit();
                        };
                        image.src = pngBase64;
                    };
                    reader.readAsDataURL(file);
                });
            });

            $("#image_file_uploader_form").on("submit", function (form) {
                var btn = $(this).find(".btn");
                btn.buttonLoading(true);

                const formData = new FormData();

                _this.appendFilesToFormData(formData, imgfiles);

                const server = new mapsvg.server();

                server
                    .post("svgfile", formData)
                    .done(function (data) {
                        var mapsRepo = new mapsvg.mapsRepository();
                        var options = {
                            source: data.file.relativeUrl,
                            title: "Image Map",
                        };
                        mapsRepo.create({ options: options }).done(function (map) {
                            if (map && map.id) {
                                window.location = window.location.href + "&map_id=" + map.id;
                            }
                        });
                    })
                    .fail(function (response) {
                        if (response.responseText) {
                            response = JSON.parse(response.responseText);
                            if (response && response.data && response.data.error) {
                                $.growl.error({ title: "", message: response.data.error });
                            }
                        }
                    })
                    .always(function () {
                        btn.buttonLoading(false);
                    });

                imgfiles = [];
                form.preventDefault();
            });

            $("#new-google-map").on("click", function (e) {
                // e.preventDefault();
                if (!MapSVG.options.google_api_key) {
                    settingsModal.show();
                    return false;
                }
                var mapsRepo = new mapsvg.mapsRepository();
                var options = {
                    source: MapSVG.urls.maps + "geo-calibrated/empty.svg",
                    title: "Google Map",
                    googleMaps: {
                        on: true,
                        apiKey: MapSVG.options.google_api_key,
                        zoom: 1,
                        center: { lat: 41.99585227532726, lng: 10.688006500000029 },
                    },
                };
                mapsRepo.create({ options: options }).done(function (map) {
                    if (map && map.id) {
                        window.location = window.location.href + "&map_id=" + map.id;
                    }
                });
            });
            $("#download_gmap").on("click", function () {
                if (!MapSVG.options.google_api_key) {
                    settingsModal.show();
                } else {
                    _this.showGoogleMapDownloader();
                }
            });

            // $("#save-api-key").on("click", function () {
            //     var key = $("#mapsvg-google-api-key").val();
            //     var key2 = $("#mapsvg-google-geocoding-api-key").val();
            //
            //     myModal.hide();
            //
            //     if (key && key.length) {
            //         var server = new mapsvg.server();
            //         server
            //
            //             .put("googleapikeys", { mapsApiKey: key, geocodingApiKey: key2 })
            //             .done(function (data) {
            //                 if (typeof data === "string") {
            //                     data = JSON.parse(data);
            //                 }
            //                 if (data.status === "OK") {
            //                     myModal.hide();
            //                     MapSVG.options.google_api_key = key;
            //                 } else {
            //                     alert("Error");
            //                 }
            //             });
            //     }
            // });

            $("#settingsModal").on("show.bs.modal", function () {
                let postTypes = _this.getPostTypes();
                let postOptions = postTypes.map((postType) => {
                    return { value: postType, label: postType, name: "mappable_post_types" };
                });

                var formSchema = new mapsvg.schema({
                    fields: [
                        {
                            name: "google_api_key",
                            label: "Google Maps API key",
                            type: "text",
                            help: "",
                        },
                        {
                            name: "google_geocoding_api_key",
                            label: "Google Geocoding API key",
                            type: "text",
                            help:
                                "Google Geocoding API is used to convert address to lat/lng coordinates and back.",
                        },
                        {
                            name: "mappable_post_types",
                            label: "Connect posts to maps",
                            type: "checkboxes",
                            help:
                                "Choose the post types you want to be able to add to a map while editing the post in Gutenberg editor.",
                            options: postOptions,
                        },
                    ],
                });

                var form = new mapsvg.formBuilder({
                    container: $("#settingsModal").find(".modal-body")[0],
                    scrollable: false,
                    showNames: false,
                    schema: formSchema,
                    // mapsvg: _this.mapsvg,
                    // mediaUploader: mediaUploader,
                    data: mapsvg.globals.options,
                    admin: _this,
                    events: {
                        save: function (formbuilder, data) {
                            jQuery.extend(mapsvg.globals.options, data);
                            _this.updateOptions(data);
                            settingsModal.hide();
                        },
                        close: function () {
                            settingsModal.hide();
                        },
                    },
                });
            });

            $("#settings-form").on("submit", function (e) {
                e.preventDefault();
                var options = {
                    google_api_key: $("#mapsvg-google-api-key").val(),
                    google_geocoding_api_key: $("#mapsvg-google-geocoding-api-key").val(),
                };
            });

            $("#save-api-key").on("click", function () {
                var options = {
                    google_api_key: $("#mapsvg-google-api-key").val(),
                    google_geocoding_api_key: $("#mapsvg-google-geocoding-api-key").val(),
                };

                if (options.google_api_key && options.google_api_key.length) {
                    var server = new mapsvg.server();
                    server.put("options", options).done(function (data) {
                        if (typeof data === "string") {
                            data = JSON.parse(data);
                        }
                        settingsModal.hide();
                        MapSVG.options.google_api_key = key;
                    });
                }
            });

            $("#mapsvg-table-maps")
                .on("click", "a.mapsvg-delete", methods.mapDelete)
                .on("click", "a.mapsvg-undo", methods.mapUndo)
                .on("click", "a.mapsvg-copy", methods.mapCopy)
                .on("click", "a.mapsvg-upgrade-v2", methods.mapUpgradeV2);
        },
        updateOptions: function (options) {
            var server = new mapsvg.server();
            server
                .post("options", { options: JSON.stringify(options) })
                .done(function (data) {
                    $.growl.notice({ title: "", message: "Settings saved" });
                })
                .fail(function (data) {
                    $.growl.error({ title: "", message: "Can't save settings" });
                });
        },
        setInputGrantAccessState: function (magicLink) {
            const btn = $("#mapsvg-toggle-magic-link");
            const btnModal = $("#btnCustomizationModal");

            if (magicLink) {
                $("#magic-link").val(magicLink).removeAttr("disabled");
                $("#mapsvg-submit-ticket-link")
                    .attr("href", "https://mapsvg.ticksy.com/submit/?magicLink=" + magicLink)
                    .removeAttr("disabled");
                $("#mapsvg-submit-ticket-link").removeClass("mapsvg-disabled-link");
                $("#mapsvg-how-to-grant-access").hide();
            }
            if (MapSVG.accessGranted) {
                // btn.text("Revoke access");
                // btn.removeClass("btn-outline-secondary");
                // btn.addClass("btn-outline-danger");
                // btn.attr("data-granted", "true");
                btnModal.removeClass("btn-outline-secondary");
                btnModal.addClass("btn-outline-danger");
                btnModal.html('<i class="mfa mfa-support"></i> Support: access granted</button>');
                $("#mapsvg-revoke-access-block").show();
            } else {
                // btn.text("Grant access");
                // btn.removeClass("btn-outline-danger");
                // btn.addClass("btn-outline-secondary");
                // btn.attr("data-granted", "false");
                btnModal.removeClass("btn-outline-danger");
                btnModal.addClass("btn-outline-secondary");
                btnModal.html('<i class="mfa mfa-support"></i> Support</button>');
                $("#mapsvg-revoke-access-block").hide();
                $("#magic-link").val("").attr("disabled", "disabled");
            }
            if (!MapSVG.userIsAdmin) {
                btn.attr("disabled", "disabled");
                $("#magic-link-disabled").show();
                $("#mapsvg-revoke-access-block").remove();
            }
        },
        copyMagicLinkToClipBoard: function () {
            $("#magic-link")[0].select();
            document.execCommand("copy");
            $.growl.notice({
                title: "",
                message: "The link has been copied to clipboard",
                duration: 3000,
            });
        },
        grantAccess: function () {
            var server = new mapsvg.server();
            const btn = $("#mapsvg-toggle-magic-link");
            btn.buttonLoading(true);
            server
                .post("magiclink")
                .done((result) => {
                    btn.buttonLoading(false);

                    if (result.link) {
                        MapSVG.accessGranted = true;
                        _this.setInputGrantAccessState(result.link);
                        _this.copyMagicLinkToClipBoard();
                    } else {
                        $.growl.error({
                            title: "",
                            message:
                                "Can't grant access automatically. Please provide your login/password in the ticket message. " +
                                "If you need an email address to create a new user account, please use this one: support@mapsvg.com",
                            duration: 30000,
                        });
                    }
                })
                .fail(() => {
                    btn.buttonLoading(false);
                    $.growl.error({
                        title: "",
                        message: "Can't create the link",
                        duration: 2000,
                    });
                });
        },
        revokeAccess: function () {
            var server = new mapsvg.server();
            const btn = $("#mapsvg-revoke-access");
            btn.buttonLoading(true);

            server
                .delete("magiclink")
                .done((result) => {
                    btn.buttonLoading(false);
                    MapSVG.accessGranted = false;
                    _this.setInputGrantAccessState();
                })
                .fail(() => {
                    btn.buttonLoading(false);
                    $.growl.error({
                        title: "",
                        message:
                            'Can\'t revoke access! Please go to <b>WP Admin &gt; Users</b> and remove "mapsvg" user.',
                        duration: 10000,
                    });
                });
        },
        setEventHandlers: function () {
            jQuery("#mapsvg-map-mode-2 input").on("change", (e) => {
                setTimeout(() => jQuery(e.target).blur(), 400);
            });

            $("body").on("click", ".toggle-tooltip", function () {
                $(this).tooltip("hide");
            });
            $("body").on("click", '[rel="tooltip"]', function () {
                $(this).tooltip("hide");
            });

            $("body").on("click", ".form-check-label", (e) => {
                let input = $(e.target).parent().find("input");
                if (input.length) {
                    $(input).prop("checked", !$(input).prop("checked"));
                    $(input).trigger("change");
                }
            });

            $("#mapsvg-admin").on("click", ".mapsvg-template-link", function () {
                var template = $(this).data("template");

                if (!_this.getData().controllers["templates"]) {
                    $('#mapsvg-tabs-menu a[href="#tab_templates"]').tab("show");
                    setTimeout(function () {
                        $("#tab_templates").find("select").val(template).trigger("change");
                    }, 500);
                } else {
                    $('#mapsvg-tabs-menu a[href="#tab_templates"]').tab("show");
                    $("#tab_templates").find("select").val(template).trigger("change");
                }
            });

            $("#mapsvg-admin").on("mousewheel", ".jspContainer", function (e) {
                e.preventDefault();
            });

            $(".mapsvg-copy-shortcode").on("click", function () {
                var str = $(this).data("shortcode");
                var el = document.createElement("textarea");
                el.value = str;
                el.setAttribute("readonly", "");
                el.style.position = "absolute";
                el.style.left = "-9999px";
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
                $.growl.notice({
                    title: "",
                    message: "The shortcode has been copied to clipboard",
                    duration: 3000,
                });
            });

            $(window).on("keydown.save.mapsvg", function (e) {
                if ((e.metaKey || e.ctrlKey) && e.keyCode == 83) {
                    e.preventDefault();
                    _data.mode != "draw" ? _this.save() : _data.controllers.draw.saveSvg();
                }
            });

            _data.view
                .on("click", "#mapsvg-save", function () {
                    _this.save();
                })
                .on("change", "#mapsvg-map-mode :radio", function () {
                    var mode = $("#mapsvg-map-mode :radio:checked").val();
                    _this.setMode(mode);
                })
                .on("change", "#mapsvg-preview-containers-toggle :checkbox", function () {
                    _this.toggleContainers($(this).is(":checked"));
                })
                .on("click", "button", function (e) {
                    e.preventDefault();
                });
            _data.view.on("change", "#mapsvg-map-mode-2 :radio", function () {
                var mode = $("#mapsvg-map-mode-2 :radio:checked").val();
                _this.setMode(mode);
            });
            $("#mapsvg-view-buttons").on("change", '[type="checkbox"]', function () {
                var visible = $(this).prop("checked");
                var name = $(this).attr("name");
                _this.togglePanel(name, visible, true);
            });

            $("#mapsvg-tabs-menu").on("click", "a", function (e) {
                e.preventDefault();
                $(this).tab("show");
            });

            $("#mapsvg-tabs-menu").on("shown.bs.tab", "a", function (e) {
                $("#mapsvg-tabs-menu .menu-name").html($(this).text());
                var h = $(this).attr("href");
                _this.resizeDashboard();
                var controllerContainer = $(h);
                var containerId = h.replace("#", "");
                var controller = controllerContainer.attr("data-controller");
                _this.loadController(containerId, controller);
            });
        },
        addController: function (menuTitle, controllerName, menuPositionAfter) {
            if (!$("#" + controllerName).length) {
                var menu = $("#mapsvg-tabs-menu .dropdown-menu");
                var after = menu.find('a[href="#' + menuPositionAfter + '"]').parent();
                $('<li><a href="#' + controllerName + '">' + menuTitle + "</a></li>").insertAfter(
                    after
                );
                $("#mapsvg-tabs").append(
                    '<div class="tab-pane" id="' +
                        controllerName +
                        '" data-controller="' +
                        controllerName +
                        '"></div>'
                );
            }
        },
        loadController: function (containerId, controllerName) {
            if (
                _data.currentController &&
                _data.currentController == _data.controllers[controllerName]
            )
                return;

            if (!_data.controllers[controllerName]) {
                var capitalized = controllerName.charAt(0).toUpperCase() + controllerName.slice(1);
                _data.controllers[controllerName] = new window[
                    "MapSVGAdmin" + capitalized + "Controller"
                ](containerId, _this, msvg);
            }

            _data.currentController && _data.currentController.viewDidDisappear();
            _data.currentController = _data.controllers[controllerName];
            _data.currentController.viewDidAppear();

            if (!$("#" + containerId).attr("data-controller")) {
                $("#" + containerId).attr("data-controller", controllerName);
            }
            if (!$("#" + containerId).hasClass("active")) {
                $('#mapsvg-tabs-menu a[href="#' + containerId + '"]').tab("show");
            }

            return _data.currentController;
        },
        unloadController: function (controllerObjectOrName) {
            if (typeof controllerObjectOrName != "string")
                controllerObjectOrName = controllerObjectOrName.nameCamel();
            _data.controllers[controllerObjectOrName].destroy();
            _data.controllers[controllerObjectOrName] = null;
            _data.currentController = null;

            if (controllerObjectOrName == "draw") {
                _data.controllers["drawRegion"] = null;
            }
        },
        createControllerContainer: function (controllerName) {
            var containerId = "mapsvg-controller-" + controllerName;
            if ($("#" + containerId).length === 0) {
                return $('<div id="' + containerId + '" class="full-flex" />');
            } else {
                return $("#" + containerId);
            }
        },
        goBackToController: function (fromController, toControllerName) {
            this.slideToController(fromController, toControllerName, "back");
        },
        goForwardToController: function (fromController, toControllerName) {
            this.slideToController(fromController, toControllerName, "forward");
        },
        slideToController: function (fromController, toControllerName, direction) {
            var container;
            if (!_data.controllers[toControllerName]) {
                container = this.createControllerContainer(toControllerName);
                if (direction == "back") {
                    container.addClass("mapsvg-slide-back").insertBefore(fromController.container);
                } else {
                    container
                        .addClass("mapsvg-slide-forward")
                        .insertAfter(fromController.container);
                }
            } else {
                container = _data.controllers[toControllerName].container;
            }
            this.loadController(container.attr("id"), toControllerName);
            if (direction == "back") {
                fromController.slideForward();
                _data.controllers[toControllerName].slideForward();
                _data.controllers[toControllerName].history.forward = fromController;
            } else {
                fromController.slideBack();
                _data.controllers[toControllerName].slideBack();
                _data.controllers[toControllerName].history.back = fromController;
            }
        },
        init: function (options) {
            // var bootstrapButton = $.fn.button.noConflict();
            // $.fn._button = bootstrapButton;
            if (MapSVG.isMac()) {
                $("body").addClass("mapsvg-os-mac");
            } else {
                $("body").addClass("mapsvg-os-other");
            }

            _data.options = options;
            _data.controllers = {};
            _data.view = $("#mapsvg-admin");

            _this.setInputGrantAccessState();
            $("#customizationModal").appendTo("body");
            const customModal = new bootstrap.Modal(document.getElementById("customizationModal"), {
                keyboard: true,
            });
            $("#btnCustomizationModal").on("click", () => {
                customModal.show();
            });
            $("#mapsvg-toggle-magic-link").on("click", (e) => {
                _this.grantAccess();
            });
            $("#mapsvg-revoke-access").on("click", function () {
                _this.revokeAccess();
            });
            $("#mapsvg-copy-magic-link").on("click", function () {
                _this.copyMagicLinkToClipBoard();
            });

            var onEditMapScreen = _data.options.map ? true : false;

            if (onEditMapScreen) {
                if (!options.map || options.map.optionsBroken) {
                    alert(
                        "Map settings are corrupted. Please contact support: https://mapsvg.ticksy.com"
                    );
                    return;
                }
                _this.setMapTitle(_data.options.map.options.title);
            }

            $("body").addClass("mapsvg-edit-screen");

            $(document).ready(function () {
                // Position control panel in WordPress
                if (WP && onEditMapScreen) {
                    new ResizeSensor($("#adminmenuwrap")[0], function () {
                        _this.resizeDashboard();
                    });
                    new ResizeSensor($("#wpwrap")[0], function () {
                        _this.resizeDashboard();
                    });
                    new ResizeSensor($("#mapsvg")[0], function () {
                        _this.resizeDashboard();
                    });

                    _this.resizeDashboard();
                }

                setTimeout(function () {
                    _data.view.tooltip({
                        selector: ".toggle-tooltip",
                        trigger: "hover",
                    });
                }, 1000);

                $("body").on("click", ".mapsvg-update", methods.mapUpdate);

                if (onEditMapScreen) {
                    _this.addHandlebarsMethods();

                    var originalAferLoad = _data.options.map.options.afterLoad;

                    _data.options.map.options.backend = true;

                    if (_data.options.map.options.manualRegions) {
                        $('label[data-mode="addRegions"]').show();
                    }

                    _data.options.map.options.editMode = true;
                    if (!_data.options.map.options.googleMaps) {
                        _data.options.map.options.googleMaps = {};
                    }
                    _data.options.map.options.googleMaps.apiKey = MapSVG.options.google_api_key;

                    msvg = new mapsvg.map("mapsvg", _data.options.map);

                    msvg.events.on("afterLoad", function () {
                        if (!window.m) {
                            window.m = msvg;
                        }

                        new ResizeSensor($(".mapsvg-header")[0], function () {
                            setTimeout(function () {
                                _this.resizeSVGCanvas();
                            }, 1);
                        });

                        // TODO change this to onCLick events
                        //msvg.setMarkerEditHandler(methods.markerEditHandler);
                        msvg.setRegionEditHandler(methods.regionEditHandler);

                        hbData = msvg.getOptions(true);
                        _this.hbData = hbData;
                        if (msvg.presentAutoID) {
                            $("#mapsvg-auto-id-warning").show();
                        }

                        _this.setMode("preview");

                        hbData.isGeo = msvg.mapIsGeo;
                        if (hbData.isGeo) {
                            $("#mapsvg-admin").addClass("mapsvg-is-geo");
                        }
                        MapSVG.markerImages = _data.options.markerImages || [];
                        if (!_data.options.map.options.defaultMarkerImage) {
                            msvg.setDefaultMarkerImage(_data.options.markerImages[0].relativeUrl);
                        }

                        // Safary is laggy when there are many input fields in a form. We'll need
                        // to wrap each input with <form /> tag
                        hbData.isSafari =
                            navigator.vendor &&
                            navigator.vendor.indexOf("Apple") > -1 &&
                            navigator.userAgent &&
                            !navigator.userAgent.match("CriOS");

                        if (
                            _data.options.map.options.extension &&
                            $().mapSvg.extensions &&
                            $().mapSvg.extensions[_data.options.map.options.extension]
                        ) {
                            var ext = $().mapSvg.extensions[_data.options.map.options.extension];
                            ext && ext.backend(msvg, _this);
                        }

                        // Preload
                        _data.controllers.settings = new MapSVGAdminSettingsController(
                            "tab_settings",
                            _this,
                            msvg
                        );
                        _data.controllers.database = new MapSVGAdminDatabaseController(
                            "database-controller",
                            _this,
                            msvg
                        );
                        _data.controllers.regions = new MapSVGAdminRegionsController(
                            "tab_regions",
                            _this,
                            msvg
                        );

                        $(document).on("focus", ".select2-selection--single", function (e) {
                            select2_open = $(this).parent().parent().prev("select");
                            select2_open.mselect2("open");
                        });

                        // Wrap input into form for Safari, otherwise form will be very slow
                        if (hbData.isSafari) {
                            _data.view
                                .find('input[type="text"]')
                                .closest(".form-group")
                                .wrap("<form />");
                        }

                        _this.setEventHandlers();
                        _this.resizeDashboard();

                        try {
                            originalAferLoad(msvg);
                        } catch (err) {}

                        if (
                            _data.options.map.options.extension &&
                            $().mapSvg.extensions &&
                            $().mapSvg.extensions[_data.options.map.options.extension]
                        ) {
                            var ext = $().mapSvg.extensions[_data.options.map.options.extension];
                            ext && ext.backendAfterLoad(msvg);
                        }
                    });

                    return _this;
                } else {
                    _this.setEventHandlersMainScreen();
                    if (!_data.options.seenWhatsNew) {
                        const whatsNewModal = new bootstrap.Modal(
                            document.getElementById("whatsNewModal"),
                            {
                                keyboard: true,
                            }
                        );
                        whatsNewModal.show();
                    }
                }
            });
            return _this;
        },
        showGoogleMapDownloader: function () {
            if (!_this.googleMapsFullscreenWrapper) {
                _this.googleMapsFullscreenWrapper = $("#mapsvg-google-map-fullscreen-wrap");

                _this.googleMapsFullscreenWrapper
                    .on("click", "#mapsvg-gm-download", function (e) {
                        e.preventDefault();
                        var link = $(this);
                        var _w = window;

                        html2canvas($("#mapsvg-google-map-fullscreen div[aria-label=Map]")[0], {
                            useCORS: true,
                            onrendered: function (canvas) {
                                var server = new mapsvg.server();

                                var dataUrl = canvas.toDataURL("image/png");
                                var bounds = _this.gm.getBounds().toJSON();
                                bounds = [bounds.west, bounds.north, bounds.east, bounds.south];

                                var width = canvas.width * 20;
                                var height = canvas.height * 20;

                                var file = { filename: "mapsvg.svg" };

                                file.data =
                                    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
                                    "\n" +
                                    "<svg " +
                                    'xmlns:mapsvg="http://mapsvg.com" ' +
                                    'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
                                    'xmlns:dc="http://purl.org/dc/elements/1.1/" ' +
                                    'xmlns:cc="http://creativecommons.org/ns#" ' +
                                    'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" ' +
                                    'xmlns:svg="http://www.w3.org/2000/svg" ' +
                                    'xmlns="http://www.w3.org/2000/svg" ' +
                                    'version="1.1" ' +
                                    'width="' +
                                    width +
                                    '" ' +
                                    'height="' +
                                    height +
                                    '" ' +
                                    'mapsvg:geoViewBox="' +
                                    bounds.join(" ") +
                                    '">' +
                                    '<image id="mapsvg-google-map-background" xlink:href="' +
                                    dataUrl +
                                    '"  x="0" y="0" height="' +
                                    height +
                                    '" width="' +
                                    width +
                                    '"></image>' +
                                    "</svg>";

                                const formData = new FormData();
                                var files = [];
                                files.push(file);

                                _this.appendFilesToFormData(formData, files);

                                server.post("svgfile", formData).done(function (data) {
                                    location.href = server.getUrl("svgfile/download");
                                });
                            },
                        });
                    })
                    .on("click", "#mapsvg-gm-close", function () {
                        _this.googleMapsFullscreenWrapper.hide();
                        $("body").css("overflow", "auto");
                    });
            }

            _this.googleMapsFullscreenWrapper.show();
            $("body").css("overflow", "hidden");

            if (!_this.gmloaded) {
                var server = new mapsvg.server();

                var locations = new Bloodhound({
                    datumTokenizer: Bloodhound.tokenizers.obj.whitespace("formatted_address"),
                    queryTokenizer: Bloodhound.tokenizers.whitespace,
                    remote: {
                        url: server.getUrl("geocoding") + "?address=%QUERY%",
                        // url: 'https://maps.googleapis.com/maps/api/geocode/json?key='+MapSVG.options.google_api_key+'&address=%QUERY%&sensor=true',
                        wildcard: "%QUERY%",
                        transform: function (response) {
                            if (response.error_message) {
                                alert(response.error_message);
                            }
                            return response.results;
                        },
                        rateLimitWait: 500,
                    },
                });
                var thContainer = _this.googleMapsFullscreenWrapper.find(
                    "#mapsvg-gm-address-search"
                );

                var tH = thContainer.typeahead(null, {
                    name: "mapsvg-addresses",
                    display: "formatted_address",
                    // source: locations,
                    source: (query, sync, async) => {
                        MapSVG.geocode({ address: query }, async);
                    },
                    async: true,
                    minLength: 2,
                });
                thContainer.on("typeahead:select", function (ev, item) {
                    var b = item.geometry.bounds ? item.geometry.bounds : item.geometry.viewport;
                    var bounds = new google.maps.LatLngBounds(b.getSouthWest(), b.getNorthEast());
                    _this.gm.fitBounds(bounds);
                });
                // $('#mapsvg-gm-address-search').on('focus', function(){
                //     $(this).select();
                // });

                _this.gmapikey = MapSVG.options.google_api_key;
                window.gm_authFailure = function () {
                    if (MapSVG.GoogleMapBadApiKey) {
                        MapSVG.GoogleMapBadApiKey();
                    } else {
                        alert("Google Maps API key is incorrect.");
                    }
                };
                _data.googleMapsScript = document.createElement("script");
                _data.googleMapsScript.onload = function () {
                    // _data.googleMaps.loaded = true;
                    // if(typeof callback == 'function')
                    //     callback();
                    _this.loadgm();
                };

                _data.googleMapsScript.src =
                    "https://maps.googleapis.com/maps/api/js?key=" +
                    _this.gmapikey +
                    "&language=en"; //+'&callback=initMap';

                document.head.appendChild(_data.googleMapsScript);
                _this.gmloaded = true;
            } else {
                _this.loadgm();
            }

            // });
        },
        loadgm: function () {
            _this.gm = new google.maps.Map($("#mapsvg-google-map-fullscreen")[0], {
                zoom: 2,
                center: new google.maps.LatLng(-34.397, 150.644),
                mapTypeId: "roadmap",
                fullscreenControl: false,
                // keyboardShortcuts: true,
                mapTypeControl: true,
                scaleControl: true,
                scrollwheel: true,
                streetViewControl: false,
                zoomControl: true,
            });
        },
        /**
         * Append files to formData as blobs
         *
         * @param formData {FormData}
         * @param files {Array}
         * @returns FormData
         */
        appendFilesToFormData(formData, files) {
            files.forEach((file) => {
                const blob = new Blob([file.data], { type: "text/xml" });
                formData.append("file", blob, file.filename.replace(/\s/g, "_"));
            });

            return formData;
        },
    };

    _this = methods;
    $.fn.buttonLoading = function (status) {
        var $this = $(this);

        var _status = status !== false;

        if (_status === true) {
            var loadingText = $(this).attr("data-loading-text");
            $this.data("original-text", $(this).html());
            //  $this.data("original-text", $(this).html());
            $this.text(loadingText);
            $this.attr("disabled", "disabled");
        } else {
            $this.html($this.data("original-text"));
            $this.removeAttr("disabled");
        }
        return $this;
    };

    /** $.FN **/
    $.fn.mapsvgadmin = function (opts) {
        if (methods[opts]) {
            return methods[opts].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof opts === "object") {
            return methods.init.apply(this, arguments);
        } else if (!opts) {
            return methods;
        } else {
            $.error("Method " + method + " does not exist on mapSvg plugin");
        }
    };
})(jQuery, mapsvg.globals);
