/**
 * MapOptions object used to define the properties that can be set on a Map.
 * @typedef {Object} MapSVG.MapOptions
 * @property {string} source - SVG file URL
 * @property {boolean} disableAll - Disables all regions
 * @property {boolean} responsive - Map responsiveness. Default: true
 * @property {string} loadingText - Loading text message. Default is "Loading map..."
 * @property {number} width - Width of the map
 * @property {number} height - Height of the map
 * @property (array) viewBox - Map viewBox: [x,y,width,height]
 * @property {boolean} lockAspectRatio - Keep aspect ratio when changing width or height
 * @property {object} padding - Map padding, default: {top: 0, left: 0, right: 0, bottom: 0}
 * @property {string} cursor - Mouse pointer style: "default' or "pointer"
 * @property {boolean} multiSelect - Allows to select multiple Regions. Default: false
 * @property {object} colors - Color settings. Example: {base: "#E1F1F1", background: "#eeeeee", hover: "#548eac", selected: "#065A85", stroke: "#7eadc0"},
 * @property {object} clustering - Clustering settings. Default: {on: false},
 * @property {object} zoom - Zoom options. Default: {on: false, limit: [0,10], delta: 2, buttons: {on: true, location: 'right'}, mousewheel: true, fingers: true},
 * @property {object} scroll - Scroll options. Default: {on: false, limit: false, background: false, spacebar: false},
 * @property {object} tooltips - Tooltip options. Default: {on: false, position: 'bottom-right', template: '', maxWidth: '', minWidth: 100},
 * @property {object} popovers - Popover options. Default: {on: false, position: 'top', template: '', centerOn: true, width: 300, maxWidth: 50, maxHeight: 50},
 * @property {object} regionStatuses - List of Region statuses
 * @property {object} events - List of callbacks
 * @property {object} choropleth - Choropleth map settings.
 * @property {object} labelsMarkers - Marker labels settings. Default: {on:false}
 * @property {object} labelsMarkers - Region labels settings. Default: {on:false}
 */
import { GeoPoint, SVGPoint } from "../Location/Location";
import { SchemaField } from "../Infrastructure/Server/SchemaField";
import { ArrayIndexed } from "../Core/ArrayIndexed";

