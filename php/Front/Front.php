<?php
/**
 * Created by PhpStorm.
 * User: Roma
 * Date: 24.10.18
 * Time: 9:59
 */

namespace MapSVG;

class Front
{
	public $mapScripts;

    public function __construct(){
        $this->registerShortcode();
    }

	/**
	 * Add common JS & CSS
	 */
	static function addJsCss(){

		wp_register_style('mapsvg', MAPSVG_PLUGIN_URL . 'dist/mapsvg.css', null, MAPSVG_ASSET_VERSION);
		wp_enqueue_style('mapsvg');

		wp_register_style('nanoscroller', MAPSVG_PLUGIN_URL . 'js/vendor/nanoscroller/nanoscroller.css');
		wp_enqueue_style('nanoscroller');

		wp_register_style('select2', MAPSVG_PLUGIN_URL . 'js/vendor/select2/select2.min.css', null, '4.0.31');
		wp_enqueue_style('select2');

		wp_register_script('jquery.mousewheel', MAPSVG_PLUGIN_URL . 'js/vendor/jquery-mousewheel/jquery.mousewheel.min.js',array('jquery'), '3.0.6');
		wp_enqueue_script('jquery.mousewheel', null, '3.0.6');

		wp_register_script('mselect2', MAPSVG_PLUGIN_URL . 'js/vendor/select2/select2.full.min.js', array('jquery'), '4.0.31',true);
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

		wp_register_script('mapsvg', MAPSVG_PLUGIN_URL . 'dist/mapsvg-front.umd.js', array('jquery','nanoscroller','mselect2','jquery.mousewheel','handlebars','handlebars-helpers','bloodhound','typeahead'), MAPSVG_ASSET_VERSION);
		//wp_enqueue_script('mapsvg');

		wp_localize_script('mapsvg','mapsvg_paths', array(
			'root'      => MAPSVG_PLUGIN_RELATIVE_URL,
            'api' => get_rest_url(null, 'mapsvg/v1/'),
			'templates' => MAPSVG_PLUGIN_RELATIVE_URL.'js/mapsvg-admin/templates/',
			'maps'      => parse_url(MAPSVG_MAPS_URL, PHP_URL_PATH),
			'uploads'   => parse_url(MAPSVG_UPLOADS_URL, PHP_URL_PATH),
            'home' => parse_url(home_url(), PHP_URL_PATH) ? parse_url(home_url(), PHP_URL_PATH) : '',
		));
		wp_localize_script('mapsvg','mapsvg_ini_vars', array(
			'post_max_size'       => ini_get('post_max_size'),
			'upload_max_filesize' => ini_get('upload_max_filesize')
		));
		wp_localize_script( 'mapsvg', 'mapsvg_runtime_vars', [
			'nonce' => wp_create_nonce( 'wp_rest' ),
		] );
		wp_enqueue_script('mapsvg');
	}

	/**
	 * Loads JS and CSS files for legacy MapSVG v2.4.1
	 */
	public static function addJsCssV2(){

		wp_register_style('mapsvg2', MAPSVG_PLUGIN_URL . 'mapsvg2/css/mapsvg.css');
		wp_enqueue_style('mapsvg2', null, '0.9');

		wp_register_script('jquery.mousewheel', MAPSVG_PLUGIN_URL . 'mapsvg2/js/jquery.mousewheel.min.js',array('jquery'), '3.0.6');
		wp_enqueue_script('jquery.mousewheel', null, '3.0.6');

		wp_register_script('handlebars', MAPSVG_PLUGIN_URL . 'mapsvg2/js/handlebars.js', null, '4.0.2');
		wp_enqueue_script('handlebars');

		wp_register_script('typeahead', MAPSVG_PLUGIN_URL . 'mapsvg2/js/typeahead.bundle.min.js', null, '1.2.1');
		wp_enqueue_script('typeahead');

		wp_register_script('nanoscroller', MAPSVG_PLUGIN_URL . 'mapsvg2/js/jquery.nanoscroller.min.js', null, '0.8.7');
		wp_enqueue_script('nanoscroller');
		wp_register_style('nanoscroller', MAPSVG_PLUGIN_URL . 'mapsvg2/css/nanoscroller.css');
		wp_enqueue_style('nanoscroller');


		if(MAPSVG_DEBUG)
			wp_register_script('mapsvg2', MAPSVG_PLUGIN_URL . 'mapsvg2/js/mapsvg.js', array('jquery'), (MAPSVG_RAND?rand():''));
		else
			wp_register_script('mapsvg2', MAPSVG_PLUGIN_URL . 'mapsvg2/js/mapsvg.min.js', array('jquery'), MAPSVG_JQUERY_VERSION);
		wp_enqueue_script('mapsvg2');
	}

