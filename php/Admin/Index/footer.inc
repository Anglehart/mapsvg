<script type="text/javascript">

    jQuery(document).ready(function () {
        mapsvg.globals.version = '<?php echo $data['mapsvgVersion'] ?>';
        mapsvg.globals.svgFiles = <?php echo json_encode($data['svgFiles'])?>;
        mapsvg.globals.options = <?php echo json_encode($data['options'])?>;
        mapsvg.globals.userIsAdmin = <?php echo current_user_can("create_users") ? "true" : "false" ?>;
        mapsvg.globals.accessGranted = <?php echo $data["accessGranted"] ?>;
        //mapsvg.globals.nonce = '<?php //echo wp_create_nonce('mapsvg')?>//';
        mapsvg.globals.admin = jQuery().mapsvgadmin('init', {
            seenWhatsNew: <?php echo $data['seenWhatsNew'] ? "true" : "false"; ?>,
            post_types: <?php echo isset($data['postTypes']) ? json_encode($data['postTypes']) : '[]' ?>,
            mapsvg_google_api_key: <?php echo isset($data['options']['google_api_key']) ? '"' . $data['options']['google_api_key'] . '"' : 'undefined' ?>,
            mapsvg_google_geocoding_api_key: <?php echo isset($data['options']['google_geocoding_api_key']) ? '"' . $data['options']['google_geocoding_api_key'] . '"' : (isset($data['options']['google_api_key']) ? '"' . $data['options']['google_api_key'] . '"' : 'undefined') ?>,
            _wpnonce: mapsvg.globals.nonce
        });
    })

</script>

</div>
