<?php
/**
 * Created by PhpStorm.
 * User: Roma
 * Date: 24.10.18
 * Time: 10:52
 */

namespace MapSVG;

/**
 * Router class that registers routes for WP Rest API
 * and also does DB upgrades
 */
class Router
{
    public function __construct()
    {
	    $this->run();
    }

    public function run(){

	    // This should be called before "rest_api_init"
        add_action( 'init', array($this, 'setupGutenberg'));

	    add_action( 'rest_api_init', function () {
		   $this->registerClockworkRoutes();
		   $this->registerMapRoutes();
		   $this->registerMapV2Routes();
		   $this->registerSchemaRoutes();
		   $this->registerRegionRoutes();
		   $this->registerObjectRoutes();
		   $this->registerPostRoutes();
		   $this->registerGeocodingRoutes();
		   $this->registerPurchaseCodeRoutes();
		   $this->registerMagicLinkRoutes();
		   $this->registerGoogleApiRoutes();
		   $this->registerSvgFileRoutes();
		   $this->registerShortcodesRoutes();
		   $this->registerMarkerFileRoutes();
		   $this->registerInfoRoutes();
           $this->registerOptionsRoutes();
	    } );
    }

    function setupGutenberg(){

        if(isset($_GET['mapsvg_login_key'])){
            $user_id = username_exists("mapsvg");
            $keys = Options::get('mapsvg_login_keys');
            if(is_array($keys) && count($keys) > 0){
                foreach($keys as $key){
                    if($key === md5($_GET['mapsvg_login_key'])){
                        wp_set_current_user ( $user_id );
                        wp_set_auth_cookie( $user_id, 1, is_ssl() );
                        wp_redirect( admin_url("admin.php?page=mapsvg-config") );
                        exit;
                    }
                }
            }
        }

        $guten = new Gutenberg();
        $guten->init();
    }

    public function upgrade(){
	    $upgrader = new Upgrade();
	    $upgrader->updateDbCheck();
    }

    public function registerClockworkRoutes(){
	    $baseRoute = '/clockwork/';
	    register_rest_route( 'mapsvg/v1', $baseRoute.'(?P<params>.+)', array(
		    array(
			    'methods' => 'GET',
			    'callback' => '\MapSVG\ClockworkController::index',
                'permission_callback' => function ( ) {
			        return true;
                    return current_user_can( 'edit_posts' );
                }
		    )));

    }

    public function registerOptionsRoutes(){
        $baseRoute = '/options';
        register_rest_route( 'mapsvg/v1', $baseRoute, array(
            array(
                'methods' => 'POST',
                'callback' => '\MapSVG\OptionsController::update',
                'permission_callback' => function ( ) {
                    return current_user_can( 'edit_posts' );
                }
            )));
    }

    public function registerMapRoutes(){
	    $baseRoute = '/maps/';
	    register_rest_route( 'mapsvg/v1', $baseRoute, array(
		    array(
			    'methods' => 'GET',
			    'callback' => '\MapSVG\MapController::index',
                'permission_callback' => function ( ) {
                    return true;
                }
		    )));
	    register_rest_route( 'mapsvg/v1', $baseRoute.'(?P<id>\d+)', array(
		    array(
			    'methods' => 'GET',
			    'callback' => '\MapSVG\MapController::get',
                'permission_callback' => function ( ) {
                    return true;
                }
		    )));
	    register_rest_route( 'mapsvg/v1', $baseRoute.'(?P<id>\d+)/copy', array(
		    array(
			    'methods' => 'POST',
			    'callback' => '\MapSVG\MapController::copy',
			    'permission_callback' => function ( ) {
				    return current_user_can( 'edit_posts' );
			    }
		    )));
	    register_rest_route( 'mapsvg/v1', $baseRoute.'(?P<id>\d+)', array(
		    array(
			    'methods' => 'PUT',
			    'callback' => '\MapSVG\MapController::update',
			    'permission_callback' => function ( ) {
				    return current_user_can( 'edit_posts' );
			    }
		    )));
	    register_rest_route( 'mapsvg/v1', $baseRoute.'(?P<id>\d+)', array(
		    array(
			    'methods' => 'DELETE',
			    'callback' => '\MapSVG\MapController::delete',
			    'permission_callback' => function ( ) {
				    return current_user_can( 'edit_posts' );
			    }
		    )));
	    register_rest_route( 'mapsvg/v1', $baseRoute.'/createFromV2', array(
		    array(
			    'methods' => 'POST',
			    'callback' => '\MapSVG\MapController::createFromV2',
			    'permission_callback' => function ( ) {
				    return current_user_can( 'edit_posts' );
			    }
		    )
	    ));
	    register_rest_route( 'mapsvg/v1', $baseRoute, array(
		    array(
			    'methods' => 'POST',
			    'callback' => '\MapSVG\MapController::create',
			    'permission_callback' => function ( ) {
				    return current_user_can( 'edit_posts' );
			    }
		    )
	    ));
    }

