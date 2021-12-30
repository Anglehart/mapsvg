const { registerPlugin } = wp.plugins;
const { PluginSidebar } = wp.editPost;
const { __ } = wp.i18n;
const { Component } = wp.element;
const { addFilter } = wp.hooks;
const { TextControl, PanelBody, ColorPicker } = wp.components;
const { createHigherOrderComponent } = wp.compose;
const { InspectorControls } = wp.editor;

const filterStyle = {
    "margin-bottom": "200px",
};

class Test extends Component {
    render() {
        return (
            // <div>
            <PluginSidebar title={__("Location", "textdomain")}>
                <div>
                    <div id="mapsvg"></div>
                </div>
                <div id="mapsvg-filters" style={filterStyle}></div>
            </PluginSidebar>
            // </div>
        );
    }

    loadMap() {
        if (document.getElementById("mapsvg") === null) {
            return;
        }
        window.MapSVG.markerImages = window.mapsvgMarkerImages;
        window.MapSVG.googleApiKey = window.googleApiKey;

        var external = {
            markerImages: window.mapsvgMarkerImages,
            googleApiKey: window.googleApiKey,
        };

        var source = window.MapSVG.googleApiKey
            ? window.mapsPath + "/geo-calibrated/empty.svg"
            : window.mapsPath + "/geo-calibrated/world.svg";

        var mapOptions = {
            // TODO change the source
            source: source,
            filters: { on: false },
            fitMarkers: true,
            defaultMarkerImage: window.MapSVG.urls.root + "markers/_pin_default.png",
            containers: { header: { on: false } },
            googleMaps: { on: !!window.MapSVG.googleApiKey, apiKey: window.googleApiKey },
            events: {
                afterLoad: (_mapsvg) => {
                    this.mapsvg = _mapsvg;

                    this.mapsvg.setMarkersEditMode(true);

                    var meta = wp.data.select("core/editor").getEditedPostAttribute("meta");
                    if (!meta) {
                        meta = [];
                    }

                    var formData = {};

                    if (meta.mapsvg_location && meta.mapsvg_location !== "null") {
                        var locationData = JSON.parse(meta.mapsvg_location);

                        var location = new mapsvg.location(locationData);

                        var marker = new mapsvg.marker({
                            location: location,
                            mapsvg: _mapsvg,
                        });
                        _mapsvg.markerAdd(marker);
                        formData["location"] = location.getData();

                        if (this.mapsvg.options.googleMaps.on) {
                            var coords = {
                                lat: location.geoPoint.lat,
                                lng: location.geoPoint.lng,
                            };
                            this.mapsvg.googleMaps.map.setCenter(coords);
                            this.mapsvg.googleMaps.map.setZoom(17);
                        }
                    }

                    var formBuilder = new mapsvg.formBuilder({
                        container: jQuery("#mapsvg-filters")[0],
                        schema: new mapsvg.schema({
                            fields: [
                                {
                                    type: "location",
                                    name: "Location",
                                    label: "",
                                    parameterNameShort: "location",
                                },
                            ],
                        }),
                        showNames: false,
                        editMode: false,
                        filtersMode: true,
                        mapsvg: _mapsvg,
                        mediaUploader: null,
                        data: formData,
                        admin: null,
                        closeOnSave: false,
                        events: {
                            init: (formBuilder, data) => {
                                this.mapsvg.hideMarkers();

                                const locationFormElement = formBuilder.getFormElementByType(
                                    "location"
                                );

                                if (locationFormElement && locationFormElement.value) {
                                    this.locationCopy = this.createLocationCopy(
                                        locationFormElement.value
                                    );
                                    if (this.locationCopy) {
                                        this.watchMarkerChanges(
                                            locationFormElement,
                                            this.locationCopy
                                        );
                                        this.mapsvg.setEditingMarker(this.locationCopy.marker);
                                    }
                                }

                                this.mapsvg.setMarkerEditHandler((location) => {
                                    if (this.locationCopy) {
                                        this.mapsvg.markerDelete(this.locationCopy.marker);
                                    }
                                    this.locationCopy = location;
                                    this.mapsvg.setEditingMarker(this.locationCopy.marker);
                                    const object = formBuilder.getData();
                                    // const img = this.mapsvg.getMarkerImage(object, );
                                    // this.locationCopy.marker.setImage(img);
                                    locationFormElement.setValue(location.getData());
                                    locationFormElement.triggerChanged();
                                    this.watchMarkerChanges(locationFormElement, this.locationCopy);
                                });
                            },
                            "changed.field": (formElement, name, value) => {
                                if (formElement.type === "location") {
                                    const location = JSON.stringify(value);
                                    wp.data
                                        .dispatch("core/editor")
                                        .editPost({ meta: { mapsvg_location: location } });

                                    if (this.locationCopy) {
                                        if (
                                            this.locationCopy.geoPoint.lat != value.geoPoint.lat ||
                                            this.locationCopy.geoPoint.lng != value.geoPoint.lng
                                        ) {
                                            if (this.mapsvg.options.googleMaps.on) {
                                                var coords = {
                                                    lat: value.geoPoint.lat,
                                                    lng: value.geoPoint.lng,
                                                };
                                                this.mapsvg.googleMaps.map.setCenter(coords);
                                                this.mapsvg.googleMaps.map.setZoom(17);
                                            }
                                        }
                                        this.mapsvg.markerDelete(this.locationCopy.marker);
                                    }

                                    if (value) {
                                        this.locationCopy = new mapsvg.location(value);

                                        const marker = new mapsvg.marker({
                                            location: this.locationCopy,
                                            mapsvg: this.mapsvg,
                                        });

                                        this.mapsvg.markerAdd(this.locationCopy.marker);
                                        this.mapsvg.setEditingMarker(marker);
                                        this.watchMarkerChanges(formElement, this.locationCopy);
                                    }
                                }
                            },
                        },
                    });
                },
            },
        };

        var map = new mapsvg.map("mapsvg", { options: mapOptions }, external);
    }

    createLocationCopy(locationFieldData) {
        if (locationFieldData) {
            let locationTemp = new mapsvg.location(locationFieldData);
            let markerCopy = new mapsvg.marker({
                location: locationTemp,
                mapsvg: this.mapsvg,
            });
            this.mapsvg.markerAdd(markerCopy);
            return locationTemp;
        }
    }

    watchMarkerChanges(locationFormElement, location) {
        if (location && location.marker) {
            location.marker.events.on("change", () => {
                if (location.marker.isMoving()) {
                    return false;
                }
                locationFormElement.setValue(location.getData());
                locationFormElement.triggerChanged();
            });
        }
    }

    componentDidMount() {
        var _this = this;
        setTimeout(function () {
            _this.loadMap();
            jQuery('button[aria-label="Location"]').on("click", function () {
                setTimeout(function () {
                    _this.loadMap();
                }, 500);
            });
        }, 1000);
    }
}

registerPlugin("mapsvg-sidebar", {
    icon: "location",
    render: Test,
});
