<!--<iframe src="about:blank" class="stretch" id="stretchIframe" scrolling="no"
style="width: 100%;height:100%;z-index: -1;"></iframe>-->

<!--<iframe src="about:blank" class="stretch" id="stretchIframe" scrolling="no" style="width: 100%;height:100%;z-index: -1;"></iframe>-->
<!-- Modal -->

<div class="mapsvg-dashboard fixed" id="mapsvg-admin">

    <div id="mapsvg-nav-header">
        <h2>
            <a href="<?php echo admin_url('admin.php?page=mapsvg-config') ?>">MapSVG</a>
            <sup><?php echo $data['mapsvgVersion'] . ($data['mapsvgGITBranch'] ? ' <i class="mfa mfa-code-fork"></i> ' . $data['mapsvgGITBranch'] : ''); ?></sup>
            &rarr; <span id="map-page-title"> <?php echo $data['map']->title; ?></span>
            <small id="mapsvg-shortcode"
                   style="float: none; width: auto; display: inline-block; transform: translateY(-2px);">
                [mapsvg id="<?php echo $data['map']->id ?>"]
                <button data-shortcode='[mapsvg id="<?php echo $data['map']->id ?>"]'
                        class="mapsvg-copy-shortcode btn btn-xs btn-link toggle-tooltip" data-bs-toggle="tooltip" data-bs-placement="right" title="Copy to clipboard"
                        style="transform: translate(-3px,-1px);">
                    <i class="mfa mfa-clone"></i></button>
            </small>
        </h2>


        <div class="float-right" id="mapsvg-top-buttons">
            <button id="mapsvg-save" class="btn btn-sm btn-primary" data-loading-text="Saving...">Save
                <span class="mapsvg-hotkey-mac">⌘ S</span><span class="mapsvg-hotkey-others">Ctrl+S</span>
            </button>
            <button id="mapsvg-save-svg" class="btn btn-sm btn-primary" style="display: none;"
                    data-loading-text="Saving...">Save SVG file <span class="mapsvg-hotkey-mac">⌘ S</span>
                <span
                        class="mapsvg-hotkey-others">Ctrl+S</span>
            </button>
            <div class="btn-group btn-group-toggle  " data-toggle="buttons" id="mapsvg-map-mode-2">
                <input id="mapSettingsOption" class="btn-check" type="radio" name="mapsvg_map_mode_2" value="preview" autocomplete="off" checked>
                <label for="mapSettingsOption" class="btn btn-outline-secondary btn-sm" data-mode="preview">
                    Map settings</label>

                <input id="editSvgOption" class="btn-check" type="radio" name="mapsvg_map_mode_2" value="draw" autocomplete="off">
                <label for="editSvgOption" class="btn btn-outline-secondary btn-sm" data-mode="draw">
                   Edit SVG file</label>
            </div>
            <div class="btn-group btn-group-toggle" data-toggle="buttons" id="mapsvg-view-buttons">

                <input id="icon1Option" class="btn-check" type="checkbox" class="form-check-input hidden" autocomplete="off" checked
                       name="left">
                <label for="icon1Option" class="btn btn-sm btn-outline-secondary active toggle-tooltip" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Toggle map view" id="mapsvg-panels-view-left"> <i
                            class="mfa mfa-map-o"></i>

                </label>

                <input id="icon2Option" class="btn-check" type="checkbox" autocomplete="off"
                       checked name="right">
                <label for="icon2Option" class="btn btn-sm btn-outline-secondary active toggle-tooltip" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Toggle controls view" id="mapsvg-panels-view-right">
                    <i class="mfa mfa-sliders"></i>

                </label>
            </div>
            <div>
                <button id="btnCustomizationModal" class="btn btn-sm btn-outline-secondary" data-toggle="modal" data-target="#customizationModal"><i class="mfa mfa-support"></i> Support</button>
            </div>
        </div>
    </div>
    <!--
