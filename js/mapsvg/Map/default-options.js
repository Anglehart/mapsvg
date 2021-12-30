const defRegionTemplate = "<div>\n" +
    "  <p>This is the demo content of the <strong>Region %templateType%</strong>.</p>\n" +
    '  <p>How to edit it: if you are in mapsvg control panel now, click on the following link to open the template editor for this view: <a href="#" class="mapsvg-template-link" data-template="%templateTypeSnake%Region">Menu > Templates > Region %templateType%</a>.</p>\n' +
    '  <p>More information about templates: <a href="https://mapsvg.com/docs/map-editor/templates" target="_blank">mapsvg.com/docs/map-editor/templates</a></p>\n' +
    "</div>\n" +
    "<hr />\n\n" +
    "<!-- Region fields are available in this template -->\n" +
    "<h5>{{#if title}} {{title}} {{else}} {{id}} {{/if}}</h5>\n" +
    "<p>Status: {{status_text}}</p>\n\n" +
    "<!-- Show all linked Database Objects: -->\n" +
    "{{#each objects}}\n\n" +
    "  <!-- DB Object are available inside of this block -->\n\n" +
    "  <h5>{{title}}</h5>\n" +
    "  <!-- When you need to render a field as HTML, use 3 curly braces instead of 2:-->\n" +
    "  <p>{{{description}}}</p>\n" +
    "  <p><em>{{location.address.formatted}}</em></p>\n\n" +
    "  <!-- Show all images: -->\n" +
    "  {{#each images}}\n" +
    '    <!-- Image fields "thumbnail", "medium", "full" -->\n' +
    "    <!-- are available in this block                -->\n" +
    '    <img src="{{thumbnail}}" />\n' +
    "  {{/each}}\n\n" +
    "{{/each}}";
const defDBTemplate = "<div>\n" +
    "  <p>This is the demo content of the <strong>DB Object %templateType%</strong>.</p>\n" +
    '  <p>How to edit it: if you are in mapsvg control panel now, click on the following link to open the template editor for this view: <a href="#" class="mapsvg-template-link" data-template="%templateTypeSnake%">Menu > Templates > DB Object %templateType%</a>.</p>\n' +
    '  <p>More information about templates: <a href="https://mapsvg.com/docs/map-editor/templates" target="_blank">mapsvg.com/docs/map-editor/templates</a></p>\n' +
    "</div>\n" +
    "<hr />\n\n" +
    "<!-- DB Object fields are available in this template. -->\n" +
    "<h5>{{title}}</h5>\n" +
    "<!-- When you need to render a fields as HTML, use 3 curly braces instead of 2:-->\n" +
    "<p>{{{description}}}</p>\n" +
    "<p><em>{{location.address.formatted}}</em></p>\n\n" +
    "<!-- Show all images: -->\n" +
    "{{#each images}}\n" +
    '  <!-- Image fields "thumbnail", "medium", "full" -->\n' +
    "  <!-- are available in this block                -->\n" +
    '  <img src="{{thumbnail}}" />\n' +
    "{{/each}}\n\n" +
    "<!-- Show all linked Regions, comma-separated: -->\n" +
    "<p> Regions: \n" +
    "  {{#each regions}}\n" +
    "    <!-- Region fields are available in this block -->\n" +
    "    {{#if title}}\n" +
    "      {{title}}\n" +
    "    {{else}}\n" +
    "      {{id}}\n" +
    "    {{/if}}{{#unless @last}}, {{/unless}}\n" +
    "  {{/each}}\n" +
    "</p>";
const dirItemItemTemplate = "<!-- If Directory Source = Database: DB Object fields are available in this template -->\n" +
    "<!-- If Directory Source = Regions: Region fields are available in this template -->\n" +
    "{{title}}";
