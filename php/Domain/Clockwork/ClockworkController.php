<?php

namespace MapSVG;


/**
 * Clockwork Controller Class.
 * Provides logs data to the browser
 */
class ClockworkController extends Controller {

	public static function index($request) {
		return new \WP_REST_Response(Logger::getMetaData($request['params']));
	}
}