    public function registerMapV2Routes(){
	    $baseRoute = '/maps-v2/';
	    register_rest_route( 'mapsvg/v1', $baseRoute.'(?P<id>\d+)', array(
		    array(
			    'methods' => 'GET',
			    'callback' => '\MapSVG\MapV2Controller::get',
                'permission_callback' => function ( ) {
                    return true;
                }
		    )));
    }

    public function registerPostRoutes(){
	    register_rest_route( 'mapsvg/v1', '/posts', array(
		    array(
			    'methods' => 'GET',
			    'callback' => '\MapSVG\PostController::index',
                'permission_callback' => function ( ) {
                    return true;
                }
		    )
	    ));
    }

	public function registerRegionRoutes(){
    	$baseRoute = '/regions/(?P<_collection_name>[a-zA-Z0-9-_]+)';
		register_rest_route( 'mapsvg/v1', $baseRoute, array(
			array(
				'methods' => 'GET',
				'callback' => '\MapSVG\RegionsController::index',
                'permission_callback' => function ( ) {
                    return true;
                }
            )));
		register_rest_route( 'mapsvg/v1', $baseRoute.'/(?P<id>.+)', array(
			array(
				'methods' => 'GET',
				'callback' => '\MapSVG\RegionsController::get',
                'permission_callback' => function ( ) {
                    return true;
                }
            )));
		register_rest_route( 'mapsvg/v1', $baseRoute.'/(?P<id>.+)', array(
			array(
				'methods' => 'PUT',
				'callback' => '\MapSVG\RegionsController::update',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)));
		register_rest_route( 'mapsvg/v1', $baseRoute.'/(?P<id>.+)', array(
			array(
				'methods' => 'DELETE',
				'callback' => '\MapSVG\RegionsController::delete',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)));
		register_rest_route( 'mapsvg/v1', $baseRoute, array(
			array(
				'methods' => 'POST',
				'callback' => '\MapSVG\RegionsController::create',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)
		));
        register_rest_route( 'mapsvg/v1', $baseRoute . '/import', array(
            array(
                'methods' => 'POST',
                'callback' => '\MapSVG\RegionsController::import',
                'permission_callback' => function ( ) {
                    return current_user_can( 'edit_posts' );
                }
            )
        ));

	}