const DefaultOptions = {
    source: "",
    markerLastID: 0,
    regionLastID: 0,
    dataLastID: 1,
    disableAll: false,
    width: null,
    height: null,
    lockAspectRatio: false,
    padding: { top: 0, left: 0, right: 0, bottom: 0 },
    maxWidth: null,
    maxHeight: null,
    minWidth: null,
    minHeight: null,
    loadingText: "Loading map...",
    colorsIgnore: false,
    colors: {
        baseDefault: "#000000",
        background: "#eeeeee",
        selected: 40,
        hover: 20,
        directory: "#fafafa",
        detailsView: "",
        status: {},
        clusters: "",
        clustersBorders: "",
        clustersText: "",
        clustersHover: "",
        clustersHoverBorders: "",
        clustersHoverText: "",
        markers: {
            base: { opacity: 100, saturation: 100 },
            hovered: { opacity: 100, saturation: 100 },
            unhovered: { opacity: 40, saturation: 100 },
            active: { opacity: 100, saturation: 100 },
            inactive: { opacity: 40, saturation: 100 },
        },
    },
    regions: {},
    clustering: { on: false },
    viewBox: [],
    cursor: "default",
    manualRegions: false,
    onClick: null,
    mouseOver: null,
    mouseOut: null,
    menuOnClick: null,
    beforeLoad: null,
    afterLoad: null,
    zoom: {
        on: true,
        limit: [0, 22],
        delta: 2,
        buttons: { on: true, location: "right" },
        mousewheel: true,
        fingers: true,
        hideSvg: false,
        hideSvgZoomLevel: 7,
    },
    scroll: { on: true, limit: false, background: false, spacebar: false },
    responsive: true,
    tooltips: { on: false, position: "bottom-right", template: "", maxWidth: "", minWidth: 100 },
    popovers: {
        on: false,
        position: "top",
        template: "",
        centerOn: true,
        width: 300,
        maxWidth: 50,
        maxHeight: 50,
    },
    multiSelect: false,
    regionStatuses: {
        "1": { label: "Enabled", value: "1", color: "", disabled: false },
        "0": { label: "Disabled", value: "0", color: "", disabled: true },
    },
    events: {
        afterLoad: "function(){\n" +
            "  // var mapsvg = this;\n" +
            "  // var regions = mapsvg.regions;\n" +
            "  // var dbObjects = mapsvg.database.getLoaded();\n" +
            "}",
        beforeLoad: "function(){\n" +
            "  // var mapsvg = this;\n" +
            "  // var settings = mapsvg.options;\n" +
            "  // console.log(settings);\n" +
            "}",
        databaseLoaded: "function (){\n" +
            "  // var mapsvg = this;\n" +
            "  // var dbObjects = mapsvg.database.getLoaded();\n" +
            "}",
        "click.region": "function (e, mapsvg){\n" +
            "  // var region = this;\n" +
            "  // console.log(region);\n" +
            "}",
        "mouseover.region": "function (e, mapsvg){\n" +
            "  // var region = this;\n" +
            "  // console.log(region);\n" +
            "}",
        "mouseout.region": "function (e, mapsvg){\n" +
            "  // var region = this;\n" +
            "  // console.log(region);\n" +
            "}",
        "click.marker": "function (e, mapsvg){\n" +
            "  // var marker = this;\n" +
            "  // console.log(marker);\n" +
            "}",
        "mouseover.marker": "function (e, mapsvg){\n" +
            "  // var marker = this;\n" +
            "  // console.log(marker);\n" +
            "}",
        "mouseout.marker": "function (e, mapsvg){\n" +
            "  // var marker = this;\n" +
            "  // console.log(marker);\n" +
            "}",
        "click.directoryItem": "function (e, regionOrObject, mapsvg){\n" + "  // var itemjQueryObject = this;\n" + "}",
        "mouseover.directoryItem": "function (e, regionOrObject, mapsvg){\n" + "  // var itemjQueryObject = this;\n" + "}",
        "mouseout.directoryItem": "function (e, regionOrObject, mapsvg){\n" + "  // var itemjQueryObject = this;\n" + "}",
        "shown.popover": "function (mapsvg){\n" + "  // var popoverjQueryObject = this;\n" + "}",
        "closed.popover": "function (mapsvg){\n" + "  // var popoverjQueryObject = this;\n" + "}",
        "closed.detailsView": "function (mapsvg){\n" + "  // var detailsjQueryObject = this;\n" + "}",
        "shown.detailsView": "function (mapsvg){\n" + "  // var detailsjQueryObject = this;\n" + "}",
    },
    css: "#mapsvg-map-%id% .mapsvg-tooltip {\n\n}\n" +
        "#mapsvg-map-%id% .mapsvg-popover {\n\n}\n" +
        "#mapsvg-map-%id% .mapsvg-details-container {\n\n}\n" +
        "#mapsvg-map-%id% .mapsvg-directory-item {\n\n}\n" +
        "#mapsvg-map-%id% .mapsvg-region-label {\n" +
        "  /* background-color: rgba(255,255,255,.6); */\n" +
        "  font-size: 11px;\n" +
        "  padding: 3px 5px;\n" +
        "  border-radius: 4px;\n" +
        "}\n" +
        "#mapsvg-map-%id% .mapsvg-marker-label {\n" +
        "  padding: 3px 5px;\n" +
        "  /*\n" +
        "  border-radius: 4px;\n" +
        "  background-color: white;\n" +
        "  margin-top: -4px;\n" +
        "  */\n}\n" +
        "#mapsvg-map-%id% .mapsvg-filters-wrap {\n\n}\n" +
        "\n\n\n\n\n\n",
    templates: {
        popoverRegion: defRegionTemplate
            .replace(/%templateType%/g, "Popover")
            .replace(/%templateTypeSnake%/g, "popover"),
        popoverMarker: defDBTemplate
            .replace(/%templateType%/g, "Popover")
            .replace(/%templateTypeSnake%/g, "popover"),
        tooltipRegion: "<!-- Region fields are available in this template -->\n{{id}} - {{title}}",
        tooltipMarker: "<!-- DB Object fields are available in this template -->\n{{title}}",
        directoryItem: dirItemItemTemplate,
        directoryCategoryItem: '<!-- Available fields: "label", "value", "counter" -->\n<span class="mapsvg-category-label">{{label}}</span>\n<span class="mapsvg-category-counter">{{counter}}</span>\n<span class="mapsvg-chevron"></span>',
        detailsView: defDBTemplate
            .replace(/%templateType%/g, "Details View")
            .replace(/%templateTypeSnake%/g, "detailsView"),
        detailsViewRegion: defRegionTemplate
            .replace(/%templateType%/g, "Details View")
            .replace(/%templateTypeSnake%/g, "detailsView"),
        labelMarker: "<!-- DB Object fields are available in this template -->\n{{title}}",
        labelRegion: "<!-- Region fields are available in this template -->\n{{title}}",
        labelLocation: "You are here!",
    },
    choropleth: {
        on: false,
        source: "regions",
        sourceFieldSelect: {
            on: false,
            variants: [],
        },
        bubbleMode: false,
        bubbleSize: {
            min: 20,
            max: 40,
        },
        labels: { low: "low", high: "high" },
        colors: { lowRGB: null, highRGB: null, low: "#550000", high: "#ee0000", noData: "#333333" },
        min: 0,
        max: 0,
        coloring: {
            mode: "gradient",
            noData: {
                color: "#999999",
                description: "No data",
            },
            gradient: {
                colors: {
                    lowRGB: null,
                    highRGB: null,
                    diffRGB: null,
                    low: "#550000",
                    high: "#ee0000",
                },
                labels: {
                    low: "low",
                    high: "high",
                },
                values: {
                    min: null,
                    max: null,
                    maxAdjusted: null,
                },
            },
            palette: {
                outOfRange: {
                    color: "#ececec",
                    description: "Out of range",
                },
                colors: [
                    {
                        color: "#550000",
                        valueFrom: 0,
                        valueTo: 50,
                        description: "",
                    },
                ],
            },
            legend: {
                on: true,
                layout: "vertical",
                container: "bottom-left",
                title: "Choropleth map",
                text: "",
                description: "",
                width: "20%",
                height: "20%",
            },
        },
    },
    filters: {
        on: true,
        source: "database",
        location: "header",
        modalLocation: "map",
        width: "100%",
        hide: false,
        showButtonText: "Filters",
        clearButtonText: "Clear all",
        clearButton: false,
        searchButton: false,
        searchButtonText: "Search",
        padding: "",
    },
    menu: {
        on: false,
        hideOnMobile: true,
        location: "leftSidebar",
        locationMobile: "leftSidebar",
        search: false,
        containerId: "",
        searchPlaceholder: "Search...",
        searchFallback: false,
        source: "database",
        showFirst: "map",
        showMapOnClick: true,
        minHeight: "400",
        sortBy: "id",
        sortDirection: "desc",
        categories: {
            on: false,
            groupBy: "",
            hideEmpty: true,
            collapse: true,
            collapseOther: true,
        },
        clickActions: {
            region: "default",
            marker: "default",
            directoryItem: {
                triggerClick: true,
                showPopover: false,
                showDetails: true,
            },
        },
        detailsViewLocation: "overDirectory",
        noResultsText: "No results found",
        filterout: { field: "", cond: "=", val: "" },
    },
    database: {
        pagination: {
            on: true,
            perpage: 30,
            next: "Next",
            prev: "Prev.",
            showIn: "both",
        },
        loadOnStart: true,
        table: "",
    },
    actions: {
        map: {
            afterLoad: {
                selectRegion: false,
            },
        },
        region: {
            mouseover: {
                showTooltip: false,
            },
            click: {
                addIdToUrl: false,
                showDetails: true,
                showDetailsFor: "region",
                filterDirectory: false,
                loadObjects: false,
                showPopover: false,
                showPopoverFor: "region",
                goToLink: false,
                linkField: "Region.link",
            },
            touch: {
                showPopover: false,
            },
        },
        marker: {
            mouseover: {
                showTooltip: false,
            },
            click: {
                showDetails: true,
                showPopover: false,
                goToLink: false,
                linkField: "Object.link",
            },
            touch: {
                showPopover: false,
            },
        },
        directoryItem: {
            click: {
                showDetails: true,
                showPopover: false,
                goToLink: false,
                selectRegion: true,
                fireRegionOnClick: true,
                linkField: "Object.link",
            },
            hover: {
                centerOnMarker: false,
            },
        },
    },
    detailsView: {
        location: "map",
        containerId: "",
        width: "100%",
        mobileFullscreen: true,
    },
    mobileView: {
        labelMap: "Map",
        labelList: "List",
        labelClose: "Close",
    },
    googleMaps: {
        on: false,
        apiKey: "",
        loaded: false,
        center: "auto",
        type: "roadmap",
        minZoom: 1,
        style: "default",
        styleJSON: [],
        language: "en",
    },
    groups: [],
    floors: [],
    layersControl: {
        on: false,
        position: "top-left",
        label: "Show on map",
        expanded: true,
        maxHeight: "100%",
    },
    floorsControl: {
        on: false,
        position: "top-left",
        label: "Floors",
        expanded: false,
        maxHeight: "100%",
    },
    containers: {
        leftSidebar: { on: false, width: "250px" },
        rightSidebar: { on: false, width: "250px" },
        header: { on: true, height: "auto" },
        footer: { on: false, height: "auto" },
    },
    labelsMarkers: { on: false },
    labelsRegions: { on: false },
    svgFileVersion: 1,
    fitMarkers: false,
    fitMarkersOnStart: false,
    fitSingleMarkerZoom: 20,
    controls: {
        location: "right",
        zoom: true,
        zoomReset: false,
        userLocation: false,
        previousMap: false,
    },
    previousMapsIds: [],
};
export { DefaultOptions };
//# sourceMappingURL=default-options.js.map