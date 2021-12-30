<?php
/**
 * Created by PhpStorm.
 * User: Roma
 * Date: 24.10.18
 * Time: 9:59
 */

namespace MapSVG;

class Admin
{
    public function __construct()
    {
        $this->addHooks();
    }

    private function addHooks()
    {
        add_action('init', array($this, 'setupTinymce'));
        add_action('admin_menu', array($this, 'addWpAdminMenuItem'));
        add_action('admin_enqueue_scripts', '\MapSVG\Admin::addJsCss', 0);
        add_action('wp_ajax_mapsvg_get_maps', array($this, 'ajax_mapsvg_get_maps'));
        add_action( 'admin_enqueue_scripts', array($this, 'enqueueGutenberg'));
    }

    /**
     * Add menu element to WP Admin menu
     */
    function addWpAdminMenuItem()
    {
        global $mapsvg_settings_page;

        if (function_exists('add_menu_page') && current_user_can('edit_posts'))
            $mapsvg_settings_page = add_menu_page('MapSVG', 'MapSVG', 'edit_posts', 'mapsvg-config', array($this, 'renderAdminPage'), '', 66);

    }

    /**
     * Add buttons to Visual Editor
     */
    public function setupTinymce()
    {
        // Check if the logged in WordPress User can edit Posts or Pages
        // If not, don't register our TinyMCE plugin
        if (!current_user_can('edit_posts') && !current_user_can('edit_pages')) {
            return;
        }

        // Check if the logged in WordPress User has the Visual Editor enabled
        // If not, don't register our TinyMCE plugin
        if (get_user_option('rich_editing') !== 'true') {
            return;
        }

        wp_register_style('mapsvg-tinymce', MAPSVG_PLUGIN_URL . "css/mapsvg-tinymce.css");
        wp_enqueue_style('mapsvg-tinymce');

        add_filter('mce_external_plugins', array($this, 'addTinymceJs'));
        add_filter('mce_buttons', array($this, 'addTinymceButton'));
    }

    /**
     * Adds a TinyMCE plugin compatible JS file to the TinyMCE / Visual Editor instance
     *
     * @param array $plugin_array Array of registered TinyMCE Plugins
     * @return array Modified array of registered TinyMCE Plugins
     */
    public function addTinymceJs($plugin_array)
    {
        $plugin_array['mapsvg'] = MAPSVG_PLUGIN_URL . 'js/mapsvg-admin/wp-editor-button/tinymce-mapsvg.js';
        return $plugin_array;
    }

    /**
     * Adds a button to the TinyMCE / Visual Editor which the user can click
     * to insert a custom CSS class.
     *
     * @param array $buttons Array of registered TinyMCE Buttons
     * @return array Modified array of registered TinyMCE Buttons
     */
    public function addTinymceButton($buttons)
    {
        array_push($buttons, 'mapsvg');
        return $buttons;
    }


