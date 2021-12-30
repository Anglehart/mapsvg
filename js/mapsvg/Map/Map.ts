/// <reference types="@types/googlemaps" />
import { MapSVG } from "../Core/globals.js";
import { DefaultOptions } from "./default-options.js";
import { tinycolor } from "../Vendor/tinycolor.js";
import { MapsRepository } from "./MapsRepository";
import { MapsV2Repository } from "./MapsV2Repository";
import { Converter } from "./Converter";

// import {Handlebars} from "../../handlebars.js"
// @ts-ignore
import Handlebars from "Handlebars";
import {} from "googlemaps";
import { ResizeSensor } from "../Core/ResizeSensor";
import {
    GroupOptionsInterface,
    GalleryOptionsInterface,
    LayersControlOptionsInterface,
    MapOptionsInterface,
    ViewBox,
    GeoViewBox,
} from "./MapOptionsInterface";

import {
    Location,
    GeoPoint,
    ScreenPoint,
    LocationOptionsInterface,
    SVGPoint,
} from "../Location/Location";
import { Marker } from "../Marker/Marker";
import { MarkerCluster } from "../MarkerCluster/MarkerCluster";
import { Region } from "../Region/Region";
import { Query } from "../Infrastructure/Server/Query";
import { CustomObject } from "../Object/CustomObject";
import { Schema } from "../Infrastructure/Server/Schema";
import { SchemaField } from "../Infrastructure/Server/SchemaField";
import { SchemaRepository } from "../Infrastructure/Server/SchemaRepository";
import { DirectoryController } from "../Directory/Directory";
import { Events } from "../Core/Events";
import { Repository } from "../Core/Repository";
import { CustomObjectsRepository } from "../Object/CustomObjectsRepository";
import { FiltersController } from "../Filters/Filters";
import { MapObject } from "../MapObject/MapObject";
import { DetailsController } from "../Details/Details";
import { PopoverController } from "../Popover/Popover";
import { FormBuilder } from "../FormBuilder/FormBuilder";
import { ArrayIndexed } from "../Core/ArrayIndexed";
import { Server } from "../Infrastructure/Server/Server";
import htmlString = JQuery.htmlString;
import { RegionsRepository } from "../Region/RegionsRepository";
import { Tooltip } from "../Tooltips/Tooltip";

const $ = jQuery;

/**
 * MapSVG.Map class. Creates a new map inside of the given HTML container, which is typically a DIV element.
 * @constructor
 *
 * @param {string} id - ID of the map container
 * @param {MapOptionsInterface} options - map settings
 *
 * @example
 * // Create the map in <div id="my-container-id"></div>:
 * var mapsvg = new MapSVGMap("my-container-id", {
 *   source: "/path/to/map.svg",
 *   zoom: {on: true},
 *   scroll: {on: true}
 * });
 *
 * // Get map instance by container ID
 * var mapsvg = MapSVG.getById("my-container-id");
 *
 * // Get map instance by index number
 * var mapsvg_1 = MapSVG.get(0); // first map on the page
 * var mapsvg_2 = MapSVG.get(1); // second map.
 *
 */
class MapSVGMap {
    //static MapSVG = MapSVG;

    id: number;
    containerId: string;
    markerOptions: Record<string, unknown> = { src: MapSVG.urls.root + "markers/pin1_red.png" };

    converter: Converter;

    dirtyFields: string[];

    regions: ArrayIndexed<Region>;
    objects: ArrayIndexed<CustomObject>;

    regionsRepository: Repository;
    objectsRepository: Repository;
    filtersRepository: Repository;
    schemaRepository: SchemaRepository;

    events: Events;

    resizeSensor: ResizeSensor;

    liveCss: HTMLStyleElement;

    defaults: MapOptionsInterface;
    options: MapOptionsInterface;
    optionsDelta: { [key: string]: any };

    mapIsGeo: boolean;
    geoCoordinates: boolean;
    editMode: boolean;
    highlightedRegions: Array<Region>;
    editRegions: { on: boolean };
    editMarkers: { on: boolean };
    clickAddsMarker: boolean;
    editData: { on: boolean };
    disableLinks: boolean;
    markerEditHandler: (location: Location) => void;
    regionEditHandler: () => void;
    objectClickedBeforeScroll: Region | Marker | MarkerCluster;
    highlighted_marker: Marker;

    googleMaps?: {
        loaded: boolean;
        map: google.maps.Map;
        zoomLimit?: boolean;
        overlay?: any;
        initialized: boolean;
        maxZoomService?: google.maps.MaxZoomService;
        currentMaxZoom?: number;
    };

    groups: ArrayIndexed<GroupOptionsInterface>;
    galleries: ArrayIndexed<GalleryOptionsInterface>;

    svgDefault: {
        viewBox?: ViewBox;
        geoViewBox?: GeoViewBox;
        width?: number;
        height?: number;
    };

    viewBox: ViewBox;
    _viewBox: ViewBox;
    viewBoxFull: ViewBox;
    viewBoxFake: ViewBox;
    whRatioFull: number;
    geoViewBox?: GeoViewBox;

    mapLonDelta: number;
    mapLatBottomDegree: number;

    zoomLevel: number;
    zoomLevels: ArrayIndexed<{
        zoomLevel: number;
        viewBox: ViewBox;
        _scale: number;
    }>;
    isZooming: boolean;
    touchZoomStart: boolean;
    scaleDistStart: number;
    scrollStarted: boolean;

    isScrolling: boolean;
    zoomDelta: number;
    whRatio: number;
    vbStart: boolean;

    scale: number;
    _scale: number;
    superScale: number;
    scroll: {
        tx?: number;
        ty?: number;
        vxi?: number;
        vyi?: number; // initial viewbox when scrollning started
        x?: number;
        y?: number; // mouse coordinates when scrolling started
        dx?: number;
        dy?: number; // mouse delta
        vx?: number;
        vy?: number; // new viewbox x/y
        gx?: number;
        gy?: number; // for google maps scroll
        touchScrollStart: number;
    };

    iosDownscaleFactor: number;

    containers: {
        svg?: SVGSVGElement;
        map?: HTMLElement;
        googleMaps?: HTMLElement;
        mapContainer?: HTMLElement;
        scrollpane?: HTMLElement;
        scrollpaneWrap?: HTMLElement;
        wrap?: HTMLElement;
        wrapAll?: HTMLElement;
        loading?: HTMLElement;
        directory?: HTMLElement;
        filters?: HTMLElement;
        detailsView?: HTMLElement;
        popover?: HTMLElement;
        tooltip?: HTMLElement;
        layers?: HTMLElement;
        layersControl?: HTMLElement;
        layersControlLabel?: HTMLElement;
        layersControlList?: HTMLElement;
        layersControlListNano?: HTMLElement;
        pagerMap?: HTMLElement;
        pagerDir?: HTMLElement;
        leftSidebar?: HTMLElement;
        rightSidebar?: HTMLElement;
        header?: HTMLElement;
        footer?: HTMLElement;
        filterTags?: HTMLElement;
        filtersModal?: HTMLElement;
        clustersCss?: HTMLStyleElement;
        clustersHoverCss?: HTMLStyleElement;
        markersCss?: HTMLStyleElement;
        controls?: HTMLElement;
        zoomButtons?: HTMLElement;
        legend?: {
            title: HTMLElement;
            text: HTMLElement;
            coloring: HTMLElement;
            description: HTMLElement;
            container: HTMLElement;
        };
        choroplethSourceSelect?: {
            container: HTMLElement;
            //label: HTMLElement,
            select: HTMLElement;
            options: Array<HTMLElement>;
        };
    };
    containersCreated: boolean;

    controllers: {
        detailsView?: DetailsController;
        popover?: PopoverController;
        directory?: DirectoryController;
        // TODO add tooltip controller
        tooltip?: Tooltip;
        filters?: FiltersController;
    };

    templates: {
        [key: string]: any; // returned by Handlebars.compile()
    };

    markers: ArrayIndexed<Marker>;
    clusters: Record<string, unknown>;
    markersClusters: ArrayIndexed<MarkerCluster>;
    firstDataLoad: boolean;
    clustersByZoom: Array<any>;
    selected_id: Array<string>;
    selected_marker: Marker;
    clusterizerWorker: Worker;
    editingMarker: Marker;

    filtersSchema: Schema;

    layers: {
        [key: string]: HTMLElement;
    };
    controls: {
        zoom: HTMLElement;
        userLocation: HTMLElement;
        zoomReset: HTMLElement;
        previousMap: HTMLElement;
    };
    formBuilder: any;
    tooltip: {
        posOriginal: { [key: string]: string };
        posShifted: { [key: string]: string };
        posShiftedPrev: { [key: string]: string };
        mirror: { [key: string]: number };
    };
    firefoxScroll: {
        insideIframe: boolean;
        scrollX: number;
        scrollY: number;
    };
    canZoom: boolean;
    eventsPreventList: { [key: string]: boolean };
    googleMapsScript: HTMLScriptElement;

    fitOnDataLoadDone: boolean;
    fitDelta: number;
    lastTimeFitWas: number;
    userLocation: Location;
    userLocationMarker: Marker;
    setMarkersByField: boolean;
    locationField: SchemaField;
    popoverShowingFor: MapObject;

    svgFileLastChanged: number;

    changedFields: any;
    changedSearch: any;

    /* This property comes from v5 without any changes */
    $gauge: any;

    /**
     * AfterLoad event can be blocked by:
     * 1. Loading Google API JS files
     * 2. Loading filters controller
     * When a blocker is introduced, it increases the number of afterLoadBlockers
     * when mapsvg.finalizeMapLoading is called, it checks if afterLoadBlockers = 0
     */
    afterLoadBlockers: number;
    loaded: boolean;

    /**
     *
     * @param containerId
     * @param mapParams
     * @param externalParams
     */

    constructor(
        containerId: string,
        mapParams: {
            id: number;
            options: MapOptionsInterface;
            svgFileLastChanged: number;
            version: string;
        },
        externalParams?: { [key: string]: any }
    ) {
        const options = mapParams.options;

        this.updateOutdatedOptions(options);

        this.dirtyFields = [];

        this.containerId = containerId;
        this.options = <MapOptionsInterface>$.extend(true, {}, DefaultOptions, options);

        this.options.source = this.urlToRelativePath(this.options.source);

        this.editMode = this.options.editMode;
        delete this.options.editMode;

        this.id = mapParams.id;
        this.svgFileLastChanged = mapParams.svgFileLastChanged;

        this.regions = new ArrayIndexed("id");
        this.objects = new ArrayIndexed("id");

        this.events = new Events(this);

        this.highlightedRegions = [];
        this.editRegions = { on: false };
        this.editMarkers = { on: false };
        this.editData = { on: false };

        this.controllers = {};

        // Set containers
        this.containers = {
            map: document.getElementById(this.containerId),
            scrollpane: $('<div class="mapsvg-scrollpane"></div>')[0],
            scrollpaneWrap: $('<div class="mapsvg-scrollpane-wrap"></div>')[0],
            layers: $('<div class="mapsvg-layers-wrap"></div>')[0],
        };

        this.containers.map.appendChild(this.containers.layers);
        this.containers.map.appendChild(this.containers.scrollpaneWrap);
        this.containers.scrollpaneWrap.appendChild(this.containers.scrollpane);

        this.whRatio = 0;
        this.isScrolling = false;
        this.markerOptions = {};
        this.svgDefault = {};
        this.scale = 1; // absolute scale
        this._scale = 1; // relative scale starting from current zoom level
        this.selected_id = [];

        this.regions = new ArrayIndexed("id");

        if (!this.options.database.regionsTableName) {
            this.options.database.regionsTableName = "regions_" + this.id;
        }
        if (!this.options.database.objectsTableName) {
            this.options.database.objectsTableName = "objects_" + this.id;
        }

        this.regionsRepository = new Repository(
            "region",
            "regions/" + this.options.database.regionsTableName
        );
        // Turn off pagination for Regions:
        this.regionsRepository.query.update({ perpage: 0 });

        this.objectsRepository = new Repository(
            "object",
            "objects/" + this.options.database.objectsTableName
        );
        if (this.options.database.noFiltersNoLoad) {
            this.objectsRepository.setNoFiltersNoLoad(true);
        }

        this.objectsRepository.query.update({
            perpage: this.options.database.pagination.on
                ? this.options.database.pagination.perpage
                : 0,
        });

        this.schemaRepository = new SchemaRepository();

        this.markers = new ArrayIndexed("id");
        this.markersClusters = new ArrayIndexed("id");
        this._viewBox = new ViewBox(0, 0, 0, 0); // initial viewBox
        this.viewBox = new ViewBox(0, 0, 0, 0); // current viewBox
        this.zoomLevel = 0;
        this.scroll = {
            tx: 0,
            ty: 0,
            vxi: 0,
            vyi: 0, // initial viewbox when scrollning started
            x: 0,
            y: 0, // mouse coordinates when scrolling started
            dx: 0,
            dy: 0, // mouse delta
            vx: 0,
            vy: 0, // new viewbox x/y
            gx: 0,
            gy: 0, // for google maps scroll
            touchScrollStart: 0,
        };
        this.layers = {};
        this.geoCoordinates = false;
        this.geoViewBox = new GeoViewBox(new GeoPoint(0, 0), new GeoPoint(0, 0));
        this.eventsPreventList = {};
        this.googleMaps = {
            loaded: false,
            initialized: false,
            map: null,
            zoomLimit: true,
            maxZoomService: null,
        };

        // Set 3 blockers initially:
        // 1. The map loading process itself
        this.afterLoadBlockers = 1;
        this.loaded = false;

        // 2. Regions loading
        // 3. Objects loading
        if (this.id) {
            this.afterLoadBlockers += 2;
        }

        // 4. Google maps API blocker?
        if (this.options.googleMaps.on) {
            this.afterLoadBlockers++;
        }
        // 5. Filters may block too because the load remote HTML filters which is async process
        if (this.filtersShouldBeShown()) {
            this.afterLoadBlockers++;
        }

        // if (MapSVG && externalParams) {
        //     for (const i in externalParams) {
        //         MapSVG[i] = externalParams[i];
        //         window.MapSVG[i] = externalParams[i];
        //     }
        // }

        this.init();
    }

    /**
     * Return relative path part of the URL
     * @param {string} url
     * @returns string
     * @private
     */
    urlToRelativePath(url: string): string {
        if (url.indexOf("//") === 0) url = url.replace(/^\/\/[^/]+/, "").replace("//", "/");
        else url = url.replace(/^.*:\/\/[^/]+/, "").replace("//", "/");
        return url;
    }

    /**
     * Sets visiblity switches for groups of SVG objects
     * @private
     */
    setGroups(groups?: GroupOptionsInterface[]): void {
        const _this = this;

        if (!this.groups) {
            _this.groups = new ArrayIndexed("id", _this.options.groups, {
                autoId: true,
                unique: true,
            });
        } else {
            this.options.groups = this.groups;
        }

        _this.groups.forEach(function (g: GroupOptionsInterface) {
            g.objects &&
                g.objects.length &&
                g.objects.forEach(function (obj) {
                    _this.containers.svg
                        .querySelector("#" + obj.value)
                        .classList.toggle("mapsvg-hidden", !g.visible);
                });
        });
    }

    /**
     * Returns the list of options for visibility settings in admin.js
     */
    getGroupSelectOptions(): any[] {
        const _this = this;
        let id;
        const optionGroups = [];
        const options = [];
        const options2 = [];

        $(_this.containers.svg)
            .find("g")
            .each(function (index) {
                const id = $(this)[0].getAttribute("id");
                if (id) {
                    const title = $(this)[0].getAttribute("title");
                    options.push({ label: title || id, value: id });
                }
            });
        optionGroups.push({ title: "SVG Layers / Groups", options: options });

        $(_this.containers.svg)
            .find("path,ellipse,circle,polyline,polygon,rectangle,img,text")
            .each(function (index) {
                const id = $(this)[0].getAttribute("id");
                if (id) {
                    const title = $(this)[0].getAttribute("title");
                    options2.push({ label: title || id, value: id });
                }
            });
        optionGroups.push({ title: "Other SVG objects", options: options2 });

        return optionGroups;
    }

    /**
     * Sets visibility switches
     * @param {object} options - Options
     * @private
     */
    setLayersControl(options?: LayersControlOptionsInterface): void {
        const _this = this;

        if (options) $.extend(true, this.options.layersControl, options);

        if (this.options.layersControl.on) {
            if (!this.containers.layersControl) {
                this.containers.layersControl = document.createElement("div");
                this.containers.layersControl.classList.add("mapsvg-layers-control");

                this.containers.layersControlLabel = document.createElement("div");
                this.containers.layersControlLabel.classList.add("mapsvg-layers-label");
                this.containers.layersControl.appendChild(this.containers.layersControlLabel);

                const layersControlWrap = document.createElement("div");
                layersControlWrap.classList.add("mapsvg-layers-list-wrap");
                this.containers.layersControl.appendChild(layersControlWrap);

                this.containers.layersControlListNano = document.createElement("div");
                this.containers.layersControlListNano.classList.add("nano");
                layersControlWrap.appendChild(this.containers.layersControlListNano);

                this.containers.layersControlList = document.createElement("div");
                this.containers.layersControlList.classList.add("mapsvg-layers-list");
                this.containers.layersControlList.classList.add("nano-content");
                this.containers.layersControlListNano.appendChild(
                    this.containers.layersControlList
                );

                this.containers.mapContainer.appendChild(this.containers.layersControl);
            }
            this.containers.layersControl.style.display = "block";
            this.containers.layersControlLabel.innerHTML = this.options.layersControl.label;

            this.containers.layersControlLabel.style.display = "block";
            this.containers.layersControlList.innerHTML = "";
            while (this.containers.layersControlList.firstChild) {
                this.containers.layersControlList.removeChild(
                    this.containers.layersControlList.firstChild
                );
            }
            this.containers.layersControl.classList.remove(
                "mapsvg-top-left",
                "mapsvg-top-right",
                "mapsvg-bottom-left",
                "mapsvg-bottom-right"
            );
            this.containers.layersControl.classList.add(
                "mapsvg-" + this.options.layersControl.position
            );
            if (
                this.options.menu.on &&
                !this.options.menu.customContainer &&
                this.options.layersControl.position.indexOf("left") !== -1
            ) {
                this.containers.layersControl.style.left = this.options.menu.width;
            }

            this.containers.layersControl.style.maxHeight = this.options.layersControl.maxHeight;

            this.options.groups.forEach((g) => {
                const item = document.createElement("div");
                item.classList.add("mapsvg-layers-item");
                item.setAttribute("data-group-id", g.id);
                item.innerHTML =
                    '<input type="checkbox" class="ios8-switch ios8-switch-sm" ' +
                    (g.visible ? "checked" : "") +
                    " /><label>" +
                    g.title +
                    "</label>";
                this.containers.layersControlList.appendChild(item);
            });

            // @ts-ignore
            $(this.containers.layersControlListNano).nanoScroller({
                preventPageScrolling: true,
                iOSNativeScrolling: true,
            });

            $(this.containers.layersControl).off();
            $(this.containers.layersControl).on("click", ".mapsvg-layers-item", function () {
                const id = $(this).data("group-id");
                const input = $(this).find("input");
                input.prop("checked", !input.prop("checked"));
                _this.groups.forEach(function (g) {
                    if (g.id === id) g.visible = !g.visible;
                });
                _this.setGroups();
            });
            $(this.containers.layersControlLabel).off();
            $(this.containers.layersControlLabel).on("click", () => {
                $(_this.containers.layersControl).toggleClass("closed");
            });

            $(this.containers.layersControl).toggleClass(
                "closed",
                !this.options.layersControl.expanded
            );
        } else {
            if (this.containers.layersControl) {
                this.containers.layersControl.style.display = "none";
            }
        }
    }

    loadDataObjects(params?: any): JQueryDeferred<any> {
        return this.objectsRepository.find(params);
    }

    loadDirectory(): void {
        // If "Load DB on start" is off then
        // don't load directory to prevent 'no records found' message from appearing
        if (
            !this.editMode &&
            this.options.menu.source === "database" &&
            !this.objectsRepository.loaded
        ) {
            return;
        }
        if (this.options.menu.on) {
            this.controllers.directory.loadItemsToDirectory();
        }
        this.setPagination();
    }

    /**
     * Adds pagination controls to the map and/or directory
     */
    setPagination() {
        const _this = this;

        this.containers.pagerMap && $(this.containers.pagerMap).empty().remove();
        this.containers.pagerDir && $(this.containers.pagerDir).empty().remove();

        if (
            _this.options.database.pagination.on &&
            _this.options.database.pagination.perpage !== 0
        ) {
            this.containers.directory.classList.toggle(
                "mapsvg-with-pagination",
                ["directory", "both"].indexOf(_this.options.database.pagination.showIn) !== -1
            );
            this.containers.map.classList.toggle(
                "mapsvg-with-pagination",
                ["map", "both"].indexOf(_this.options.database.pagination.showIn) !== -1
            );

            if (_this.options.menu.on) {
                this.containers.pagerDir = _this.getPagination();
                _this.controllers.directory.addPagination(this.containers.pagerDir);
            }
            this.containers.pagerMap = _this.getPagination();
            this.containers.map.appendChild(this.containers.pagerMap);
        }
    }
    /**
     * Generates HTML with pagination buttons and attaches callback event on button click
     * @param {function} callback - Callback function that should be called on click on a next/prev page button
     */
    getPagination(callback?: () => void): HTMLElement {
        const _this = this;

        // pager && (pager.empty().remove());
        const pager = $(
            '<nav class="mapsvg-pagination"><ul class="pager"><!--<li class="mapsvg-first"><a href="#">First</a></li>--><li class="mapsvg-prev"><a href="#">&larr; ' +
                _this.options.database.pagination.prev +
                " " +
                _this.options.database.pagination.perpage +
                '</a></li><li class="mapsvg-next"><a href="#">' +
                _this.options.database.pagination.next +
                " " +
                _this.options.database.pagination.perpage +
                ' &rarr;</a></li><!--<li class="mapsvg-last"><a href="#">Last</a></li>--></ul></nav>'
        );

        if (this.objectsRepository.onFirstPage() && this.objectsRepository.onLastPage()) {
            pager.hide();
        } else {
            pager.find(".mapsvg-prev").removeClass("disabled");
            pager.find(".mapsvg-first").removeClass("disabled");
            pager.find(".mapsvg-last").removeClass("disabled");
            pager.find(".mapsvg-next").removeClass("disabled");

            this.objectsRepository.onLastPage() &&
                pager.find(".mapsvg-next").addClass("disabled") &&
                pager.find(".mapsvg-last").addClass("disabled");

            this.objectsRepository.onFirstPage() &&
                pager.find(".mapsvg-prev").addClass("disabled") &&
                pager.find(".mapsvg-first").addClass("disabled");
        }

        pager
            .on("click", ".mapsvg-next:not(.disabled)", (e) => {
                e.preventDefault();
                if (this.objectsRepository.onLastPage()) return;
                const query = new Query({ page: this.objectsRepository.query.page + 1 });
                this.objectsRepository.find(query).done(function () {
                    callback && callback();
                });
            })
            .on("click", ".mapsvg-prev:not(.disabled)", function (e) {
                e.preventDefault();
                if (_this.objectsRepository.onFirstPage()) return;
                const query = new Query({ page: _this.objectsRepository.query.page - 1 });
                _this.objectsRepository.find(query).done(function () {
                    callback && callback();
                });
            })
            .on("click", ".mapsvg-first:not(.disabled)", function (e) {
                e.preventDefault();
                if (_this.objectsRepository.onFirstPage()) return;
                const query = new Query({ page: 1 });
                _this.objectsRepository.find(query).done(function () {
                    callback && callback();
                });
            })
            .on("click", ".mapsvg-last:not(.disabled)", function (e) {
                e.preventDefault();
                if (_this.objectsRepository.onLastPage()) return;
                const query = new Query({ lastpage: true });
                _this.objectsRepository.find(query).done(function () {
                    callback && callback();
                });
            });

        return pager[0];
    }

    /**
     * Deletes all markers from the map
     */
    deleteMarkers() {
        while (this.markers.length) {
            this.markerDelete(this.markers[0]);
        }
    }

    /**
     * Deletes all markers from the map
     */
    deleteClusters(): void {
        if (this.markersClusters) {
            this.markersClusters.forEach(function (markerCluster) {
                markerCluster.destroy();
            });
            this.markersClusters.clear();
        }
    }

    /**
     * Adds locations from the database to the map - as markers or as clusters if clustering is enabled.
     * @private
     */
    addLocations(): void {
        const _this = this;
        this.firstDataLoad = this.firstDataLoad === undefined;

        let locationField = this.objectsRepository.getSchema().getFieldByType("location");
        if (!locationField) {
            return;
        }
        locationField = locationField.name;

        if (locationField) {
            if (this.firstDataLoad) {
                this.setMarkerImagesDependency();
            }

            _this.deleteMarkers();
            _this.deleteClusters();

            _this.clusters = {};
            _this.clustersByZoom = [];

            if (this.objectsRepository.getLoaded().length > 0) {
                this.objectsRepository.getLoaded().forEach(function (object) {
                    if (object[locationField]) {
                        if (
                            object[locationField].img &&
                            (object[locationField].geoPoint || object[locationField].svgPoint)
                        ) {
                            new Marker({
                                location: object[locationField],
                                object: object,
                                mapsvg: _this,
                            });
                        }
                    }
                });
                if (_this.options.clustering.on) {
                    _this.startClusterizer();
                } else {
                    this.objectsRepository.getLoaded().forEach(function (object) {
                        if (object.location && object.location.marker) {
                            _this.markerAdd(object.location.marker);
                        }
                    });
                    _this.mayBeFitMarkers();
                }
            }
        }
    }
    /**
     * Stores a set of markers/clusters for a certain zoom level for later use.
     * This method gets called by a worker thread that calculates markers/clusters for all zoom levels.
     * @param zoomLevel
     * @param clusters
     * @private
     */
    addClustersFromWorker(zoomLevel: number, clusters): void {
        const _this = this;

        _this.clustersByZoom[zoomLevel] = [];
        for (const cell in clusters) {
            const markers = clusters[cell].markers.map(function (marker) {
                return _this.objectsRepository.objects.findById(marker.id).location.marker;
            });
            _this.clustersByZoom[zoomLevel].push(
                new MarkerCluster(
                    {
                        markers: markers,
                        svgPoint: new SVGPoint(clusters[cell].x, clusters[cell].y),
                        cellX: clusters[cell].cellX,
                        cellY: clusters[cell].cellY,
                    },
                    _this
                )
            );
        }
        if (_this.zoomLevel === zoomLevel) {
            _this.clusterizeMarkers();
        }
    }
    /**
     * Starts clusterizer worker in a separate thread
     * @private
     */
    startClusterizer(): void | boolean {
        if (!this.objectsRepository || this.objectsRepository.getLoaded().length === 0) {
            return;
        }
        const locationField = this.objectsRepository.getSchema().getFieldByType("location");
        if (!locationField) {
            return false;
        }

        if (!this.clusterizerWorker) {
            this.clusterizerWorker = new Worker(MapSVG.urls.root + "js/mapsvg/Core/clustering.js");

            // Receive messages from postMessage() calls in the Worker
            this.clusterizerWorker.onmessage = (evt) => {
                if (evt.data.clusters) {
                    this.addClustersFromWorker(evt.data.zoomLevel, evt.data.clusters);
                }
            };
        }

        // Pass data to the WebWorker
        const objectsData = [];
        this.objectsRepository
            .getLoaded()
            .filter((o) => {
                return o.location && o.location.marker;
            })
            .forEach((o) => {
                objectsData.push({
                    id: o.id,
                    x: o.location.marker.svgPoint.x,
                    y: o.location.marker.svgPoint.y,
                });
            });
        this.clusterizerWorker.postMessage({
            objects: objectsData,
            cellSize: 50,
            mapWidth: this.containers.map.clientWidth,
            zoomLevels: this.zoomLevels,
            zoomLevel: this.zoomLevel,
            zoomDelta: this.zoomDelta,
            svgViewBox: this.svgDefault.viewBox,
        });

        this.events.on("zoom", () => {
            this.clusterizerWorker.postMessage({
                message: "zoom",
                zoomLevel: this.zoomLevel,
            });
        });
    }
    /**
     * Starts clustering markers on the map
     * @property {boolean} skipFitMarkers - Don't do "fit markers" action. Used to prevent fitting markers
     * on changinh zoom level.
     * @private
     */
    clusterizeMarkers(skipFitMarkers?: boolean): void {
        $(this.layers.markers)
            .children()
            .each((i, obj) => {
                $(obj).detach();
            });
        this.markers.clear();
        this.markersClusters.clear();

        // $(this.containers.map).addClass('no-transitions-markers');

        this.clustersByZoom &&
            this.clustersByZoom[this.zoomLevel] &&
            this.clustersByZoom[this.zoomLevel].forEach((cluster) => {
                // Don't clusterize on google maps with zoom level >= 17
                if (
                    this.options.googleMaps.on &&
                    this.googleMaps.map &&
                    this.googleMaps.map.getZoom() >= 17
                ) {
                    this.markerAdd(cluster.markers[0]);
                } else {
                    if (cluster.markers.length > 1) {
                        this.markersClusterAdd(cluster);
                    } else {
                        this.markerAdd(cluster.markers[0]);
                    }
                }
            });

        if (this.editingMarker) {
            this.markerAdd(this.editingMarker);
        }

        if (!skipFitMarkers) {
            this.mayBeFitMarkers();
        }

        if (this.options.labelsMarkers.on) {
            this.setLabelsMarkers();
        }

        // $(_this.containers.map).removeClass('no-transitions-markers');
    }
    /**
     * Returns URL of the mapsvg.css file
     * @returns {string} URL
     * @private
     */
    getCssUrl(): string {
        return MapSVG.urls.root + "css/mapsvg.css";
    }
    /**
     * Checks if the map is geo-calibrated
     * @returns {boolean}
     */
    isGeo(): boolean {
        return this.mapIsGeo;
    }
    /**
     * Converts a string to function
     * @param string
     * @returns {function|object} Function or object {error: "error text"}
     * @private
     *
     */
    functionFromString(string: string): SyntaxError | TypeError {
        let func;
        let error;
        const fn = string.trim();
        if (fn.indexOf("{") == -1 || fn.indexOf("function") !== 0 || fn.indexOf("(") == -1) {
            return new SyntaxError("MapSVG user function error: no function body.");
        }
        const fnBody = fn.substring(fn.indexOf("{") + 1, fn.lastIndexOf("}"));
        const params = fn.substring(fn.indexOf("(") + 1, fn.indexOf(")"));
        try {
            func = new Function(params, fnBody);
        } catch (err) {
            error = err;
        }

        if (!error) return func;
        else return error;
    }
    /**
     * Returns map options.
     * @param {bool} forTemplate - If options should be formatted for use in a template
     * @param {bool} forWeb - If options should be formatted for use in the web
     * @param {object} optionsDelta - used by backend WP admin only, part of options from the previous view mode
     * @returns {object}
     */
    getOptions(forTemplate: boolean, forWeb: boolean) {
        const options = <MapOptionsInterface>$.extend(true, {}, this.options);

        function clearEmpties(o) {
            for (const k in o) {
                if (!o[k] || typeof o[k] !== "object") {
                    continue;
                }

                clearEmpties(o[k]);
                if (Object.keys(o[k]).length === 0) {
                    delete o[k];
                }
            }
        }

        clearEmpties(options.regions);

        $.extend(true, options, this.optionsDelta);

        options.viewBox = this._viewBox.toArray();
        options.filtersSchema = this.filtersSchema.getFieldsAsArray();
        if (options.filtersSchema.length > 0) {
            options.filtersSchema.forEach((field) => {
                if (field.type === "distance") {
                    field.value = "";
                }
            });
        }

        // @ts-ignore - old options field from MapSVG versions <5.x
        delete options.markers;

        if (forTemplate) {
            // @ts-ignore - may this needs to be removed?
            options.svgFilename = options.source.split("/").pop();
            // @ts-ignore - may this needs to be removed?
            options.svgFiles = MapSVG.svgFiles;
        }

        if (forWeb)
            $.each(options, (key, val) => {
                if (JSON.stringify(val) == JSON.stringify(this.defaults[key])) delete options[key];
            });
        delete options.backend;

        return options;
    }

