<?php


namespace MapSVG;

/**
 * Class that gets data from a remote server via one of available methods: cURL or file_get_contents()
 * @package MapSVG
 */
class Remote {
	public static function get($url) {
		if (function_exists('curl_exec')){
			$conn = curl_init($url);
			curl_setopt($conn, CURLOPT_SSL_VERIFYPEER, true);
			curl_setopt($conn, CURLOPT_FRESH_CONNECT,  true);
			curl_setopt($conn, CURLOPT_RETURNTRANSFER, 1);
			$url_get_contents_data = (curl_exec($conn));
			curl_close($conn);
			$response = array("body"=>$url_get_contents_data, "status"=>"OK");
			return $response;
		} else if(ini_get('allow_url_fopen')){
			$url_get_contents_data = file_get_contents($url);
			$response = array("body"=>$url_get_contents_data, "status"=>"OK");
			return $response;
		}else{
			$response = array("body"=>"","status"=>"PHP_SETTINGS_ERROR", "error_message"=>'Can\'t connect to the remote server. Please enable "allow_url_fopen" option in php.ini settings or install cURL.');
			return $response;
		}
	}
}