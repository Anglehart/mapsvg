<?php


namespace MapSVG;

/**
 * Geocoding Class.
 * Handles requests to Google Geocoding API.
 */
class Geocoding {

	public $geocoding_quota_per_second;
	private $permanent_error;
	private $apiKey;

	public function __construct($apiKey = ''){
		$this->geocoding_quota_per_second = 1;
		$this->apiKey = $apiKey;
		$this->permanent_error = '';
	}

	public function get($address, $return_as_array = true, $convert_latlng_to_address = true) {

		if(empty($address)){
			return false;
		}

		if($this->permanent_error !== ''){
			return $return_as_array ? json_decode($this->permanent_error, true) : $this->permanent_error;
		}

		if(!$this->apiKey){
			$this->apiKey = Options::get('google_geocoding_api_key');
			if(!$this->apiKey){
				$this->apiKey = Options::get('google_api_key');
			}
		}
		$address_is_coordinates = false;
		$reg_latlng = "/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/";
		if(preg_match($reg_latlng, $address)){
			$address_is_coordinates = true;
			$coords = explode(",", $address);
			$coords[0] = trim($coords[0]);
			$coords[1] = trim($coords[1]);
			$coords_item = array(
				"geometry" => array("location" => array("lat"=>$coords[0], "lng"=>$coords[1])),
				"formatted_address" => $address,
				"address_components" => array()
			);
		}

		if((!$address_is_coordinates || $convert_latlng_to_address === true) && $this->apiKey) {
			if ( $this->geocoding_quota_per_second > 49 ) {
				sleep( 1 );
				$this->geocoding_quota_per_second = 1;
			}
			$address = urlencode( $address );
			// TODO if $_GET['language'] is not set then read lang from the map settings (if it's import from CSV)
			$lang = isset($_REQUEST['language']) ? $_REQUEST['language'] : 'en';
			$country = isset($_REQUEST['country']) ? '&components=country:'.$_REQUEST['country'] : '';

			$data    = Remote::get( 'https://maps.googleapis.com/maps/api/geocode/json?key=' . $this->apiKey . '&address=' . $address . '&sensor=true&language=' . $lang . $country);
			if ( $data && !isset($data['error_message'])) {
				$response = json_decode( $data['body'], true );
				if ( $response['status'] === 'OVER_DAILY_LIMIT' || $response['status'] === 'OVER_QUERY_LIMIT' ) {
					$this->permanent_error = $data;
				} else {
					if($address_is_coordinates){
						array_unshift($response['results'], $coords_item);
					}
				}
			} else {
				$response = $data;
			}
		} else {
			if($address_is_coordinates){
				$response = array(
					"status"  => "OK",
					"results" => array($coords_item)
				);
			} else {
				$response = array('status'=>'NO_API_KEY', 'error_message' => 'No Google Geocoding API key. Add the key on MapSVG start screen.');
			}
		}
		return $return_as_array ? $response : json_encode($response);
	}
}