    /**
     * Add admin JS & CSS
     */
    static function addJsCss($hook_suffix)
    {

        global $mapsvg_settings_page, $wp_version;

        $mapsRepo = new MapsRepository();

        // Load scripts only if it's MapSVG config page! Don't load scripts on all WP Admin pages
        if ($mapsvg_settings_page != $hook_suffix)
            return;

        if (isset($_GET['page']) && $_GET['page'] == 'mapsvg-config') {

            // Load scripts and CSS for WP Media file uploader
            wp_enqueue_media();


            wp_register_script('admin.mapsvg', MAPSVG_PLUGIN_URL . 'js/mapsvg-admin/core/admin.js', array('jquery', 'bootstrap','mapsvg'), MAPSVG_ASSET_VERSION);
            wp_enqueue_script('admin.mapsvg');
            wp_enqueue_script('controller.admin.mapsvg', MAPSVG_PLUGIN_URL . 'js/mapsvg-admin/core/controller.js', array('mapsvg', 'admin.mapsvg'), MAPSVG_ASSET_VERSION);

            $dir = MAPSVG_PLUGIN_DIR . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'mapsvg-admin' . DIRECTORY_SEPARATOR . 'modules';

            $files = [];

            foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir)) as $filepath) {
                if (pathinfo($filepath, PATHINFO_EXTENSION) === 'js') {
                    $filename = pathinfo($filepath, PATHINFO_FILENAME);
                    $filepathSlashedAsUrl = str_replace('\\', '/', $filepath);
                    $pathParts = explode('/js/', $filepathSlashedAsUrl);
                    $url = MAPSVG_PLUGIN_URL . 'js/' . $pathParts[1];
                    $files[] = $url;
                    wp_enqueue_script($filename . '.controller.admin.mapsvg', $url, array('mapsvg', 'admin.mapsvg', 'controller.admin.mapsvg'), MAPSVG_ASSET_VERSION);
                }
            }

            wp_register_script('papaparse', MAPSVG_PLUGIN_URL . "js/vendor/papaparse/papaparse.min.js", null, '4.6.0');
            wp_enqueue_script('papaparse');

            wp_register_script('popper', MAPSVG_PLUGIN_URL . "js/vendor/popper/popper.min.js", null, '2.9.2');
            wp_enqueue_script('popper');

            wp_register_script('bootstrap', MAPSVG_PLUGIN_URL . "js/vendor/bootstrap/bootstrap.min.js", array("popper"), '5.0.0');
            wp_enqueue_script('bootstrap');
            wp_register_style('bootstrap', MAPSVG_PLUGIN_URL . "js/vendor/bootstrap/bootstrap.min.css", null, '5.0.0');
            wp_enqueue_style('bootstrap');

            wp_register_style('mapsvg-fontawesome', MAPSVG_PLUGIN_URL . "css/font-awesome/font-awesome.min.css", null, '4.4.0-mfa');
            wp_enqueue_style('mapsvg-fontawesome');

            wp_register_script('bootstrap-colorpicker', MAPSVG_PLUGIN_URL . 'js/vendor/bootstrap-colorpicker/bootstrap-colorpicker.min.js');
            wp_enqueue_script('bootstrap-colorpicker');
            wp_register_style('bootstrap-colorpicker', MAPSVG_PLUGIN_URL . 'js/vendor/bootstrap-colorpicker/bootstrap-colorpicker.min.css');
            wp_enqueue_style('bootstrap-colorpicker');

            wp_enqueue_script('growl', MAPSVG_PLUGIN_URL . 'js/vendor/jquery-growl/jquery.growl.js', array('jquery'), '4.0', true);
            wp_register_style('growl', MAPSVG_PLUGIN_URL . 'js/vendor/jquery-growl/jquery.growl.css', null, '1.0');
            wp_enqueue_style('growl');

            wp_register_style('main.css', MAPSVG_PLUGIN_URL . 'css/mapsvg-admin.css', null, MAPSVG_ASSET_VERSION);
            wp_enqueue_style('main.css');


            wp_register_script('mselect2', MAPSVG_PLUGIN_URL . 'js/vendor/select2/select2.full.min.js', array('jquery'), '4.0.31', true);
            wp_enqueue_script('mselect2');
            wp_register_style('mselect2', MAPSVG_PLUGIN_URL . 'js/vendor/select2/select2.min.css', null, '4.0.3');
            wp_enqueue_style('mselect2');

            wp_register_script('ionslider', MAPSVG_PLUGIN_URL . 'js/vendor/ion-rangeslider/ion.rangeSlider.min.js', array('jquery'), '2.1.2');
            wp_enqueue_script('ionslider');
            wp_register_style('ionslider', MAPSVG_PLUGIN_URL . 'js/vendor/ion-rangeslider/ion.rangeSlider.css');
            wp_enqueue_style('ionslider');
            wp_register_style('ionslider-skin', MAPSVG_PLUGIN_URL . 'js/vendor/ion-rangeslider/ion.rangeSlider.skinNice.css');
            wp_enqueue_style('ionslider-skin');

            wp_register_script('codemirror', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.js', null, '1.0');
            wp_enqueue_script('codemirror');
            wp_register_style('codemirror', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.css');
            wp_enqueue_style('codemirror');
            wp_register_script('codemirror.javascript', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.javascript.js', array('codemirror'), '1.0');
            wp_enqueue_script('codemirror.javascript');
            wp_register_script('codemirror.xml', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.xml.js', array('codemirror'), '1.0');
            wp_enqueue_script('codemirror.xml');
            wp_register_script('codemirror.css', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.css.js', array('codemirror'), '1.0');
            wp_enqueue_script('codemirror.css');
            wp_register_script('codemirror.htmlmixed', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.htmlmixed.js', array('codemirror'), '1.0');
            wp_enqueue_script('codemirror.htmlmixed');
            wp_register_script('codemirror.simple', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.simple.js', array('codemirror'), '1.0');
            wp_enqueue_script('codemirror.simple');
            wp_register_script('codemirror.multiplex', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.multiplex.js', array('codemirror'), '1.0');
            wp_enqueue_script('codemirror.multiplex');
            wp_register_script('codemirror.handlebars', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.handlebars.js', array('codemirror'), '1.0');
            wp_enqueue_script('codemirror.handlebars');

            wp_register_script('codemirror.hint', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.show-hint.js', array('codemirror'), '1.0');
            wp_enqueue_script('codemirror.hint');
            wp_register_script('codemirror.anyword-hint', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.anyword-hint.js', array('codemirror'), '1.0');
            wp_enqueue_script('codemirror.anyword-hint');
            wp_register_style('codemirror.hint.css', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.show-hint.css', array('codemirror'), '1.0');
            wp_enqueue_style('codemirror.hint.css');

            wp_register_script('codemirror.jshint', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/jshint.js', array('codemirror'), '1.0');
            wp_enqueue_script('codemirror.jshint');
            wp_register_script('codemirror.lint', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.lint.js', array('codemirror'), '1.0');
            wp_enqueue_script('codemirror.lint');
            wp_register_script('codemirror.js-lint', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.javascript-lint.js', array('codemirror'), '1.0');
            wp_enqueue_script('codemirror.js-lint');
            wp_register_style('codemirror.lint.css', MAPSVG_PLUGIN_URL . 'js/vendor/codemirror/codemirror.lint.css', array('codemirror'), '1.0');
            wp_enqueue_style('codemirror.lint.css');

            wp_register_script('sortable', MAPSVG_PLUGIN_URL . 'js/vendor/sortable/sortable.min.js', null, '1.4.2');
            wp_enqueue_script('sortable');

            wp_register_script('jscrollpane', MAPSVG_PLUGIN_URL . 'js/vendor/jscrollpane/jquery.jscrollpane.min.js', null, '0.8.7');
            wp_enqueue_script('jscrollpane');
            wp_register_style('jscrollpane', MAPSVG_PLUGIN_URL . 'js/vendor/jscrollpane/jquery.jscrollpane.css');
            wp_enqueue_style('jscrollpane');

            wp_register_script('html2canvas', MAPSVG_PLUGIN_URL . 'js/vendor/html2canvas/html2canvas.min.js', null, '0.5.0');
            wp_enqueue_script('html2canvas');

            wp_register_script('bootstrap-datepicker', MAPSVG_PLUGIN_URL . 'js/vendor/bootstrap-datepicker/bootstrap-datepicker.min.js', array('bootstrap'), '1.6.4.2.1');
            wp_enqueue_script('bootstrap-datepicker');
            wp_register_script('bootstrap-datepicker-locales', MAPSVG_PLUGIN_URL . 'js/vendor/bootstrap-datepicker/datepicker-locales/locales.js', array('bootstrap', 'bootstrap-datepicker'), '1.0');
            wp_enqueue_script('bootstrap-datepicker-locales');
            wp_register_style('bootstrap-datepicker', MAPSVG_PLUGIN_URL . 'js/vendor/bootstrap-datepicker/bootstrap-datepicker.min.css', array('bootstrap'), '1.6.4.2');
            wp_enqueue_style('bootstrap-datepicker');

            wp_register_script('path-data-polyfill', MAPSVG_PLUGIN_URL . 'js/mapsvg-admin/core/path-data-polyfill.js', null, '1.0');
            wp_enqueue_script('path-data-polyfill');
        }

        // Load common JS/CSS files
        self::addJsCssCommon();
    }

    /**
     * Add common JS & CSS
     */
    static function addJsCssCommon()
    {

        wp_register_style('mapsvg', MAPSVG_PLUGIN_URL . 'dist/mapsvg.css', null, MAPSVG_ASSET_VERSION);
        wp_enqueue_style('mapsvg');

        wp_register_style('nanoscroller', MAPSVG_PLUGIN_URL . 'js/vendor/nanoscroller/nanoscroller.css');
        wp_enqueue_style('nanoscroller');

        wp_register_style('mselect2', MAPSVG_PLUGIN_URL . 'js/vendor/select2/select2.min.css', null, '4.0.31');
        wp_enqueue_style('mselect2');

        wp_register_script('jquery.mousewheel', MAPSVG_PLUGIN_URL . 'js/vendor/jquery-mousewheel/jquery.mousewheel.min.js', array('jquery'), '3.0.6');
        wp_enqueue_script('jquery.mousewheel', null, '3.0.6');

        wp_register_script('mselect2', MAPSVG_PLUGIN_URL . 'js/vendor/select2/select2.full.min.js', array('jquery'), '4.0.31', true);
        wp_enqueue_script('mselect2');

        wp_register_script('nanoscroller', MAPSVG_PLUGIN_URL . 'js/vendor/nanoscroller/jquery.nanoscroller.min.js', null, '0.8.7');
        wp_enqueue_script('nanoscroller');

        wp_register_script('typeahead', MAPSVG_PLUGIN_URL . 'js/vendor/typeahead/typeahead.jquery.js', null, '0.11.1');
        wp_enqueue_script('typeahead');

        wp_register_script('bloodhound', MAPSVG_PLUGIN_URL . 'js/vendor/typeahead/bloodhound.js', null, '0.11.1');
        wp_enqueue_script('bloodhound');

        wp_register_script('handlebars', MAPSVG_PLUGIN_URL . 'js/vendor/handlebars/handlebars.min.js', null, '4.7.7');
        wp_enqueue_script('handlebars');
        wp_enqueue_script('handlebars-helpers', MAPSVG_PLUGIN_URL . 'js/vendor/handlebars/handlebars-helpers.js', null, MAPSVG_ASSET_VERSION);

        $mapsvgDeps = array('nanoscroller', 'mselect2', 'jquery.mousewheel', 'bloodhound', 'typeahead');
        if (isset($_GET['page']) && $_GET['page'] == 'mapsvg-config') {
            $mapsvgDeps = array_merge($mapsvgDeps, array('handlebars', 'handlebars-helpers', 'codemirror'));
        }

        wp_register_script('mapsvg', MAPSVG_PLUGIN_URL . 'dist/mapsvg-front.umd.js', $mapsvgDeps, MAPSVG_ASSET_VERSION);

        wp_localize_script('mapsvg', 'mapsvg_paths', array(
            'root' => MAPSVG_PLUGIN_RELATIVE_URL,
            'api' => get_rest_url(null, 'mapsvg/v1/'),
            'templates' => MAPSVG_PLUGIN_RELATIVE_URL . 'js/mapsvg-admin/templates/',
            'maps' => parse_url(MAPSVG_MAPS_URL, PHP_URL_PATH),
            'uploads' => parse_url(MAPSVG_UPLOADS_URL, PHP_URL_PATH),
            'home' => parse_url(home_url(), PHP_URL_PATH) ? parse_url(home_url(), PHP_URL_PATH) : '',
        ));
        wp_localize_script('mapsvg', 'mapsvg_ini_vars', array(
            'post_max_size' => ini_get('post_max_size'),
            'upload_max_filesize' => ini_get('upload_max_filesize')
        ));
        wp_localize_script('mapsvg', 'mapsvg_runtime_vars', [
            'nonce' => wp_create_nonce('wp_rest'),
        ]);
        wp_enqueue_script('mapsvg');

    }

    function enqueueGutenberg( $hook_suffix ){
        if( in_array($hook_suffix, array('post.php', 'post-new.php') ) ){
            $db = Database::get();
            $post_types = Options::get('mappable_post_types');
            $screen = get_current_screen();
            if(!empty($post_types)){
                if( is_object( $screen ) && in_array($screen->post_type, $post_types)){
                    static::addJsCssGutenberg();
                }
            }
        }
    }

    /**
     * Adds scripts and CSS to Gutenberg editor
     */
    function addJsCssGutenberg(){
        static::addJsCssCommon();

        wp_register_script(
            'mapsvg-gutenberg-sidebar',
            MAPSVG_PLUGIN_URL.'dist/mapsvg-gutenberg.build.js',
            array('wp-blocks', 'wp-plugins', 'wp-edit-post', 'wp-i18n', 'wp-element' )
        );

        $markersRepo = new MarkersRepository();
        $markerImages = $markersRepo->find();
        $apiKey = Options::get("google_api_key");

        wp_localize_script('mapsvg-gutenberg-sidebar','mapsvgMarkerImages', $markerImages);
        wp_localize_script('mapsvg-gutenberg-sidebar','googleApiKey', $apiKey);
        wp_localize_script('mapsvg-gutenberg-sidebar','mapsPath', MAPSVG_MAPS_URL);

        wp_enqueue_script( 'mapsvg-gutenberg-sidebar');

        wp_register_style('fontawesome', MAPSVG_PLUGIN_URL . "css/font-awesome/font-awesome.min.css", null, '4.4.0');
        wp_enqueue_style('fontawesome');

//        wp_enqueue_style(
//            'mapsvg-main-css',
//            MAPSVG_PLUGIN_URL.'css/mapsvg-admin.css'
//        );
        wp_enqueue_style(
            'mapsvg-gutenberg-css',
            MAPSVG_PLUGIN_URL.'css/mapsvg-gutenberg.css'
        );
    }

    /**
     * Render MapSVG settings page in WP Admin
     */
    function renderAdminPage()
    {

        // Check user rights
        if (!current_user_can('edit_posts'))
            die();

        if (isset($_GET['map_id']) && !empty($_GET['map_id'])) {
            $this->edit($_REQUEST);
        } else {
            $this->index($_REQUEST);
        }

        return true;
    }

	public function index($request)
    {
        $templateData = array();
        $mapsRepo = new MapsRepository();

        $mapsRepo->deleteAllRemovedOneDayAgo();

        // Load the list of available SVG files
        $svgRepo = new SVGFileRepository();

		// Load the list of created maps
		$query = new Query(array('perpage' => 0, 'filters' => ['status' =>  1 ],'fields'=>array('id','title')));

        $post_types = $this->getPostTypes();

        $seenWhatsNew = Options::get('seen_whats_new');
        if(!$seenWhatsNew){
            $whatsNew = file_get_contents(MAPSVG_PLUGIN_DIR . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'Admin' . DIRECTORY_SEPARATOR .  'Changelog' . DIRECTORY_SEPARATOR . '6.0.0.html');
            Options::set('seen_whats_new', 1);
        }


        $options["mapsvg_login_keys"] = null;

        $templateData = array(
            'page' => 'index',
            'svgFiles' => $svgRepo->find(),
            'maps' => $mapsRepo->find($query),
            'mapsvgVersion' => MAPSVG_VERSION,
            'mapsvgGITBranch' => MAPSVG_GIT_BRANCH,
            'options' => Options::getAll(),
            'postTypes' => $post_types,
            'seenWhatsNew' => $seenWhatsNew,
            'whatsNew' => isset($whatsNew) ?  $whatsNew : '',
            'accessGranted' => (Options::get("mapsvg_login_keys") && (count(Options::get("mapsvg_login_keys")) > 0)) ? "true" : "false"
        );

        if (defined('PHP_VERSION_ERROR')) {
            $templateData['mapsvg_error'] = PHP_VERSION_ERROR;
        }

        $this->renderOutput('index', $templateData);
    }

    public function edit($request)
    {
        $templateData = array();
        $mapsRepo = new MapsRepository();
        $map = $mapsRepo->findById($request['map_id']);

        // If table or schema doesn't exists, fix that
        if(!$map->regions->hasTable()){
            if($map->regions->hasSchema()){
                $map->regions = RegionsRepository::createRepository($map->regions->getSchema()->getData());
            } else {
                $map->regions = RegionsRepository::createRepository('regions_' . $map->id);
            }
            $map->setRegionsTable();
        }

        if(!$map->objects->hasTable()){
            if($map->objects->hasSchema()){
                $map->objects = ObjectsRepository::createRepository($map->objects->getSchema()->getData());
            } else {
                $map->regions = ObjectsRepository::createRepository('objects_' . $map->id);
            }
        }

//        $map->regions->loadSchema();
//        $map->objects->loadSchema();

        if($map->optionsBroken && isset($_GET["fix"])){
            $upgrader = new Upgrade();
            $upgrader->v6FixMap($map);
            $map = $mapsRepo->findById($request['map_id']);
        }

        $updater = new MapUpdater();
        $updater->maybeUpdate($map);

        if (empty($map->title)) {
            $map->setTitle('New map');
        }

        $markersRepo = new MarkersRepository();
        $markerImages = $markersRepo->find();

        $map->withObjects();
        $map->withRegions();
        $map->withSchema();



        $db = Database::get();

        $fulltext_min_word = $db->get_row("show variables like 'ft_min_word_len'", OBJECT);
        $fulltext_min_word = $fulltext_min_word ? $fulltext_min_word->Value : 0;

        $options = Options::getAll();
        $post_types = $this->getPostTypes();


        // Load the list of available SVG files
        $svgRepo = new SVGFileRepository();

        $options["mapsvg_login_keys"] = null;

        $templateData = array(
            'page' => 'edit',
            'map' => $map,
            'mapsvgVersion' => MAPSVG_VERSION,
            'mapsvgGITBranch' => MAPSVG_GIT_BRANCH,
            'markerImages' => $markerImages,
            'svgFiles' => $svgRepo->find(),
            'mapsvg_version' => MAPSVG_VERSION,
            'fulltext_min_word' => $fulltext_min_word,
            'options' => $options,
            'postTypes' => $post_types,
            'userIsAdmin' => current_user_can("create_users") ? "true" : "false",
            'accessGranted' => (Options::get("mapsvg_login_keys") && (count(Options::get("mapsvg_login_keys")) > 0)) ? "true" : "false"

    );

        if (defined('PHP_VERSION_ERROR')) {
            $templateData['mapsvg_error'] = PHP_VERSION_ERROR;
        }

        $this->renderOutput('edit', $templateData);
    }

    public function renderOutput($page, $data)
    {
        include(__DIR__ . DIRECTORY_SEPARATOR . ucfirst($page) . DIRECTORY_SEPARATOR . 'header.inc');
        include(__DIR__ . DIRECTORY_SEPARATOR . ucfirst($page) . DIRECTORY_SEPARATOR . 'body.inc');
        include(__DIR__ . DIRECTORY_SEPARATOR . ucfirst($page) . DIRECTORY_SEPARATOR . 'footer.inc');
        include(__DIR__ . DIRECTORY_SEPARATOR . "Common" . DIRECTORY_SEPARATOR . 'support_modal.inc');
    }

    /**
     * Get all maps created in MapSVG. Used in old WordPress page editor (WordPress 4.x)
     */
    function ajax_mapsvg_get_maps()
    {
        //    $data = get_posts(array('numberposts'=>999, 'post_type'=>'mapsvg');
        //    echo json_encode($data);
        $args = array('post_type' => 'mapsvg');
        $loop = new WP_Query($args);
        $array = array();

        while ($loop->have_posts()) : $loop->the_post();

            $array[] = array(
                'id' => get_the_ID(),
                'title' => get_the_title()
            );

        endwhile;

        wp_reset_query();
        ob_clean();
        echo json_encode($array);
        die();
    }


    function getPostTypes()
    {
        global $wpdb;

        $args = array(
            '_builtin' => false
        );

        $_post_types = get_post_types($args, 'names');
        if (!$_post_types)
            $_post_types = array();

        $post_types = array();
        foreach ($_post_types as $pt) {
            if ($pt != 'mapsvg')
                $post_types[] = $pt;
        }
        $post_types[] = 'post';
        $post_types[] = 'page';
        return $post_types;
    }


}
