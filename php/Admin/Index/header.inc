<!--<iframe src="about:blank" class="stretch" id="stretchIframe" scrolling="no" style="width: 100%;height:100%;z-index: -1;"></iframe>-->
<div class="mapsvg-dashboard" id="mapsvg-admin">
    <div class="row">
        <div class="col-sm-6">
            <h1 style="margin-bottom: 20px;">MapSVG
                <sup><?php echo $data['mapsvgVersion'] . ($data['mapsvgGITBranch'] ? ' <i class="mfa mfa-code-fork"></i> ' . $data['mapsvgGITBranch'] : ''); ?></sup>
            </h1>
        </div>
        <div class="col-sm-6" style="text-align: right; line-height: 72px;">
            <div class="float-end" style="padding-left: 20px;">
                <button id="btnCustomizationModal" class="btn btn-sm btn-outline-secondary" data-toggle="modal" data-target="#customizationModal"><i class="mfa mfa-support"></i> Support</button>
            </div>

            <div class="float-end">
                <a href="#"
                   id="mapsvg-enter-purchase-code-link"><?php echo((isset($data['options']['purchase_code']) && $data['options']['purchase_code']) ? "Purchase code" : "<b>Activate</b>") ?></a>
                | <a href="https://mapsvg.com/docs" target="_blank">Docs</a>
                <?php if (MAPSVG_DEBUG) { ?>
                    | <a href="#" id="mapsvg-btn-phpinfo" data-loading-text="Getting info...">PHPInfo</a>
                <?php } ?>
            </div>




        </div>
    </div>
