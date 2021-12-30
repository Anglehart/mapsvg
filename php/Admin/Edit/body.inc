<!-- FORM -->
<!--<table id="mapsvg-table-maps" class="table table-striped" style="height:
325px;" width="824">-->
<!--<table id="mapsvg-table-maps" class="table table-striped" width="100%">-->
<div id="mapsvg-panels" class="stretch">
    <div class="mapsvg-panel mapsvg-panel-left stretch" id="mapsvg-container">
        <div class="alert alert-warning alert-dismissible" id="mapsvg-auto-id-warning"
             role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span
                        aria-hidden="true">&#xD7;</span>
            </button>
            <strong>Warning!</strong> Some objects in SVG file are missing their IDs.
            MapSVG generated IDs but please note that if you will edit SVG file later
            and add/remove some objects, it would change objects order and ID references
            would be lost.
        </div>
        <div id="mapsvg-preview-buttons">
            <div class="btn-group-xs btn-group-toggle" data-toggle="buttons" id="mapsvg-preview-containers-toggle">
                <input id="containerOption" class="btn-check" type="checkbox" name="mapsvg-preview-containers-toggle" value="1"
                       checked autocomplete="off">
                <label for="containerOption" class="btn btn-outline-secondary btn-xs ">
                    Containers</label>
            </div>
            <div class="btn-group-xs btn-group btn-group-toggle " data-toggle="buttons" id="mapsvg-map-mode">

                <input id="previewOption" type="radio" class="btn-check"  name="mapsvg_map_mode" value="preview" autocomplete="off"
                       checked>
                <label for="previewOption" class="btn btn-outline-secondary btn-xs active" data-mode="preview">
                    Preview</label>

                <input id="addRegOption" type="radio" class="btn-check"  name="mapsvg_map_mode" value="addRegions" autocomplete="off">
                <label for="addRegOption" class="btn btn-outline-secondary btn-xs" data-mode="addRegions"
                       style="display: none;">
                   Add regions</label>

                <input id="editRegOption" type="radio" class="btn-check"  name="mapsvg_map_mode" value="editRegions" autocomplete="off">
                <label for="editRegOption" class="btn btn-outline-secondary btn-xs" data-mode="editRegions">
                  Edit
                    regions</label>

                <input id="editDbOption" type="radio" class="btn-check" name="mapsvg_map_mode" value="editData" autocomplete="off">
                <label for="editDbOption" class="btn btn-outline-secondary btn-xs" data-mode="editData">
                   Edit DB
                    objects</label>
                <!-- <label class="btn btn-outline-secondary btn-xs disabled"
                data-mode="editMarkers">-->
                <!-- <input type="radio" name="mapsvg_map_mode" value="editMarkers" autocomplete="off"> Edit markers-->
                <!-- </label>-->
            </div>
        </div>
        <div id="mapsvg-sizer">
            <div id="mapsvg"></div>
        </div>
    </div>
    <div class="stretch mapsvg-panel mapsvg-panel-right">
        <ul class="nav nav-tabs" id="mapsvg-tabs-menu">
            <li role="presentation" class="dropdown active nav-item">
                <!-- <a class="dropdown-toggle active" data-toggle="dropdown" href="#"
                role="button" aria-haspopup="true" aria-expanded="false">-->
                <!-- <i class="mfa mfa-bars"></i> <span class="menu-name">Menu</span> <span class="caret"></span>-->
                <!-- </a>-->
                <!-- <ul class="dropdown-menu">-->
                <!-- <li class="active"><a href="#tab_settings">Settings</a></li>-->
                <!-- <li><a href="#tab_colors">Colors</a></li>-->
                <!-- <li><a href="#tab_regions">Regions</a></li>-->
                <!-- <li><a href="#tab_database">Database</a></li>-->
                <!-- <li><a href="#tab_layers">Groups</a></li>-->
                <!-- <li><a href="#tab_google_maps">Google maps</a></li>-->
                <!-- <li><a href="#tab_directory">Directory</a></li>-->
                <!-- <li><a href="#tab_details">Details view</a></li>-->
                <!-- <li><a href="#tab_filters">Filters</a></li>-->
                <!-- <li><a href="#tab_actions">Actions</a></li>-->
                <!-- <li><a href="#gallery">Gallery</a></li>-->
                <!-- <li><a href="#tab_templates">Templates</a></li>-->
                <!-- <li><a href="#tab_events">JavaScript</a></li>-->
                <!-- <li><a href="#tab_css">CSS</a></li>-->
                <!-- <li class="mapsvg-draw-menu-item"><a href="#tab_draw_region">SVG Object</a></li>-->
                <!-- </ul>-->
            </li>
            <li class=" toggle-tooltip nav-item" title="Settings"><a href="#tab_settings" class="nav-link active"><i
                            class="mfa mfa-cog"></i></a>
            </li>