export interface MapOptionsInterface {
    id: number;
    title: string;
    backend: boolean; // passed from admin
    /** @deprecated */
    afterLoad: Function;
    /** @deprecated */
    beforeLoad: Function;
    /** @deprecated */
    dataLoaded: Function;
    db_map_id: number | string;
    source: string;
    regionPrefix: string;
    groups: ArrayIndexed<GroupOptionsInterface>;
    galleries: ArrayIndexed<GalleryOptionsInterface>;
    layersControl: LayersControlOptionsInterface;
    disableAll: boolean;
    responsive: boolean;
    loadingText: string;
    width: number;
    height: number;
    viewBox: number[];
    lockAspectRatio: boolean;
    padding: { top: number; left: number; right: number; bottom: number };
    cursor: string;
    multiSelect: boolean;
    colorsIgnore: boolean;
    editMode: boolean;
    defaultMarkerImage: string;
    fitMarkers: boolean;
    fitMarkersOnStart: boolean;
    fitSingleMarkerZoom: number;
    menu: {
        showFirst: string;
        showMapOnClick: boolean;
        noResultsText: string;
        on: boolean;
        customContainer: boolean;
        width: string;
        source: string;
        hideOnMobile: boolean;
        location: string;
        containerId: string;
        position: string;
        filterout: { field: string; val: number | string };
        categories: {
            on: boolean;
            groupBy: string;
            collapse: boolean;
            collapseOther: boolean;
            hideEmpty: boolean;
        };
        sortBy: string;
        sortDirection: string;
        minHeight: string;
    };
    colors: {
        base?: string;
        baseDefault?: string;
        background?: string;
        hover?: string | number;
        selected?: string | number;
        stroke?: string;
        directory: string;
        directorySearch: string;
        detailsView: string;
        popover: string;
        tooltip: string;
        status: any;
        markers: any;
        leftSidebar: string;
        rightSidebar: string;
        header: string;
        footer: string;
        modalFilters: string;
        clusters: string;
        clustersHover: string;
        clustersText: string;
        clustersBorders: string;
        clustersHoverBorders: string;
        clustersHoverText: string;
    };
    clustering: { on: boolean };
    zoom: {
        on: boolean;
        limit: [number, number];
        delta: number;
        buttons: {
            on: boolean;
            location: string;
        };
        mousewheel: boolean;
        fingers: boolean;
        hideSvg: boolean;
        hideSvgZoomLevel: number;
    };
    scroll: {
        on: boolean;
        limit: boolean;
        background: boolean;
        spacebar: boolean;
    };
    tooltips: {
        on: boolean;
        position: string;
        template: string;
        maxWidth: number;
        minWidth: number;
    };
    popovers: {
        on: boolean;
        position: string;
        template: string;
        centerOn: boolean;
        width: string;
        maxWidth: number;
        maxHeight: number;
        mobileFullscreen: boolean;
        resetViewboxOnClose: boolean;
    };
    regionStatuses: Array<any>;
    events: { [key: string]: string };
    choropleth: {
        on?: boolean;
        [key: string]: any;
        source: string;
        sourceField: string;
        sourceFieldSelect: {
            on: boolean;
            variants: Array<string>;
        };
        bubbleMode: boolean;
        bubbleSize: {
            min: number;
            max: number;
        };
        coloring: {
            mode: string;
            noData: {
                color: "grey";
                description: "-";
            };
            gradient: {
                colors: {
                    low: string;
                    high: string;
                    diffRGB: { r: number; g: number; b: number; a: number };
                    lowRGB: { r: number; g: number; b: number; a: number };
                    highRGB: { r: number; g: number; b: number; a: number };
                };
                labels: {
                    low: string;
                    high: string;
                };
                values: {
                    min: number;
                    max: number;
                    maxAdjusted: number;
                };
            };
            palette: {
                colors: Array<{
                    color: string;
                    valueFrom: number;
                    valueTo: number;
                    description: string;
                }>;
                outOfRange: {
                    color: "grey";
                    description: "-";
                };
            };
            legend: {
                on: boolean;
                layout: string;
                container: string;
                title: string;
                text: string;
                description: string;
                width: string;
                height: string;
            };
        };
    };
    regionChoroplethField: string;
    regions: Array<{ id: string; title: string; fill: string; disabled: boolean }>;
    database: {
        pagination: { on: boolean; perpage: number; showIn: string; prev: string; next: string };
        loadOnStart: boolean;
        noFiltersNoLoad: boolean;
        regionsTableName: string;
        objectsTableName: string;
    };
    labelsMarkers: { on: boolean };
    labelsRegions: { on: boolean };
    googleMaps: {
        on: boolean;
        apiKey: string;
        center: GeoPoint;
        zoom: number;
        drawingTools?: boolean;
        geometry?: boolean;
        minZoom: number;
        language: string;
    };
    css: string;
    containers: {
        leftSidebar: { on: boolean; width: string; height: string };
        rightSidebar: { on: boolean; width: string; height: string };
        header: { on: boolean; width: string; height: string };
        footer: { on: boolean; width: string; height: string };
    };
    filters: {
        on: boolean;
        source: string;
        containerId: string;
        location: string;
        width: string;
        filteredRegionsStatus: number;
        modalLocation: string;
        hideOnMobile: boolean;
        hide: boolean;
        padding: string;
        showButtonText: string;
        clearButton: boolean;
        clearButtonText: boolean;
        searchButton: boolean;
        searchButtonText: string;
    };
    filtersSchema?: Array<SchemaField>;
    detailsView: {
        location: string;
        width: string;
        mobileFullscreen: boolean;
        containerId: string;
        margin: string;
        autoresize: boolean;
    };
    mobileView: {
        [key: string]: any;
    };
    templates: {
        directory: string;
        directoryItem: string;
        labelRegion: string;
        popoverRegion: string;
        popoverMarker: string;
        tooltipRegion: string;
        tooltipMarker: string;
        detailsViewRegion: string;
        detailsView: string;
    };
    controls: {
        zoom: boolean;
        zoomReset: boolean;
        userLocation: boolean;
        location: string;
        previousMap: boolean;
    };
    actions: {
        region: {
            click: { [key: string]: any };
            touch: { [key: string]: any };
            mouseover: { [key: string]: any; showTooltip: boolean };
            mouseout: { [key: string]: any };
        };
        marker: {
            touch: { [key: string]: any };
            click: { [key: string]: any };
            mouseover: { [key: string]: any; showTooltip: boolean };
            mouseout: { [key: string]: any };
        };
        map: {
            afterLoad: {
                selectRegion: boolean;
            };
        };
        directoryItem: {
            touch: { [key: string]: any };
            click: { [key: string]: any };
            hover: { [key: string]: any };
            mouseout: { [key: string]: any };
        };
    };
    svgFileVersion: number;
    data_regions: any; // passed from Admin
    data_objects: any; // passed from Admin
    extension: any;
    markerLastID: number;
    previousMapsIds: Array<number | string>;
}

