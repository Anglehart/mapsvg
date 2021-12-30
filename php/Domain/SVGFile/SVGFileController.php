<?php

namespace MapSVG;

class SVGFileController extends Controller {

	/**
	 * Forces generated SVG file download in the browser
	 * @param $request
	 *
	 * @return array|string[]
	 * @throws \Exception
	 */
	public static function download($request){

		$url = MAPSVG_MAPS_UPLOADS_URL.'mapsvg.svg?nocache='.rand();
		$response = Remote::get($url);

		if($response && !isset($response['error_message'])){
			header('Content-type: image/svg+xml');
			header("Content-Disposition: attachment; filename=mapsvg.svg");
			echo $response['body'];
		}else {
			echo json_encode( $response );
			die();
		}
	}

	/**
	 * Uploads an SVG file.
	 * @param $request
	 * @return \WP_REST_Response
	 */
	public static function create($request){
        $files = $request->get_file_params();
		$filesRepo = new SVGFileRepository();
		$file = new SVGFile($files['file']);
		$file = $filesRepo->create($file);
		return self::render(array('file' => array('name' => $file->name, 'path'=>$file->path)));
	}

	/**
	 * Updates an SVG file
	 * @param $request
	 *
	 * @return \WP_REST_Response
	 * @throws \Exception
	 */
	public static function update($request){
        $files = $request->get_file_params();
		$filesRepo = new SVGFileRepository();
		$file = new SVGFile($files['file']);
		$filesRepo->save($file);
		static::updateLastChanged($file);

		return self::render(array('status'=>'OK'));
	}

	/**
	 * Copies an SVG file
	 * @param $request
	 *
	 * @return \WP_REST_Response
	 * @throws \Exception
	 */
	public static function copy($request){
		$filesRepo = new SVGFileRepository();
		$file = new SVGFile($request['file']);
		$newFile = $filesRepo->copy($file);
		return self::render(array('file' => $newFile));
	}

	/**
	 * Updates "lastChanged" timestamp for all maps created from the provided SVG file.
	 * @param $file
	 * @param $updateTitles
	 */
	private static function updateLastChanged($file, $updateTitles = null){
		$mapsRepo = new MapsRepository();
		$query = new Query(array('filters'=> array('svgFilePath'=>$file->path)));
		$maps = $mapsRepo->find($query);
		foreach($maps as $map){
			/** @var $map Map */
			$map->update(array('svgFileLastChanged'=>$file->lastChanged()));
			$mapsRepo->updateFromSvg($map, $updateTitles);
		}
	}

	/**
	 * Updates "lastChanged" timestamp for all maps created from the provided SVG file.
	 * @param $request
	 *
	 * @return \WP_REST_Response
	 */
	public static function reload($request){
		$file = new SVGFile($request['file']);
		$updateTitles = $request['updateTitles'] === 'true';
		static::updateLastChanged($file, $updateTitles);
		return self::render(array('file' => $file));
	}

}