<!--            <li class="toggle-tooltip nav-item" title="Choropleth"><a href="#tab_choropleth" class="nav-link"><i-->
<!--                            class="mfa mfa-thermometer-half"></i></a>-->
<!--            </li>-->
            <li class="toggle-tooltip nav-item" title="Colors"><a href="#tab_colors" class="nav-link"><i
                            class="mfa mfa-paint-brush"></i></a>
            </li>
            <li class="toggle-tooltip nav-item" title="Regions"><a href="#tab_regions" class="nav-link"><i
                            class="mfa mfa-object-group"></i></a>
            </li>
            <li class="toggle-tooltip nav-item" title="Database"><a href="#tab_database" class="nav-link"><i
                            class="mfa mfa-database"></i></a>
            </li>
            <li class="toggle-tooltip nav-item" title="Filters"><a href="#tab_filters" class="nav-link"><i
                            class="mfa mfa-filter"></i></a>
            </li>
            <li class="toggle-tooltip nav-item" title="Google Maps"><a href="#tab_google_maps" class="nav-link"><i
                            class="mfa mfa-google"></i></a>
            </li>
            <li class="toggle-tooltip nav-item" title="Directory"><a href="#tab_directory" class="nav-link"><i
                            class="mfa mfa-bars"></i></a>
            </li>
            <li class="toggle-tooltip nav-item" title="Details view"><a href="#tab_details" class="nav-link"><i
                            class="mfa mfa-id-card-o"></i></a>
            </li>
            <li class="toggle-tooltip nav-item" title="Actions"><a href="#tab_actions" class="nav-link"><i
                            class="mfa mfa-mouse-pointer"></i></a>
            </li>
            <li class="toggle-tooltip nav-item" title="Gallery"><a href="#gallery" class="nav-link"><i
                            class="mfa mfa-image"></i></a>
            </li>
            <li class="toggle-tooltip nav-item" title="Visibility"><a href="#tab_layers" class="nav-link"><i
                            class="mfa mfa-toggle-on"></i></a>
            </li>
            <li class="toggle-tooltip nav-item" title="Templates"><a href="#tab_templates" class="nav-link"><i
                            class="mfa mfa-file-text"></i></a>
            </li>
            <li class="toggle-tooltip nav-item" title="Javascript"><a href="#tab_events" class="nav-link"><i
                            class="mfa mfa-code"></i></a>
            </li>
            <li class="toggle-tooltip nav-item" title="CSS"><a href="#tab_css" class="nav-link"><i
                            class="mfa mfa-css3"></i></a>
            </li>
            <li class="mapsvg-draw-menu-item nav-item"><a href="#tab_draw_region" class="nav-link">SVG Object</a>
            </li>
        </ul>
        <div id="mapsvg-mapform-container" class="stretch mapsvg-scrollable-content">
            <div class="tab-content" id="mapsvg-tabs">
                <div class="tab-pane active" id="tab_settings" data-controller="settings"></div>
<!--                <div class="tab-pane" id="tab_choropleth" data-controller="choropleth"></div>-->
                <div class="tab-pane" id="tab_colors" data-controller="colors"></div>
                <div class="tab-pane" id="tab_regions" data-controller="regions"></div>
                <div class="tab-pane" id="tab_google_maps" data-controller="googleMaps"></div>
                <div class="tab-pane tab-markers" id="tab_markers" data-controller="markers"></div>
                <div class="tab-pane" id="tab_database" data-controller="database">
                    <div class="full-flex" id="database-controller"></div>
                </div>
                <!-- <div class="tab-pane" id="tab_floors" data-controller="floors"></div>-->
                <div class="tab-pane" id="tab_layers" data-controller="layers"></div>
                <div class="tab-pane" id="tab_directory" data-controller="directory"></div>
                <div class="tab-pane" id="tab_details" data-controller="details"></div>
                <div class="tab-pane" id="tab_filters" data-controller="filters"></div>
                <div class="tab-pane" id="tab_actions" data-controller="actions"></div>
                <div class="tab-pane" id="tab_templates" data-controller="templates"></div>
                <div class="tab-pane" id="tab_events" data-controller="javascript"></div>
                <div class="tab-pane" id="tab_css" data-controller="css"></div>
                <div class="tab-pane mapsvg-draw-controller" id="tab_draw_region"
                     data-controller="drawRegion"></div>
                <div class="tab-pane" id="gallery" data-controller="gallery">
                    <div class="mapsvg-view-padding">
                        <div class="card bg-light card-body mb-3">Get MapSVG.Gallery add-on: <a
                                    href="http://mapsvg.com/add-ons/gallery"
                                    target="_blank">mapsvg.com/add-ons/gallery</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
