<?php

namespace MapSVG;
require_once ('Marker.php');

class MarkersController extends Controller {
	public static function create($request) {
		$repository = new MarkersRepository();
		$files = $request->get_file_params();
		$file = $repository->upload($files['file']);
		return self::render(array('marker' => $file));
	}
}