    /**
     * Restore delta options, used by MapSVG-Admin
     * @private
     */
    restoreDeltaOptions(): void {
        this.update(this.optionsDelta);
        this.optionsDelta = {};
    }

    /**
     * Sets event handlers
     * @param {object} functions - Callbacks {eventName, eventName, ...}
     */
    setEvents(functions: { [key: string]: string }) {
        // TODO add namespaces for events as done in jQuery

        let compiledFunction;

        for (const eventName in functions) {
            if (typeof functions[eventName] === "string") {
                compiledFunction =
                    functions[eventName] != ""
                        ? this.functionFromString(<string>functions[eventName])
                        : null;
                if (
                    !compiledFunction ||
                    compiledFunction.error ||
                    compiledFunction instanceof TypeError ||
                    compiledFunction instanceof SyntaxError
                ) {
                    continue;
                }
            } else if (typeof functions[eventName] === "function") {
                compiledFunction = functions[eventName];
            }

            // Reset events
            this.events.off(eventName);
            // Set new event
            this.events.on(eventName, compiledFunction);

            if (eventName.indexOf("directory") !== -1) {
                const event = eventName.split(".")[0];

                if (this.controllers && this.controllers.directory) {
                    this.controllers.directory.events.off(event);
                    this.controllers.directory.events.on(event, compiledFunction);
                }
            }
        }

        $.extend(true, this.options.events, functions);
    }
    /**
     * Sets map actions that should be performed on Region click. Marker click, etc.
     * @param options
     *
     * @example
     * mapsvg.setActions({
     *   "click.region": {
     *     showPopover: true,
     *     showDetails: false
     *   }
     * })
     */
    setActions(options): void {
        $.extend(true, this.options.actions, options);
    }
    /**
     * Sets Details View options
     * @param {object} options - Options
     */
    setDetailsView(options?: { [key: string]: any }) {
        options = options || this.options.detailsView || {};
        $.extend(true, this.options.detailsView, options);

        // Since 5.0.0: no top/near locations.
        if (this.options.detailsView.location === "top" && this.options.menu.position === "left") {
            this.options.detailsView.location = "leftSidebar";
        } else if (
            this.options.detailsView.location === "top" &&
            this.options.menu.position === "right"
        ) {
            this.options.detailsView.location = "rightSidebar";
        }
        if (
            this.options.detailsView.location === "near" ||
            this.options.detailsView.location === "mapContainer"
        ) {
            this.options.detailsView.location = "map";
        }

        if (!this.containers.detailsView) {
            this.containers.detailsView = $('<div class="mapsvg-details-container"></div>')[0];
        }

        $(this.containers.detailsView).toggleClass(
            "mapsvg-details-container-relative",
            !(MapSVG.isPhone && this.options.detailsView.mobileFullscreen) &&
                !this.shouldBeScrollable(this.options.detailsView.location)
        );

        if (this.options.detailsView.location === "custom") {
            $("#" + this.options.detailsView.containerId).append($(this.containers.detailsView));
        } else {
            if (MapSVG.isPhone && this.options.detailsView.mobileFullscreen) {
                $("body").append($(this.containers.detailsView));
                $(this.containers.detailsView).addClass("mapsvg-container-fullscreen");
            } else {
                this.containers[this.options.detailsView.location].append(
                    this.containers.detailsView
                );
            }
            if (this.options.detailsView.margin) {
                $(this.containers.detailsView).css("margin", this.options.detailsView.margin);
            }
            $(this.containers.detailsView).css("width", this.options.detailsView.width);
        }
    }
    /**
     * Sets mobile view options
     * @param options
     */
    setMobileView(options): void {
        $.extend(true, this.options.mobileView, options);
    }
    /**
     * Attaches DB Objects to Regions
     * @param object
     */
    attachDataToRegions(object?: any) {
        this.regions.forEach(function (region) {
            region.objects = [];
        });

        this.objectsRepository.getLoaded().forEach((obj, index) => {
            const regions = obj.getRegionsForTable(this.options.database.regionsTableName);
            if (regions && regions.length) {
                regions.forEach((region) => {
                    const r = this.getRegion(region.id);
                    if (r) r.objects.push(obj);
                });
            }
        });
    }
    /**
     * Sets templates body
     * @param {object} templates - Key:value pairs of template names and HTML content
     */
    setTemplates(templates): void {
        this.templates = this.templates || {};
        for (let name in templates) {
            if (name != undefined) {
                this.options.templates[name] = templates[name];
                let t = this.options.templates[name];
                if (name == "directoryItem" || name == "directoryCategoryItem") {
                    const dirItemTemplate = this.options.templates.directoryItem;
                    t =
                        '{{#each items}}<div id="mapsvg-directory-item-{{#if id_no_spaces}}{{id_no_spaces}}{{else}}{{id}}{{/if}}" class="mapsvg-directory-item" data-object-id="{{id}}">' +
                        dirItemTemplate +
                        "</div>{{/each}}";
                    if (
                        this.options.menu.categories &&
                        this.options.menu.categories.on &&
                        this.options.menu.categories.groupBy
                    ) {
                        const t2 = this.options.templates["directoryCategoryItem"];
                        t =
                            '{{#each items}}{{#with category}}<div id="mapsvg-category-item-{{value}}" class="mapsvg-category-item" data-category-value="{{value}}">' +
                            t2 +
                            '</div><div class="mapsvg-category-block" data-category-id="{{value}}">{{/with}}' +
                            t +
                            "</div>{{/each}}";
                    }
                    name = "directory";
                }

                try {
                    this.options.templates[name] = t;
                    this.templates[name] = Handlebars.compile(t, { strict: false });
                } catch (err) {
                    console.error(err);
                    this.templates[name] = Handlebars.compile("", { strict: false });
                }

                if (
                    this.editMode &&
                    (name == "directory" || name == "directoryCategoryItem") &&
                    this.controllers &&
                    this.controllers.directory
                ) {
                    this.controllers.directory.templates.main = this.templates[name];
                    this.loadDirectory();
                }
            }
        }
    }
    /**
     * Updates map settings.
     * @param {object} options - Map options
     *
     * @example
     * mapsvg.update({
     *   popovers: {on: true},
     *   colors: {
     *     background: "red"
     *   }
     * });
     */
    update(options): void {
        for (const key in options) {
            if (key == "regions") {
                // TODO options.regions for different regions tables (add regionTableName into options)
                for (const id in options.regions) {
                    const region = this.getRegion(id);
                    region && region.update(options.regions[id]);
                    if (options.regions[id].disabled != undefined) {
                        this.deselectRegion(region);
                        // @ts-ignore
                        this.options.regions[id] = this.options.regions[id] || {};
                        this.options.regions[id].disabled = region.disabled;
                    }
                }
            } else {
                const setter = "set" + MapSVG.ucfirst(key);
                if (typeof this[setter] == "function") this[setter](options[key]);
                else {
                    this.options[key] = options[key];
                }
            }
        }
    }

    getDirtyFields(): { [key: string]: any } {
        return this.getData();
    }
    clearDirtyFields(): void {
        this.dirtyFields = [];
    }

    /**
     * Sets map title
     * @param {string} title - Map title
     * @private
     */
    setTitle(title: string): void {
        title && (this.options.title = title);
    }
    /**
     * Adds MapSVG add-ons
     * @param extension
     * @private
     */
    setExtension(extension): void {
        if (extension) {
            this.options.extension = extension;
        } else {
            delete this.options.extension;
        }
    }
    /**
     * Disables/enables redirection by link on click on a region or marker
     * when "Go to link..." feature is enabled
     * Used to prevent redirection in the map editor.
     * @param {boolean} on - true (enable redirection) of false (disable)
     */
    setDisableLinks(on: boolean): void {
        on = MapSVG.parseBoolean(on);
        if (on) {
            $(this.containers.map).on("click.a.mapsvg", "a", function (e) {
                e.preventDefault();
            });
        } else {
            $(this.containers.map).off("click.a.mapsvg");
        }
        this.disableLinks = on;
    }
    /**
     * Sets loading text message
     * @param {string} val - "Loading map..." text
     */
    setLoadingText(val): void {
        this.options.loadingText = val;
    }
    /**
     * Enable or disable lock aspect ratio. Used in Map Editor.
     * @param {boolean} onoff
     * @private
     */
    setLockAspectRatio(onoff: boolean): void {
        this.options.lockAspectRatio = MapSVG.parseBoolean(onoff);
    }
    /**
     * Sets callback for marker click. Used in Map Editor to show an object editing window.
     * @private
     */
    setMarkerEditHandler(handler: (location: Location) => void): void {
        this.markerEditHandler = handler;
    }
    /**
     * Sets the field that is used for choropleth map
     * @param {string} field - field name
     */
    setChoroplethSourceField(field): void {
        this.options.choropleth.sourceField = field;
        this.redrawChoropleth();
    }
    /**
     * Sets callback function that is called on click on a Region.
     * Used in the Map Editor on click on a Region in the "Edit regions" map mode.
     * @param {Function} handler
     */
    setRegionEditHandler(handler: () => void): void {
        this.regionEditHandler = handler;
    }
    /**
     * Disables all Regions if "true" is passed.
     * @param {boolean} on
     */
    setDisableAll(on: boolean) {
        on = MapSVG.parseBoolean(on);
        $.extend(true, this.options, { disableAll: on });
        $(this.containers.map).toggleClass("mapsvg-disabled-regions", on);
    }
    /**
     * @private
     */
    setRegionStatuses<T>(_statuses: ArrayIndexed<T>): void {
        // @ts-ignore
        this.options.regionStatuses = {};
        const colors = {};
        _statuses.forEach((statusOptions) => {
            this.options.regionStatuses[statusOptions.value] = statusOptions;
            colors[statusOptions.value] = statusOptions.color.length
                ? statusOptions.color
                : undefined;
        });
        this.setColors({ status: colors });
    }
    /**
     * @deprecated
     * @private
     */
    setColorsIgnore(val): void {
        this.options.colorsIgnore = MapSVG.parseBoolean(val);
        this.regionsRedrawColors();
    }
    /**
     * Sets color settings (background, regions, containers, etc.)
     * @param {object} colors
     *
     * @example
     * mapsvg.setColors({
     *   background: "#EEEEEE",
     *   hover: "10",
     *   selected: "20",
     *   leftSidebar: "#FF2233",
     *   detailsView: "#FFFFFF"
     * });
     */
    setColors(colors?: { [key: string]: string | number | Record<string, unknown> }): void {
        for (const i in colors) {
            if (i === "status") {
                // @ts-ignore
                for (const s in colors[i]) {
                    MapSVG.fixColorHash(colors[i][s]);
                }
            } else {
                if (typeof colors[i] == "string") {
                    MapSVG.fixColorHash(colors[i]);
                }
            }
        }

        $.extend(true, this.options, { colors: colors });

        if (colors && colors.status) this.options.colors.status = colors.status;

        if (this.options.colors.markers) {
            for (const z in this.options.colors.markers) {
                for (const x in this.options.colors.markers[z]) {
                    this.options.colors.markers[z][x] = parseInt(this.options.colors.markers[z][x]);
                }
            }
        }

        if (this.options.colors.background)
            $(this.containers.map).css({ background: this.options.colors.background });
        if (this.options.colors.hover) {
            // Typescript compiler thinks isNaN can't accept strings
            // @ts-ignore
            this.options.colors.hover = !isNaN(this.options.colors.hover)
                ? parseInt(this.options.colors.hover + "")
                : this.options.colors.hover;
        }
        if (this.options.colors.selected) {
            // Typescript compiler thinks isNaN can't accept strings
            // @ts-ignore
            this.options.colors.selected = !isNaN(this.options.colors.selected)
                ? parseInt(this.options.colors.selected + "")
                : this.options.colors.selected;
        }

        $(this.containers.leftSidebar).css({
            "background-color": this.options.colors.leftSidebar,
        });
        $(this.containers.rightSidebar).css({
            "background-color": this.options.colors.rightSidebar,
        });
        $(this.containers.header).css({ "background-color": this.options.colors.header });
        $(this.containers.footer).css({ "background-color": this.options.colors.footer });

        if ($(this.containers.detailsView) && this.options.colors.detailsView !== undefined) {
            $(this.containers.detailsView).css({
                "background-color": this.options.colors.detailsView,
            });
        }
        if ($(this.containers.directory) && this.options.colors.directory !== undefined) {
            $(this.containers.directory).css({
                "background-color": this.options.colors.directory,
            });
        }
        if ($(this.containers.filtersModal) && this.options.colors.modalFilters !== undefined) {
            $(this.containers.filtersModal).css({
                "background-color": this.options.colors.modalFilters,
            });
        }

        if ($(this.containers.filters) && this.options.colors.directorySearch) {
            $(this.containers.filters).css({
                "background-color": this.options.colors.directorySearch,
            });
        } else if ($(this.containers.filters)) {
            $(this.containers.filters).css({
                "background-color": "",
            });
        }

        if (!this.containers.clustersCss) {
            this.containers.clustersCss = <HTMLStyleElement>(
                $("<style></style>").appendTo("body")[0]
            );
        }
        let css = "";
        if (this.options.colors.clusters) {
            css += "background-color: " + this.options.colors.clusters + ";";
        }
        if (this.options.colors.clustersBorders) {
            css += "border-color: " + this.options.colors.clustersBorders + ";";
        }
        if (this.options.colors.clustersText) {
            css += "color: " + this.options.colors.clustersText + ";";
        }
        $(this.containers.clustersCss).html(".mapsvg-marker-cluster {" + css + "}");

        if (!this.containers.clustersHoverCss) {
            this.containers.clustersHoverCss = <HTMLStyleElement>(
                $("<style></style>").appendTo("body")[0]
            );
        }
        let cssHover = "";
        if (this.options.colors.clustersHover) {
            cssHover += "background-color: " + this.options.colors.clustersHover + ";";
        }
        if (this.options.colors.clustersHoverBorders) {
            cssHover += "border-color: " + this.options.colors.clustersHoverBorders + ";";
        }
        if (this.options.colors.clustersHoverText) {
            cssHover += "color: " + this.options.colors.clustersHoverText + ";";
        }
        $(this.containers.clustersHoverCss).html(".mapsvg-marker-cluster:hover {" + cssHover + "}");

        if (!this.containers.markersCss) {
            this.containers.markersCss = <HTMLStyleElement>$("<style></style>").appendTo("head")[0];
        }
        const markerCssText =
            ".mapsvg-with-marker-active .mapsvg-marker {\n" +
            "  opacity: " +
            this.options.colors.markers.inactive.opacity / 100 +
            ";\n" +
            "  -webkit-filter: grayscale(" +
            (100 - this.options.colors.markers.inactive.saturation) +
            "%);\n" +
            "  filter: grayscale(" +
            (100 - this.options.colors.markers.inactive.saturation) +
            "%);\n" +
            "}\n" +
            ".mapsvg-with-marker-active .mapsvg-marker-active {\n" +
            "  opacity: " +
            this.options.colors.markers.active.opacity / 100 +
            ";\n" +
            "  -webkit-filter: grayscale(" +
            (100 - this.options.colors.markers.active.saturation) +
            "%);\n" +
            "  filter: grayscale(" +
            (100 - this.options.colors.markers.active.saturation) +
            "%);\n" +
            "}\n" +
            ".mapsvg-with-marker-hover .mapsvg-marker {\n" +
            "  opacity: " +
            this.options.colors.markers.unhovered.opacity / 100 +
            ";\n" +
            "  -webkit-filter: grayscale(" +
            (100 - this.options.colors.markers.unhovered.saturation) +
            "%);\n" +
            "  filter: grayscale(" +
            (100 - this.options.colors.markers.unhovered.saturation) +
            "%);\n" +
            "}\n" +
            ".mapsvg-with-marker-hover .mapsvg-marker-hover {\n" +
            "  opacity: " +
            this.options.colors.markers.hovered.opacity / 100 +
            ";\n" +
            "  -webkit-filter: grayscale(" +
            (100 - this.options.colors.markers.hovered.saturation) +
            "%);\n" +
            "  filter: grayscale(" +
            (100 - this.options.colors.markers.hovered.saturation) +
            "%);\n" +
            "}\n";
        $(this.containers.markersCss).html(markerCssText);

        $.each(this.options.colors, (key, color) => {
            if (color === null || color == "") delete this.options.colors[key];
        });

        this.regionsRedrawColors();
    }
    /**
     * Sets tooltips options.
     * @param {object} options
     * @example
     * mapsvg.setTooltips({
     *   on: true,
     *   position: "bottom-left",
     *   maxWidth: "300"
     * })
     */
    setTooltips(options: { on: boolean }): void {
        if (options.on !== undefined) options.on = MapSVG.parseBoolean(options.on);

        $.extend(true, this.options, { tooltips: options });

        if (!this.containers.tooltip) {
            this.containers.tooltip = $("<div />").addClass("mapsvg-tooltip")[0];
            $(this.containers.map).append(this.containers.tooltip);
            this.controllers.tooltip = new Tooltip({
                mapsvg: this,
                container: this.containers.tooltip,
                position: this.options.tooltips.position,
                maxWidth: this.options.tooltips.maxWidth,
                minWidth: this.options.tooltips.minWidth,
            });
            this.controllers.tooltip._init();
        }

        if (typeof this.options.tooltips.position !== "undefined") {
            this.controllers.tooltip.setPosition(this.options.tooltips.position);
        }

        if (
            typeof this.options.tooltips.maxWidth !== "undefined" ||
            typeof this.options.tooltips.minWidth !== "undefined"
        ) {
            this.controllers.tooltip.setSize(
                this.options.tooltips.minWidth,
                this.options.tooltips.maxWidth
            );
        }
    }
    /**
     * Sets popover options.
     * @param {object} options
     * @example
     * mapsvg.setPopovers({
     *   on: true,
     *   width: 300, // pixels
     *   maxWidth: 70, // percents of map container
     *   maxHeight: 70, // percents of map container
     *   mobileFullscreen: true
     * });
     */
    setPopovers(options) {
        if (options.on !== undefined) options.on = MapSVG.parseBoolean(options.on);

        $.extend(this.options.popovers, options);

        if (!this.containers.popover) {
            this.containers.popover = $("<div />").addClass("mapsvg-popover")[0];
            this.layers.popovers.append(this.containers.popover);
        }
        $(this.containers.popover).css({
            width:
                this.options.popovers.width + (this.options.popovers.width == "auto" ? "" : "px"),
            "max-width": this.options.popovers.maxWidth + "%",
            "max-height":
                (this.options.popovers.maxHeight * $(this.containers.wrap).outerHeight()) / 100 +
                "px",
        });

        if (this.options.popovers.mobileFullscreen && MapSVG.isPhone) {
            $("body").toggleClass("mapsvg-fullscreen-popovers", true);
            $(this.containers.popover).appendTo("body");
        }
    }
    /**
     * Sets region prefix
     * @param {string} prefix
     * @private
     */
    setRegionPrefix(prefix) {
        this.options.regionPrefix = prefix;
    }
    /**
     * Sets initial viewbox
     * @param {array} v - [x,y,width,height]
     * @private
     */
    setInitialViewBox(v) {
        if (typeof v == "string")
            v = v
                .trim()
                .split(" ")
                .map(function (v) {
                    return parseFloat(v);
                });
        this._viewBox.update(new ViewBox(v));
        if (this.options.googleMaps.on) {
            this.options.googleMaps.center = this.googleMaps.map.getCenter().toJSON();
            this.options.googleMaps.zoom = this.googleMaps.map.getZoom();
        }
        this.zoomLevel = 0;
        this.setZoomLevels();
    }
    /**
     * Sets viewbox on map start and calculates initial width/height ratio
     * @private
     */
    setViewBoxOnStart() {
        this.viewBoxFull = this.svgDefault.viewBox;
        this.viewBoxFake = this.viewBox;
        this.whRatioFull = this.viewBoxFull.width / this.viewBox.width;
        this.containers.svg.setAttribute("viewBox", this.viewBoxFull.toString());

        if ((MapSVG.device.ios || MapSVG.device.android) && this.svgDefault.viewBox.width > 1500) {
            this.iosDownscaleFactor = this.svgDefault.viewBox.width > 9999 ? 100 : 10;
            this.containers.svg.style.width =
                (this.svgDefault.viewBox.width / this.iosDownscaleFactor).toString() + "px";
        } else {
            this.containers.svg.style.width = this.svgDefault.viewBox.width + "px";
        }

        this.vbStart = true;
    }
    /**
     * Sets map viewbox
     * @param {ViewBox} viewBox
     * @param {boolean} adjustGoogleMap
     */
    setViewBox(viewBox?: ViewBox, adjustGoogleMap = true): boolean {
        let initial = false;

        if (typeof viewBox === "undefined" || (viewBox.width === 0 && viewBox.height === 0)) {
            viewBox = this.svgDefault.viewBox;
            initial = true;
        }
        const isZooming =
            viewBox.width != this.viewBox.width || viewBox.height != this.viewBox.height;

        this.viewBox.update(viewBox);

        this.whRatio = this.viewBox.width / this.viewBox.height;

        !this.vbStart && this.setViewBoxOnStart();

        if (initial) {
            if (this._viewBox.width === 0 && this._viewBox.height === 0) {
                this._viewBox.update(this.viewBox);
            }
            this._scale = 1;
        }

        this.scale = this.getScale();
        this.superScale = (this.whRatioFull * this.svgDefault.viewBox.width) / this.viewBox.width;

        const w = this.svgDefault.viewBox.width / this.containers.map.clientWidth;
        this.superScale = this.superScale / w;

        if ((MapSVG.device.ios || MapSVG.device.android) && this.svgDefault.viewBox.width > 1500) {
            this.superScale *= this.iosDownscaleFactor;
        }

        this.scroll.tx = Math.round((this.svgDefault.viewBox.x - this.viewBox.x) * this.scale);
        this.scroll.ty = Math.round((this.svgDefault.viewBox.y - this.viewBox.y) * this.scale);

        // Changing Google Map boundaries will call this method again with adjustGoogleMap=false
        if (this.googleMaps.map && adjustGoogleMap !== false) {
            // We don't know if there are more zoom levels for Google Map
            // So we just zoom-in and then check if zoom has changed.
            // If it's changed then we set the center point
            const googlePrevZoom = this.googleMaps.map.getZoom();
            this.googleMaps.map.setCenter(this.getCenterGeoPoint());
            this.googleMaps.map.setZoom(this.getZoomForGoogle());
            // if (googlePrevZoom !== this.googleMaps.map.getZoom()) {
            // }
        } else {
            this.containers.scrollpane.style.transform =
                "translate(" + this.scroll.tx + "px," + this.scroll.ty + "px)";
            this.containers.svg.style.transform = "scale(" + this.superScale + ")";
            this.syncZoomLevelWithGoogle();
        }

        this.movingItemsAdjustScreenPosition();

        if (isZooming) {
            this.adjustStrokes();
            this.toggleSvgLayerOnZoom();
            if (this.options.clustering.on) {
                // Google Maps is calling setViewBox 20-30 times per zoom cycle (400ms)
                // until the animation finishes. So we have to use .throttle to avoid calling
                // the expensive operation multiple times.
                this.throttle(this.clusterizeOnZoom, 400, this);
            } else {
                this.events.trigger("zoom");
            }
        }

        return true;
    }

    /**
     * Google Maps max zoom level is inconsistent for satellite view map type:
     * depending on the location it can be from 17 to 22.
     * It's hard to tell if user can zoom in Google Map more before actual zoom occurs.
     * So we are letting them to zoom and then, if Google Map isn't zoomed then MapSVG and
     * Google Maps levels would be out of sync.
     * In this method we check if MapSVG zoom and Google Zoom levels are out of sync
     * and then synchronize them.
     */
    private syncZoomLevelWithGoogle(): void {
        if (
            this.googleMaps.map &&
            this.googleMaps.map.getZoom() !== this.getZoomForGoogle() &&
            typeof this.zoomDelta !== "undefined"
        ) {
            this.zoomLevel = this.googleMaps.map.getZoom() - this.zoomDelta;
        }
    }

    /**
     * Returns lat,lng coordinates of center of the current view
     */
    getCenterGeoPoint(): GeoPoint {
        return this.converter.convertSVGToGeo(this.getCenterSvgPoint());
    }

    /**
     * Returns  SVG coordinates of the center of current map position
     */
    getCenterSvgPoint(): SVGPoint {
        return new SVGPoint(
            this.viewBox.x + this.viewBox.width / 2,
            this.viewBox.y + this.viewBox.height / 2
        );
    }

    /**
     * Returns zoom level adjusted for Google Maps
     */
    getZoomForGoogle(): number {
        if (typeof this.zoomLevel === "string") {
            this.zoomLevel = parseInt(this.zoomLevel);
        }
        return this.zoomLevel + this.zoomDelta;
    }
    getZoomRange(): { min: number; max: number } {
        const range = { min: 0, max: 0 };

        if (this.options.googleMaps.on) {
            range.min = Math.max(0, this.options.zoom.limit[0] + this.zoomDelta) - this.zoomDelta;
            range.max = Math.min(22, this.options.zoom.limit[1] + this.zoomDelta) - this.zoomDelta;
        } else {
            range.min = this.options.zoom.limit[0];
            range.max = this.options.zoom.limit[1];
        }
        return range;
    }
    /**
     * Turns on marker animations
     * @private
     */
    enableMovingElementsAnimation(): void {
        $(this.containers.map).removeClass(
            "no-transitions-markers no-transitions-labels no-transitions-bubbles"
        );
    }
    /**
     * Turns off marker animations
     * @private
     */
    disableMovingElementsAnimation(): void {
        $(this.containers.map).addClass(
            "no-transitions-markers no-transitions-labels no-transitions-bubbles"
        );
    }
    /**
     * Event handler that clusterizes markers on zoom
     * @private
     */

