<?php

namespace MapSVG;

/**
 * Logger class that sends the data from PHP to browser console.
 */
class Logger {
	static $clockwork;

	/**
	 * Initialize the Clockwork library
	 */
	public static function init(){
		if(MAPSVG_DEBUG) {
			self::$clockwork = \Clockwork\Support\Vanilla\Clockwork::init( [
				'api'              => '/wp-json/mapsvg/v1/clockwork/',
				'register_helpers' => true
			] );
		}
	}

	/**
	 * Save the logged data for Clockwork. The data becomes accessible by an API URL
	 * /wp-json/mapsvg/v1/clockwork/
	 */
	public static function finish(){
		if(MAPSVG_DEBUG) {
			return self::$clockwork->requestProcessed();
		}
	}

	/**
	 * Return metadata for Clockwork
	 */
	public static function getMetaData($request){
		if(MAPSVG_DEBUG) {
			return self::$clockwork->getMetadata( $request );
		}
	}

	public static function logger(){
		return self::$clockwork;
	}

	/**
	 * Add a log to Clockwork
	 */
	public static function error($data, $label = null){
		if(MAPSVG_DEBUG) {
			clock($data);
		}
	}

	/**
	 * Add a log to Clockwork
	 */
	public static function info($data, $label = null){
		if(MAPSVG_DEBUG) {
			clock($data);
		}
	}

	/**
	 * Add a database query, with timing - to Clockwork logs
	 */
	public static function addDatabaseQuery($query, $time){
		if(MAPSVG_DEBUG) {
			clock()->addDatabaseQuery( $query, null, ( microtime( true ) - $time ) * 1000 );
		}
	}
}