export interface GroupOptionsInterface {
    id: string;
    title: string;
    objects: Array<{ label: string; value: string }>;
    visible: boolean;
}
export interface GalleryOptionsInterface {
    id: string;
    title: string;
    objects: Array<{ label: string; value: string }>;
    visible: boolean;
}
export interface LayersControlOptionsInterface {
    on: boolean;
    label: string;
    maxHeight: string;
    position: string;
    expanded: boolean;
}
export class ViewBox {
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x: any, y?: number | string, width?: number | string, height?: number | string) {
        if (typeof x === "object") {
            // x as Object
            if (
                x.hasOwnProperty("x") &&
                x.hasOwnProperty("y") &&
                x.hasOwnProperty("width") &&
                x.hasOwnProperty("height")
            ) {
                this.x = typeof x.x === "string" ? parseFloat(x.x) : x.x;
                this.y = typeof x.y === "string" ? parseFloat(x.y) : x.y;
                this.width = typeof x.width === "string" ? parseFloat(x.width) : x.width;
                this.height = typeof x.height === "string" ? parseFloat(x.height) : x.height;
            } else if (typeof x === "object" && x.length && x.length === 4) {
                // x as Array
                this.x = typeof x[0] === "string" ? parseFloat(x[0]) : x[0];
                this.y = typeof x[1] === "string" ? parseFloat(x[1]) : x[1];
                this.width = typeof x[2] === "string" ? parseFloat(x[2]) : x[2];
                this.height = typeof x[3] === "string" ? parseFloat(x[3]) : x[3];
            }
        } else {
            this.x = typeof x === "string" ? parseFloat(x) : x;
            this.y = typeof y === "string" ? parseFloat(y) : y;
            this.width = typeof width === "string" ? parseFloat(width) : width;
            this.height = typeof height === "string" ? parseFloat(height) : height;
        }
    }

    /**
     * Updates viewbox with new numbers
     * @param newViewBox
     */
    update(newViewBox: ViewBox): void {
        this.x = newViewBox.x;
        this.y = newViewBox.y;
        this.width = newViewBox.width;
        this.height = newViewBox.height;
    }

    /**
     * Returns a string with viewBox numbers
     */
    toString(): string {
        return this.x + " " + this.y + " " + this.width + " " + this.height;
    }

    /**
     * Returns an array containing viewBox numbers
     */
    toArray(): number[] {
        return [this.x, this.y, this.width, this.height];
    }

    clone(): ViewBox {
        return new ViewBox({ x: this.x, y: this.y, width: this.width, height: this.height });
    }

    /**
     * Check whether current viewBox fits inside of another viewBox
     */
    fitsInViewBox(viewBox: ViewBox, atLeastByOneDimension?: boolean): boolean {
        if (atLeastByOneDimension === true) {
            return viewBox.width > this.width || viewBox.height > this.height;
        } else {
            return viewBox.width > this.width && viewBox.height > this.height;
        }
    }

    /**
     * Adds padding to the viewBox
     */
    addPadding(padding: { top: number; left: number; right: number; bottom: number }): void {
        if (padding.top) {
            this.y -= padding.top;
            this.height += padding.top;
        }
        if (padding.right) {
            this.width += padding.right;
        }
        if (padding.bottom) {
            this.height += padding.bottom;
        }
        if (padding.left) {
            this.x -= padding.left;
            this.width += padding.left;
        }
    }
}

export class GeoViewBox {
    sw: GeoPoint;
    ne: GeoPoint;
    constructor(sw: GeoPoint, ne: GeoPoint) {
        this.sw = sw;
        this.ne = ne;
    }
}