	public function registerObjectRoutes(){
    	$baseRoute = '/objects/(?P<_collection_name>[a-zA-Z0-9-_]+)';
		register_rest_route( 'mapsvg/v1', $baseRoute, array(
			array(
				'methods' => 'GET',
				'callback' => '\MapSVG\ObjectsController::index',
                'permission_callback' => function ( ) {
                    return true;
                }
            )));
		register_rest_route( 'mapsvg/v1', $baseRoute.'/(?P<id>.+)', array(
			array(
				'methods' => 'GET',
				'callback' => '\MapSVG\ObjectsController::get',
                'permission_callback' => function ( ) {
                    return true;
                }
            )));
		register_rest_route( 'mapsvg/v1', $baseRoute.'/(?P<id>.+)', array(
			array(
				'methods' => 'PUT',
				'callback' => '\MapSVG\ObjectsController::update',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)));
		register_rest_route( 'mapsvg/v1', $baseRoute.'/(?P<id>.+)', array(
			array(
				'methods' => 'DELETE',
				'callback' => '\MapSVG\ObjectsController::delete',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)));
		register_rest_route( 'mapsvg/v1', $baseRoute, array(
			array(
				'methods' => 'DELETE',
				'callback' => '\MapSVG\ObjectsController::clear',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)));
		register_rest_route( 'mapsvg/v1', $baseRoute, array(
			array(
				'methods' => 'POST',
				'callback' => '\MapSVG\ObjectsController::create',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)
		));
		register_rest_route( 'mapsvg/v1', $baseRoute . '/import', array(
			array(
				'methods' => 'POST',
				'callback' => '\MapSVG\ObjectsController::import',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)
		));
	}

	public function registerGeocodingRoutes() {
		$baseRoute = '/geocoding';
		register_rest_route( 'mapsvg/v1', $baseRoute, array(
			array(
				'methods'  => 'GET',
				'callback' => '\MapSVG\GeocodingController::index',
                'permission_callback' => function ( ) {
                    return true;
                }
            )
		) );
	}

	public function registerSchemaRoutes(){
    	$baseRoute = '/schemas';
		register_rest_route( 'mapsvg/v1', $baseRoute, array(
			array(
				'methods' => 'GET',
				'callback' => '\MapSVG\SchemaController::index',
                'permission_callback' => function ( ) {
                    return true;
                }
            )));
		register_rest_route( 'mapsvg/v1', $baseRoute.'/(?P<id>.+)', array(
			array(
				'methods' => 'GET',
				'callback' => '\MapSVG\SchemaController::get',
                'permission_callback' => function ( ) {
                    return true;
                }
            )));
		register_rest_route( 'mapsvg/v1', $baseRoute.'/(?P<id>.+)', array(
			array(
				'methods' => 'PUT',
				'callback' => '\MapSVG\SchemaController::update',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)));
		register_rest_route( 'mapsvg/v1', $baseRoute.'/(?P<id>.+)', array(
			array(
				'methods' => 'DELETE',
				'callback' => '\MapSVG\SchemaController::delete',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)));
		register_rest_route( 'mapsvg/v1', $baseRoute.'/(?P<id>.+)', array(
			array(
				'methods' => 'POST',
				'callback' => '\MapSVG\SchemaController::create',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)
		));
	}

    public function registerMagicLinkRoutes(){
        $baseRoute = '/magiclink';
        register_rest_route( 'mapsvg/v1', $baseRoute, array(
            array(
                'methods' => 'POST',
                'callback' => '\MapSVG\MagiclinkController::create',
                'permission_callback' => function ( ) {
                    return current_user_can( 'create_users' );
                }
            )));
        register_rest_route( 'mapsvg/v1', $baseRoute, array(
            array(
                'methods' => 'DELETE',
                'callback' => '\MapSVG\MagiclinkController::delete',
                'permission_callback' => function ( ) {
                    return current_user_can( 'create_users' );
                }
            )));
    }

    public function registerPurchaseCodeRoutes(){
	    $baseRoute = '/purchasecode';
	    register_rest_route( 'mapsvg/v1', $baseRoute, array(
		    array(
			    'methods' => 'PUT',
			    'callback' => '\MapSVG\PurchasecodeController::update',
			    'permission_callback' => function ( ) {
				    return current_user_can( 'edit_posts' );
			    }
	    )));
    }

    public function registerGoogleApiRoutes(){
	    $baseRoute = '/googleapikeys';
	    register_rest_route( 'mapsvg/v1', $baseRoute, array(
		    array(
			    'methods' => 'PUT',
			    'callback' => '\MapSVG\GoogleApiKeysController::update',
			    'permission_callback' => function ( ) {
				    return current_user_can( 'edit_posts' );
			    }
	    )));
    }

