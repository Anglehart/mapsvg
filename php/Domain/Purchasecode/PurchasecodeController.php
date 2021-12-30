<?php

namespace MapSVG;

/**
 * Controller Class for purchase code.
 * @package MapSVG
 */
class PurchasecodeController extends Controller {

	/**
	 * Checks and updates purchase code in the database
	 * @param $request
	 *
	 * @return \WP_REST_Response
	 */
	public static function update($request){

		$code = $request['purchase_code'];

		$response = Remote::get('https://mapsvg.com/wp-updates/?action=info&purchase_code='.$code);

		if($response && isset($response['body'])){
			$data = json_decode($response['body'], true);
			if(isset($data['error'])){
				$response['error_message'] = $data['error'];
				unset($response['body']);
			}
		}

		if($response && !isset($response['error_message'])){
			Options::set('purchase_code', $code);
			return self::render([], 200);
		} else {
			return self::render($response, 400);
		}
	}
}