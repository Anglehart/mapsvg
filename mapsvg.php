<?php
/*
Plugin Name: MapSVG
Plugin URI: http://codecanyon.net/item/mapsvg-interactive-vector-maps/2547255?ref=RomanCode
Description: Interactive Vector Maps (SVG), Google maps, Image maps.
Author: Roman S. Stepanov
Author URI: http://codecanyon.net/user/RomanCode
Version: 6.0.1
*/
namespace MapSVG;

include 'php/Autoloader.php';

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

/**
 * The MAPSVG_DEBUG constant switches between Development and Production modes.
 * To enable the Dev mode, add the following line to wp_config.php:
 * define('MAPSVG_DEBUG', true);
 * Also, debugging can be enabled by adding ?mapsvg_debug=SECRET_KEY to the URL
 */
if(!defined('MAPSVG_DEBUG')){
	if(isset($_GET['mapsvg_debug'])){
		$secret_key = $_GET['mapsvg_debug'];
		$open_key   = 'salted_maps_2020';
		$key        = $secret_key.$open_key;
		$md5        = md5($key);
		define('MAPSVG_DEBUG', $md5 === 'd603c50bd2fd093451c0c483e7eff3fe');
	} else {
		define('MAPSVG_DEBUG', false);
	}
}
if(MAPSVG_DEBUG){
    include 'vendor/autoload.php';
}

/**
 * Turn on error notifications and determine GIT branch in Development mode
 */
if(MAPSVG_DEBUG){
    define('MAPSVG_GIT_BRANCH', shell_exec('cd '.__DIR__.'; git rev-parse --abbrev-ref HEAD;'));

	error_reporting(E_ALL);
	// The following line is required for FirePHP logs:
	ob_start();
}
else {
    define('MAPSVG_GIT_BRANCH', '');
}

/**
 * Include the class that renders shortcode on an empty page.
 * Used in MapSVG templates as shown below:
 * {{shortcode '[apple id="123"]'}}
 */
if(isset($_GET['mapsvg_shortcode']) || isset($_GET['mapsvg_shortcode_inline']) || isset($_GET['mapsvg_embed_post'])) {
	include( __DIR__.DIRECTORY_SEPARATOR.'php'.DIRECTORY_SEPARATOR.'Domain'.DIRECTORY_SEPARATOR.'ShortcodeRender'.DIRECTORY_SEPARATOR.'shortcodes.php' );
}

/**
 * If MAPSVG_RAND == true && MAPSVG_DEBUG == true
 * then a random number is added to js/css file URLs to disable cache
 */
define('MAPSVG_RAND', isset($_GET['norand']) ? false : true);

$upload_dir = wp_upload_dir();
$upload_dir['path'] = str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $upload_dir['path']);
$upload_dir['basedir'] = str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $upload_dir['basedir']);

$plugin_dir_url = plugin_dir_url( __FILE__ );
if(is_ssl()){
	$upload_dir['baseurl'] = str_replace('http:','https:', $upload_dir['baseurl']);
	$plugin_dir_url = str_replace('http:','https:', $plugin_dir_url);
}

/** String constants */
define('MAPSVG_INFO', 'INFO');
define('MAPSVG_ERROR', 'ERROR');

/** MapSVG version number */
define('MAPSVG_VERSION', '6.0.1');

/** MapSVG plugin URL */
define('MAPSVG_PLUGIN_URL', $plugin_dir_url);

/** MapSVG plugin relative URL without domain */
$parts = parse_url(MAPSVG_PLUGIN_URL);
define('MAPSVG_PLUGIN_PATH', $parts['path']);

/** MapSVG plugin dir */
define('MAPSVG_PLUGIN_DIR', str_replace(['\\', '/'], DIRECTORY_SEPARATOR, realpath(plugin_dir_path( __FILE__ ))));

/** Maps dir */
define('MAPSVG_MAPS_DIR', realpath(MAPSVG_PLUGIN_DIR . DIRECTORY_SEPARATOR . 'maps'));

/** Maps uploads dir */
define('MAPSVG_MAPS_UPLOADS_DIR', $upload_dir['basedir'] . DIRECTORY_SEPARATOR. 'mapsvg');

/** Maps uploads URL */
define('MAPSVG_MAPS_UPLOADS_URL', $upload_dir['baseurl'] . '/mapsvg/');

define('MAPSVG_MAPS_URL', MAPSVG_PLUGIN_URL . 'maps/');

define('MAPSVG_PINS_DIR', realpath(MAPSVG_PLUGIN_DIR . DIRECTORY_SEPARATOR . 'markers'));

define('MAPSVG_PINS_URL', MAPSVG_PLUGIN_URL . 'markers/');

define('MAPSVG_ASSET_VERSION', MAPSVG_VERSION.(MAPSVG_DEBUG?(MAPSVG_RAND?rand():''):''));

define('MAPSVG_JQUERY_VERSION', MAPSVG_VERSION.(MAPSVG_DEBUG?(MAPSVG_RAND?rand():''):''));

/** Version number of the database structure */
define('MAPSVG_DB_VERSION', '1.0');

/** Prefix for MapSVG tables in the database */
define('MAPSVG_PREFIX',  'mapsvg6_');

// The list of MapSVG version numbers with incompatible code changes (space-separated).
// If the map version is between of these numbers it needs to be upgraded.
define('MAPSVG_INCOMPATIBLE_VERSIONS',  '2.0.0 3.2.0 5.0.0 6.0.0');



/**
 * Class MapSVG
 * @package MapSVG
 */
class MapSVG {

    public function __construct(){
        if($this->isPhpVersionOk() && MAPSVG_DEBUG){
            Logger::init();
        }
    }

	public function run(){

        if (defined("PHP_VERSION_ERROR")){
            add_action('admin_menu', array($this, 'addErrorPage'));
            return;
        }

        $upgrader = new Upgrade();
        $upgrader->updateDbCheck();

        $router = new Router();

		add_action('wp_head',array($this,'ajaxurl'));

        if (is_admin()) {
            /** Load Admin controller */
            try {
                $admin = new Admin();
            } catch (\Exception $e) {
                status_header($e->getCode());
                $response = ['error' => $e->getMessage()];
            }
        } else {
	        /** Load Front-end controller */
            $front = new Front();
        }
	}


	/**
	 * Add "ajaxurl" JavaScript global variable that contains URL of the admin-ajax.php file
	 */
	function ajaxurl() {
		$url = '';
		if ( is_admin() )
			$url = admin_url( 'admin-ajax.php' );
		else
			$url = site_url( 'wp-admin/admin-ajax.php' );
		?>
		<script type="text/javascript">
            var ajaxurl = '<?php echo $url; ?>';
		</script>
		<?php
	}

    function addErrorPage(){
        add_menu_page('MapSVG', 'MapSVG', 'edit_posts', 'mapsvg-config', array($this, 'renderErrorPage'), '', 66);
    }

    /**
     * Checks PHP Version
     * @return bool
     */
    function isPhpVersionOk()
    {
        $match = array();
        preg_match("#^\d+(\.\d+)*#", PHP_VERSION, $match);
        $php_version = $match[0];
        if (version_compare($php_version, '5.4.0', '<')) {
            define('PHP_VERSION_ERROR', 'Your PHP version is ' . $php_version . '. MapSVG requires version 5.4.0 or higher.');
            return false;
        } else {
            return true;
        }
    }

    function renderErrorPage(){
        echo "<div style='padding: 30px;'>".PHP_VERSION_ERROR."</div>";
    }
}

$mapsvg = new MapSVG();
$mapsvg->run();


?>