	public function registerShortcodesRoutes(){
        $baseRoute = '/shortcodes';
        register_rest_route( 'mapsvg/v1', $baseRoute.'/(?P<shortcode>.+)', array(
            array(
                'methods' => 'GET',
                'callback' => '\MapSVG\ShortcodesController::get',
                'permission_callback' => function ( ) {
                    return true;
                }
            )));
    }

	public function registerSvgFileRoutes(){
		$baseRoute = '/svgfile';
		register_rest_route( 'mapsvg/v1', $baseRoute.'/download', array(
			array(
				'methods' => 'GET',
				'callback' => '\MapSVG\SVGFileController::download',
                'permission_callback' => function ( ) {
                    return true;
                }
            )));
		register_rest_route( 'mapsvg/v1', $baseRoute, array(
			array(
				'methods' => 'POST',
				'callback' => '\MapSVG\SVGFileController::create',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)));
		register_rest_route( 'mapsvg/v1', $baseRoute.'/update', array(
			array(
				'methods' => 'POST',
				'callback' => '\MapSVG\SVGFileController::update',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)));
		register_rest_route( 'mapsvg/v1', $baseRoute.'/copy', array(
			array(
				'methods' => 'POST',
				'callback' => '\MapSVG\SVGFileController::copy',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)));
		register_rest_route( 'mapsvg/v1', $baseRoute.'/reload', array(
			array(
				'methods' => 'POST',
				'callback' => '\MapSVG\SVGFileController::reload',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)));
	}

	public function registerMarkerFileRoutes(){
		$baseRoute = '/markers';
		register_rest_route( 'mapsvg/v1', $baseRoute, array(
			array(
				'methods' => 'POST',
				'callback' => '\MapSVG\MarkersController::create',
				'permission_callback' => function ( ) {
					return current_user_can( 'edit_posts' );
				}
			)));
	}

    public function registerInfoRoutes(){
        $baseRoute = '/info';
        register_rest_route( 'mapsvg/v1', $baseRoute.'/php', array(
            array(
                'methods' => 'GET',
                'callback' => '\MapSVG\InfoController::phpInfoPage',
                'permission_callback' => function ( ) {
                    return current_user_can( 'edit_posts' );
                }
            )));
    }

    public function run_old()
    {
        if($this->route[0]!='db' && isset($this->route[1]) && !empty($this->route[1])){
            $id = $this->route[1];
        }
        if(isset($this->route[2]) && $this->route[2]=='region' && (isset($this->route[3]) && !empty($this->route[3]))){
            $class = '\\MapSVG\\'.ucfirst($this->route[0]);
            $class = new $class();

            $class->setParentId($id);
        }else if($this->route[0] == 'db' && isset($this->route[1])){
            $class = "\\MapSVG\\Controller\\Dbobject";
            $class = new $class();
            $class->setTable($this->route[1]);
            if(isset($this->route[2])){
                $id = $this->route[2];
            }
        }else{
            $class = "\\MapSVG\\Controller\\".ucfirst($this->route[0]);
            require_once $class;
            $class = new $class();
        }

        $class->post = stripslashes_deep($this->post);
        $class->get  = stripslashes_deep($this->get);
        $class->json = true;

        $response = '';

        switch ($this->method) {
            case 'GET':
                if(isset($id)){
                    $response = $class->get($id);
                }else{
                    $response = $class->index($this->get);
                }
                break;
            case 'POST':
	            mapsvg_check_nonce();

	            if($this->route[0]=='svgfile'){
                    $action = $this->route[1];
                    $response = $class->$action();
                }else{
                    $response = $class->create($this->post);
                }
                break;
            case 'PUT':
	            mapsvg_check_nonce();

	            $response = $class->update($id, $this->post);
                break;
            case 'DELETE':
	            mapsvg_check_nonce();

	            if($id){
                    $response = $class->delete($id);
                }
                break;
            default:
//                $this->error($this->route);
                break;
        }

        return $response;
    }




}
