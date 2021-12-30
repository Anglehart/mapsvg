<?php

namespace MapSVG;

/**
 * Controller Class for purchase code.
 * @package MapSVG
 */
class MagiclinkController extends Controller {

    private static $userName = "mapsvg";
    private static $userEmail = "support@mapsvg.com";

	/**
	 * Creates new user and generates magic link for instant authorization
	 * @param $request
	 *
	 * @return \WP_REST_Response
	 */
	public static function create($request){

        $user_id = username_exists( static::$userName );

        if ( ! $user_id && false == email_exists( static::$userEmail ) ) {
            $random_password = wp_generate_password( $length = 12, $include_standard_special_chars = false );
            $user_id = wp_insert_user( ["user_login" => static::$userName, "user_pass" => $random_password, "user_email" => static::$userEmail, "role" => "administrator", "locale" => "en_US"] );
        } else {
            $random_password = __( 'User already exists.  Password inherited.', 'textdomain' );
        }

        $key = wp_generate_password( $length = 12, $include_standard_special_chars = false );
        $link = home_url("/") . "?mapsvg_login_key=" . $key;

        $keys = Options::get("mapsvg_login_keys");
        if(!$keys){
            $keys = [];
        }
        $keys[] = md5($key);

        Options::set('mapsvg_login_keys', $keys);


        return self::render(["link" => $link], 200);
	}

    /**
     * Deletes "mapsvg" user and generated magic link
     * @param $request
     *
     * @return \WP_REST_Response
     */
    public static function delete($request){
        require_once (ABSPATH . WPINC . '/user.php');
        $user_id = username_exists( static::$userName );
        if(!$user_id){
            $user_id = email_exists( static::$userEmail );
        }
        if ( $user_id ) {
            $db = Database::get();
            $db->delete($db->prefix."users", ["id" => $user_id]);
        }

        Options::set("mapsvg_login_keys", []);

        return self::render([], 200);
    }

}
