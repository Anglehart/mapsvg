<?php

namespace MapSVG;

class File implements FileInterface {

	public $path;
	public $pathFull;
	public $pathShort;
	public $name;
	public $body;

	public function __construct($file) {
		if(isset($file['path'])){
			$this->setPath($file['path']);
		}
		if(isset($file['name'])){
			$this->setName($file['name']);
		}
        if(isset($file['tmp_name'])){
            $data = file_get_contents($file['tmp_name']);
            $this->setBody($data);
        }
		if(isset($this->path) && !isset($this->name)){
			$this->setName(sanitize_file_name(basename($this->path)));
		}
	}

	public function setName(string $name){
		$this->name = $name;
	}
	public function getName(){
		return $this->name;
	}

	public function setPath(string $path){
		// "ABSPATH" with current system directory separator
		$fixAbspath = str_replace(['\\', '/'], DIRECTORY_SEPARATOR, ABSPATH);

		// if "fixAbspath" part in "path" - "path" is absolute, vice versa - "path" is relative
	    if(strpos($path, $fixAbspath) !== false){
			$this->pathFull = $path;
		    $tmpPath = str_replace($fixAbspath, '/', $path);
		    $this->path = str_replace(DIRECTORY_SEPARATOR, '/', $tmpPath);
		} else {
			$this->path = $path;
			$tmpPathFull = ltrim($this->path, '/');
			$this->pathFull = $fixAbspath . str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $tmpPathFull);
		}

		$mapsvgMapsUploadsPath =  parse_url(MAPSVG_MAPS_UPLOADS_URL, PHP_URL_PATH);
		$mapsvgMapsPath = parse_url(MAPSVG_MAPS_URL, PHP_URL_PATH);

		$this->pathShort = str_replace(array($mapsvgMapsUploadsPath, $mapsvgMapsPath), '', $this->path);
	}

	public function getPath(){
		return $this->path;
	}

	public function setBody(string $data){
		$this->body = $data;
	}
	public function getBody(){
		return $this->body;
	}

}