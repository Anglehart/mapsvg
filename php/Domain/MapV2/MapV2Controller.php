<?php


namespace MapSVG;


class MapV2Controller extends Controller {

	public static function getRepository($request){
		return new MapsV2Repository();
	}

	public static function get($request){
		$repository = new MapsV2Repository();
		$response   = array();
		$map = $repository->findById($request['id']);
		$response['map'] = $map;
		return $response;
	}
}