    clusterizeOnZoom(): void {
        if (this.options.googleMaps.on && this.googleMaps.map && this.zoomDelta) {
            this.zoomLevel = this.googleMaps.map.getZoom() - this.zoomDelta;
        }
        this.events.trigger("zoom");
        this.clusterizeMarkers(true);
    }
    /**
     * Delays method execution.
     * For example, it can be used in search input fields to prevent sending
     * an ajax request on each key press.
     * @param {function} method
     * @param {number} delay
     * @param {object} scope
     * @param {array} params
     * @private
     */
    throttle(method: (params: any) => void, delay: number, scope: any, params?: any): void {
        // @ts-ignore
        clearTimeout(method._tId);
        // @ts-ignore
        method._tId = setTimeout(function () {
            method.apply(scope, params);
        }, delay);
    }
    /**
     * Sets SVG viewBox by Google Maps bounds.
     * Used to overlay SVG map on Google Map.
     */
    setViewBoxByGoogleMapBounds(): void {
        const googleMapBounds = this.googleMaps.map.getBounds();
        if (!googleMapBounds) return;
        const googleMapBoundsJSON = googleMapBounds.toJSON();

        if (googleMapBoundsJSON.west == -180 && googleMapBoundsJSON.east == 180) {
            const center = this.googleMaps.map.getCenter().toJSON();
        }
        const ne = new GeoPoint(
            googleMapBounds.getNorthEast().lat(),
            googleMapBounds.getNorthEast().lng()
        );
        const sw = new GeoPoint(
            googleMapBounds.getSouthWest().lat(),
            googleMapBounds.getSouthWest().lng()
        );

        const xyNE = this.converter.convertGeoToSVG(ne);
        const xySW = this.converter.convertGeoToSVG(sw);

        // Check if map is on border between 180/-180 longitude
        if (xyNE.x < xySW.y) {
            const mapPointsWidth =
                (this.svgDefault.viewBox.width / this.converter.mapLonDelta) * 360;
            xySW.x = -(mapPointsWidth - xySW.y);
        }

        const width = xyNE.x - xySW.x;
        const height = xySW.y - xyNE.y;
        const viewBox = new ViewBox(xySW.x, xyNE.y, width, height);
        this.setViewBox(viewBox);
    }
    /**
     * Redraws the map.
     * Must be called when the map is shown after being hidden.
     */
    redraw(): void {
        this.disableAnimation();
        if (MapSVG.browser.ie) {
            $(this.containers.svg).css({ height: this.svgDefault.viewBox.height });
        }

        if (this.options.googleMaps.on && this.googleMaps.map) {
            // var center = this.googleMaps.map.getCenter();
            google.maps.event.trigger(this.googleMaps.map, "resize");
            // this.googleMaps.map.setCenter(center);
            // this.setViewBoxByGoogleMapBounds();
        } else {
            this.setViewBox(this.viewBox);
        }
        $(this.containers.popover) &&
            $(this.containers.popover).css({
                "max-height":
                    (this.options.popovers.maxHeight * $(this.containers.wrap).outerHeight()) /
                        100 +
                    "px",
            });
        if (this.controllers && this.controllers.directory) {
            this.controllers.directory.updateTopShift();
            this.controllers.directory.updateScroll();
        }
        this.movingItemsAdjustScreenPosition();
        this.adjustStrokes();
        this.enableAnimation();
    }

    /**
     * Sets map size.
     * Can accept both or just 1 parameter - width or height. The missing parameter will be calcualted.
     * @param {number} width
     * @param {number} height
     * @param {boolean} responsive
     * @returns {number[]} - [width, height]
     */
    setSize(width: number, height: number, responsive?: boolean): void {
        // Convert strings to numbers
        this.options.width = width;
        this.options.height = height;
        this.options.responsive =
            responsive != null && responsive != undefined
                ? MapSVG.parseBoolean(responsive)
                : this.options.responsive;

        // Calculate width and height
        if (!this.options.width && !this.options.height) {
            this.options.width = this.svgDefault.width;
            this.options.height = this.svgDefault.height;
        } else if (!this.options.width && this.options.height) {
            this.options.width =
                (this.options.height * this.svgDefault.width) / this.svgDefault.height;
        } else if (this.options.width && !this.options.height) {
            this.options.height =
                (this.options.width * this.svgDefault.height) / this.svgDefault.width;
        }

        this.whRatio = this.options.width / this.options.height;
        this.scale = this.getScale();

        this.setResponsive(responsive);

        if (this.options.choropleth.on && this.options.choropleth.bubbleMode) {
            this.redrawBubbles();
        }

        this.movingItemsAdjustScreenPosition();
    }
    /**
     * Sets map responsiveness on/off. When map is responsive, it takes the full width of the parent container.
     * @param {bool} on
     */
    setResponsive(on: boolean): void {
        on = on != undefined ? MapSVG.parseBoolean(on) : this.options.responsive;

        $(this.containers.map).css({
            width: "100%",
            height: "0",
            "padding-bottom": (this.viewBox.height * 100) / this.viewBox.width + "%",
        });
        if (on) {
            $(this.containers.wrap).css({
                width: "100%",
                height: "auto",
            });
        } else {
            $(this.containers.wrap).css({
                width: this.options.width + "px",
                height: this.options.height + "px",
            });
        }
        $.extend(true, this.options, { responsive: on });

        if (!this.resizeSensor) {
            this.resizeSensor = new ResizeSensor(this.containers.map, () => {
                this.redraw();
            });
        }

        this.redraw();
    }
    /**
     * Sets map scroll options.
     * @param {object} options - scroll options
     * @param {bool} skipEvents - used by Map Editor to prevent re-setting event handlers.
     * @example
     * mapsvg.setScroll({
     *   on: true,
     *   limit: false // limit scroll to map bounds
     * });
     */
    setScroll(options, skipEvents): void {
        options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
        options.limit != undefined && (options.limit = MapSVG.parseBoolean(options.limit));
        $.extend(true, this.options, { scroll: options });
        !skipEvents && this.setEventHandlers();
    }
    /**
     * Sets map zoom options.
     * @param {object} options - zoom options
     * @example
     * mapsvg.setZoom({
     *   on: true,
     *   mousewheel: true,
     *   limit: [-5,10], // allow -5 zoom steps back and +20 zoom steps up from initial position.
     * });
     */
    setZoom(options): void {
        options = options || {};
        options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
        options.fingers != undefined && (options.fingers = MapSVG.parseBoolean(options.fingers));
        options.mousewheel != undefined &&
            (options.mousewheel = MapSVG.parseBoolean(options.mousewheel));

        // delta = 1.2 changed to delta = 2 since introducing Google Maps + smooth zoom
        options.delta = 2;

        // options.delta && (options.delta = parseFloat(options.delta));

        if (options.limit) {
            if (typeof options.limit == "string") options.limit = options.limit.split(";");
            options.limit = [parseInt(options.limit[0]), parseInt(options.limit[1])];
        }
        if (!this.zoomLevels) {
            this.setZoomLevels();
        }

        $.extend(true, this.options, { zoom: options });
        //(options.buttons && options.buttons.on) && (options.buttons.on = MapSVG.parseBoolean(options.buttons.on));
        $(this.containers.scrollpaneWrap).off("wheel.mapsvg");

        if (this.options.zoom.mousewheel) {
            // var lastZoomTime = 0;
            // var zoomTimeDelta = 0;

            if (MapSVG.browser.firefox) {
                this.firefoxScroll = { insideIframe: false, scrollX: 0, scrollY: 0 };

                $(this.containers.scrollpaneWrap)
                    .on("mouseenter", () => {
                        this.firefoxScroll.insideIframe = true;
                        this.firefoxScroll.scrollX = window.scrollX;
                        this.firefoxScroll.scrollY = window.scrollY;
                    })
                    .on("mouseleave", () => {
                        this.firefoxScroll.insideIframe = false;
                    });

                $(document).scroll(() => {
                    if (this.firefoxScroll.insideIframe)
                        window.scrollTo(this.firefoxScroll.scrollX, this.firefoxScroll.scrollY);
                });
            }

            $(this.containers.scrollpaneWrap).on("wheel.mapsvg", (event: JQuery.MouseEventBase) => {
                event.preventDefault();
                this.mouseWheelZoom(event);
                // this.throttle(this.mouseWheelZoom, 500, this, [event]);
                return false;
            });
            $(this.layers.markers).on("wheel.mapsvg", (event: JQuery.MouseEventBase) => {
                event.preventDefault();
                this.mouseWheelZoom(event);
                return false;
            });
        }
        this.canZoom = true;
    }

    mouseWheelZoom(event: JQuery.MouseEventBase<any, any, any, any>): void {
        event.preventDefault();
        // @ts-ignore - doesn't recognize .deltaY
        const d = Math.sign(-event.originalEvent.deltaY);
        const center = this.getSvgPointAtClick(event.originalEvent);
        d > 0 ? this.zoomIn(center) : this.zoomOut(center);
    }