<div class="mapsvg-dashboard fixed" id="mapsvg-admin">
    <div id="mapsvg-nav-header">
        <h2>
            <a href="<?php echo admin_url('admin.php?page=mapsvg-config') ?>">MapSVG</a> <sup><?php echo $data['mapsvgVersion'] . ($data['mapsvgGITBranch'] ? ' <i class="mfa mfa-code-fork"></i> ' . $data['mapsvgGITBranch'] : ''); ?></sup>  &rarr; <span id="map-page-title"> <?php echo $data['map']->title; ?></span> <small id="mapsvg-shortcode" style="float: none; width: auto; display: inline-block; transform: translateY(-2px);"> [mapsvg id="<?php echo $data['map']->id ?>"]  <button data-shortcode='[mapsvg id="<?php echo $data['map']->id ?>"]' class="mapsvg-copy-shortcode btn btn-xs btn-link toggle-tooltip"  data-placement="right" title="Copy&nbsp;to&nbsp;clipboard" style="transform: translate(-3px,-1px);"><i class="mfa mfa-clone"></i></button></small>
        </h2>

        <div class="pull-right" id="mapsvg-top-buttons">
            <button id="mapsvg-save" class="btn btn-sm btn-primary" data-loading-text="Saving..." >Save &nbsp;<span class="mapsvg-hotkey-mac">⌘S</span><span class="mapsvg-hotkey-others">Ctrl+S</span></button>
            <button id="mapsvg-save-svg" class="btn btn-sm btn-primary" style="display: none;" data-loading-text="Saving..." >Save SVG file&nbsp;<span class="mapsvg-hotkey-mac">⌘S</span><span class="mapsvg-hotkey-others">Ctrl+S</span></button>
            <div class="btn-group" data-toggle="buttons" id="mapsvg-map-mode-2">
                <label class="btn btn-default btn-sm active" data-mode="preview">
                    <input type="radio" name="mapsvg_map_mode" value="preview" autocomplete="off" checked> Map settings
                </label>
                <label class="btn btn-default btn-sm" data-mode="draw">
                    <input type="radio" name="mapsvg_map_mode" value="draw" autocomplete="off"> Edit SVG file
                </label>
            </div>
            <div class="btn-group" data-toggle="buttons" id="mapsvg-view-buttons">
                <label class="btn btn-sm btn-default active" id="mapsvg-panels-view-left">
                    <i class="mfa mfa-map-o"></i>
                    <input type="checkbox" autocomplete="off" checked name="left">
                </label>
                <label class="btn btn-sm btn-default active" id="mapsvg-panels-view-right">
                    <i class="mfa mfa-sliders"></i>
                    <input type="checkbox" autocomplete="off" checked name="right">
                </label>
            </div>

        </div>
    </div>
<!--
<div class="mapsvg-dashboard fixed" id="mapsvg-admin">
    <div id="mapsvg-nav-header">
         <h2>

            <a href="<?php echo admin_url('admin.php?page=mapsvg-config') ?>">MapSVG</a> <sup><?php echo $data['mapsvgVersion'] . ($data['mapsvgGITBranch'] ? ' <i class="mfa mfa-code-fork"></i> ' . $data['mapsvgGITBranch'] : ''); ?></sup>  &#x2192; <span id="map-page-title"> <?php echo $data['map']->title; ?></span> <small id="mapsvg-shortcode" style="float: none; width: auto; display: inline-block; transform: translateY(-2px);"> [mapsvg id="<?php echo $data['map']->id ?>"]  <button data-shortcode="[mapsvg id="<?php echo $data['map']->id ?>"]' class="mapsvg-copy-shortcode btn btn-xs btn-link toggle-tooltip"  data-placement="right" title="Copy to clipboard" style="transform: translate(-3px,-1px);"><i class="mfa mfa-clone"></i></button></small>

        </h2>
        <div class="float-right" id="mapsvg-top-buttons">
            <button id="mapsvg-save" class="btn btn-sm btn-primary" data-loading-text="Saving...">Save  <span class="mapsvg-hotkey-mac">⌘S</span><span class="mapsvg-hotkey-others">Ctrl+S</span>
            </button>
            <button id="mapsvg-save-svg" class="btn btn-sm btn-primary" style="display: none;"
            data-loading-text="Saving...">Save SVG file <span class="mapsvg-hotkey-mac">⌘S</span>
                <span
                class="mapsvg-hotkey-others">Ctrl+S</span>
            </button>
            <div class="btn-group" data-toggle="buttons" id="mapsvg-map-mode-2">
                <label class="btn btn-outline-secondary btn-sm active" data-mode="preview">
                    <input type="radio" name="mapsvg_map_mode" value="preview" autocomplete="off"
                    checked>Map settings</label>
                <label class="btn btn-outline-secondary btn-sm" data-mode="draw">
                    <input type="radio" name="mapsvg_map_mode" value="draw" autocomplete="off">Edit SVG file</label>
            </div>
            <div class="btn-group" data-toggle="buttons" id="mapsvg-view-buttons">
                <label class="btn btn-sm btn-outline-secondary active" id="mapsvg-panels-view-left"> <i class="mfa mfa-map-o"></i>
                    <input type="checkbox" autocomplete="off" checked
                    name="left">
                </label>
                <label class="btn btn-sm btn-outline-secondary active" id="mapsvg-panels-view-right"> <i class="mfa mfa-sliders"></i>
                    <input type="checkbox" autocomplete="off"
                    checked name="right">
                </label>
            </div>
        </div>
    </div>
</div>
