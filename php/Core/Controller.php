<?php
namespace MapSVG;

/**
 * Core Controller class used to implement actual controllers.
 * @package MapSVG
 */
class Controller {

	/**
	 * @param \WP_REST_Request|array $request
	 * @param int $status
	 *
	 * @return \WP_REST_Response
	 */
	public static function render($request, $status = 200){
		Logger::finish();
		return new \WP_REST_Response($request, $status);
	}

}