    /**
     * Sets map control buttons.
     * @param {object} options - control button options
     * @example
     * mapsvg.setControls({
     *   location: 'right',
     *   zoom: true,
     *   zoomReset: true,
     *   userLocation: true,
     *   previousMap: true
     * });
     */
    setControls(options): void {
        options = options || {};
        $.extend(true, this.options, { controls: options });
        this.options.controls.zoom = MapSVG.parseBoolean(this.options.controls.zoom);
        this.options.controls.zoomReset = MapSVG.parseBoolean(this.options.controls.zoomReset);
        this.options.controls.userLocation = MapSVG.parseBoolean(
            this.options.controls.userLocation
        );
        this.options.controls.previousMap = MapSVG.parseBoolean(this.options.controls.previousMap);

        const loc = this.options.controls.location || "right";

        if (!this.containers.controls) {
            const buttons = $("<div />").addClass("mapsvg-buttons");

            const zoomGroup = $("<div />").addClass("mapsvg-btn-group").appendTo(buttons);
            const zoomIn = $("<div />").addClass("mapsvg-btn-map mapsvg-in");

            zoomIn.on("touchend click", (e) => {
                if (e.cancelable) {
                    e.preventDefault();
                }
                e.stopPropagation();
                this.zoomIn();
            });

            const zoomOut = $("<div />").addClass("mapsvg-btn-map mapsvg-out");
            zoomOut.on("touchend click", (e) => {
                if (e.cancelable) {
                    e.preventDefault();
                }
                e.stopPropagation();
                this.zoomOut();
            });
            zoomGroup.append(zoomIn).append(zoomOut);

            const location = $("<div />").addClass("mapsvg-btn-map mapsvg-btn-location");
            location.on("touchend click", (e) => {
                if (e.cancelable) {
                    e.preventDefault();
                }
                e.stopPropagation();
                this.showUserLocation((location) => {
                    if (this.options.scroll.on) {
                        this.centerOn(location.marker);
                    }
                });
            });

            const userLocationIcon =
                '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 447.342 447.342" style="enable-background:new 0 0 447.342 447.342;" xml:space="preserve"><path d="M443.537,3.805c-3.84-3.84-9.686-4.893-14.625-2.613L7.553,195.239c-4.827,2.215-7.807,7.153-7.535,12.459 c0.254,5.305,3.727,9.908,8.762,11.63l129.476,44.289c21.349,7.314,38.125,24.089,45.438,45.438l44.321,129.509 c1.72,5.018,6.325,8.491,11.63,8.762c5.306,0.271,10.244-2.725,12.458-7.535L446.15,18.429 C448.428,13.491,447.377,7.644,443.537,3.805z"/></svg>';
            location.html(userLocationIcon);

            const locationGroup = $("<div />").addClass("mapsvg-btn-group").appendTo(buttons);
            locationGroup.append(location);

            const zoomResetIcon =
                '<svg height="14px" version="1.1" viewBox="0 0 14 14" width="14px" xmlns="http://www.w3.org/2000/svg" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" xmlns:xlink="http://www.w3.org/1999/xlink"><g fill="none" fill-rule="evenodd" id="Page-1" stroke="none" stroke-width="1"><g fill="#000000" transform="translate(-215.000000, -257.000000)"><g id="fullscreen" transform="translate(215.000000, 257.000000)"><path d="M2,9 L0,9 L0,14 L5,14 L5,12 L2,12 L2,9 L2,9 Z M0,5 L2,5 L2,2 L5,2 L5,0 L0,0 L0,5 L0,5 Z M12,12 L9,12 L9,14 L14,14 L14,9 L12,9 L12,12 L12,12 Z M9,0 L9,2 L12,2 L12,5 L14,5 L14,0 L9,0 L9,0 Z" /></g></g></g></svg>';
            const zoomResetButton = $("<div />")
                .html(zoomResetIcon)
                .addClass("mapsvg-btn-map mapsvg-btn-zoom-reset");
            zoomResetButton.on("touchend click", (e) => {
                if (e.cancelable) {
                    e.preventDefault();
                }
                e.stopPropagation();
                this.viewBoxReset(true);
            });
            const zoomResetGroup = $("<div />").addClass("mapsvg-btn-group").appendTo(buttons);
            zoomResetGroup.append(zoomResetButton);

            const previousMapIcon =
                '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" version="1.1" id="mapsvg-previous-map-icon" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve" sodipodi:docname="undo.svg" inkscape:version="0.92.4 (5da689c313, 2019-01-14)"><metadata id="metadata19"><rdf:RDF><cc:Work rdf:about="">' +
                '<dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /></cc:Work></rdf:RDF></metadata><defs id="defs17" /><sodipodi:namedview pagecolor="#ffffff" bordercolor="#666666" borderopacity="1" objecttolerance="10" gridtolerance="10" guidetolerance="10" inkscape:pageopacity="0" inkscape:pageshadow="2" inkscape:window-width="1920" inkscape:window-height="1017" id="namedview15" showgrid="false" inkscape:zoom="1.0103686" inkscape:cx="181.33521" inkscape:cy="211.70893" inkscape:window-x="-8" inkscape:window-y="-8" inkscape:window-maximized="1" inkscape:current-layer="Capa_1" /> <g id="g6" transform="matrix(0.53219423,0,0,0.52547259,122.72749,106.63302)">' +
                '<g id="g4"><path d="m 142.716,293.147 -94,-107.602 94,-107.602 c 7.596,-8.705 6.71,-21.924 -1.995,-29.527 -8.705,-7.596 -21.917,-6.703 -29.527,1.995 L 5.169,171.782 c -6.892,7.882 -6.892,19.65 0,27.532 l 106.026,121.372 c 4.143,4.729 9.94,7.157 15.771,7.157 4.883,0 9.786,-1.702 13.755,-5.169 8.706,-7.603 9.598,-20.822 1.995,-29.527 z" id="path2" inkscape:connector-curvature="0" /></g></g><g id="g12" transform="matrix(0.53219423,0,0,0.52547259,122.72749,106.63302)"><g id="g10"> <path d="M 359.93,164.619 H 20.926 C 9.368,164.619 0,173.986 0,185.545 c 0,11.558 9.368,20.926 20.926,20.926 H 359.93 c 60.776,0 110.218,49.441 110.218,110.211 0,60.77 -49.442,110.211 -110.218,110.211 H 48.828 c -11.558,0 -20.926,9.368 -20.926,20.926 0,11.558 9.368,20.926 20.926,20.926 H 359.93 C 443.774,468.745 512,400.526 512,316.682 512,232.838 443.781,164.619 359.93,164.619 Z" ' +
                'id="path8" inkscape:connector-curvature="0" /></g></g></svg>';
            const previousMapButton = $("<div />")
                .html(previousMapIcon)
                .addClass("mapsvg-btn-map mapsvg-btn-previous-map");
            previousMapButton.on("touchend click", (e) => {
                if (e.cancelable) {
                    e.preventDefault();
                }
                e.stopPropagation();
                this.loadPreviousMap();
            });
            const previousMapGroup = $("<div />").addClass("mapsvg-btn-group").appendTo(buttons);
            previousMapGroup.append(previousMapButton);

            this.containers.controls = buttons[0];
            this.controls = {
                zoom: zoomGroup[0],
                userLocation: locationGroup[0],
                zoomReset: zoomResetGroup[0],
                previousMap: previousMapGroup[0],
            };
            $(this.containers.map).append($(this.containers.controls));
        }

        $(this.controls.zoom).toggle(this.options.controls.zoom);
        $(this.controls.userLocation).toggle(this.options.controls.userLocation);
        $(this.controls.zoomReset).toggle(this.options.controls.zoomReset);
        $(this.controls.previousMap).toggle(
            this.options.controls.previousMap && this.options.previousMapsIds.length > 0
        );

        $(this.containers.controls).removeClass("left");
        $(this.containers.controls).removeClass("right");
        (loc == "right" && $(this.containers.controls).addClass("right")) ||
            (loc == "left" && $(this.containers.controls).addClass("left"));
    }
    /**
     * Calcualtes map viewBox parameter for each zoom level
     * @private
     */
    setZoomLevels(): void {
        if (!this.zoomLevels) {
            this.zoomLevels = new ArrayIndexed("zoomLevel");
        } else {
            this.zoomLevels.clear();
        }

        for (let i = -20; i < 0; i++) {
            const _scale = 1 / Math.pow(this.options.zoom.delta, Math.abs(i));
            this.zoomLevels.push({
                zoomLevel: i,
                _scale: _scale,
                viewBox: new ViewBox(
                    0,
                    0,
                    this._viewBox.width / _scale,
                    this._viewBox.height / _scale
                ),
            });
        }

        for (let z = 0; z <= 20; z++) {
            const _scale = Math.pow(this.options.zoom.delta, Math.abs(z));
            this.zoomLevels.push({
                zoomLevel: z,
                _scale: _scale,
                viewBox: new ViewBox(
                    0,
                    0,
                    this._viewBox.width / _scale,
                    this._viewBox.height / _scale
                ),
            });
        }
    }
    /**
     * Sets mouse pointer cursor style on hover on regions / markers.
     * @param {string} type - "pointer" or "default"
     */
    setCursor(type): void {
        type = type == "pointer" ? "pointer" : "default";
        this.options.cursor = type;
        if (type == "pointer") $(this.containers.map).addClass("mapsvg-cursor-pointer");
        else $(this.containers.map).removeClass("mapsvg-cursor-pointer");
    }
    /**
     * Enables/disables "multiselect" option that allows to select multiple regions.
     * @param {boolean} on
     * @param {boolean} deselect - If true, deselects currently selected Regions
     */
    setMultiSelect(on: boolean, deselect?: boolean) {
        this.options.multiSelect = MapSVG.parseBoolean(on);
        if (deselect !== false) this.deselectAllRegions();
    }
    /**
     * Sets choropleth map options
     * @param {object} options
     *
     * @example
     * mapsvg.setChoropleth({
     *   on: true,
     *   colors: {
     *     high: "#FF0000",
     *     low: "#00FF00"
     *   }
     *   labels: {
     *     high: "high",
     *     low: "low"
     *   }
     * });
     */
    _new_setChoropleth(options?: any) {
        options = options || this.options.choropleth;
        options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));

        if (
            typeof options.coloring === "undefined" ||
            typeof options.coloring.palette === "undefined" ||
            typeof options.coloring.palette.colors === "undefined"
        ) {
            if (
                typeof options.sourceFieldSelect === "undefined" ||
                typeof options.sourceFieldSelect.variants === "undefined"
            ) {
                $.extend(true, this.options.choropleth, options);
            } else {
                this.options.choropleth.sourceFieldSelect.variants =
                    options.sourceFieldSelect.variants;
            }
        } else {
            const paletteColorsIndexes = Object.keys(options.coloring.palette.colors);
            if (
                paletteColorsIndexes.length > 1 ||
                (paletteColorsIndexes[0] == "0" &&
                    Object.keys(options.coloring.palette.colors[0]).length > 1)
            ) {
                this.options.choropleth.coloring.palette.colors = options.coloring.palette.colors;
            } else {
                const paletteColorIndex = Object.keys(options.coloring.palette.colors)[0];
                $.extend(
                    true,
                    this.options.choropleth.coloring.palette.colors[paletteColorIndex],
                    options.coloring.palette.colors[paletteColorIndex]
                );
            }
        }

        this.updateChoroplethMinMax();

        if (
            this.options.choropleth.on &&
            this.options.choropleth.sourceFieldSelect.on &&
            this.options.choropleth.sourceFieldSelect.variants
        ) {
            if (!this.containers.choroplethSourceSelect) {
                const sourceSelectOptions = [];
                this.options.choropleth.sourceFieldSelect.variants.forEach((variant) => {
                    sourceSelectOptions.push(
                        $(
                            '<option value="' +
                                variant +
                                '" ' +
                                (variant === this.options.choropleth.sourceField
                                    ? "selected"
                                    : "") +
                                ">" +
                                variant +
                                "</option>"
                        )
                    );
                });

                this.containers.choroplethSourceSelect = {
                    container: $('<div class="mapsvg-choropleth-source-field"></div>')[0],
                    select: $(
                        '<select id="mapsvg-choropleth-source-field-select" class="mapsvg-select2"></select>'
                    )[0],
                    options: sourceSelectOptions,
                };

                $(this.containers.choroplethSourceSelect.select).append(
                    this.containers.choroplethSourceSelect.options
                );
                //$(this.containers.choroplethSourceSelect.container).append($(this.containers.choroplethSourceSelect.label));
                $(this.containers.choroplethSourceSelect.container).append(
                    $(this.containers.choroplethSourceSelect.select)
                );

                $(this.containers.map).append($(this.containers.choroplethSourceSelect.container));

                $(this.containers.choroplethSourceSelect.select).mselect2();

                //select2 lib bug workaround. Should be on('change'...)
                $(this.containers.choroplethSourceSelect.select)
                    .mselect2()
                    .on("select2:select select2:unselecting", (e) => {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                        e.stopPropagation();
                        this.setChoropleth({ sourceField: $(e.target).mselect2().val() });
                    });
            } else {
                $(this.containers.choroplethSourceSelect.select).mselect2("destroy");
                $(this.containers.choroplethSourceSelect.select).find("option").remove();
                this.containers.choroplethSourceSelect.options = [];
                this.options.choropleth.sourceFieldSelect.variants.forEach((variant) => {
                    this.containers.choroplethSourceSelect.options.push(
                        $(
                            '<option value="' +
                                variant +
                                '" ' +
                                (variant === this.options.choropleth.sourceField
                                    ? "selected"
                                    : "") +
                                ">" +
                                variant +
                                "</option>"
                        )[0]
                    );
                });
                $(this.containers.choroplethSourceSelect.select).append(
                    this.containers.choroplethSourceSelect.options
                );
                $(this.containers.choroplethSourceSelect.select).mselect2({ width: "100%" });
            }
        }

        if (
            (!this.options.choropleth.on || !this.options.choropleth.sourceFieldSelect.on) &&
            this.containers.choroplethSourceSelect &&
            $(this.containers.choroplethSourceSelect.container).is(":visible")
        ) {
            $(this.containers.choroplethSourceSelect.container).hide();
        } else if (
            this.options.choropleth.on &&
            this.options.choropleth.sourceFieldSelect.on &&
            this.containers.choroplethSourceSelect &&
            !$(this.containers.choroplethSourceSelect.container).is(":visible")
        ) {
            $(this.containers.choroplethSourceSelect.container).show();
        }

        $(this.containers.map).find(".mapsvg-choropleth-legend").remove();

        if (this.options.choropleth.on && this.options.choropleth.coloring.legend.on) {
            const legend = this.options.choropleth.coloring.legend;
            let coloring = "";

            if (this.options.choropleth.coloring.mode === "gradient") {
                //Gradient mode
                coloring +=
                    '<div class="mapsvg-choropleth-legend-gradient-no-data">' +
                    this.options.choropleth.coloring.noData.description +
                    "</div>";

                let legendGradient = "";

                for (let chunkIdx = 1; chunkIdx < 5; chunkIdx++) {
                    legendGradient +=
                        '<div class="mapsvg-choropleth-legend-gradient-chunk">' +
                        ((this.options.choropleth.coloring.gradient.values.maxAdjusted * chunkIdx) /
                            5 +
                            this.options.choropleth.coloring.gradient.values.min) +
                        "</div>";
                }

                coloring +=
                    '<div class="mapsvg-choropleth-legend-gradient-colors">' +
                    legendGradient +
                    "</div>";
            } else {
                //Palette mode

                coloring +=
                    '<div class="mapsvg-choropleth-legend-palette-color-wrap" data-idx="no-data">' +
                    '<div class="mapsvg-choropleth-legend-palette-color"></div>' +
                    '<div class="mapsvg-choropleth-legend-palette-color-description">' +
                    this.options.choropleth.coloring.noData.description +
                    "</div>" +
                    "</div>";

                coloring +=
                    '<div class="mapsvg-choropleth-legend-palette-color-wrap" data-idx="out-of-range">' +
                    '<div class="mapsvg-choropleth-legend-palette-color"></div>' +
                    '<div class="mapsvg-choropleth-legend-palette-color-description">' +
                    this.options.choropleth.coloring.palette.outOfRange.description +
                    "</div>" +
                    "</div>";

                const paletteColors = this.options.choropleth.coloring.palette.colors;

                paletteColors.forEach((paletteColor, idx) => {
                    let paletteColorElementText = "";
                    if (paletteColor.description) {
                        paletteColorElementText = paletteColor.description;
                    } else {
                        if (idx === 0 && !paletteColor.valueFrom && paletteColor.valueFrom !== 0) {
                            if (legend.layout === "vertical") {
                                paletteColorElementText = "Less then " + paletteColor.valueTo;
                            } else {
                                paletteColorElementText = "< " + paletteColor.valueTo;
                            }
                        } else if (idx === paletteColors.length - 1 && !paletteColor.valueTo) {
                            if (legend.layout === "vertical") {
                                paletteColorElementText = paletteColor.valueFrom + " or more";
                            } else {
                                paletteColorElementText = paletteColor.valueFrom + " <";
                            }
                        } else {
                            paletteColorElementText =
                                paletteColor.valueFrom + " &#8804; " + paletteColor.valueTo;
                        }
                    }

                    coloring +=
                        '<div class="mapsvg-choropleth-legend-palette-color-wrap" data-idx="' +
                        idx +
                        '">' +
                        '<div class="mapsvg-choropleth-legend-palette-color"></div>' +
                        '<div class="mapsvg-choropleth-legend-palette-color-description">' +
                        paletteColorElementText +
                        "</div>" +
                        "</div>";
                });
            }

            this.containers.legend = {
                title: $(
                    '<div class="mapsvg-choropleth-legend-title">' + legend.title + "</div>"
                )[0],
                text: $('<div class="mapsvg-choropleth-legend-text">' + legend.text + "</div>")[0],
                coloring: $(
                    '<div class="mapsvg-choropleth-legend-' +
                        this.options.choropleth.coloring.mode +
                        '">' +
                        coloring +
                        "</div>"
                )[0],
                description: $(
                    '<div class="mapsvg-choropleth-legend-description">' +
                        legend.description +
                        "</div>"
                )[0],
                container: $("<div />").addClass(
                    "mapsvg-choropleth-legend mapsvg-choropleth-legend-" +
                        legend.layout +
                        " mapsvg-choropleth-legend-container-" +
                        legend.container
                )[0],
            };

            $(this.containers.legend.container)
                .append(this.containers.legend.title)
                .append(this.containers.legend.text)
                .append(this.containers.legend.coloring)
                .append(this.containers.legend.description);
            $(this.containers.map).append(this.containers.legend.container);

            this.setChoroplethLegendCSS();

            this.regionsRepository.events.on("updated", () => {
                this.redrawChoropleth();
            });

            this.objectsRepository.events.on("updated", () => {
                this.redrawChoropleth();
            });
        }

        if (this.options.choropleth.on && this.options.choropleth.coloring.mode === "gradient") {
            const colors = this.options.choropleth.coloring.gradient.colors;
            if (colors) {
                colors.lowRGB = tinycolor(colors.low).toRgb();
                colors.highRGB = tinycolor(colors.high).toRgb();
                colors.diffRGB = {
                    r: colors.highRGB.r - colors.lowRGB.r,
                    g: colors.highRGB.g - colors.lowRGB.g,
                    b: colors.highRGB.b - colors.lowRGB.b,
                    a: colors.highRGB.a - colors.lowRGB.a,
                };
                this.containers.legend && this.setChoroplethLegendCSS();
            }
        }

        this.redrawChoropleth();
    }
    /**
     * Redraws choropleth map colors
     * @private
     */
    redrawChoropleth() {
        this.updateChoroplethMinMax();
        this.redrawBubbles();
        this.regionsRedrawColors();
    }
    /**
     * Updates min/max values of choropleth fields
     * @private
     */
    updateChoroplethMinMax() {
        if (this.options.choropleth.on) {
            const gradient = this.options.choropleth.coloring.gradient,
                values = [];

            gradient.values.min = 0;
            gradient.values.max = null;

            if (this.options.choropleth.source === "regions") {
                this.regions.forEach((region) => {
                    const choropleth =
                        region.data && region.data[this.options.choropleth.sourceField];
                    choropleth != undefined && choropleth !== "" && values.push(choropleth);
                });
            } else {
                this.objectsRepository.objects.forEach((object) => {
                    const choropleth = object[this.options.choropleth.sourceField];
                    choropleth != undefined && choropleth !== "" && values.push(choropleth);
                });
            }

            if (values.length > 0) {
                gradient.values.min = Math.min.apply(null, values);
                gradient.values.max = Math.max.apply(null, values);
                gradient.values.maxAdjusted = gradient.values.max - gradient.values.min;
            }
        }
    }
    /**
     * Sets gradient for choropleth map
     * @private
     */
    setChoroplethLegendCSS(): void {
        const gradient = this.options.choropleth.coloring.gradient,
            legend = this.options.choropleth.coloring.legend,
            noData = this.options.choropleth.coloring.noData,
            outOfRange = this.options.choropleth.coloring.palette.outOfRange;

        $(".mapsvg-choropleth-legend").css({
            width: legend.width,
            height: legend.height,
        });

        if (this.options.choropleth.coloring.mode === "gradient") {
            if (legend.layout === "horizontal") {
                // horizontal legend
                $(
                    ".mapsvg-choropleth-legend-horizontal .mapsvg-choropleth-legend-gradient-colors"
                ).css({
                    background:
                        "linear-gradient(to right," +
                        gradient.colors.low +
                        " 1%," +
                        gradient.colors.high +
                        " 100%)",
                });
            } else {
                // vertical legend
                $(
                    ".mapsvg-choropleth-legend-vertical .mapsvg-choropleth-legend-gradient-colors"
                ).css({
                    background:
                        "linear-gradient(to bottom," +
                        gradient.colors.low +
                        " 1%," +
                        gradient.colors.high +
                        " 100%)",
                });
            }

            $(".mapsvg-choropleth-legend-gradient-no-data").css({
                "background-color": noData.color,
            });
        } else {
            const paletteColors = this.options.choropleth.coloring.palette.colors;

            paletteColors.forEach(function (paletteColor, idx) {
                $(
                    '.mapsvg-choropleth-legend-palette-color-wrap[data-idx="' +
                        idx +
                        '"] .mapsvg-choropleth-legend-palette-color'
                ).css({
                    "background-color": paletteColor.color,
                });
            });

            $(
                '.mapsvg-choropleth-legend-palette-color-wrap[data-idx="no-data"] .mapsvg-choropleth-legend-palette-color'
            ).css({
                "background-color": noData.color,
            });

            $(
                '.mapsvg-choropleth-legend-palette-color-wrap[data-idx="out-of-range"] .mapsvg-choropleth-legend-palette-color'
            ).css({
                "background-color": outOfRange.color,
            });
        }
    }
    /**
     * Sets custom map CSS.
     * CSS is added as <style>...</style> tag in the page <header>
     * @param {string} css
     * @private
     */
    setCss(css?: string): void {
        this.options.css =
            css || (this.options.css ? this.options.css.replace(/%id%/g, "" + this.id) : "");
        this.liveCss = this.liveCss || <HTMLStyleElement>$("<style></style>").appendTo("head")[0];
        $(this.liveCss).html(this.options.css);
    }
    /**
     * Sets filter options
     * @param {object} options
     * @example
     * mapsvg.setFilters{{
     *   on: true,
     *   location: "leftSidebar"
     * }};
     */
    setFilters(options?: { [key: string]: any }): void {
        options = options || this.options.filters;
        options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
        options.hide != undefined && (options.hide = MapSVG.parseBoolean(options.hide));
        $.extend(true, this.options, { filters: options });

        const scrollable = false;

        if (
            ["leftSidebar", "rightSidebar", "header", "footer", "custom", "map"].indexOf(
                this.options.filters.location
            ) === -1
        ) {
            this.options.filters.location = "leftSidebar";
        }

        if (this.options.filters.on) {
            if (this.formBuilder) {
                this.formBuilder.destroy();
            }

            if (!this.containers.filters) {
                this.containers.filters = $('<div class="mapsvg-filters-wrap"></div>')[0];
            } else {
                $(this.containers.filters).empty();
                $(this.containers.filters).show();
            }

            $(this.containers.filters).css({
                "background-color": this.options.colors.directorySearch,
            });

            if ($(this.containers.filtersModal)) {
                $(this.containers.filtersModal).css({ width: this.options.filters.width });
            }

            if (this.options.filters.location === "custom") {
                $(this.containers.filters)
                    .removeClass("mapsvg-filter-container-custom")
                    .addClass("mapsvg-filter-container-custom");
                if ($("#" + this.options.filters.containerId).length) {
                    $("#" + this.options.filters.containerId).append(this.containers.filters);
                } else {
                    $(this.containers.filters).hide();
                    console.error(
                        "MapSVG: filter container #" +
                            this.options.filters.containerId +
                            " does not exists"
                    );
                }
            } else {
                if (MapSVG.isPhone) {
                    $(this.containers.header).append($(this.containers.filters));
                    this.setContainers({ header: { on: true } });
                } else {
                    const location = MapSVG.isPhone ? "header" : this.options.filters.location;
                    if (
                        this.options.menu.on &&
                        this.controllers.directory &&
                        this.options.menu.location === this.options.filters.location
                    ) {
                        $(this.controllers.directory.containers.view)
                            .find(".mapsvg-directory-filter-wrap")
                            .append($(this.containers.filters));
                        this.controllers.directory.updateTopShift();
                    } else {
                        $(this.containers[location]).append($(this.containers.filters));
                        this.controllers.directory && this.controllers.directory.updateTopShift();
                    }
                }
            }

            this.loadFiltersController(this.containers.filters, false);

            this.updateFiltersState();
        } else {
            if ($(this.containers.filters)) {
                $(this.containers.filters).empty();
                $(this.containers.filters).hide();
            }
        }

        if (
            this.options.menu.on &&
            this.controllers.directory &&
            this.options.menu.location === this.options.filters.location
        ) {
            this.controllers.directory.updateTopShift();
        }
    }
    /**
     * Updates filters in drop-downs. For example, when region is clicked and data is filtered -
     * it selects corresponding region in the drop-down filter
     * @private
     */
    updateFiltersState() {
        if (this.options.filters && this.options.filters.on && this.controllers.filters) {
            //this.controllers.filters.reset();
            this.controllers.filters.update(this.objectsRepository.query);
            this.updateFilterTags();
        }
    }

    private setGlobalDistanceFilter(): void {
        if (
            this.objectsRepository &&
            this.objectsRepository.query.filters &&
            this.objectsRepository.query.filters.distance
        ) {
            const dist = this.objectsRepository.query.filters.distance;
            MapSVG.distanceSearch = this.objectsRepository.query.filters.distance;
        } else {
            MapSVG.distanceSearch = null;
        }
    }

    private updateFilterTags() {
        $(this.containers.filterTags) && $(this.containers.filterTags).empty();

        // TODO get field difference

        for (const field_name in this.objectsRepository.query.filters) {
            let field_value = this.objectsRepository.query.filters[field_name];
            let _field_name = field_name;
            const filterField = this.filtersSchema.getField(_field_name);

            if (field_name == "regions") {
                // check if there is such filter. If there is then change its value
                // if there isn't then add a tag with close button
                _field_name = "";
                field_value = field_value.region_ids.map((id) => this.getRegion(id).title);
            } else {
                _field_name = filterField && filterField.label;
            }

            if (field_name !== "distance") {
                if (!this.containers.filterTags) {
                    this.containers.filterTags = $('<div class="mapsvg-filter-tags"></div>')[0];
                    // TODO If filtersmodeal on then dont append
                    if ($(this.containers.filters)) {
                        // $(this.containers.filters).append($(this.containers.filterTags));
                    } else {
                        if (this.options.menu.on && this.controllers.directory) {
                            $(this.controllers.directory.containers.toolbar).append(
                                this.containers.filterTags
                            );
                            this.controllers.directory.updateTopShift();
                        } else {
                            $(this.containers.map).append(this.containers.filterTags);
                            if (this.options.zoom.buttons.on) {
                                if (this.options.layersControl.on) {
                                    if (this.options.layersControl.position == "top-left") {
                                        $(this.containers.filterTags).css({
                                            right: 0,
                                            bottom: 0,
                                        });
                                    } else {
                                        $(this.containers.filterTags).css({
                                            bottom: 0,
                                        });
                                    }
                                } else {
                                    if (this.options.zoom.buttons.location == "left") {
                                        $(this.containers.filterTags).css({
                                            right: 0,
                                        });
                                    }
                                }
                            }
                        }
                    }

                    $(this.containers.filterTags).on(
                        "click",
                        ".mapsvg-filter-delete",
                        (e: JQuery.MouseEventBase) => {
                            const filterField = $(e.target).data("filter");
                            $(e.target).parent().remove();
                            this.objectsRepository.query.removeFilter(filterField);
                            this.deselectAllRegions();
                            this.loadDataObjects();
                        }
                    );
                }
                $(this.containers.filterTags).append(
                    '<div class="mapsvg-filter-tag">' +
                        (_field_name ? _field_name + ": " : "") +
                        field_value +
                        ' <span class="mapsvg-filter-delete" data-filter="' +
                        field_name +
                        '">×</span></div>'
                );
            }
        }
    }

    /**
     * Sets container options: leftSidebar, rightSidebar, header, footer.
     * @param {object} options
     *
     * @example
     * mapsvg.setContainers({
     *   leftSidebar: {
     *     on: true,
     *     width: "300px"
     *   }
     * });
     */
    setContainers(options) {
        const _this = this;

        if (!this.containersCreated) {
            this.containers.wrapAll = document.createElement("div");
            this.containers.wrapAll.classList.add("mapsvg-wrap-all");
            this.containers.wrapAll.id = "mapsvg-map-" + this.id;
            this.containers.wrapAll.setAttribute("data-map-id", this.id ? this.id.toString() : "");

            this.containers.wrap = document.createElement("div");
            this.containers.wrap.classList.add("mapsvg-wrap");

            this.containers.mapContainer = document.createElement("div");
            this.containers.mapContainer.classList.add("mapsvg-map-container");

            this.containers.leftSidebar = document.createElement("div");
            this.containers.leftSidebar.className =
                "mapsvg-sidebar mapsvg-top-container mapsvg-sidebar-left";
            this.containers.rightSidebar = document.createElement("div");
            this.containers.rightSidebar.className =
                "mapsvg-sidebar mapsvg-top-container mapsvg-sidebar-right";

            this.containers.header = document.createElement("div");
            this.containers.header.className = "mapsvg-header mapsvg-top-container";
            this.containers.footer = document.createElement("div");
            this.containers.footer.className = "mapsvg-footer mapsvg-top-container";

            _this.containers.wrapAll = $('<div class="mapsvg-wrap-all"></div>')
                .attr("id", "mapsvg-map-" + this.id)
                .attr("data-map-id", this.id)[0];
            _this.containers.wrap = $('<div class="mapsvg-wrap"></div>')[0];
            _this.containers.mapContainer = $('<div class="mapsvg-map-container"></div>')[0];
            _this.containers.leftSidebar = $(
                '<div class="mapsvg-sidebar mapsvg-top-container mapsvg-sidebar-left"></div>'
            )[0];
            _this.containers.rightSidebar = $(
                '<div class="mapsvg-sidebar mapsvg-top-container mapsvg-sidebar-right"></div>'
            )[0];
            _this.containers.header = $(
                '<div class="mapsvg-header mapsvg-top-container"></div>'
            )[0];
            _this.containers.footer = $(
                '<div class="mapsvg-footer mapsvg-top-container"></div>'
            )[0];

            $(_this.containers.wrapAll).insertBefore(_this.containers.map);
            $(_this.containers.wrapAll).append(_this.containers.header);
            $(_this.containers.wrapAll).append(_this.containers.wrap);
            $(_this.containers.wrapAll).append(_this.containers.footer);

            $(_this.containers.mapContainer).append(_this.containers.map);

            $(_this.containers.wrap).append(_this.containers.leftSidebar);
            $(_this.containers.wrap).append(_this.containers.mapContainer);
            $(_this.containers.wrap).append(_this.containers.rightSidebar);
            _this.containersCreated = true;
        }

        options = options || _this.options.containers || {};

        for (const contName in options) {
            if (options[contName].on !== undefined) {
                options[contName].on = MapSVG.parseBoolean(options[contName].on);
            }

            if (options[contName].width) {
                if (
                    typeof options[contName].width != "string" ||
                    (options[contName].width.indexOf("px") === -1 &&
                        options[contName].width.indexOf("%") === -1 &&
                        options[contName].width !== "auto")
                ) {
                    options[contName].width = options[contName].width + "px";
                }
                $(_this.containers[contName]).css({ "flex-basis": options[contName].width });
            }
            if (options[contName].height) {
                if (
                    typeof options[contName].height != "string" ||
                    (options[contName].height.indexOf("px") === -1 &&
                        options[contName].height.indexOf("%") === -1 &&
                        options[contName].height !== "auto")
                ) {
                    options[contName].height = options[contName].height + "px";
                }
                $(_this.containers[contName]).css({
                    "flex-basis": options[contName].height,
                    height: options[contName].height,
                });
            }

            $.extend(true, _this.options, { containers: options });

            let on = _this.options.containers[contName].on;

            if (
                MapSVG.isPhone &&
                _this.options.menu.hideOnMobile &&
                _this.options.menu.location === contName &&
                ["leftSidebar", "rightSidebar"].indexOf(contName) !== -1
            ) {
                on = false;
            } else if (
                MapSVG.isPhone &&
                _this.options.menu.location === "custom" &&
                ["leftSidebar", "rightSidebar"].indexOf(contName) !== -1
            ) {
                // hide sidebars on mobiles if there's no directory in there because filters are always moved to header (or custom) on mobiles
                on = false;
                $(_this.containers.wrapAll).addClass("mapsvg-hide-map-list-buttons");
            } else if (
                MapSVG.isPhone &&
                !_this.options.menu.hideOnMobile &&
                _this.options.menu.location === contName &&
                ["leftSidebar", "rightSidebar"].indexOf(contName) !== -1
            ) {
                $(_this.containers.wrapAll).addClass("mapsvg-hide-map-list-buttons");
                $(_this.containers.wrapAll).addClass("mapsvg-directory-visible");
            }
            $(_this.containers[contName]).toggle(on);
        }

        _this.setDetailsView();
    }
    /**
     * Checks if container should be scrollable
     * @param {string} container - mapContainer / leftSidebar / rightSidebar / custom / header / footer
     * @returns {boolean}
     * @private
     */
    shouldBeScrollable(container) {
        const _this = this;

        switch (container) {
            case "map":
            case "leftSidebar":
            case "rightSidebar":
                return true;
                break;
            case "custom":
                return false;
                break;
            case "header":
            case "footer":
                if (
                    _this.options.containers[container].height &&
                    _this.options.containers[container].height !== "auto" &&
                    _this.options.containers[container].height !== "100%"
                ) {
                    return true;
                } else {
                    return false;
                }
                break;
            default:
                return false;
                break;
        }
    }
    /**
     * Sets directory options.
     * @alias setMenu
     * @param {object} options
     * @returns {*|void}
     *
     * @example
     * mapsvg.setDirectory({
     *   on: true,
     *   container: "leftSidebar"
     * });
     */
    setDirectory(options) {
        return this.setMenu(options);
    }
    /**
     * Sets menu (directory) options
     * @param options
     * @private
     */
    setMenu(options?: { [key: string]: any }) {
        const _this = this;

        options = options || this.options.menu;
        options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
        options.search != undefined && (options.search = MapSVG.parseBoolean(options.search));
        options.showMapOnClick != undefined &&
            (options.showMapOnClick = MapSVG.parseBoolean(options.showMapOnClick));
        options.searchFallback != undefined &&
            (options.searchFallback = MapSVG.parseBoolean(options.searchFallback));
        options.customContainer != undefined &&
            (options.customContainer = MapSVG.parseBoolean(options.customContainer));

        $.extend(true, this.options, { menu: options });

        this.controllers = this.controllers || {};

        if (!this.containers.directory) {
            this.containers.directory = $('<div class="mapsvg-directory"></div>')[0];
        }

        // If directory will be scrollable make it absolutely positioned, fill the parent container.
        $(this.containers.directory).toggleClass(
            "flex",
            this.shouldBeScrollable(this.options.menu.location)
        );

        if (this.options.menu.on) {
            if (!this.controllers.directory) {
                this.controllers.directory = new DirectoryController({
                    container: this.containers.directory,
                    template: this.options.templates.directory,
                    mapsvg: this,
                    repository:
                        this.options.menu.source === "regions"
                            ? this.regionsRepository
                            : this.objectsRepository,
                    scrollable: this.shouldBeScrollable(this.options.menu.location), //this.options.menu.location === 'leftSidebar' || this.options.menu.location === 'rightSidebar',
                    // position: this.options.menu.position,
                    // search: this.options.menu.search,
                    events: {
                        click: (e, regionOrObject, mapsvg) => {
                            this.events.trigger("click.directoryItem", this, [
                                e,
                                regionOrObject,
                                mapsvg,
                            ]);
                        },
                        mouseover: (e, regionOrObject, mapsvg) => {
                            this.events.trigger("mouseover.directoryItem", this, [
                                e,
                                regionOrObject,
                                mapsvg,
                            ]);
                        },
                        mouseout: (e, regionOrObject, mapsvg) => {
                            this.events.trigger("mouseout.directoryItem", this, [
                                e,
                                regionOrObject,
                                mapsvg,
                            ]);
                        },
                    },
                });
                this.controllers.directory._init();
            }
            if (options.source) {
                this.controllers.directory.repository =
                    this.options.menu.source === "regions"
                        ? this.regionsRepository
                        : this.objectsRepository;
            }
            if (options.sortBy || options.sortDirection) {
                this.controllers.directory.repository.query.update({
                    sort: [
                        {
                            field: this.options.menu.sortBy,
                            order: this.options.menu.sortDirection,
                        },
                    ],
                });
            }
            if (options.filterout) {
                const f = {};
                f[this.options.menu.filterout.field] = this.options.menu.filterout.val;
                this.controllers.directory.repository.query.setFilterOut(f);
            }
            if (options.location) {
                this.controllers.directory.scrollable = this.shouldBeScrollable(
                    this.options.menu.location
                );
            }

            let $container;
            if (MapSVG.isPhone && this.options.menu.hideOnMobile) {
                $container = $(this.containers.leftSidebar);
            } else {
                $container =
                    this.options.menu.location !== "custom"
                        ? $(this.containers[this.options.menu.location])
                        : $("#" + this.options.menu.containerId);
            }
            $container.append(this.containers.directory);

            if (this.options.colors.directory) {
                $(this.containers.directory).css({
                    "background-color": this.options.colors.directory,
                });
            }
            this.setFilters();
            this.setTemplates({ directoryItem: this.options.templates.directoryItem });
            if (
                (this.options.menu.source === "regions" && this.regionsRepository.loaded) ||
                (this.options.menu.source === "database" && this.objectsRepository.loaded)
            ) {
                if (
                    this.editMode &&
                    (options.sortBy || options.sortDirection || options.filterout)
                ) {
                    this.controllers.directory.repository.reload();
                }
                this.loadDirectory();
            }
        } else {
            this.controllers.directory && this.controllers.directory.destroy();
            this.controllers.directory = null;
        }
    }
    /**
     * Sets database options.
     * @param {object} options
     * @example
     * mapsvg.setDatabase({
     *   pagination: {on: true, perpage: 30}
     * });
     */
    setDatabase(options) {
        options = options || this.options.database;

        if (options.pagination) {
            if (options.pagination.on != undefined) {
                options.pagination.on = MapSVG.parseBoolean(options.pagination.on);
            }
            if (options.pagination.perpage != undefined) {
                options.pagination.perpage = parseInt(options.pagination.perpage);
            }
        }
        $.extend(true, this.options, { database: options });
        if (options.pagination) {
            if (options.pagination.on !== undefined || options.pagination.perpage) {
                const query = new Query({
                    perpage: this.options.database.pagination.on
                        ? this.options.database.pagination.perpage
                        : 0,
                });

                this.objectsRepository.find(query);
            } else {
                this.setPagination();
            }
        }
    }
    updateGoogleMapsMaxZoom(geoPoint: GeoPoint): void {
        this.googleMaps.maxZoomService.getMaxZoomAtLatLng(
            geoPoint,
            (result: google.maps.MaxZoomResult) => {
                if (result.status === "OK") {
                    this.googleMaps.currentMaxZoom = result.zoom;
                }
            }
        );
    }
    /**
     * Sets Google Map options.
     * @param {object} options
     * @example
     * mapsvg.setGoogleMaps({
     *   on: true,
     *   type: "terrain"
     * });
     *
     * // Get Google Maps instance:
     * var gm = mapsvg.googleMaps.map;
     */
    setGoogleMaps(options?: any) {
        options = options || this.options.googleMaps;
        options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));

        if (!this.googleMaps) {
            this.googleMaps = { loaded: false, initialized: false, map: null, overlay: null };
        }

        $.extend(true, this.options, { googleMaps: options });

        if (this.options.googleMaps.on) {
            $(this.containers.map).toggleClass("mapsvg-with-google-map", true);
            if (!MapSVG.googleMapsApiLoaded) {
                this.loadGoogleMapsAPI(
                    () => {
                        this.setGoogleMaps();
                    },
                    () => {
                        this.setGoogleMaps({ on: false });
                    }
                );
            } else {
                if (!this.googleMaps.map) {
                    this.containers.googleMaps = $(
                        '<div class="mapsvg-layer mapsvg-layer-gm" id="mapsvg-google-maps-' +
                            this.id +
                            '"></div>'
                    ).prependTo(this.containers.map)[0];
                    $(this.containers.googleMaps).css({
                        position: "absolute",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        "z-index": "0",
                    });
                    this.googleMaps.map = new google.maps.Map(this.containers.googleMaps, {
                        mapTypeId: options.type,
                        fullscreenControl: false,
                        keyboardShortcuts: false,
                        mapTypeControl: false,
                        scaleControl: false,
                        scrollwheel: false,
                        streetViewControl: false,
                        zoomControl: false,
                        styles: options.styleJSON,
                        tilt: 0,
                    });
                    let overlay;

                    const southWest = new google.maps.LatLng(
                        this.geoViewBox.sw.lat,
                        this.geoViewBox.sw.lng
                    );
                    const northEast = new google.maps.LatLng(
                        this.geoViewBox.ne.lat,
                        this.geoViewBox.ne.lng
                    );
                    const bounds = new google.maps.LatLngBounds(southWest, northEast);

                    this.googleMaps.overlay = this.createGoogleMapOverlay(
                        bounds,
                        this.googleMaps.map
                    );

                    let needToSetZoomLevels = false;

                    if (!this.options.googleMaps.center || !this.options.googleMaps.zoom) {
                        // var southWest = new google.maps.LatLng(this.geoViewBox.bottomLat, this.geoViewBox.leftLon);
                        // var northEast = new google.maps.LatLng(this.geoViewBox.topLat, this.geoViewBox.rightLon);
                        // var bounds = new google.maps.LatLngBounds(southWest,northEast);
                        this.googleMaps.map.fitBounds(bounds, 0);
                        needToSetZoomLevels = true;
                    } else {
                        this.googleMaps.map.setZoom(this.options.googleMaps.zoom);
                        // this.options.googleMaps.center.lat = parseFloat(this.options.googleMaps.center.lat);
                        // this.options.googleMaps.center.lng = parseFloat(this.options.googleMaps.center.lng);
                        this.googleMaps.map.setCenter(this.options.googleMaps.center);
                    }
                    this.googleMaps.initialized = true;
                    this.googleMaps.maxZoomService = new google.maps.MaxZoomService();

                    this.googleMaps.map.addListener("idle", () => {
                        this.isZooming = false;
                    });
                    google.maps.event.addListenerOnce(this.googleMaps.map, "idle", () => {
                        setTimeout(() => {
                            $(this.containers.map).addClass("mapsvg-fade-in");
                            setTimeout(() => {
                                $(this.containers.map).removeClass("mapsvg-google-map-loading");
                                $(this.containers.map).removeClass("mapsvg-fade-in");
                                // this.googleMaps.overlay.draw();
                                if (
                                    !this.options.googleMaps.center ||
                                    !this.options.googleMaps.zoom
                                ) {
                                    this.options.googleMaps.center = this.googleMaps.map
                                        .getCenter()
                                        .toJSON();
                                    this.options.googleMaps.zoom = this.googleMaps.map.getZoom();
                                }
                                this.zoomDelta = this.options.googleMaps.zoom - this.zoomLevel;
                                this.updateGoogleMapsMaxZoom(this.options.googleMaps.center);
                                // if (needToSetZoomLevels) {
                                this.setInitialViewBox(this.viewBox);
                                this.toggleSvgLayerOnZoom();
                                // }
                                this.events.trigger("googleMapsLoaded");
                                this.afterLoadBlockers--;
                                this.finalizeMapLoading();
                            }, 300);
                        }, 1);
                    });
                    this.events.on("googleMapsBoundsChanged", (bounds) => {
                        this.setViewBoxByGoogleMapsOverlay();
                    });
                } else {
                    $(this.containers.map).toggleClass("mapsvg-with-google-map", true);
                    $(this.containers.googleMaps) && $(this.containers.googleMaps).show();
                    if (options.type) {
                        this.googleMaps.map.setMapTypeId(options.type);
                    }
                    this.setViewBoxByGoogleMapsOverlay();
                }
            }
        } else {
            // TODO: destroy google maps
            $(this.containers.map).toggleClass("mapsvg-with-google-map", false);
            $(this.containers.googleMaps) && $(this.containers.googleMaps).hide();
            this.googleMaps.initialized = false;
        }
        if (this.converter) {
            this.converter.setWorldShift(this.options.googleMaps.on);
        }
    }
    createGoogleMapOverlay(bounds, map) {
        class GoogleMapsOverlay extends google.maps.OverlayView {
            bounds_: google.maps.LatLngBounds;
            map_: google.maps.Map;
            prevCoords: {
                sw: { x: number; y: number };
                sw2: { x: number; y: number };
                ne: { x: number; y: number };
                ne2: { x: number; y: number };
            };
            element: HTMLElement;
            mapsvg: MapSVGMap;

            constructor(bounds, googleMapInstance, mapsvg: MapSVGMap) {
                super();
                // Initialize all properties.
                this.bounds_ = bounds;
                this.map_ = googleMapInstance;
                this.mapsvg = mapsvg;
                this.setMap(googleMapInstance);
                this.prevCoords = {
                    sw: { x: 0, y: 0 },
                    sw2: { x: 0, y: 0 },
                    ne: { x: 0, y: 0 },
                    ne2: { x: 0, y: 0 },
                };
            }

            draw(): void {
                this.mapsvg.events.trigger("googleMapsBoundsChanged", this.map_, [
                    this.getPixelBounds(),
                    this.map_,
                ]);
            }

            onAdd(): void {
                this.element = document.createElement("div");
                this.element.style.borderStyle = "none";
                this.element.style.borderWidth = "0px";
                this.element.style.position = "absolute";

                // Add the element to the "overlayLayer" pane.
                const panes = this.getPanes();
                panes.overlayLayer.appendChild(this.element);
            }

            getPixelBounds(): { sw: google.maps.Point; ne: google.maps.Point } {
                const overlayProjection = this.getProjection();
                if (!overlayProjection) return;

                const geoSW = this.bounds_.getSouthWest();
                const geoNE = this.bounds_.getNorthEast();

                const coords = {
                    sw: overlayProjection.fromLatLngToDivPixel(geoSW),
                    ne: overlayProjection.fromLatLngToDivPixel(geoNE),
                    sw2: overlayProjection.fromLatLngToContainerPixel(geoSW),
                    ne2: overlayProjection.fromLatLngToContainerPixel(geoNE),
                };

                // check if map on border between 180/-180 longitude
                // if(ne.x < sw.x){
                //     sw.x = sw.x - overlayProjection.getWorldWidth();
                // }
                // console.log('NOW sw:'+sw.x+' and ne:'+ne.x+'and W-width:'+overlayProjection.getWorldWidth());

                // if(ne2.x < sw2.x){
                //     sw2.x = sw2.x - overlayProjection.getWorldWidth();
                // }

                const ww = overlayProjection.getWorldWidth();

                if (this.prevCoords.sw) {
                    if (coords.ne.x < coords.sw.x) {
                        if (
                            Math.abs(this.prevCoords.sw.x - coords.sw.x) >
                            Math.abs(this.prevCoords.ne.x - coords.ne.x)
                        ) {
                            coords.sw.x = coords.sw.x - ww;
                        } else {
                            coords.ne.x = coords.ne.x + ww;
                        }
                        if (
                            Math.abs(this.prevCoords.sw2.x - coords.sw2.x) >
                            Math.abs(this.prevCoords.ne2.x - coords.ne2.x)
                        ) {
                            coords.sw2.x = coords.sw2.x - ww;
                        } else {
                            coords.ne2.x = coords.ne2.x + ww;
                        }
                    }
                }

                this.prevCoords = coords;

                // div.style.background = 'rgba(255,0,0,.5)';
                // div.style.left   = coords.sw.x + 'px';
                // div.style.top    = coords.ne.y + 'px';
                // div.style.width  = (coords.ne.x - coords.sw.x) + 'px';
                // div.style.height = (coords.sw.y - coords.ne.y) + 'px';

                return { sw: coords.sw2, ne: coords.ne2 };
            }
        }
        return new GoogleMapsOverlay(bounds, map, this);
    }
    /**
     * Loads Google Maps API (js file)
     * @param {function} callback - called on file load
     * @param fail
     * @private
     */
    loadGoogleMapsAPI(callback: () => void, fail: () => void): void {
        if (window.google !== undefined && google.maps) {
            MapSVG.googleMapsApiLoaded = true;
        }

        if (MapSVG.googleMapsApiLoaded) {
            if (typeof callback == "function") {
                callback();
            }
            return;
        }

        MapSVG.googleMapsLoadCallbacks = MapSVG.googleMapsLoadCallbacks || [];
        if (typeof callback == "function") {
            MapSVG.googleMapsLoadCallbacks.push(callback);
        }

        if (MapSVG.googleMapsApiIsLoading) {
            return;
        }
        MapSVG.googleMapsApiIsLoading = true;

        // @ts-ignore
        window.gm_authFailure = () => {
            if (MapSVG.GoogleMapBadApiKey) {
                MapSVG.GoogleMapBadApiKey();
            } else {
                if (this.editMode) {
                    alert("Google maps API key is incorrect.");
                } else {
                    console.error("MapSVG: Google maps API key is incorrect.");
                }
            }
        };
        this.googleMapsScript = document.createElement("script");
        this.googleMapsScript.onload = () => {
            MapSVG.googleMapsApiLoaded = true;
            MapSVG.googleMapsLoadCallbacks.forEach((_callback) => {
                if (typeof callback == "function") _callback();
            });
        };
        const gmLibraries = [];
        if (this.options.googleMaps.drawingTools) {
            gmLibraries.push("drawing");
        }
        if (this.options.googleMaps.geometry) {
            gmLibraries.push("geometry");
        }
        let libraries = "";
        if (gmLibraries.length > 0) {
            libraries = "&libraries=" + gmLibraries.join(",");
        }
        this.googleMapsScript.src =
            "https://maps.googleapis.com/maps/api/js?language=" +
            this.options.googleMaps.language +
            "&key=" +
            this.options.googleMaps.apiKey +
            libraries;

        document.head.appendChild(this.googleMapsScript);
    }
    /**
     * Loads Details View for an object (Region or DB Object)
     * @param {Region|object} obj
     *
     * @example
     * var region = mapsvg.getRegion("US-TX");
     * mapsvg.loadDetailsView(region);
     *
     * var object = mapsvg.database.getLoadedObject(12);
     * mapsvg.loadDetailsView(object);
     */
    loadDetailsView(obj: Region | CustomObject): void {
        this.controllers.popover && this.controllers.popover.close();
        if (this.controllers.detailsView) this.controllers.detailsView.destroy();

        this.controllers.detailsView = new DetailsController({
            // color: this.options.colors.detailsView,
            autoresize:
                MapSVG.isPhone &&
                this.options.detailsView.mobileFullscreen &&
                this.options.detailsView.location !== "custom"
                    ? false
                    : this.options.detailsView.autoresize,
            container: this.containers.detailsView,
            template:
                obj instanceof Region
                    ? this.options.templates.detailsViewRegion
                    : this.options.templates.detailsView,
            mapsvg: this,
            data: obj.getData(),
            modal:
                MapSVG.isPhone &&
                this.options.detailsView.mobileFullscreen &&
                this.options.detailsView.location !== "custom",
            scrollable:
                (MapSVG.isPhone &&
                    this.options.detailsView.mobileFullscreen &&
                    this.options.detailsView.location !== "custom") ||
                this.shouldBeScrollable(this.options.detailsView.location), //['custom','header','footer'].indexOf(this.options.detailsView.location) === -1,
            withToolbar:
                !(
                    MapSVG.isPhone &&
                    this.options.detailsView.mobileFullscreen &&
                    this.options.detailsView.location !== "custom"
                ) && this.shouldBeScrollable(this.options.detailsView.location), //['custom','header','footer'].indexOf(this.options.detailsView.location) === -1,
            // width: this.options.detailsView.width,
            events: {
                shown: (detailsController: DetailsController) => {
                    this.events.trigger("shown.detailsView", this, [this, detailsController]);
                    $(window).trigger("shown.detailsView", [this, detailsController]);
                },
                closed: (detailsController: DetailsController) => {
                    this.deselectAllRegions();
                    this.deselectAllMarkers();
                    this.controllers &&
                        this.controllers.directory &&
                        this.controllers.directory.deselectItems();
                    this.events.trigger("closed.detailsView", [this, detailsController]);
                },
            },
        });
        this.controllers.detailsView._init();
    }
    /**
     * Loads modal window with filters
     * @private
     */
    loadFiltersModal(): void {
        if (this.options.filters.modalLocation != "custom") {
            if (!this.containers.filtersModal) {
                this.containers.filtersModal = $(
                    '<div class="mapsvg-details-container mapsvg-filters-wrap"></div>'
                )[0];
            }
            this.setColors();
            $(this.containers.filtersModal).css({ width: this.options.filters.width });
            if (MapSVG.isPhone) {
                $("body").append($(this.containers.filtersModal));
                $(this.containers.filtersModal).css({ width: "" });
            } else {
                $(this.containers[this.options.filters.modalLocation]).append(
                    $(this.containers.filtersModal)
                );
            }
        } else {
            this.containers.filtersModal = $("#" + this.options.filters.containerId)[0];
            $(this.containers.filtersModal).css({ width: "" });
        }

        this.loadFiltersController(this.containers.filtersModal, true);
    }
    /**
     * Loads filters controller into a provided container
     * @param {HTMLElement} container - Container, jQuery object
     * @param {boolean} modal - If filter should be in a modal window
     */
    loadFiltersController(container: HTMLElement, modal = false): void {
        if (!this.filtersShouldBeShown()) {
            return;
        }

        let filtersInDirectory: boolean, filtersHide: boolean;

        if (MapSVG.isPhone) {
            filtersInDirectory = true;
            filtersHide = this.options.filters.hideOnMobile; //this.filtersSchema.schema.length > 2;
        } else {
            filtersInDirectory =
                this.options.menu.on &&
                this.controllers.directory &&
                this.options.menu.location === this.options.filters.location;
            filtersHide = this.options.filters.hide;
        }
        const scrollable =
            modal ||
            (!filtersInDirectory &&
                ["leftSidebar", "rightSidebar"].indexOf(this.options.filters.location) !== -1);

        this.filtersRepository =
            this.options.filters.source === "regions"
                ? this.regionsRepository
                : this.objectsRepository;

        if (this.options.filters.searchButton) {
            this.changedFields = null;
            this.changedSearch = null;
        } else {
            this.changedSearch = () => {
                this.filtersRepository.query.searchFallback = this.filtersSchema.getFieldByType(
                    "search"
                ).searchFallback;
                this.throttle(this.filtersRepository.reload, 400, this.filtersRepository);
            };
            this.changedFields = () => {
                this.throttle(this.filtersRepository.reload, 400, this.filtersRepository);
            };
        }

        this.controllers.filters = new FiltersController({
            container: container,
            query: this.filtersRepository.query,
            mapsvg: this,
            schema: this.filtersSchema,
            template: '<div class="mapsvg-filters-container"></div>',
            scrollable: scrollable,
            modal: modal,
            withToolbar: MapSVG.isPhone ? false : modal,
            width: $(container).hasClass("mapsvg-map-container")
                ? this.options.filters.width
                : "100%",
            hide: this.options.filters.hide,
            hideOnMobile: this.options.filters.hideOnMobile,
            showButtonText: this.options.filters.showButtonText,
            clearButton: this.options.filters.clearButton,
            clearButtonText: this.options.filters.clearButtonText,
            searchButton: this.options.filters.searchButton,
            searchButtonText: this.options.filters.searchButtonText,
            padding: this.options.filters.padding,
            events: {
                cleared: () => {
                    this.deselectAllRegions();
                    this.filtersRepository.reload();
                },
                "changed.fields": this.changedFields,

                "changed.search": this.changedSearch,

                "click.btn.searchButton": () => {
                    this.filtersRepository.reload();
                },
                loaded: () => {
                    // TODO add resize sensor to directory instead of this:
                    this.controllers.directory && this.controllers.directory.updateTopShift();
                    this.afterLoadBlockers--;
                    this.finalizeMapLoading();
                },
                "click.btn.showFilters": () => {
                    this.loadFiltersModal();
                },
            },
        });
        this.controllers.filters._init();
    }

    private filtersShouldBeShown() {
        return (
            this.options.filters.on &&
            this.options.filtersSchema &&
            this.options.filtersSchema.length > 0
        );
    }

    /**
     * Event handler for text search input
     * @param {string} text
     * @param {boolean} fallback
     * @private
     */
    textSearch(text: string, fallback = false): void {
        const query = new Query({
            filters: { search: text },
            searchFallback: fallback,
        });

        this.filtersRepository.find(query);
    }
    /**
     * Finds a Region by ID
     * @param {string} id - Region ID
     * @returns {Region}

     * @example
     * var region = mapsvg.getRegion("US-TX");
     */
    getRegion(id: string): Region {
        return this.regions.findById(id);
    }
    /**
     * Returns all Regions
     * @returns {Region[]}
     */
    getRegions(): ArrayIndexed<Region> {
        return this.regions;
    }
    /**
     * Finds a Marker by ID
     * @param {string} id - Marker ID
     * @returns {Marker}

     * @example
     * var marker = mapsvg.getMarker("marker_12");
     */
    getMarker(id: string): Marker {
        return this.markers.findById(id);
    }
    /**
     * Checks if IDs is unique
     * @param id
     * @returns {bool|string} - true if ID is available, {error: "error text"} if not.
     * @private
     */
    checkId(id: string): { canUse: boolean; error: string } {
        if (this.getRegion(id))
            return { canUse: false, error: "This ID is already being used by a Region" };
        else if (this.getMarker(id))
            return { canUse: false, error: "This ID is already being used by another Marker" };
        else return { canUse: true, error: "" };
    }
    /**
     * Redraws colors of regions.
     * Used when Region statuses are loaded from the database or when choropleth map is enabled.
     */
    regionsRedrawColors(): void {
        this.regions.forEach((region: Region) => {
            region.setFill();
        });
    }
    /**
     * Redraws choropleth bubbles.
     */
    redrawBubbles(): void {
        $(this.containers.map).removeClass("bubbles-regions-on bubbles-database-on");

        if (this.options.choropleth.on && this.options.choropleth.bubbleMode) {
            $(this.containers.map).addClass("bubbles-" + this.options.choropleth.source + "-on");
        }

        this.regions.forEach(function (region) {
            region.drawBubble();
        });

        const markersBubbleMode =
            this.options.choropleth.on &&
            this.options.choropleth.source == "database" &&
            this.options.choropleth.bubbleMode;
        this.markers.forEach(function (marker) {
            marker.setBubbleMode(markersBubbleMode);
        });
    }
    /**
     * Destroys the map and all related containers.
     * @returns {Map}
     */
    destroy(): void {
        if (this.controllers && this.controllers.directory) {
            this.controllers.directory.mobileButtons.remove();
        }
        $(this.containers.map)
            .empty()
            .insertBefore($(this.containers.wrapAll))
            .attr("style", "")
            .removeClass("mapsvg mapsvg-responsive");

        this.controllers.popover && this.controllers.popover.close();

        if (this.controllers.detailsView) this.controllers.detailsView.destroy();

        $(this.containers.wrapAll).remove();
    }
    /**
     * Was used previously to return _data that contained all map properties.
     * Now properties are stored in the map instance itself.
     * @returns {Map}
     */
    getData(): { id: number; title: string; options: { [key: string]: any } } {
        return {
            id: this.id,
            title: this.options.title,
            options: this.getOptions(false, false),
        };
    }
    /**
     * Checks if fitmarkers() action can be performed and does it
     * @private
     */
    mayBeFitMarkers(): void {
        if (!this.lastTimeFitWas) {
            this.lastTimeFitWas = Date.now() - 99999;
        }

        this.fitDelta = Date.now() - this.lastTimeFitWas;

        if (
            this.fitDelta > 1000 &&
            !this.firstDataLoad &&
            !this.fitOnDataLoadDone &&
            this.options.fitMarkers
        ) {
            this.fitMarkers();
            this.fitOnDataLoadDone = true;
        }
        if (
            this.firstDataLoad &&
            (this.options.fitMarkersOnStart ||
                (this.options.fitMarkers && this.options.database.loadOnStart === false))
        ) {
            this.firstDataLoad = false;
            if (this.options.googleMaps.on && !this.googleMaps.map) {
                this.events.on("googleMapsLoaded", () => {
                    this.fitMarkers();
                });
            } else {
                this.fitMarkers();
            }
        }

        this.lastTimeFitWas = Date.now();
    }
    /**
     * Changes maps viewBox to fit loaded markers.
     */
    fitMarkers(): void {
        const dbObjects = this.objectsRepository.getLoaded();

        if (!dbObjects || dbObjects.length === 0) {
            return;
        }

        if (this.options.googleMaps.on && typeof google !== "undefined") {
            const lats = [];
            const lngs = [];

            if (dbObjects.length > 1) {
                dbObjects.forEach((object) => {
                    if (object.location && object.location.geoPoint) {
                        lats.push(object.location.geoPoint.lat);
                        lngs.push(object.location.geoPoint.lng);
                    }
                });

                // calc the min and max lng and lat
                const minlat = Math.min.apply(null, lats),
                    maxlat = Math.max.apply(null, lats);
                const minlng = Math.min.apply(null, lngs),
                    maxlng = Math.max.apply(null, lngs);

                const bbox = new google.maps.LatLngBounds(
                    { lat: minlat, lng: minlng },
                    { lat: maxlat, lng: maxlng }
                );
                this.googleMaps.map.fitBounds(bbox, 0);
            } else {
                if (
                    dbObjects[0].location &&
                    dbObjects[0].location.geoPoint.lat &&
                    dbObjects[0].location.geoPoint.lng
                ) {
                    const coords = {
                        lat: dbObjects[0].location.geoPoint.lat,
                        lng: dbObjects[0].location.geoPoint.lng,
                    };
                    if (this.googleMaps.map) {
                        this.googleMaps.map.setCenter(coords);
                        this.googleMaps.map.setZoom(this.options.fitSingleMarkerZoom);
                    }
                }
            }
        } else {
            if (this.options.clustering.on) {
                const arr = [];
                this.markersClusters.forEach((c) => {
                    arr.push(c);
                });
                this.markers.forEach((m) => {
                    arr.push(m);
                });
                this.zoomTo(arr);
                return;
            } else {
                this.zoomTo(this.markers);
                return;
            }
        }
    }

    setFitSingleMarkerZoom(zoom) {
        this.options.fitSingleMarkerZoom = parseInt(zoom);
    }
    /**
     * Shows user current location
     * Works only under HTTPS connection
     * @returns {boolean|object} - "false" if geolocation is unavailable, or {lat: float, lng: float} if it's available
     */
    showUserLocation(callback: (location: Location) => void): void {
        this.getUserLocation((geoPoint: GeoPoint) => {
            this.userLocation = null;
            this.userLocation = new Location({
                geoPoint: geoPoint,
                img: MapSVG.urls.root + "/markers/user-location.svg",
            });
            this.userLocationMarker && this.userLocationMarker.delete();
            this.userLocationMarker = new Marker({
                location: this.userLocation,
                mapsvg: this,
                width: 15,
                height: 15,
            });
            $(this.userLocationMarker.element).addClass("mapsvg-user-location");
            this.userLocationMarker.centered = true;
            this.getLayer("markers").append(this.userLocationMarker.element);
            this.userLocationMarker.adjustScreenPosition();
            callback && callback(this.userLocation);
        });
    }
    /**
     * Gets user's current location by using browser's HTML5 geolocation feature.
     * Works only under HTTPS connection!
     * @returns {boolean|object} - "false" if geolocation is unavailable, or {lat: float, lng: float} if it's available
     */
    getUserLocation(callback: (coordinates: GeoPoint) => void): boolean {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                const pos = new GeoPoint(position.coords.latitude, position.coords.longitude);
                callback && callback(pos);
            });
        } else {
            return false;
        }
    }
    /**
     * Returns current SVG scale related to screen - map screen pixels to SVG points ratio.
     * Example: if SVG current viewBox width is 600 and the map is shown in a 300px container,
     * the map scale is 0.5 (300/600 = 0.5)
     * @returns {number}
     */
    getScale(): number {
        const scale2 = this.containers.map.clientWidth / this.viewBox.width;
        return scale2 || 1;
    }

    /**
     * Returns current viewBox
     * @returns {array} - [x,y,width,height]
     */
    getViewBox(): ViewBox {
        return this.viewBox;
    }
    /**
     * Sets map container size and viewBox size.
     * This method should be used when you need to change both map container size and viewBox size.
     * @param {number} width
     * @param {number} height
     * @returns {Array} - viewBox, [x,y,width,height]
     */
    viewBoxSetBySize(width: number, height: number): ViewBox {
        this.setSize(width, height);
        this._viewBox.update(this.viewBoxGetBySize(width, height));
        this.setViewBox(this._viewBox);
        $(window).trigger("resize");
        this.setSize(width, height);
        this.setZoomLevels();

        return this.viewBox;
    }
    /**
     * Returns viewBox for a provided width/height
     * @param width
     * @param height
     * @returns {Array} - viewBox, [x,y,width,height]
     * @private
     */
    viewBoxGetBySize(width: number, height: number): ViewBox {
        const new_ratio = width / height;
        const old_ratio = this.svgDefault.viewBox.width / this.svgDefault.viewBox.height;

        const vb = this.svgDefault.viewBox.clone();

        if (new_ratio != old_ratio) {
            if (new_ratio > old_ratio) {
                vb.width = this.svgDefault.viewBox.height * new_ratio;
                vb.x = this.svgDefault.viewBox.x - (vb.width - this.svgDefault.viewBox.width) / 2;
            } else {
                vb.height = this.svgDefault.viewBox.width / new_ratio;
                vb.y = this.svgDefault.viewBox.y - (vb.height - this.svgDefault.viewBox.height) / 2;
            }
        }

        return vb;
    }
    /**
     * Resets map zoom and scroll to initial position.
     * @param {bool} toInitial - Set to "true" if you want to reset to initial viewBox that was set by user;
     * set to "false" to reset to original SVG viewBox as defined in the SVG file
     * @returns {Array} - viewBox, [x,y,width,height]
     */
    viewBoxReset(toInitial: boolean): ViewBox {
        if (this.options.googleMaps.on && this.googleMaps.map) {
            if (!toInitial) {
                this.options.googleMaps.center = null;
                this.options.googleMaps.zoom = null;
            }
            if (!this.options.googleMaps.center || !this.options.googleMaps.zoom) {
                const southWest = new google.maps.LatLng(
                    this.geoViewBox.sw.lat,
                    this.geoViewBox.sw.lng
                );
                const northEast = new google.maps.LatLng(
                    this.geoViewBox.ne.lat,
                    this.geoViewBox.ne.lng
                );
                const bounds = new google.maps.LatLngBounds(southWest, northEast);
                this.googleMaps.map.fitBounds(bounds, 0);
                this.options.googleMaps.center = this.googleMaps.map.getCenter().toJSON();
                this.options.googleMaps.zoom = this.googleMaps.map.getZoom();
            } else {
                this.googleMaps.map.setZoom(this.options.googleMaps.zoom);
                this.googleMaps.map.setCenter(this.options.googleMaps.center);
            }
        } else {
            if (toInitial) {
                const v = this._viewBox || this.svgDefault.viewBox;
                this.zoomLevel = 0;
                this._scale = 1;
                this.setViewBox(v);
            } else {
                this.setViewBox();
            }
        }
        return this.viewBox;
    }

    /**
     * Returns geo-bounds of the map.
     * @returns {number[]} - [leftLon, topLat, rightLon, bottomLat]
     */
    getGeoViewBox(): number[] {
        const v = this.viewBox;
        const p1 = new SVGPoint(v.x, v.y);
        const p2 = new SVGPoint(v.x + v.width, v.y);
        const p3 = new SVGPoint(v.x, v.y);
        const p4 = new SVGPoint(v.x, v.y + v.height);

        const leftLon = this.converter.convertSVGToGeo(p1).lng;
        const rightLon = this.converter.convertSVGToGeo(p2).lng;
        const topLat = this.converter.convertSVGToGeo(p3).lat;
        const bottomLat = this.converter.convertSVGToGeo(p4).lat;

        return [leftLon, topLat, rightLon, bottomLat];
    }

    private setStrokes() {
        $(this.containers.svg)
            .find("path, polygon, circle, ellipse, rect, line, polyline")
            .each((index, elem) => {
                const width = MapObject.getComputedStyle("stroke-width", elem);
                if (width) {
                    $(elem).attr("data-stroke-width", width.replace("px", ""));
                }
            });
    }

    /**
     * Adjusts stroke thickness on zoom change
     */
    adjustStrokes(): void {
        $(this.containers.svg)
            .find("path, polygon, circle, ellipse, rect, line, polyline")
            .each((index, elem) => {
                const width = elem.getAttribute("data-stroke-width");
                if (width) {
                    $(elem).css("stroke-width", Number(width) / this.scale);
                }
            });
    }
    /**
     * Zooms-in the map
     * @param {SVGPoint} center - if provided, zoom will shift the center point
     */
    zoomIn(center?: SVGPoint): void {
        if (this.canZoom) {
            this.isZooming = true;
            this.canZoom = false;
            setTimeout(() => {
                this.isZooming = false;
                this.canZoom = true;
            }, 700);
            this.zoom(1, center);
        }
    }
    /**
     * Zooms-out the map
     * @param {SVGPoint} center - [x,y] center point (optional)
     */
    zoomOut(center?: SVGPoint): void {
        if (this.canZoom) {
            this.isZooming = true;
            this.canZoom = false;
            setTimeout(() => {
                this.isZooming = false;
                this.canZoom = true;
            }, 700);
            this.zoom(-1, center);
        }
    }
    /**
     * Zooms to Region, Marker or array of Markers.
     * @param {String|Region|Marker|Marker[]|MarkersCluster[]} mapObjects - Region ID, Region, Marker, array of Markers, array of MarkerClusters
     * @param {number} zoomToLevel - Zoom level
     *
     * @example
     * var region = mapsvg.getRegion("US-TX");
     * mapsvg.zoomTo(region);
     */
    zoomTo(
        mapObjects: Region | Marker | MarkerCluster | Marker[] | Region[] | MarkerCluster[],
        zoomToLevel?: number
    ): boolean {
        // If a single object Marker | Region | Cluster is passed, convert it to array
        if (mapObjects instanceof Marker || mapObjects instanceof MarkerCluster) {
            return this.zoomToMarkerOrCluster(mapObjects, zoomToLevel);
        } else {
            const convertedObjects = !Array.isArray(mapObjects) ? [mapObjects] : mapObjects;
            const bbox = this.getGroupBBox(convertedObjects);
            return this.fitViewBox(bbox, zoomToLevel);
        }
    }

    /**
     * Zooms to a single marker or cluster
     * @private
     */
    zoomToMarkerOrCluster(mapObject: Marker | MarkerCluster, zoomToLevel?: number): boolean {
        this.zoomLevel = zoomToLevel || 1;
        const foundZoomLevel = this.zoomLevels.get(this.zoomLevel);
        if (!foundZoomLevel) {
            return false;
        }
        const vb = foundZoomLevel.viewBox;

        if (this.canZoom) {
            this.isZooming = true;
            this.canZoom = false;
            setTimeout(() => {
                this.isZooming = false;
                this.canZoom = true;
            }, 700);
            const vbNew = new ViewBox(
                mapObject.svgPoint.x - vb.width / 2,
                mapObject.svgPoint.y - vb.height / 2,
                vb.width,
                vb.height
            );
            this.setViewBox(vbNew);
            this._scale = foundZoomLevel._scale;
            return true;
        }

        return false;
    }

    getGroupBBox(mapObjects: (Marker | Region | MarkerCluster)[]): ViewBox {
        let _bbox, bbox;
        const xmax: number[] = [];
        const ymax: number[] = [];
        const xmin: number[] = [];
        const ymin: number[] = [];

        for (let i = 0; i < mapObjects.length; i++) {
            _bbox = mapObjects[i].getBBox();
            xmin.push(_bbox.x);
            ymin.push(_bbox.y);
            const _w = _bbox.x + _bbox.width;
            const _h = _bbox.y + _bbox.height;
            xmax.push(_w);
            ymax.push(_h);
        }
        const _xmin = Math.min(...xmin);
        const _ymin = Math.min(...ymin);
        const width = Math.max(...xmax) - _xmin;
        const height = Math.max(...ymax) - _ymin;

        let padding = 10;
        const point1 = new ScreenPoint(padding, 0);
        const point2 = new ScreenPoint(0, 0);
        padding =
            this.converter.convertPixelToSVG(point1).x - this.converter.convertPixelToSVG(point2).x;

        return new ViewBox(
            _xmin - padding,
            _ymin - padding,
            width + padding * 2,
            height + padding * 2
        );
    }

    fitViewBox(fitViewBox: ViewBox, forceZoomLevel: number): boolean {
        let viewBoxPrev: ViewBox;
        let foundZoomLevelNumber = 0;
        let foundZoomLevel: { zoomLevel: number; viewBox: ViewBox; _scale: number };
        let newViewBox: ViewBox;

        this.zoomLevels.forEach((zoomLevel) => {
            if (viewBoxPrev && viewBoxPrev.x !== undefined) {
                if (
                    fitViewBox.fitsInViewBox(viewBoxPrev) &&
                    zoomLevel.viewBox.fitsInViewBox(fitViewBox, true)
                ) {
                    foundZoomLevelNumber = forceZoomLevel ? forceZoomLevel : zoomLevel.zoomLevel;
                    foundZoomLevel = this.zoomLevels.get(foundZoomLevelNumber);

                    newViewBox = new ViewBox(
                        fitViewBox.x - foundZoomLevel.viewBox.width / 2 + fitViewBox.width / 2,
                        fitViewBox.y - foundZoomLevel.viewBox.height / 2 + fitViewBox.height / 2,
                        foundZoomLevel.viewBox.width,
                        foundZoomLevel.viewBox.height
                    );
                }
            }
            viewBoxPrev = zoomLevel && zoomLevel.viewBox;
        });
        if (foundZoomLevel) {
            if (this.canZoom) {
                this.isZooming = true;
                this.canZoom = false;
                setTimeout(() => {
                    this.isZooming = false;
                    this.canZoom = true;
                }, 700);
                this.zoomLevel = foundZoomLevelNumber;
                this._scale = foundZoomLevel._scale;
                this.setViewBox(newViewBox);
                return true;
            }
        } else {
            return false;
        }
    }

    /**
     * Zooms to a single region
     * @param region
     * @param zoomToLevel
     *
     * @private
     */
    zoomToRegion(region: Region, zoomToLevel?: number): boolean {
        this.fitViewBox(region.getBBox(), zoomToLevel);
        return true;
    }
    /**
     * Centers map on Region or Marker.
     * @param {Region|Marker} region - Region or Marker
     * @param {number} yShift - Vertical shift from center. Used by showPopover method to fit popover in the map container
     */
    centerOn(region: Region | Marker, yShift?: number): void {
        if (this.options.googleMaps.on) {
            yShift = yShift ? (yShift + 12) / this.getScale() : 0;
            $(this.containers.map).addClass("scrolling");
            const latLng = region.getCenterLatLng(yShift);
            this.googleMaps.map.panTo(latLng);
            setTimeout(() => {
                $(this.containers.map).removeClass("scrolling");
            }, 100);
        } else {
            yShift = yShift ? (yShift + 12) / this.getScale() : 0;
            const bbox = region.getBBox();
            const vb = this.viewBox;
            const newViewBox = new ViewBox(
                bbox.x - vb.width / 2 + bbox.width / 2,
                bbox.y - vb.height / 2 + bbox.height / 2 - yShift,
                vb.width,
                vb.height
            );
            this.setViewBox(newViewBox);
        }
    }
    /**
     * Zooms the map
     * @param {number} delta - 1/-1
     * @param {SVGPoint} center - [x,y] zoom center point
     * @returns {boolean}
     */
    zoom(delta: number, center?: SVGPoint): void {
        let newViewBox = new ViewBox(0, 0, 0, 0);

        const d = delta > 0 ? 1 : -1;

        if (!this.zoomLevels.get(this.zoomLevel + d)) return;

        const newZoomLevel = this.zoomLevel + d;
        const zoomIn = d > 0;
        const zoomOut = d < 0;

        const zoomRange = this.getZoomRange();

        const isInZoomRange = this.zoomLevel >= zoomRange.min && this.zoomLevel <= zoomRange.max;

        const goingOutOfZoomRange =
            isInZoomRange && (newZoomLevel > zoomRange.max || newZoomLevel < zoomRange.min);

        const outOfRangeAndMovingAway =
            !isInZoomRange &&
            ((zoomIn && newZoomLevel > zoomRange.max) || (zoomOut && newZoomLevel < zoomRange.min));

        if (goingOutOfZoomRange || outOfRangeAndMovingAway) {
            return;
        }

        this.zoomLevel = newZoomLevel;

        const z = this.zoomLevels.get(this.zoomLevel);
        this._scale = z._scale;
        newViewBox = z.viewBox;

        let shift = [];
        if (center) {
            const koef = zoomIn ? 0.5 : -1; // 1/2 * (d=1) || 2 * (d=-1)
            // shift = [(center.x - this.viewBox.x) * koef, (center.y - this.viewBox.y) * koef];
            // shift = newNewBox.width/2 - (center.x - this.viewBox.x)

            newViewBox.x = this.viewBox.x + (center.x - this.viewBox.x) * koef;
            newViewBox.y = this.viewBox.y + (center.y - this.viewBox.y) * koef;

            // newViewBox.x =
            //     this.svgDefault.viewBox.x + (center.x - this.svgDefault.viewBox.x) * koef;
            //
            // newViewBox.y =
            //     this.svgDefault.viewBox.y + (center.y - this.svgDefault.viewBox.y) * koef;
            // shift = newNewBox.width/2 - ()
            // newViewBox.x -= this.viewBox.x + shift[0];
            // newViewBox.y -= this.viewBox.y + shift[1];
        } else {
            shift = [
                (this.viewBox.width - newViewBox.width) / 2,
                (this.viewBox.height - newViewBox.height) / 2,
            ];
            newViewBox.x = this.viewBox.x + shift[0];
            newViewBox.y = this.viewBox.y + shift[1];
        }

        this.shiftViewBoxToScrollBoundaries(newViewBox);

        this.setViewBox(newViewBox);

        // this.events.trigger('zoom');
    }

    private toggleSvgLayerOnZoom(): void {
        if (
            this.options.googleMaps.on &&
            this.googleMaps.map &&
            this.options.zoom.hideSvg &&
            this.googleMaps.map.getZoom() >= this.options.zoom.hideSvgZoomLevel
        ) {
            if (!$(this.containers.svg).hasClass("mapsvg-invisible")) {
                $(this.containers.svg).animate({ opacity: 0 }, 400, "linear", () => {
                    $(this.containers.svg).addClass("mapsvg-invisible");
                });
            }
        } else {
            if ($(this.containers.svg).hasClass("mapsvg-invisible")) {
                $(this.containers.svg).animate({ opacity: 1 }, 400, "linear", () => {
                    $(this.containers.svg).removeClass("mapsvg-invisible");
                });
            }
        }
    }

    private shiftViewBoxToScrollBoundaries(newViewBox: ViewBox): ViewBox {
        if (this.options.scroll.limit) {
            if (newViewBox.x < this.svgDefault.viewBox.x) newViewBox.x = this.svgDefault.viewBox.x;
            else if (
                newViewBox.x + newViewBox.width >
                this.svgDefault.viewBox.x + this.svgDefault.viewBox.width
            )
                newViewBox.x =
                    this.svgDefault.viewBox.x + this.svgDefault.viewBox.width - newViewBox.width;

            if (newViewBox.y < this.svgDefault.viewBox.y) newViewBox.y = this.svgDefault.viewBox.y;
            else if (
                newViewBox.y + newViewBox.height >
                this.svgDefault.viewBox.y + this.svgDefault.viewBox.height
            )
                newViewBox.y =
                    this.svgDefault.viewBox.y + this.svgDefault.viewBox.height - newViewBox.height;
        }
        return newViewBox;
    }

    /**
     * Deletes a marker
     * @param {Marker} marker
     */
    markerDelete(marker: Marker): void {
        if (this.editingMarker && this.editingMarker.id == marker.id) {
            this.unsetEditingMarker();
        }

        if (this.markers.findById(marker.id)) {
            this.markers.delete(marker.id);
        }
        marker.delete();
        marker = null;

        if (this.markers.length === 0) this.options.markerLastID = 0;
    }
    /**
     * Adds a marker cluster
     * @param {MarkerCluster} markersCluster
     */
    markersClusterAdd(markersCluster: MarkerCluster): void {
        this.layers.markers.append(markersCluster.elem);
        this.markersClusters.push(markersCluster);
        markersCluster.adjustScreenPosition();
    }
    /** Adds a marker to the map.
     * @param {Marker} marker
     * @example
     */
    markerAdd(marker): void {
        $(marker.element).hide();
        marker.adjustScreenPosition();
        // marker.setImage(this.getMarkerImage(marker.object, marker.location), true);
        this.layers.markers.append(marker.element);
        this.markers.push(marker);
        marker.mapped = true;

        setTimeout(function () {
            $(marker.element).show();
        }, 100);
    }
    /**
     * Removes marker from the map
     * @param marker
     */
    markerRemove(marker: Marker): void {
        if (this.editingMarker && this.editingMarker.id == marker.id) {
            this.editingMarker = null;
            delete this.editingMarker;
        }

        if (this.markers.findById(marker.id)) {
            this.markers.findById(marker.id).element.remove();
            this.markers.delete(marker.id);
            marker = null;
        }
        if (this.markers.length === 0) this.options.markerLastID = 0;
    }
    /**
     * Generates new Marker ID
     * @returns {*}
     * @private
     */
    markerId(): string {
        this.options.markerLastID = this.options.markerLastID + 1;
        const id = "marker_" + this.options.markerLastID;
        if (this.getMarker(id)) return this.markerId();
        else return id;
    }

    /**
     * Adjust positions of all movable objects (markers, clusters, popovers, labels)
     *
     */
    movingItemsAdjustScreenPosition() {
        this.markersAdjustScreenPosition();

        this.popoverAdjustScreenPosition();

        this.bubblesRegionsAdjustScreenPosition();

        this.labelsRegionsAdjustScreenPosition();
    }

    /**
     * Move all movable objects (markers, clusters, popovers, labels) by given values
     *
     * @param {number} deltaX
     * @param {number} deltaY
     */
    movingItemsMoveScreenPositionBy(deltaX, deltaY) {
        this.markersMoveScreenPositionBy(deltaX, deltaY);

        this.popoverMoveScreenPositionBy(deltaX, deltaY);

        this.bubblesRegionsMoveScreenPositionBy(deltaX, deltaY);

        this.labelsRegionsMoveScreenPositionBy(deltaX, deltaY);
    }

    /**
     * Adjusts position of Region Labels
     */
    labelsRegionsAdjustScreenPosition() {
        if ($(this.containers.map).is(":visible")) {
            this.regions.forEach(function (region) {
                region.adjustLabelScreenPosition();
            });
        }
    }

    /**
     * Adjusts position of Regions bubbles
     */
    bubblesRegionsAdjustScreenPosition() {
        if ($(this.containers.map).is(":visible")) {
            this.regions.forEach(function (region) {
                region.adjustBubbleScreenPosition();
            });
        }
    }

    /**
     * Move position of Region Labels by given numbers
     *
     * @param {number} deltaX
     * @param {number} deltaY
     */
    labelsRegionsMoveScreenPositionBy(deltaX: number, deltaY: number): void {
        if ($(this.containers.map).is(":visible")) {
            this.regions.forEach(function (region) {
                region.moveLabelScreenPositionBy(deltaX, deltaY);
            });
        }
    }

    /**
     * Move position of Regions bubbles by given numbers
     *
     * @param {number} deltaX
     * @param {number} deltaY
     */
    bubblesRegionsMoveScreenPositionBy(deltaX: number, deltaY: number): void {
        if ($(this.containers.map).is(":visible")) {
            this.regions.forEach((region) => {
                region.moveBubbleScreenPositionBy(deltaX, deltaY);
            });
        }
    }

    /**
     * Adjusts position of Markers and MarkerClusters.
     * This method is called on zoom or when map container is resized.
     */
    markersAdjustScreenPosition(): void {
        this.markers.forEach((marker: Marker) => {
            marker.adjustScreenPosition();
        });
        this.markersClusters.forEach((cluster: MarkerCluster) => {
            cluster.adjustScreenPosition();
        });
        if (this.userLocationMarker) {
            this.userLocationMarker.adjustScreenPosition();
        }
    }

    /**
     * Move Markers and clusters by given numbers.
     *
     * @param {number} deltaX
     * @param {number} deltaY
     */
    markersMoveScreenPositionBy(deltaX: number, deltaY: number): void {
        this.markers.forEach((marker) => {
            marker.moveSrceenPositionBy(deltaX, deltaY);
        });

        this.markersClusters.forEach((cluster: MarkerCluster) => {
            cluster.moveSrceenPositionBy(deltaX, deltaY);
        });

        if (this.userLocationMarker) {
            this.userLocationMarker.moveSrceenPositionBy(deltaX, deltaY);
        }
    }

    /**
     * Sets marker into "edit mode".
     * Used in Map Editor.
     * @param {Marker} marker
     * @private
     */
    setEditingMarker(marker: Marker): void {
        this.editingMarker = marker;
        if (!this.editingMarker.mapped) {
            this.editingMarker.needToRemove = true;
            // this.editingMarker.node.addClass("mapsvg-editing-marker");
            this.markerAdd(this.editingMarker);
        }
    }
    /**
     * Disables marker "edit mode".
     * Used in Map Editor.
     * @private
     */
    unsetEditingMarker(): void {
        if (this.editingMarker && this.editingMarker.needToRemove) {
            this.markerRemove(this.editingMarker);
        }
        this.editingMarker = null;
    }
    /**
     * Returns marker that is currently in the "edit mode"
     * Used in Map Editor.
     * @private
     */
    getEditingMarker(): Marker {
        return this.editingMarker;
    }
    /**
     * Event handler - called when map scroll starts
     * @param e
     * @param mapsvg
     * @returns {boolean}
     * @private
     */
    scrollStart(e: JQuery.TouchEventBase, mapsvg: MapSVGMap): void {
        if (
            $(e.target).hasClass("mapsvg-btn-map") ||
            $(e.target).closest(".mapsvg-choropleth").length
        )
            return;

        if (this.editMarkers.on && $(e.target).hasClass("mapsvg-marker")) return;

        e.preventDefault();

        $(this.containers.map).addClass("no-transitions");

        const ce =
            e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0]
                ? e.originalEvent.touches[0]
                : e;

        this.scrollStarted = true;

        this.scroll = {
            tx: this.scroll.tx || 0,
            ty: this.scroll.ty || 0,
            // initial viewbox when scrollning started
            vxi: this.viewBox.x,
            vyi: this.viewBox.y,
            // mouse coordinates when scrolling started
            x: ce.clientX,
            y: ce.clientY,
            // mouse delta
            dx: 0,
            dy: 0,
            // new viewbox x/y
            vx: 0,
            vy: 0,
            // for google maps scroll
            gx: ce.clientX,
            gy: ce.clientY,
            touchScrollStart: 0,
        };

        if (e.type.indexOf("mouse") === 0) {
            $(document).on("mousemove.scroll.mapsvg", (e: JQuery.TouchEventBase) => {
                this.scrollMove(e);
            });
            if (this.options.scroll.spacebar) {
                $(document).on("keyup.scroll.mapsvg", (e: JQuery.TouchEventBase) => {
                    if (e.keyCode == 32) {
                        this.scrollEnd(e, mapsvg);
                    }
                });
            } else {
                $(document).on("mouseup.scroll.mapsvg", (e: JQuery.TouchEventBase) => {
                    this.scrollEnd(e, mapsvg);
                });
            }
        }
    }
    /**
     * Event handler - called when map scroll moves
     * @param e
     * @event
     * @private
     */
    scrollMove(e: JQuery.TouchEventBase): void {
        e.preventDefault();

        if (!this.isScrolling) {
            this.isScrolling = true;
            // $(this.containers.map).css('pointer-events','none');
            $(this.containers.map).addClass("scrolling");
        }

        const ce =
            e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0]
                ? e.originalEvent.touches[0]
                : e;

        this.panBy(this.scroll.gx - ce.clientX, this.scroll.gy - ce.clientY);

        this.scroll.gx = ce.clientX;
        this.scroll.gy = ce.clientY;

        // delta x/y
        this.scroll.dx = this.scroll.x - ce.clientX;
        this.scroll.dy = this.scroll.y - ce.clientY;

        // new viewBox x/y
        let vx = this.scroll.vxi + this.scroll.dx / this.scale;
        let vy = this.scroll.vyi + this.scroll.dy / this.scale;

        // Limit scroll to map boundaries
        if (this.options.scroll.limit) {
            if (vx < this.svgDefault.viewBox.x) vx = this.svgDefault.viewBox.x;
            else if (
                this.viewBox.width + vx >
                this.svgDefault.viewBox.x + this.svgDefault.viewBox.width
            )
                vx = this.svgDefault.viewBox.x + this.svgDefault.viewBox.width - this.viewBox.width;

            if (vy < this.svgDefault.viewBox.y) vy = this.svgDefault.viewBox.y;
            else if (
                this.viewBox.height + vy >
                this.svgDefault.viewBox.y + this.svgDefault.viewBox.height
            )
                vy =
                    this.svgDefault.viewBox.y +
                    this.svgDefault.viewBox.height -
                    this.viewBox.height;
        }

        this.scroll.vx = vx;
        this.scroll.vy = vy;
    }
    /**
     * Event handler - called when map scroll ends
     * @param {JQuery.TriggeredEvent} e
     * @param {MapSVGMap} mapsvg
     * @param {boolean} noClick
     * @returns {boolean}
     * @event
     * @private
     */
    scrollEnd(e: JQuery.TouchEventBase, mapsvg: MapSVGMap, noClick?: boolean): void {
        setTimeout(() => {
            this.enableAnimation();
            this.scrollStarted = false;
            this.isScrolling = false;
        }, 100);
        if (this.googleMaps && this.googleMaps.overlay) {
            this.googleMaps.overlay.draw();
        }

        $(this.containers.map).removeClass("scrolling");
        $(document).off("keyup.scroll.mapsvg");
        $(document).off("mousemove.scroll.mapsvg");
        $(document).off("mouseup.scroll.mapsvg");

        // call regionClickHandler if mouse did not move more than 5 pixels
        if (noClick !== true && Math.abs(this.scroll.dx) < 5 && Math.abs(this.scroll.dy) < 5) {
            // this.controllers.popoverOffHandler(e);
            /*
            if (this.editMarkers.on && this.clickAddsMarker) this.markerAddClickHandler(e);
            this.events.trigger("click", this, [e, this, this]);
            if (this.objectClickedBeforeScroll) {
                const objectType =
                    this.objectClickedBeforeScroll instanceof Marker
                        ? "marker"
                        : this.objectClickedBeforeScroll instanceof Region
                        ? "region"
                        : "markerCluster";
                this.events.trigger("click." + objectType, this, [
                    e,
                    this.objectClickedBeforeScroll,
                    this,
                ]);
            }
            */
            if (this.editMarkers.on) this.clickAddsMarker && this.markerAddClickHandler(e);
            else if (this.objectClickedBeforeScroll)
                if (this.objectClickedBeforeScroll instanceof Marker) {
                    this.markerClickHandler(e, this.objectClickedBeforeScroll);
                } else if (this.objectClickedBeforeScroll instanceof Region) {
                    this.regionClickHandler(e, this.objectClickedBeforeScroll);
                } else if (this.objectClickedBeforeScroll instanceof MarkerCluster) {
                    this.markerClusterClickHandler(e, this.objectClickedBeforeScroll);
                }
        }

        this.viewBox.x = this.scroll.vx || this.viewBox.x;
        this.viewBox.y = this.scroll.vy || this.viewBox.y;
    }

    setViewBoxByGoogleMapsOverlay(): void {
        const bounds = this.googleMaps.overlay.getPixelBounds();
        const scale = (bounds.ne.x - bounds.sw.x) / this.svgDefault.viewBox.width;

        const vb = new ViewBox(
            this.svgDefault.viewBox.x - bounds.sw.x / scale,
            this.svgDefault.viewBox.y - bounds.ne.y / scale,
            this.containers.map.offsetWidth / scale,
            this.containers.map.offsetHeight / scale
        );
        this.setViewBox(vb, false);
    }

    /**
     * Shift the map by x,y pixels
     * @param {number} x
     * @param {number} y
     */
    panBy(x: number, y: number): { x: boolean; y: boolean } {
        let tx = this.scroll.tx - x;
        let ty = this.scroll.ty - y;

        const scrolled = { x: true, y: true };

        if (this.options.scroll.limit) {
            const svg = $(this.containers.svg)[0].getBoundingClientRect();
            const bounds = $(this.containers.map)[0].getBoundingClientRect();
            if ((svg.left - x > bounds.left && x < 0) || (svg.right - x < bounds.right && x > 0)) {
                tx = this.scroll.tx;
                scrolled.x = false;
            }
            if ((svg.top - y > bounds.top && y < 0) || (svg.bottom - y < bounds.bottom && y > 0)) {
                ty = this.scroll.ty;
                scrolled.y = false;
            }
        }

        $(this.containers.scrollpane).css({
            transform: "translate(" + tx + "px," + ty + "px)",
        });

        this.scroll.tx = tx;
        this.scroll.ty = ty;

        if (scrolled.x || scrolled.y) {
            const moveX = scrolled.x ? x : 0;
            const moveY = scrolled.y ? y : 0;

            this.movingItemsMoveScreenPositionBy(moveX, moveY);

            if (this.googleMaps.map) {
                let point = this.googleMaps.map.getCenter();

                const projection = this.googleMaps.overlay.getProjection();

                const pixelpoint = projection.fromLatLngToDivPixel(point);
                pixelpoint.x += moveX;
                pixelpoint.y += moveY;

                point = projection.fromDivPixelToLatLng(pixelpoint);

                this.googleMaps.map.setCenter(point);
            }
        }

        return scrolled;
    }
    /**
     * Save the Region ID that was clicked before starting map scroll.
     * It is used to trigger .regionClickHandler() later if scroll was less than 5px
     */
    setObjectClickedBeforeScroll(object: Region | Marker | MarkerCluster): void {
        this.objectClickedBeforeScroll = object;
    }
    /**
     * Event hanlder
     * @param _e
     * @param mapsvg
     * @private
     * @event
     */
    touchStart(_e: JQuery.TouchEventBase, mapsvg: MapSVGMap): void {
        _e.preventDefault();

        // stop scroll and cancel click event
        if (this.scrollStarted) {
            this.scrollEnd(_e, mapsvg, true);
        }
        const e = _e.originalEvent;

        if (this.options.zoom.fingers && e.touches && e.touches.length == 2) {
            // this.touchZoomStartViewBox = this.viewBox;
            // this.touchZoomStartScale =  this.scale;
            this.touchZoomStart = true;
            this.scaleDistStart = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
        } else if (e.touches && e.touches.length == 1) {
            this.scrollStart(_e, mapsvg);
        }

        $(document)
            .on("touchmove.scroll.mapsvg", (e: JQuery.TouchEventBase) => {
                e.preventDefault();
                this.touchMove(e, this);
            })
            .on("touchend.scroll.mapsvg", (e: JQuery.TouchEventBase) => {
                e.preventDefault();
                this.touchEnd(e, this);
            });
    }
    /**
     * Event hanlder
     * @param {JQuery.TriggeredEvent} _e
     * @param mapsvg
     * @private
     */
    touchMove(_e: JQuery.TouchEventBase, mapsvg: MapSVGMap): void {
        _e.preventDefault();
        const e = _e.originalEvent;

        if (this.options.zoom.fingers && e.touches && e.touches.length == 2) {
            if (!MapSVG.ios) {
                // e.scale is present on iOS devices only so we need to add "ts-ignore"
                // @ts-ignore
                e.scale =
                    Math.hypot(
                        e.touches[0].pageX - e.touches[1].pageX,
                        e.touches[0].pageY - e.touches[1].pageY
                    ) / this.scaleDistStart;
            }

            // e.scale is present on iOS devices only so we need to add "ts-ignore"
            // @ts-ignore
            if (e.scale != 1 && this.canZoom) {
                // @ts-ignore
                const d = e.scale > 1 ? 1 : -1;

                const cx =
                    e.touches[0].pageX >= e.touches[1].pageX
                        ? e.touches[0].pageX -
                          (e.touches[0].pageX - e.touches[1].pageX) / 2 -
                          $(this.containers.map).offset().left
                        : e.touches[1].pageX -
                          (e.touches[1].pageX - e.touches[0].pageX) / 2 -
                          $(this.containers.map).offset().left;
                const cy =
                    e.touches[0].pageY >= e.touches[1].pageY
                        ? e.touches[0].pageY -
                          (e.touches[0].pageY - e.touches[1].pageY) -
                          $(this.containers.map).offset().top
                        : e.touches[1].pageY -
                          (e.touches[1].pageY - e.touches[0].pageY) -
                          $(this.containers.map).offset().top;

                const center = this.converter.convertPixelToSVG(new ScreenPoint(cx, cy));

                if (d > 0) this.zoomIn(center);
                else this.zoomOut(center);
            }
        } else if (e.touches && e.touches.length == 1) {
            this.scrollMove(_e);
        }
    }
    /**
     * Event hanlder
     * @param _e
     * @param mapsvg
     * @private
     */
    touchEnd(_e: JQuery.TouchEventBase, mapsvg: MapSVGMap): void {
        _e.preventDefault();
        const e = _e.originalEvent;
        if (this.touchZoomStart) {
            this.touchZoomStart = false;
        } else if (this.scrollStarted) {
            this.scrollEnd(_e, mapsvg);
        }

        $(document).off("touchmove.scroll.mapsvg");
        $(document).off("touchend.scroll.mapsvg");
    }
    /**
     * Returns array of IDs of selected Regions
     * @returns {String[]}
     */
    getSelected(): string[] {
        return this.selected_id;
    }
    /**
     * Selects a Region
     * @param {Region|string} id - Region or ID
     * @param {bool} skipDirectorySelection
     * @returns {boolean}
     */
    selectRegion(id: string | Region, skipDirectorySelection?: boolean): void {
        let region: Region;

        // this.hidePopover();
        if (typeof id == "string") {
            region = this.getRegion(id);
        } else {
            region = id;
        }
        if (!region) return;

        let ids: Array<string>;

        if (this.options.multiSelect && !this.editRegions.on) {
            if (region.selected) {
                this.deselectRegion(region);
                if (!skipDirectorySelection && this.options.menu.on) {
                    if (this.options.menu.source == "database") {
                        if (region.objects && region.objects.length) {
                            ids = region.objects.map((obj: CustomObject) => {
                                return obj.id.toString();
                            });
                        }
                    } else {
                        ids = [region.id];
                    }
                    this.controllers.directory.deselectItems();
                }

                return;
            }
        } else if (this.selected_id.length > 0) {
            this.deselectAllRegions();
            if (!skipDirectorySelection && this.options.menu.on) {
                if (this.options.menu.source == "database") {
                    if (region.objects && region.objects.length) {
                        ids = region.objects.map((obj: CustomObject) => {
                            return obj.id.toString();
                        });
                    }
                } else {
                    ids = [region.id];
                }
                this.controllers.directory.deselectItems();
            }
        }

        this.selected_id.push(region.id);
        region.select();

        const skip = this.options.actions.region.click.filterDirectory;

        if (
            !skip &&
            !skipDirectorySelection &&
            this.options.menu.on &&
            this.controllers &&
            this.controllers.directory
        ) {
            if (this.options.menu.source == "database") {
                if (region.objects && region.objects.length) {
                    ids = region.objects.map((obj: CustomObject) => {
                        return obj.id.toString();
                    });
                } else {
                    ids = [region.id];
                }
            } else {
                ids = [region.id];
            }
            this.controllers.directory.selectItems(ids);
        }

        if (
            this.options.actions.region.click.addIdToUrl &&
            !this.options.actions.region.click.showAnotherMap
        ) {
            window.location.hash = "/m/" + region.id;
            // history.replaceState(null, null, region.id);
            // history.replaceState("", document.title, window.location.pathname
            //     + window.location.search + '#m_'+region.id);
        }
    }
    /**
     * Deselects all Regions
     */
    deselectAllRegions(): void {
        $.each(this.selected_id, (index, id) => {
            this.deselectRegion(this.getRegion(id));
        });
    }
    /**
     * Deselects one Region
     * @param {Region} region
     */
    deselectRegion(region: Region): void {
        if (!region) region = this.getRegion(this.selected_id[0]);
        if (region) {
            region.deselect();
            const i = $.inArray(region.id, this.selected_id);
            this.selected_id.splice(i, 1);
            // if(MapSVG.browser.ie)//|| MapSVG.browser.firefox)
            //     this.mapAdjustStrokes();
        }
        if (this.options.actions.region.click.addIdToUrl) {
            // window.location.hash = ' '; //window.location.hash.replace(region.id,'');
            // history.replaceState("", document.title, window.location.pathname
            //     + window.location.search);
            if (window.location.hash.indexOf(region.id) !== -1) {
                history.replaceState(null, null, " ");
            }
        }
    }
    /**
     * Highlights an array of Regions (used on mouseover)
     * @param {Region[]} regions
     */
    highlightRegions(regions: Region[]): void {
        regions.forEach((region) => {
            if (region && !region.selected && !region.disabled) {
                this.highlightedRegions.push(region);
                region.highlight();
            }
        });
    }
    /**
     * Unhighlights all Regions  (used on mouseout)
     */
    unhighlightRegions(): void {
        this.highlightedRegions.forEach((region: Region) => {
            if (region && !region.selected && !region.disabled) region.unhighlight();
        });
        this.highlightedRegions = [];
    }
    /**
     * Selects a Marker
     * @param {Marker} marker
     */
    selectMarker(marker: Marker): void {
        if (!(marker instanceof Marker)) return;

        this.deselectAllMarkers();
        marker.select();
        this.selected_marker = marker;

        $(this.layers.markers).addClass("mapsvg-with-marker-active");

        if (this.options.menu.on && this.options.menu.source == "database") {
            this.controllers.directory.deselectItems();
            this.controllers.directory.selectItems(marker.object.id);
        }
    }

    /**
     * Deselects all Markers
     */
    deselectAllMarkers(): void {
        this.selected_marker && this.selected_marker.deselect();
        $(this.layers.markers).removeClass("mapsvg-with-marker-active");
    }

    /**
     * Deselects one Marker
     * @param {Marker} marker
     */
    deselectMarker(marker: Marker): void {
        if (marker) {
            marker.deselect();
        }
    }
    /**
     * Highlight marker
     * @param {Marker} marker
     */
    highlightMarker(marker: Marker): void {
        $(this.layers.markers).addClass("mapsvg-with-marker-hover");
        marker.highlight();
        this.highlighted_marker = marker;
    }
    /**
     * Unhighlights all Regions  (used on mouseout)
     */
    unhighlightMarker(): void {
        $(this.layers.markers).removeClass("mapsvg-with-marker-hover");
        this.highlighted_marker && this.highlighted_marker.unhighlight();
    }
    /**
     * Converts mouse pointer coordinates to SVG coordinates
     * @param {object} e - Event object
     * @returns {Array} - [x,y] SVG coordinates
     */
    convertMouseToSVG(e: JQuery.TriggeredEvent): SVGPoint {
        const mc = MapSVG.mouseCoords(e);
        const x = mc.x - $(this.containers.map).offset().left;
        const y = mc.y - $(this.containers.map).offset().top;
        const screenPoint = new ScreenPoint(x, y);
        return this.converter.convertPixelToSVG(screenPoint);
    }

    /**
     * Converts map geo-boundaries to viewBox
     * @param sw
     * @param ne
     * @returns {*[]}
     *
     * @private
     * @deprecated
     */
    /*
    convertGeoBoundsToViewBox (geoViewBox: GeoViewBox): ViewBox {
        //sw, ne

        var lat = parseFloat(coords[0]);
        var lon = parseFloat(coords[1]);
        var x = (lon - this.geoViewBox.leftLon) * (this.svgDefault.viewBox.width / this.converter.mapLonDelta);

        var lat = lat * 3.14159 / 180;
        // var worldMapWidth = ((this.svgDefault.width / this.converter.mapLonDelta) * 360) / (2 * 3.14159);
        var worldMapWidth = ((this.svgDefault.viewBox.width / this.converter.mapLonDelta) * 360) / (2 * 3.14159);
        var mapOffsetY = (worldMapWidth / 2 * Math.log((1 + Math.sin(this.mapLatBottomDegree)) / (1 - Math.sin(this.mapLatBottomDegree))));
        var y = this.svgDefault.viewBox.height - ((worldMapWidth / 2 * Math.log((1 + Math.sin(lat)) / (1 - Math.sin(lat)))) - mapOffsetY);

        x += this.svgDefault.viewBox.x;
        y += this.svgDefault.viewBox.y;

        return [x, y];
    }
    */

    /**
     * For choropleth map: returns color for given number value
     * @param {number} choroplethValue - Number value
     * @returns {{r: number, g: number, b: number, a: number}} - Color values, 0-255.
     */
    pickChoroplethColor(choroplethValue: number): { r: number; g: number; b: number; a: number } {
        const w =
            (choroplethValue - this.options.choropleth.coloring.gradient.values.min) /
            this.options.choropleth.coloring.gradient.values.maxAdjusted;
        const rgba = {
            r: Math.round(
                this.options.choropleth.coloring.gradient.colors.diffRGB.r * w +
                    this.options.choropleth.coloring.gradient.colors.lowRGB.r
            ),
            g: Math.round(
                this.options.choropleth.coloring.gradient.colors.diffRGB.g * w +
                    this.options.choropleth.coloring.gradient.colors.lowRGB.g
            ),
            b: Math.round(
                this.options.choropleth.coloring.gradient.colors.diffRGB.b * w +
                    this.options.choropleth.coloring.gradient.colors.lowRGB.b
            ),
            a: Math.round(
                this.options.choropleth.coloring.gradient.colors.diffRGB.a * w +
                    this.options.choropleth.coloring.gradient.colors.lowRGB.a
            ),
        };
        return rgba;
    }
    /**
     * Checks if Region should be disabled
     * @param {string} id - Region ID
     * @param {string} svgfill - Region color ("fill" attribute)
     * @returns {boolean} - "true" if Region should be disabled.
     */
    isRegionDisabled(id: string, svgfill: string): boolean {
        if (this.options.regions[id] && (this.options.regions[id].disabled || svgfill == "none")) {
            return true;
        } else if (
            (this.options.regions[id] == undefined ||
                MapSVG.parseBoolean(this.options.regions[id].disabled)) &&
            (this.options.disableAll || svgfill == "none" || id == "labels" || id == "Labels")
        ) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Gets map settings from the server
     */
    loadMap(id: number | string, container: HTMLElement): void {
        if (!(container instanceof HTMLElement)) {
            console.error("Can't load a new map: container was not provided.");
            return;
        }

        const previousMapsIds = [...this.options.previousMapsIds];
        const currentMapId = this.id;
        if (previousMapsIds[previousMapsIds.length - 1] !== id) {
            previousMapsIds.push(currentMapId);
        } else {
            previousMapsIds.pop();
        }

        let showPreviousMapButton;
        if (this.options.actions.region.click.showAnotherMapContainerId !== "undefined") {
            showPreviousMapButton = false;
        } else {
            showPreviousMapButton = this.options.controls.previousMap;
        }

        const mapsRepo = new MapsRepository();
        mapsRepo.findById(id).done((map) => {
            this.destroy();
            const newMap = new MapSVGMap(container.getAttribute("id"), map);
            newMap.options.previousMapsIds = previousMapsIds;
            newMap.options.controls.previousMap = showPreviousMapButton;
            newMap.setControls(newMap.options.controls);
        });
    }

    /**
     * Load previous map from the history (MapSVGMap.options.previousMapsIds)
     */
    loadPreviousMap(): void {
        const previousMapId = this.options.previousMapsIds[this.options.previousMapsIds.length - 1];
        const container: HTMLElement = document.getElementById(this.containerId);

        this.loadMap(previousMapId, container);
    }
    markerClusterClickHandler(e: JQuery.TriggeredEvent, markerCluster: MarkerCluster): void {
        this.objectClickedBeforeScroll = null;
        if (this.eventsPreventList["click"]) return;
        this.zoomTo(markerCluster.markers);
        return;
    }
    regionClickHandler(e: JQuery.TriggeredEvent, region: Region): void {
        this.objectClickedBeforeScroll = null;
        if (this.eventsPreventList["click"]) return;

        this.selectRegion(region.id);

        if (this.editRegions.on) {
            this.regionEditHandler.call(region);
            return;
        }

        const actions = this.options.actions;

        if (actions.region.click.zoom) {
            this.zoomTo(region, parseInt(actions.region.click.zoomToLevel));
        }

        if (actions.region.click.filterDirectory) {
            const query = new Query({
                filters: {
                    regions: {
                        table_name: this.regionsRepository.getSchema().name,
                        region_ids: [region.id],
                    },
                },
            });
            this.objectsRepository.find(query).done(() => {
                if (this.controllers.popover) {
                    this.controllers.popover.redraw(region.forTemplate());
                }
                if (this.controllers.detailsView) {
                    this.controllers.detailsView.redraw(region.forTemplate());
                }
            });
            this.updateFiltersState();
        }

        if (actions.region.click.showDetails) {
            this.loadDetailsView(region);
        }

        if (actions.region.click.showPopover) {
            if (actions.region.click.zoom) {
                setTimeout(() => {
                    this.showPopover(region);
                }, 400);
            } else {
                this.showPopover(region);
            }
        } else if (e && e.type.indexOf("touch") !== -1 && actions.region.touch.showPopover) {
            if (actions.region.click.zoom) {
                setTimeout(() => {
                    this.showPopover(region);
                }, 400);
            } else {
                this.showPopover(region);
            }
        }

        if (actions.region.click.goToLink) {
            const linkParts = actions.region.click.linkField.split(".");
            let url;
            if (linkParts.length > 1) {
                const obj = linkParts.shift();
                const attr = "." + linkParts.join(".");
                if (obj == "Region") {
                    if (region.data) {
                        try {
                            url = eval("region.data" + attr);
                        } catch (err) {
                            console.log("No such field as region.data" + attr);
                        }
                    }
                } else {
                    if (region.objects && region.objects[0]) {
                        try {
                            url = eval("region.objects[0]" + attr);
                        } catch (err) {
                            console.log("No such field as region.objects[0]" + attr);
                        }
                    }
                }

                if (url && !this.disableLinks) {
                    if (this.editMode) {
                        alert("Redirect: " + url + "\nLinks are disabled in the preview.");
                        return;
                    }
                    if (actions.region.click.newTab) {
                        const win = window.open(url, "_blank");
                        win.focus();
                    } else {
                        window.location.href = url;
                    }
                }
            }
        }
        if (actions.region.click.showAnotherMap) {
            if (this.editMode) {
                alert('"Show another map" action is disabled in the preview');
                return;
            }
            const linkParts = actions.region.click.showAnotherMapField.split(".");
            let url;
            if (linkParts.length > 1) {
                const obj = linkParts.shift();
                const attr = "." + linkParts.join(".");
                let map_id;
                if (obj == "Region") {
                    if (region.data) map_id = eval("region.data" + attr);
                } else {
                    if (region.objects && region.objects[0])
                        map_id = eval("region.objects[0]" + attr);
                }

                if (map_id) {
                    const container = actions.region.click.showAnotherMapContainerId
                        ? $("#" + actions.region.click.showAnotherMapContainerId)[0]
                        : $(this.containers.map)[0];
                    this.loadMap(map_id, container);
                }
            }
        }
        this.events.trigger("click.region", region, [e, region, this]);
    }
    markerClickHandler(e: JQuery.TriggeredEvent, marker: Marker): void {
        this.objectClickedBeforeScroll = null;
        if (this.eventsPreventList["click"]) return;

        const actions = this.options.actions;

        this.selectMarker(marker);
        const passingObject = marker.object;

        if (actions.marker.click.zoom) {
            this.zoomTo(marker, parseInt(actions.marker.click.zoomToLevel));
        }

        if (actions.marker.click.filterDirectory) {
            const query = new Query({ filters: { id: marker.object.id } });
            this.objectsRepository.find(query);
            this.updateFiltersState();
        }

        if (actions.marker.click.showDetails) this.loadDetailsView(passingObject);
        if (actions.marker.click.showPopover) {
            if (actions.marker.click.zoom) {
                setTimeout(() => {
                    this.showPopover(passingObject);
                }, 500);
            } else {
                this.showPopover(passingObject);
            }
        } else if (e && e.type.indexOf("touch") !== -1 && actions.marker.touch.showPopover) {
            if (actions.marker.click.zoom) {
                setTimeout(() => {
                    this.showPopover(passingObject);
                }, 500);
            } else {
                this.showPopover(passingObject);
            }
        }
        if (actions.marker.click.goToLink) {
            const linkParts = actions.marker.click.linkField.split(".");
            let url;
            if (linkParts.length > 1) {
                const obj = linkParts.shift();
                const attr = "." + linkParts.join(".");
                try {
                    url = eval("passingObject" + attr);
                } catch (err) {
                    console.log("MapSVG: No such field as passingObject" + attr);
                }
                if (url && !this.disableLinks)
                    if (this.editMode) {
                        alert("Redirect: " + url + "\nLinks are disabled in the preview.");
                        return;
                    }
                if (actions.marker.click.newTab) {
                    const win = window.open(url, "_blank");
                    win.focus();
                } else {
                    window.location.href = url;
                }
            }
        }
        this.events.trigger("click.marker", marker, [e, marker, this]);
    }
    /**
     * Checks if file exists by provided URL.
     * @param {string} url
     * @returns {boolean}
     *
     * @private
     */
    fileExists(url: string): boolean {
        if (url.substr(0, 4) == "data") return true;
        const http = new XMLHttpRequest();
        http.open("HEAD", url, false);
        http.send();
        return http.status != 404;
    }

    /**
     * Hides all markers
     * @private
     */
    hideMarkers(): void {
        this.markers.forEach(function (marker) {
            marker.hide();
        });
        $(this.containers.wrap).addClass("mapsvg-edit-marker-mode");
    }
    /**
     * Hides all markers except one.
     * Used in Map Editor.
     * @param {string} id - ID of the Marker
     * @private
     */
    hideMarkersExceptOne(id: string): void {
        this.markers.forEach(function (marker) {
            if (typeof id === "undefined" || (marker.object && id != marker.object.id)) {
                marker.hide();
            }
        });

        $(this.containers.wrap).addClass("mapsvg-edit-marker-mode");
    }
    /**
     * Shows all markers after .hideMarkersExceptOne()
     * Used in Map Editor.
     * @private
     */
    showMarkers(): void {
        this.markers.forEach(function (m) {
            m.show();
        });
        this.deselectAllMarkers();
        // $(this.containers.wrap).removeClass('mapsvg-clusters-hidden');
        $(this.containers.wrap).removeClass("mapsvg-edit-marker-mode");
    }
    /**
     * Event handler that creates marker on click on the map.
     * Used in the Map Editor.
     * @param {object} e - Event object
     * @returns {boolean}
     */
    markerAddClickHandler(e: JQuery.TriggeredEvent): void {
        // Don't add marker if marker was clicked
        if ($(e.target).hasClass("mapsvg-marker")) return;
        const svgPoint = this.getSvgPointAtClick(e);
        const geoPoint = this.isGeo() ? this.converter.convertSVGToGeo(svgPoint) : null;

        if (!$.isNumeric(svgPoint.x) || !$.isNumeric(svgPoint.y)) return;

        if (this.editingMarker) {
            if (geoPoint) {
                this.editingMarker.location.setGeoPoint(geoPoint);
            } else {
                this.editingMarker.location.setSvgPoint(svgPoint);
            }
            return;
        }
        const location = new Location({
            svgPoint: svgPoint,
            geoPoint: geoPoint,
            img: this.options.defaultMarkerImage,
        });

        const marker = new Marker({
            location: location,
            mapsvg: this,
        });
        this.markerAdd(marker);

        this.markerEditHandler && this.markerEditHandler.call(location, location);
    }

    private getSvgPointAtClick(
        e: JQuery.TriggeredEvent | JQuery.MouseEventBase | MouseEvent
    ): SVGPoint {
        const mc = MapSVG.mouseCoords(e);
        const x = mc.x - $(this.containers.map).offset().left;
        const y = mc.y - $(this.containers.map).offset().top;
        const screenPoint = new ScreenPoint(x, y);
        return this.converter.convertPixelToSVG(screenPoint);
    }

    /**
     * Sets default marker image.
     * Used in Map Editor.
     * @param {string} src - Image URL
     * @private
     */
    setDefaultMarkerImage(src: string): void {
        this.options.defaultMarkerImage = src;
    }

    /**
     * Checks and remebers if marker images should be set by a field value
     * @private
     */
    setMarkerImagesDependency(): void {
        this.locationField = this.objectsRepository.schema.getFieldByType("location");
        // @ts-ignore
        if (
            this.locationField &&
            this.locationField.markersByFieldEnabled &&
            this.locationField.markerField &&
            Object.values(this.locationField.markersByField).length > 0
        ) {
            this.setMarkersByField = true;
        } else {
            this.setMarkersByField = false;
        }
    }

    /**
     * Returns default marker image or marker image by field value if such option is enabled
     * @param {Number|String} fieldValue
     * @returns {String} URL of marker image
     * @private
     */
    getMarkerImage(fieldValueOrObject: any, location?: Location): string {
        let fieldValue;

        if (this.setMarkersByField) {
            if (typeof fieldValueOrObject === "object") {
                // @ts-ignore
                fieldValue = fieldValueOrObject[this.locationField.markerField];
                if (this.locationField.markerField === "regions") {
                    fieldValue = fieldValue[0] && fieldValue[0].id;
                } else if (typeof fieldValue === "object" && fieldValue.length) {
                    fieldValue = fieldValue[0].value;
                }
            } else {
                fieldValue = fieldValueOrObject;
            }
            // @ts-ignore
            if (this.locationField.markersByField[fieldValue]) {
                // @ts-ignore
                return this.locationField.markersByField[fieldValue];
            }
        }

        return location && location.imagePath
            ? location.imagePath
            : this.options.defaultMarkerImage
            ? this.options.defaultMarkerImage
            : MapSVG.urls.root + "markers/_pin_default.png";
    }

    /**
     * Sets on/off "edit markers" mode
     * @param {bool} on - on/off
     * @param {bool} clickAddsMarker - defines if click on the map should add a marker
     * @private
     */
    setMarkersEditMode(on: boolean, clickAddsMarker: boolean): void {
        this.editMarkers.on = MapSVG.parseBoolean(on);
        this.clickAddsMarker = this.editMarkers.on;
        this.setEventHandlers();
    }

    /**
     * Sets on/off "edit regions" mode
     * Used in Map Editor.
     * @param {bool} on - on/off
     *
     * @private
     */
    setRegionsEditMode(on: boolean): void {
        this.editRegions.on = MapSVG.parseBoolean(on);
        this.deselectAllRegions();
        this.setEventHandlers();
    }

    /**
     * Enables edit mode (which means that the map is going to be shown in the Map Editor)
     * Used in the Map Editor.
     * @param {bool} on
     * @private
     */
    setEditMode(on: boolean): void {
        this.editMode = on;
    }

    /**
     * Enables "Edit objects" mode
     * Used in the Map Editor.
     * @param {bool} on
     * @private
     */
    setDataEditMode(on: boolean): void {
        this.editData.on = MapSVG.parseBoolean(on);
        this.deselectAllRegions();
        this.setEventHandlers();
    }

    /**
     * Downloads SVG file.
     * @private
     */
    /*
    download(){

        var _this = this;

        var downloadForm;
        if($('#mdownload').length === 1){
            downloadForm = $('#mdownload');
        } else {
            downloadForm = $('<form id="mdownload" action="/wp-content/plugins/mapsvg-dev/download.php" method="POST"><input type="hidden" name="svg_file" value="0" /><input type="hidden" name="svg_title"></form>');
            downloadForm.appendTo('body');
        }

        downloadForm.find('input[name="svg_file"]').val($(_this.containers.svg).prop('outerHTML'));
        downloadForm.find('input[name="svg_title"]').val(_this.options.title);
        setTimeout(function() {
            jQuery('#mdownload').submit();
        }, 500);
    }
    */

    /**
     * Adjusts popover position. User on zoom and when map container is resized.
     *
     */
    popoverAdjustScreenPosition(): void {
        if (this.controllers.popover instanceof PopoverController) {
            this.controllers.popover.adjustScreenPosition();
        }
    }

    /**
     * Moves popover position. User on zoom and when map container is resized.
     *
     * @param {number} deltaX
     * @param {number} deltaY
     */
    popoverMoveScreenPositionBy(deltaX: number, deltaY: number): void {
        if (this.controllers.popover instanceof PopoverController) {
            this.controllers.popover.moveSrceenPositionBy(deltaX, deltaY);
        }
    }

    /**
     * Shows a popover for provided Region or DB Object.
     * @param {Region|object} object - Region or DB Object
     *
     * @example
     * var region = mapsvg.getRegion("US-TX");
     * mapsvg.showPopover(region);
     */
    showPopover(object: Region | CustomObject): void {
        const mapObject =
            object instanceof Region
                ? object
                : object.location && object.location.marker
                ? object.location.marker
                : null;
        if (!mapObject) return;

        let point;
        if (mapObject instanceof Marker) {
            point = mapObject.svgPoint;
        } else {
            point = mapObject.getCenterSVG();
        }
        this.controllers.popover && this.controllers.popover.destroy();
        this.controllers.popover = new PopoverController({
            container: this.containers.popover,
            point: point,
            yShift: mapObject instanceof Marker ? mapObject.height : 0,
            template:
                object instanceof Region
                    ? this.options.templates.popoverRegion
                    : this.options.templates.popoverMarker,
            mapsvg: this,
            data: object.getData(),
            mapObject: mapObject,
            scrollable: true,
            withToolbar: !(MapSVG.isPhone && this.options.popovers.mobileFullscreen),
            events: {
                shown: (popover: PopoverController) => {
                    if (this.options.popovers.centerOn) {
                        const shift = popover.containers.main.offsetHeight / 2;
                        if (
                            this.options.popovers.centerOn &&
                            !(MapSVG.isPhone && this.options.popovers.mobileFullscreen)
                        ) {
                            this.centerOn(mapObject, shift);
                        }
                    }
                    this.popoverShowingFor = mapObject;
                    this.events.trigger("shown.popover", this, [this, popover]);
                    $(window).trigger("shown.popover", [this, popover]);
                },
                closed: (popover: PopoverController) => {
                    this.options.popovers.resetViewboxOnClose && this.viewBoxReset(true);
                    this.popoverShowingFor = null;
                    this.events.trigger("closed.popover", this, [this, popover]);
                },
                resize: (popover: PopoverController) => {
                    if (this.options.popovers.centerOn) {
                        const shift = popover.containers.main.offsetHeight / 2;
                        if (
                            this.options.popovers.centerOn &&
                            !(MapSVG.isPhone && this.options.popovers.mobileFullscreen)
                        ) {
                            this.centerOn(mapObject, shift);
                        }
                    }
                },
            },
        });
        this.controllers.popover._init();
    }

    /**
     * Hides the popover
     */
    hidePopover(): void {
        this.controllers.popover && this.controllers.popover.close();
    }

    /**
     * Event handler that catches clicks outside of the popover and closes the popover.
     * @param {object} e - Event object
     */
    popoverOffHandler(e: JQuery.TriggeredEvent): void {
        if (
            this.isScrolling ||
            $(e.target).closest(".mapsvg-popover").length ||
            $(e.target).hasClass("mapsvg-btn-map")
        )
            return;
        this.controllers.popover && this.controllers.popover.close();
    }

    /**
     * Mouseover event handler for Regions and Markers
     * @param {object} e - Event object
     * @param {Marker|Region} object
     * @private
     */
    mouseOverHandler(e: JQuery.TriggeredEvent, object: Marker | Region | MarkerCluster): void {
        if (this.eventsPreventList["mouseover"]) {
            return;
        }

        if (object instanceof Marker) {
            if (this.options.actions.marker.mouseover.showTooltip) {
                this.showTooltip(object);
            }
        }

        if (object instanceof Region) {
            if (this.options.actions.region.mouseover.showTooltip) {
                this.showTooltip(object);
            }
        }

        let ids: any[];
        if (this.options.menu.on) {
            if (this.options.menu.source == "database") {
                if (object instanceof Region && object.objects.length) {
                    ids = object.objects.map((obj) => {
                        return obj.id;
                    });
                }
                if (object instanceof Marker) {
                    ids = object.object ? [object.object.id] : [];
                }
            } else {
                if (object instanceof Region) {
                    ids = [object.id];
                }
                if (
                    this instanceof Marker &&
                    // @ts-ignore
                    object.object.regions &&
                    // @ts-ignore
                    object.object.regions.length
                ) {
                    // @ts-ignore
                    ids = object.object.regions.map((obj) => {
                        return obj.id;
                    });
                }
            }
            this.controllers.directory.highlightItems(ids);
        }

        if (object instanceof Region) {
            if (!object.selected) object.highlight();
            this.events.trigger("mouseover.region", object, [e, this]);
        } else {
            this.highlightMarker(<Marker>object);
            this.events.trigger("mouseover.marker", object, [e, this]);
        }
    }

    public showTooltip(object: Marker | Region | MarkerCluster): void {
        let name, _object;
        if (object instanceof Region) {
            name = "tooltipRegion";
            _object = object;
        } else if (object instanceof Marker) {
            name = "tooltipMarker";
            _object = object.object;
        } else {
            name = "tooltipMarker";
            _object = object;
        }
        if (_object != null && this.popoverShowingFor !== object) {
            this.controllers.tooltip.setMainTemplate(this.options.templates[name]);
            this.controllers.tooltip.redraw(_object.getData());
            this.controllers.tooltip.show();
        }
    }

    /**
     * Mouseout event handler for Regions and Markers
     * @param {object} e - Event object
     * @param {Marker|Region} object
     * @private
     */
    mouseOutHandler(e: JQuery.TriggeredEvent, object: Marker | Region | MarkerCluster): void {
        if (this.eventsPreventList["mouseout"]) {
            return;
        }

        if (this.controllers.tooltip) this.controllers.tooltip.hide();

        if (object instanceof Region) {
            if (!object.selected) object.unhighlight();
            this.events.trigger("mouseout.region", object, [e, this]);
        } else {
            this.unhighlightMarker();
            this.events.trigger("mouseout.marker", object, [e, this]);
        }

        let ids: any[];
        if (this.options.menu.on) {
            if (this.options.menu.source == "database") {
                if (object instanceof Marker) {
                    const marker = <Marker>object;
                    ids = marker.object ? [marker.object.id] : [];
                }
            }
            this.controllers.directory.unhighlightItems();
        }
    }

    /**
     * Prevents provided event from being fired
     * @param {string} event - Event name
     * @private
     */
    eventsPrevent(event: string): void {
        this.eventsPreventList[event] = true;
    }

    /**
     * Restores event disabled by .eventsPrevent()
     * @param {string} event - Event name
     * @private
     */
    eventsRestore(event: string): void {
        if (event) {
            this.eventsPreventList[event] = false;
        } else {
            this.eventsPreventList = {};
        }
    }

    /**
     * Sets all event handlers
     * @private
     */
    setEventHandlers() {
        const _this = this;

        $(_this.containers.map).off(".common.mapsvg");
        $(_this.containers.scrollpane).off(".common.mapsvg");
        $(document).off(".scroll.mapsvg");
        $(document).off(".scrollInit.mapsvg");

        if (_this.editMarkers.on) {
            $(_this.containers.map).on(
                "touchstart.common.mapsvg mousedown.common.mapsvg",
                ".mapsvg-marker",
                function (e) {
                    e.originalEvent.preventDefault();
                    const marker = _this.getMarker($(this).attr("id"));
                    const startCoords = MapSVG.mouseCoords(e);
                    marker.drag(startCoords, _this.scale);

                    /*
                marker.drag(startCoords, _this.scale, function() {
                    if (_this.mapIsGeo){
                        var svgPoint = new SVGPoint(this.x + this.width / 2, this.y + (this.height-1));
                        this.geoCoords = _this.converter.convertSVGToGeo(svgPoint);
                    }
                    //_this.markerEditHandler && _this.markerEditHandler.call(this,true);
                },function(){
                    //_this.markerEditHandler && _this.markerEditHandler.call(this);
                });

                 */
                }
            );
        }

        // REGIONS
        if (!_this.editMarkers.on) {
            $(_this.containers.map)
                .on("mouseover.common.mapsvg", ".mapsvg-region", function (e) {
                    const id = $(this).attr("id");
                    _this.mouseOverHandler.call(_this, e, _this.getRegion(id));
                })
                .on("mouseleave.common.mapsvg", ".mapsvg-region", function (e) {
                    const id = $(this).attr("id");
                    _this.mouseOutHandler.call(_this, e, _this.getRegion(id));
                });
        }
        if (!_this.editRegions.on) {
            $(_this.containers.map)
                .on("mouseover.common.mapsvg", ".mapsvg-marker", function (e) {
                    const id = $(this).attr("id");
                    _this.mouseOverHandler.call(_this, e, _this.getMarker(id));
                })
                .on("mouseleave.common.mapsvg", ".mapsvg-marker", function (e) {
                    const id = $(this).attr("id");
                    _this.mouseOutHandler.call(_this, e, _this.getMarker(id));
                });
        }

        if (_this.options.scroll.spacebar) {
            $(document).on("keydown.scroll.mapsvg", function (e) {
                if (
                    !(
                        document.activeElement.tagName === "INPUT" &&
                        $(document.activeElement).attr("type") === "text"
                    ) &&
                    !_this.isScrolling &&
                    e.keyCode == 32
                ) {
                    e.preventDefault();
                    $(_this.containers.map).addClass("mapsvg-scrollable");
                    $(document)
                        .on("mousemove.scrollInit.mapsvg", function (e: JQuery.TouchEventBase) {
                            _this.isScrolling = true;
                            $(document).off("mousemove.scrollInit.mapsvg");
                            _this.scrollStart(e, _this);
                        })
                        .on("keyup.scroll.mapsvg", function (e: JQuery.TouchEventBase) {
                            if (e.keyCode == 32) {
                                $(document).off("mousemove.scrollInit.mapsvg");
                                $(_this.containers.map).removeClass("mapsvg-scrollable");
                            }
                        });
                }
            });
        } else if (!_this.options.scroll.on) {
            if (!_this.editMarkers.on) {
                $(_this.containers.map).on(
                    "touchstart.common.mapsvg",
                    ".mapsvg-region",
                    function (e) {
                        _this.scroll.touchScrollStart = $(window).scrollTop();
                    }
                );
                $(_this.containers.map).on(
                    "touchstart.common.mapsvg",
                    ".mapsvg-marker",
                    function (e) {
                        _this.scroll.touchScrollStart = $(window).scrollTop();
                    }
                );

                $(_this.containers.map).on(
                    "touchend.common.mapsvg mouseup.common.mapsvg",
                    ".mapsvg-region",
                    function (e) {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                        if (
                            !_this.scroll.touchScrollStart ||
                            _this.scroll.touchScrollStart === $(window).scrollTop()
                        ) {
                            _this.regionClickHandler(e, _this.getRegion($(this).attr("id")));
                        }
                    }
                );
                $(_this.containers.map).on(
                    "touchend.common.mapsvg mouseup.common.mapsvg",
                    ".mapsvg-marker",
                    function (e) {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                        if (
                            !_this.scroll.touchScrollStart ||
                            _this.scroll.touchScrollStart === $(window).scrollTop()
                        ) {
                            _this.markerClickHandler.call(
                                _this,
                                e,
                                _this.getMarker($(this).attr("id"))
                            );
                        }
                    }
                );
                $(_this.containers.map).on(
                    "touchend.common.mapsvg mouseup.common.mapsvg",
                    ".mapsvg-marker-cluster",
                    function (e) {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                        if (
                            !_this.scroll.touchScrollStart ||
                            _this.scroll.touchScrollStart == $(window).scrollTop()
                        ) {
                            const cluster = $(this).data("cluster");
                            _this.zoomTo(cluster.markers);
                        }
                    }
                );
                // }
            } else {
                if (_this.clickAddsMarker)
                    $(_this.containers.map).on(
                        "touchend.common.mapsvg mouseup.common.mapsvg",
                        function (e) {
                            // e.stopImmediatePropagation();
                            if (e.cancelable) {
                                e.preventDefault();
                            }
                            _this.markerAddClickHandler(e);
                        }
                    );
            }
        } else {
            $(_this.containers.map).on(
                "touchstart.common.mapsvg mousedown.common.mapsvg",
                function (e: JQuery.TouchEventBase) {
                    if (
                        $(e.target).hasClass("mapsvg-popover") ||
                        $(e.target).closest(".mapsvg-popover").length
                    ) {
                        // Prevent even dobule firing touchstart+mousedown on clicking popover close button
                        if ($(e.target).hasClass("mapsvg-popover-close")) {
                            if (e.type == "touchstart") {
                                if (e.cancelable) {
                                    e.preventDefault();
                                }
                            }
                        }
                        return;
                    }

                    if (e.type == "touchstart") {
                        if (e.cancelable) {
                            e.preventDefault();
                        }
                    }

                    let obj: any;

                    if (
                        e.target &&
                        $(e.target).attr("class") &&
                        $(e.target).attr("class").indexOf("mapsvg-region") != -1
                    ) {
                        obj = _this.getRegion($(e.target).attr("id"));
                        _this.setObjectClickedBeforeScroll(obj);
                    } else if (
                        e.target &&
                        $(e.target).attr("class") &&
                        $(e.target).attr("class").indexOf("mapsvg-marker") != -1 &&
                        $(e.target).attr("class").indexOf("mapsvg-marker-cluster") === -1
                    ) {
                        if (_this.editMarkers.on) {
                            return;
                        }
                        obj = _this.getMarker($(e.target).attr("id"));
                        _this.setObjectClickedBeforeScroll(obj);
                    } else if (
                        e.target &&
                        $(e.target).attr("class") &&
                        $(e.target).attr("class").indexOf("mapsvg-marker-cluster") != -1
                    ) {
                        if (_this.editMarkers.on) {
                            return;
                        }
                        obj = $(e.target).data("cluster");
                        _this.setObjectClickedBeforeScroll(obj);
                    }
                    if (e.type == "mousedown") {
                        _this.scrollStart(e, _this);
                    } else {
                        _this.touchStart(e, _this);
                    }
                }
            );
        }

        //TODO Vyacheslav - переделать под новый choropleth
        /*
        $(_this.containers.map).on('mouseover.common.mapsvg', '.mapsvg-choropleth-gradient-wrap', function(e){
            let currentSegment = _this.options.choropleth.segments[$(e.target).parents('.mapsvg-choropleth-gradient-wrap').data('idx')];

            if (currentSegment.description){
                _this.showTooltip(currentSegment.description);
            }
        });
        */

        $(_this.containers.map).on(
            "mouseleave.common.mapsvg",
            ".mapsvg-choropleth-gradient-wrap",
            (e) => {
                this.controllers.tooltip.hide();
            }
        );
    }

    setLabelsRegions(options?: any): void {
        options = options || this.options.labelsRegions;
        options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
        $.extend(true, this.options, { labelsRegions: options });

        if (this.options.labelsRegions.on) {
            this.regions.forEach((region) => {
                if (!region.label) {
                    region.label = jQuery('<div class="mapsvg-region-label" />')[0];
                    $(this.layers.labels).append(region.label);
                }
                try {
                    $(region.label).html(this.templates.labelRegion(region.forTemplate()));
                } catch (err) {
                    console.error('MapSVG: Error in the "Region Label" template');
                }
            });
            this.labelsRegionsAdjustScreenPosition();
        } else {
            this.regions.forEach((region) => {
                if (region.label) {
                    $(region.label).remove();
                    region.label = null;
                    delete region.label;
                }
            });
        }
    }

    /**
     * Sets Marker labels
     * @param {object} options
     */
    setLabelsMarkers(options?: any): void {
        options = options || this.options.labelsMarkers;
        options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
        $.extend(true, this.options, { labelsMarkers: options });

        if (this.options.labelsMarkers.on) {
            this.markers.forEach((marker: Marker) => {
                try {
                    marker.setLabel(this.templates.labelMarker(marker.object));
                } catch (err) {
                    console.error('MapSVG: Error in the "Marker Label" template');
                }
            });
        } else {
            this.markers.forEach((marker: Marker) => {
                marker.setLabel("");
            });
        }
    }

    /**
     * Adds a layer to the map that may contain some objects.
     * @private
     */
    addLayer(name: string): HTMLElement {
        this.layers[name] = $('<div class="mapsvg-layer mapsvg-layer-' + name + '"></div>')[0];
        this.containers.layers.appendChild(this.layers[name]);
        return this.layers[name];
    }

    /**
     * Returns layer by provided name
     * @param name
     */
    getLayer(name: string): HTMLElement {
        return this.layers[name];
    }

    /**
     * Returns Database
     * @example
     * var objects = mapsvg.getDb().getLoaded();
     * var object  = mapsvg.getDb().getLoadedObject(12);
     *
     * // Filter DB by region "US-TX". This automatically triggers markers and directory reloading
     * mapsvg.getDatabase().getAll({filters: {regions: "US-TX"}});
     */
    getDb(): CustomObjectsRepository {
        return this.objectsRepository;
    }

    /**
     * Returns Regions database
     */
    getDbRegions(): RegionsRepository {
        return this.regionsRepository;
    }

    /**
     * Adds an SVG object as Region to MapSVG
     * @param {object} svgObject - SVG Object
     * @returns {Region}
     * @private
     */
    regionAdd(
        svgObject:
            | SVGPathElement
            | SVGCircleElement
            | SVGEllipseElement
            | SVGRectElement
            | SVGPolygonElement
            | SVGPolylineElement
    ) {
        const region = new Region(svgObject, this);
        region.setStatus(1);
        this.regions.push(region);
        this.regions.sort(function (a, b) {
            return a.id == b.id ? 0 : +(a.id > b.id) || -1;
        });
        return region;
    }

    /**
     * Deletes a Region from the map
     * @param {string} id - Region ID
     * @private
     */
    regionDelete(id: string): void {
        if (this.regions.findById(id)) {
            this.regions.findById(id).elem.remove();
            this.regions.delete(id);
        } else if ($("#" + id).length) {
            $("#" + id).remove();
        }
    }
    /**
     * Reloads Regions from SVG file
     */
    reloadRegions(): void {
        // this.regions.forEach(function (r: Region) {
        //     $(r.element).css({ "stroke-width": r.style["stroke-width"] });
        // });
        this.regions.clear();
        $(this.containers.svg).find(".mapsvg-region").removeClass("mapsvg-region");
        $(this.containers.svg)
            .find(".mapsvg-region-disabled")
            .removeClass("mapsvg-region-disabled");
        $(this.containers.svg)
            .find("path, polygon, circle, ellipse, rect")
            .each((index: number, element: HTMLElement) => {
                // @ts-ignore
                const elem = <SVGElement>element;
                if ($(elem).closest("defs").length) return;
                if (elem.getAttribute("data-stroke-width")) {
                    elem.style["stroke-width"] = elem.getAttribute("data-stroke-width");
                }
                if (elem.getAttribute("id")) {
                    if (
                        !this.options.regionPrefix ||
                        (this.options.regionPrefix &&
                            elem.getAttribute("id").indexOf(this.options.regionPrefix) === 0)
                    ) {
                        const region = new Region(elem, this);
                        this.regions.push(region);
                    }
                }
            });
    }
    /**
     * Reloads Regions data
     */
    reloadRegionsFull(): void {
        const statuses = this.regionsRepository.getSchema().getFieldByType("status");

        this.regions.forEach((region) => {
            const _region = <CustomObject>this.regionsRepository.getLoaded().findById(region.id);

            if (_region) {
                region.setData(_region);
                if (statuses && _region.status !== undefined && _region.status !== null) {
                    region.setStatus(_region.status);
                }
            } else {
                if (
                    this.options.filters.filteredRegionsStatus ||
                    this.options.filters.filteredRegionsStatus === 0 ||
                    (this.options.menu.source === "regions" &&
                        this.options.menu.filterout &&
                        this.options.menu.filterout.field === "status" &&
                        this.options.menu.filterout.val) ||
                    this.options.menu.filterout.val === 0
                ) {
                    const status =
                        this.options.filters.filteredRegionsStatus ||
                        this.options.filters.filteredRegionsStatus === 0
                            ? this.options.filters.filteredRegionsStatus
                            : this.options.menu.filterout.val;
                    region.setStatus(status);
                }
            }
        });

        this.loadDirectory();
        this.setChoropleth();
        this.setLayersControl();
        this.setGroups();
        if (this.options.labelsRegions.on) {
            this.setLabelsRegions();
        }
    }

    /**
     * Fix "fit markers" view world screen offset
     * @private
     */
    fixMarkersWorldScreen(): void {
        if (this.googleMaps.map)
            setTimeout(() => {
                const markers = { left: 0, right: 0, leftOut: 0, rightOut: 0 };
                if (this.markers.length > 1) {
                    this.markers.forEach((m: Marker) => {
                        if (
                            $(m.element).offset().left <
                            $(this.containers.map).offset().left +
                                this.containers.map.clientWidth / 2
                        ) {
                            markers.left++;
                            if ($(m.element).offset().left < $(this.containers.map).offset().left) {
                                markers.leftOut++;
                            }
                        } else {
                            markers.right++;
                            if (
                                $(m.element).offset().left >
                                $(this.containers.map).offset().left +
                                    this.containers.map.clientWidth
                            ) {
                                markers.rightOut++;
                            }
                        }
                    });

                    if (
                        (markers.left === 0 && markers.rightOut) ||
                        (markers.right === 0 && markers.leftOut)
                    ) {
                        const k = markers.left === 0 ? 1 : -1;
                        const ww =
                            (this.svgDefault.viewBox.width / this.converter.mapLonDelta) *
                            360 *
                            this.getScale();
                        this.googleMaps.map.panBy(k * ww, 0);
                    }
                }
            }, 600);
    }

    /**
     * Updates map options from old version of MapSVG
     * @param options
     * @private
     */
    updateOutdatedOptions(options) {
        // Fix Directory options
        if (options.menu && (options.menu.position || options.menu.customContainer)) {
            if (options.menu.customContainer) {
                options.menu.location = "custom";
            } else {
                options.menu.position = options.menu.position === "left" ? "left" : "right";
                options.menu.location =
                    options.menu.position === "left" ? "leftSidebar" : "rightSidebar";
                if (!options.containers || !options.containers[options.menu.location]) {
                    options.containers = options.containers || {};
                    options.containers[options.menu.location] = { on: false, width: "200px" };
                }
                options.containers[options.menu.location].width = options.menu.width;
                if (MapSVG.parseBoolean(options.menu.on)) {
                    options.containers[options.menu.location].on = true;
                }
            }
            delete options.menu.position;
            delete options.menu.width;
            delete options.menu.customContainer;
        }
        // Fix Details View options
        if (
            options.detailsView &&
            (options.detailsView.location === "mapContainer" ||
                options.detailsView.location === "near" ||
                options.detailsView.location === "top")
        ) {
            options.detailsView.location = "map";
        }
        // Transfer zoom options to controls options
        if (!options.controls) {
            options.controls = {};
            options.controls.zoom =
                options.zoom &&
                options.zoom.on &&
                (!options.zoom.buttons || options.zoom.buttons.location !== "hide");
            options.controls.location =
                options.zoom && options.zoom.buttons && options.zoom.buttons.location !== "hide"
                    ? options.zoom.buttons.location
                    : "right";
        }
        // Transfer zoom options to controls options
        if (options.colors && !options.colors.markers) {
            options.colors.markers = {
                base: { opacity: 100, saturation: 100 },
                hovered: { opacity: 100, saturation: 100 },
                unhovered: { opacity: 100, saturation: 100 },
                active: { opacity: 100, saturation: 100 },
                inactive: { opacity: 100, saturation: 100 },
            };
        }
        if (options.tooltipsMode) {
            options.tooltips.mode = options.tooltipsMode;
            delete options.tooltipsMode;
        }
        if (options.popover) {
            options.popovers = options.popover;
            delete options.popover;
        }
    }

    /**
     * Initialization. Map rendering happens here. Gets called on map creation.
     * @param {MapOptionsInterface} options - Map options
     * @param {HTMLElement} elem
     * @returns {*}
     * @private
     */
    init(): MapSVGMap {
        MapSVG.addInstance(this);

        if (this.options.source === "") {
            throw new Error("MapSVG: please provide SVG file source.");
        }

        this.disableAnimation();

        this.setEvents(this.options.events);
        this.events.trigger("beforeLoad");

        // TODO load only when filters are on
        this.loadGoogleMapsAPI(
            () => {},
            () => {}
        );

        this.containers.map.classList.add("mapsvg");

        this.setCss();

        if (this.options.colors && this.options.colors.background) {
            this.containers.map.style.background = this.options.colors.background;
        }

        this.setContainers(this.options.containers);
        this.setColors();

        this.addLoadingMessage();

        this.addLayer("markers");
        this.addLayer("labels");
        this.addLayer("bubbles");
        this.addLayer("popovers");
        this.addLayer("scrollpane");

        this.loadExtensions();

        // GET the map by ajax request
        $.ajax({ url: this.options.source + "?v=" + this.svgFileLastChanged })
            .fail((resp) => {
                this.svgLoadingFailed(resp);
            })
            .done((xmlData) => {
                this.renderSvgData(xmlData);
            });

        return this;
    }

    getContainer(name: string): HTMLElement {
        return this.containers[name];
    }

    private renderSvgData(xmlData) {
        // Default width/height/viewBox from SVG
        const svgTag = $(xmlData).find("svg");
        this.containers.svg = svgTag[0];

        if (svgTag.attr("width") && svgTag.attr("height")) {
            this.svgDefault.width = parseFloat(svgTag.attr("width").replace(/px/g, ""));
            this.svgDefault.height = parseFloat(svgTag.attr("height").replace(/px/g, ""));
            this.svgDefault.viewBox = svgTag.attr("viewBox")
                ? new ViewBox(svgTag.attr("viewBox").split(" "))
                : new ViewBox(0, 0, this.svgDefault.width, this.svgDefault.height);
        } else if (svgTag.attr("viewBox")) {
            this.svgDefault.viewBox = new ViewBox(svgTag.attr("viewBox").split(" "));
            this.svgDefault.width = this.svgDefault.viewBox.width;
            this.svgDefault.height = this.svgDefault.viewBox.height;
        } else {
            const msg =
                "MapSVG: width/height and viewBox are missing in the SVG file. Can't parse the file because of that.";
            if (this.editMode) {
                alert(msg);
            } else {
                console.error(msg);
            }
            return false;
        }

        this.geoViewBox = this.getGeoViewBoxFromSvgTag(this.containers.svg);

        if (this.options.viewBox && this.options.viewBox.length == 4) {
            this._viewBox = new ViewBox(this.options.viewBox);
        } else {
            this._viewBox = new ViewBox(this.svgDefault.viewBox);
        }

        svgTag.attr("preserveAspectRatio", "xMidYMid meet");
        svgTag.removeAttr("width");
        svgTag.removeAttr("height");
        $(this.containers.scrollpane).append(svgTag);
        this.setStrokes();

        this.reloadRegions();

        this.setSize(this.options.width, this.options.height, this.options.responsive);

        if (this.options.disableAll) {
            this.setDisableAll(true);
        }

        this.setViewBox(this._viewBox);

        // Create Converter instance
        this.converter = new Converter(this.containers.map, this.svgDefault.viewBox, this.viewBox);
        if (this.geoViewBox) {
            this.converter.setGeoViewBox(this.geoViewBox);
        }

        this.setResponsive(this.options.responsive);
        this.setScroll(this.options.scroll, true);
        this.setZoom(this.options.zoom);
        this.setControls(this.options.controls);
        this.setGoogleMaps();
        this.setTooltips(this.options.tooltips);
        this.setPopovers(this.options.popovers);
        if (this.options.cursor) this.setCursor(this.options.cursor);
        this.setTemplates(this.options.templates);
        this.loadExtensions();

        this.filtersSchema = new Schema({ fields: this.options.filtersSchema });

        this.objectsRepository.events.on("load", () => {
            this.showLoadingMessage();
        });
        this.objectsRepository.events.on("loaded", () => {
            this.setGlobalDistanceFilter();
            this.fitOnDataLoadDone = false;
            this.addLocations();
            this.fixMarkersWorldScreen();
            // this.addDataObjectsAsMarkers();
            this.attachDataToRegions();
            this.loadDirectory();
            if (this.options.labelsMarkers.on) {
                this.setLabelsMarkers();
            }
            // Check if there's a call to "{{objects}}" inside of the labelRegion template
            // and if it's found then reload Region Labels
            if (this.options.templates.labelRegion.indexOf("{{objects") !== -1) {
                this.setLabelsRegions();
            }
            if (
                this.options.filters.on &&
                this.options.filters.source === "database" &&
                this.controllers.filters &&
                this.controllers.filters.hideFilters
            ) {
                this.controllers.filters.setFiltersCounter();
            }
            this.hideLoadingMessage();
            this.events.trigger("databaseLoaded");

            this.updateFiltersState();
            this.setChoropleth();
        });
        this.objectsRepository.events.on("schemaChanged", () => {
            this.objectsRepository.reload();
        });
        this.objectsRepository.events.on("updated", (obj) => {
            this.attachDataToRegions(obj);
            this.reloadRegionsFull();
        });
        this.objectsRepository.events.on("created", (obj: CustomObject) => {
            this.attachDataToRegions(obj);
            this.reloadRegionsFull();
        });
        this.objectsRepository.events.on("deleted", (id: number) => {
            this.attachDataToRegions();
            this.reloadRegionsFull();
        });

        this.regionsRepository.events.on("load", () => {
            this.showLoadingMessage();
        });
        this.regionsRepository.events.on("loaded", () => {
            this.hideLoadingMessage();

            this.reloadRegionsFull();
            if (
                this.options.filters.on &&
                this.options.filters.source === "regions" &&
                this.controllers.filters &&
                this.controllers.filters.hideFilters
            ) {
                this.controllers.filters.setFiltersCounter();
            }
            this.events.trigger("regionsLoaded");
        });
        this.regionsRepository.events.on("updated", (regionData) => {
            this.reloadRegionsFull();
        });
        this.regionsRepository.events.on("created", (regionData) => {
            this.reloadRegionsFull();
        });
        this.regionsRepository.events.on("deleted", (regionData) => {
            this.reloadRegionsFull();
        });

        this.setMenu();
        this.setFilters();

        if (this.options.menu.filterout.field) {
            const f = {};
            f[this.options.menu.filterout.field] = this.options.menu.filterout.val;
            if (this.options.menu.source == "regions") {
                // this.regionsRepository.query.setFilterOut(f);
            } else {
                this.objectsRepository.query.setFilterOut(f);
            }
        }

        this.setEventHandlers();

        // The initial map loading process is finished, remove the first afterLoad blocker
        this.afterLoadBlockers--;

        if (!this.id) {
            this.finalizeMapLoading();
            return;
        }

        if (!this.options.data_regions) {
            this.regionsRepository.find().done((data) => {
                this.afterLoadBlockers--;
                this.finalizeMapLoading();
            });
        } else {
            this.regionsRepository.loadDataFromResponse(this.options.data_regions);
            this.afterLoadBlockers--;
        }

        if (!this.options.data_objects) {
            if (this.options.database.loadOnStart || this.editMode) {
                this.objectsRepository.find().done((data) => {
                    this.afterLoadBlockers--;
                    this.finalizeMapLoading();
                });
            } else {
                this.afterLoadBlockers--;
                this.finalizeMapLoading();
            }
        } else {
            if (this.editMode || this.options.database.loadOnStart) {
                this.objectsRepository.loadDataFromResponse(this.options.data_objects);
                this.afterLoadBlockers--;
            } else {
                this.afterLoadBlockers--;
            }
            delete this.options.data_regions;
            delete this.options.data_objects;
            this.finalizeMapLoading();
        }
    }

    private getGeoViewBoxFromSvgTag(svgTag: SVGSVGElement): GeoViewBox | null {
        const geo = $(svgTag).attr("mapsvg:geoViewBox") || $(svgTag).attr("mapsvg:geoviewbox");
        if (geo) {
            const geoParts = geo.split(" ").map((p) => parseFloat(p));
            if (geoParts.length == 4) {
                this.mapIsGeo = true;
                this.geoCoordinates = true;

                const sw = new GeoPoint(geoParts[3], geoParts[0]);
                const ne = new GeoPoint(geoParts[1], geoParts[2]);
                return new GeoViewBox(sw, ne);
            }
        } else {
            return null;
        }
    }

    private svgLoadingFailed(resp: JQueryXHR) {
        if (resp.status == 404) {
            let msg =
                "MapSVG: file not found - " +
                this.options.source +
                "\n\nIf you moved MapSVG from another server please read the following docs page: https://mapsvg.com/docs/installation/moving";
            if (this.editMode) {
                msg +=
                    "\n\nIf you know the correct path for the SVG file, please write it and press OK:";
                const oldSvgPath = this.options.source;
                const userSvgPath = prompt(msg, oldSvgPath);
                if (userSvgPath !== null) {
                    $.ajax({ url: userSvgPath + "?v=" + this.svgFileLastChanged })
                        .fail(function () {
                            location.reload();
                        })
                        .done((xmlData) => {
                            this.options.source = userSvgPath;
                            this.renderSvgData(xmlData);
                            const mapsRepo = new MapsRepository();
                            mapsRepo.update(this);
                        });
                } else {
                    location.reload();
                }
            } else {
                console.error(msg);
            }
        } else {
            const msg =
                "MapSVG: can't load SVG file for unknown reason. Please contact support: https://mapsvg.ticksy.com";
            if (this.editMode) {
                alert(msg);
            } else {
                console.error(msg);
            }
        }
    }

    private addLoadingMessage() {
        this.containers.loading = document.createElement("div");
        this.containers.loading.className = "mapsvg-loading";

        const loadingTextBlock = document.createElement("div");
        loadingTextBlock.className = "mapsvg-loading-text";
        loadingTextBlock.innerHTML = this.options.loadingText;

        const spinner = document.createElement("div");
        spinner.className = "spinner-border spinner-border-sm";

        this.containers.loading.appendChild(spinner);
        this.containers.loading.appendChild(loadingTextBlock);

        this.containers.map.appendChild(this.containers.loading);

        if (this.options.googleMaps.on) {
            $(this.containers.map).addClass("mapsvg-google-map-loading");
        }
    }
    private hideLoadingMessage() {
        $(this.containers.loading).hide();
    }
    private showLoadingMessage() {
        $(this.containers.loading).show();
    }

    private disableAnimation() {
        this.containers.map.classList.add("no-transitions");
    }
    private enableAnimation() {
        $(this.containers.map).removeClass("no-transitions");
    }

    private loadExtensions() {
        // Load extension (common things)
        // @ts-ignore
        if (
            this.options.extension &&
            // @ts-ignore
            $().mapSvg.extensions &&
            // @ts-ignore
            $().mapSvg.extensions[_this.options.extension]
        ) {
            // @ts-ignore
            const ext = $().mapSvg.extensions[_this.options.extension];
            ext && ext.common(this);
        }
    }

    /**
     * Final stage of initialization.
     * Initialization is split into 2 steps because the 1st step contains async ajax request.
     * When the ajax requires is done, the final initialization step is called.
     * @private
     */
    finalizeMapLoading(): void {
        if (this.afterLoadBlockers > 0 || this.loaded) {
            return;
        }

        this.selectRegionByIdFromUrl();

        setTimeout(() => {
            this.movingItemsAdjustScreenPosition();
            this.adjustStrokes();
            setTimeout(() => {
                this.hideLoadingMessage();
                $(this.containers.loading).find(".mapsvg-loading-text").hide();
                this.enableAnimation();
            }, 200);
        }, 100);

        this.loaded = true;
        this.events.trigger("afterLoad");
    }

    private selectRegionByIdFromUrl() {
        const match = RegExp("[?&]mapsvg_select=([^&]*)").exec(window.location.search);
        if (match) {
            const select = decodeURIComponent(match[1].replace(/\+/g, " "));
            this.selectRegion(select);
        }
        if (window.location.hash) {
            const query = window.location.hash.replace("#/m/", "");
            const region = this.getRegion(query);
            if (region && this.options.actions.map.afterLoad.selectRegion) {
                this.regionClickHandler(null, region);
            }
        }
    }

    createForm(options): FormBuilder {
        return new FormBuilder(options);
    }
    getApiUrl(path: string): string {
        const server = new Server();
        return server.getUrl(path);
    }
    getConverter(): Converter {
        return this.converter;
    }

    /**
     * Old choropleth methods
     */

    /**
     * Sets choropleth map options
     * @param {object} options
     *
     * @example
     * mapsvg.setGauge({
     *   on: true,
     *   colors: {
     *     high: "#FF0000",
     *     low: "#00FF00"
     *   }
     *   labels: {
     *     high: "high",
     *     low: "low"
     *   }
     * });
     */
    setChoropleth(options?: any) {
        const _this = this;

        options = options || _this.options.choropleth;
        options.on != undefined && (options.on = MapSVG.parseBoolean(options.on));
        $.extend(true, _this.options, { choropleth: options });

        let needsRedraw = false;

        if (!_this.$gauge) {
            _this.$gauge = {};
            _this.$gauge.gradient = $("<td>&nbsp;</td>").addClass("mapsvg-gauge-gradient");
            _this.setGaugeGradientCSS();
            _this.$gauge.container = $("<div />").addClass("mapsvg-gauge").hide();
            _this.$gauge.table = $("<table />");
            const tr = $("<tr />");
            _this.$gauge.labelLow = $("<td>" + _this.options.choropleth.labels.low + "</td>");
            _this.$gauge.labelHigh = $("<td>" + _this.options.choropleth.labels.high + "</td>");
            tr.append(_this.$gauge.labelLow);
            tr.append(_this.$gauge.gradient);
            tr.append(_this.$gauge.labelHigh);
            _this.$gauge.table.append(tr);
            _this.$gauge.container.append(_this.$gauge.table);
            $(_this.containers.map).append(_this.$gauge.container);
        }

        if (!_this.options.choropleth.on && _this.$gauge.container.is(":visible")) {
            _this.$gauge.container.hide();
            needsRedraw = true;
        } else if (_this.options.choropleth.on && !_this.$gauge.container.is(":visible")) {
            _this.$gauge.container.show();
            needsRedraw = true;
            _this.regionsRepository.events.on("change", function () {
                _this.redrawGauge();
            });
        }

        if (options.colors) {
            _this.options.choropleth.colors.lowRGB = tinycolor(
                _this.options.choropleth.colors.low
            ).toRgb();
            _this.options.choropleth.colors.highRGB = tinycolor(
                _this.options.choropleth.colors.high
            ).toRgb();
            _this.options.choropleth.colors.diffRGB = {
                r:
                    _this.options.choropleth.colors.highRGB.r -
                    _this.options.choropleth.colors.lowRGB.r,
                g:
                    _this.options.choropleth.colors.highRGB.g -
                    _this.options.choropleth.colors.lowRGB.g,
                b:
                    _this.options.choropleth.colors.highRGB.b -
                    _this.options.choropleth.colors.lowRGB.b,
                a:
                    _this.options.choropleth.colors.highRGB.a -
                    _this.options.choropleth.colors.lowRGB.a,
            };
            needsRedraw = true;
            _this.$gauge && _this.setGaugeGradientCSS();
        }

        if (options.labels) {
            _this.$gauge.labelLow.html(_this.options.choropleth.labels.low);
            _this.$gauge.labelHigh.html(_this.options.choropleth.labels.high);
        }

        needsRedraw && _this.redrawGauge();
    }

    /**
     * Redraws choropleth map colors
     * @private
     */
    redrawGauge() {
        const _this = this;

        _this.updateGaugeMinMax();
        _this.regionsRedrawColors();
    }

    /**
     * Updates min/max values of Region choropleth fields
     * @private
     */
    updateGaugeMinMax() {
        const _this = this;

        _this.options.choropleth.min = 0;
        _this.options.choropleth.max = false;
        const values = [];
        _this.regions.forEach(function (r) {
            const gauge = r.data && r.data[_this.options.regionChoroplethField];
            gauge != undefined && values.push(gauge);
        });
        if (values.length > 0) {
            _this.options.choropleth.min = values.length == 1 ? 0 : Math.min.apply(null, values);
            _this.options.choropleth.max = Math.max.apply(null, values);
            _this.options.choropleth.maxAdjusted =
                _this.options.choropleth.max - _this.options.choropleth.min;
        }
    }
    /**
     * Sets gradient for choropleth map
     * @private
     */
    setGaugeGradientCSS() {
        const _this = this;

        _this.$gauge.gradient.css({
            background:
                "linear-gradient(to right," +
                _this.options.choropleth.colors.low +
                " 1%," +
                _this.options.choropleth.colors.high +
                " 100%)",
            filter:
                'progid:DXImageTransform.Microsoft.gradient( startColorstr="' +
                _this.options.choropleth.colors.low +
                '", endColorstr="' +
                _this.options.choropleth.colors.high +
                '",GradientType=1 )',
        });
    }

    /**
     * Below is a set of getters and methods for backward compatibility
     */

    get $map() {
        return $(this.getContainer("map"));
    }

    get $svg() {
        return $(this.getContainer("svg"));
    }

    get $popover() {
        return $(this.getContainer("popover"));
    }

    get $details() {
        return $(this.getContainer("detailsView"));
    }

    get $directory() {
        return $(this.getContainer("directory"));
    }

    get database() {
        return this.objectsRepository;
    }

    get regionsDatabase() {
        return this.regionsRepository;
    }
}

export {
    MapSVGMap as map,
    MapSVGMap as MapSVGMap,
    MapsRepository as mapsRepository,
    MapsV2Repository as mapsV2Repository,
    Repository as repository,
    SchemaRepository as schemaRepository,
    MapSVG as globals,
    Marker as marker,
    Location as location,
    Server as server,
    ArrayIndexed as arrayIndexed,
    Schema as schema,
    Query as query,
    ScreenPoint as screenPoint,
    SVGPoint as svgPoint,
    GeoPoint as geoPoint,
    FormBuilder as formBuilder,
    CustomObject as customObject,
};
