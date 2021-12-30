<script type="text/javascript">
    var mapsvg_fulltext_min_word = <?php echo $data['fulltext_min_word'] ? $data['fulltext_min_word'] : 'undefined' ?>;

    jQuery(document).ready(function () {
        mapsvg.globals.version = '<?php echo $data['mapsvgVersion'] ?>';
        mapsvg.globals.svgFiles = <?php echo json_encode($data['svgFiles'])?>;
        mapsvg.globals.options = <?php echo json_encode($data['options'])?>;
        mapsvg.globals.userIsAdmin = <?php echo current_user_can("create_users") ? "true" : "false" ?>;
        mapsvg.globals.accessGranted = <?php echo $data["accessGranted"] ?>;
        //mapsvg.globals.nonce = '<?php //echo wp_create_nonce('mapsvg')?>//';
        mapsvg.globals.admin = jQuery().mapsvgadmin('init', {
            map: <?php echo json_encode($data['map']);?>,
            post_types: <?php echo isset($data['postTypes']) ? json_encode($data['postTypes']) : '[]' ?>,
            mapsvg_google_api_key: <?php echo isset($data['options']['google_api_key']) ? '"' . $data['options']['google_api_key'] . '"' : 'undefined' ?>,
            mapsvg_google_geocoding_api_key: <?php echo isset($data['options']['google_geocoding_api_key']) ? '"' . $data['options']['google_geocoding_api_key'] . '"' : (isset($data['options']['google_api_key']) ? '"' . $data['options']['google_api_key'] . '"' : 'undefined') ?>,
            markerImages: <?php echo(isset($data['markerImages']) ? json_encode($data['markerImages']) : '[]')?>,
            _wpnonce: mapsvg.globals.nonce
        });
    })

</script>

</div>