	public function registerShortcode(){
		add_shortcode( 'mapsvg', array($this, 'renderShortcode' ));
	}

	/**
	 *  Renders [mapsvg id="xxx"] shortcode.
	 *
	 *  Shortcode returns an empty <div id="mapsvg-XXX" class="mapsvg"</div> container
	 *  and adds a JS script at the bottom of a page that adds the map to the created container
	 *
	 * @param $atts
	 * Attributes from the shortcode
	 *
	 * @return string
	 * String that replaces the [mapsvg id="xxx"] shortcode
	 */
	function renderShortcode( $atts ){

		if(!isset($atts['id'])){
			return 'Error: no ID in mapsvg shortcode.';
		}

		$mapsRepo = new MapsRepository();
		$map = $mapsRepo->findById($atts['id']);

		if (!$map){
			return 'Map not found, please check "id" parameter in your shortcode.';
		}

		if(version_compare($map->version, '3.0.0', '<')){
			return $this->renderShortcodeV2($atts);
		}

		$googleMapsApiKey = Options::get("google_api_key");

        $map->withSchema();
        $map->withRegions();

		if(isset($map->options["database"]["loadOnStart"]) && $map->options["database"]["loadOnStart"] === true){
            $map->withObjects();
        }

		// Check if map settings need to be upgraded
		$updater = new MapUpdater();
		$updater->maybeUpdate($map);

		// Load JS/CSS files
		static::addJsCss();
		do_action('mapsvg_shortcode');

		$js_mapsvg_options = json_encode($map, JSON_UNESCAPED_UNICODE);

		$no_double_render = !empty($atts['no_double_render']) ? true : false;

		// Prepare MapSVG container (short
		$container_id = $no_double_render ? $map->id : $this->generateContainerId($map->id);
		$data    = '<div id="mapsvg-'.$container_id.'" class="mapsvg"></div>';
		$script  = "<script type=\"text/javascript\">";
		$script .= "window.addEventListener(\"load\", function(){";
		$script .= "MapSVG.version = '".MAPSVG_VERSION."';\n";
		$script .= 'var mapsvg_options = '.$js_mapsvg_options.';';

		if(!empty($atts['selected'])){
			$country = str_replace(' ','_', $atts['selected']);
			$script .= 'jQuery.extend( true, mapsvg_options, {options: {regions: {"'.$country.'": {selected: true}}}} );';
		}
		// , svg_file_version: '.(int)get_post_meta($map->id, 'mapsvg_svg_file_version', true).'
		$script .= 'jQuery.extend( true, mapsvg_options, {options: {googleMaps: {apiKey: "'.$googleMapsApiKey.'"}}} );';

		$script .= 'new mapsvg.map("mapsvg-'.$container_id.'", mapsvg_options);});</script>';

		$this->mapScripts[$container_id] = $script;

		// Load MapSVG execution script at the bottom of the page
		add_action('wp_footer', [$this,'outputJsScript'], 9998);

		return $data;
	}

	function renderShortcodeV2( $atts ){

		$db = Database::get();

		static::addJsCssV2();

		$res = $db->get_results(
			$db->prepare("select * from $db->posts WHERE ID = %d", (int)$atts['id'])
		);
		$post = $res && isset($res[0]) ? $res[0] : array();

		if (empty($post->ID))
			return 'Map not found, please check "id" parameter in your shortcode.';

		$data  = '<div id="mapsvg-'.$post->ID.'" class="mapsvg"></div>';
		$script = '<script type="text/javascript">';

		if(!empty($atts['selected'])){
			$country = str_replace(' ','_', $atts['selected']);
			$script .= '
		      var mapsvg_options = '.$post->post_content.';
		      jQuery.extend( true, mapsvg_options, {regions: {"'.$country.'": {selected: true}}} );
		      jQuery("#mapsvg-'.$post->ID.'").mapSvg2(mapsvg_options);</script>';
		}else{
			$script .= 'jQuery("#mapsvg-'.$post->ID.'").mapSvg2('.$post->post_content.');</script>';
		}

		$this->mapScripts[$post->ID] = $script;

		// Load MapSVG execution script at the bottom of the page
		add_action('wp_footer', [$this,'outputJsScript'], 9998);

		return $data;
	}

	/**
	 * Generate container ID for the map
	 */
	function generateContainerId($mapId, $iteration = 0){

		$iteration_str = '';

		if($iteration !== 0){
			$iteration_str = '-'.$iteration;
		}
		if(isset($this->mapScripts[$mapId.$iteration_str])){
			$iteration++;
			return $this->generateContainerId($mapId, $iteration);
		} else {
			return $mapId.$iteration_str;
		}
	}

	/**
	 * Output MapSVG scripts
	 */
	function outputJsScript(){
		foreach($this->mapScripts as $m){
			echo $m;
		}
	}

}
