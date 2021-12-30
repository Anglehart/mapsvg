<?php


namespace MapSVG;


class MapV2 extends Model {

	public static $slugOne  = 'map';
	public static $slugMany = 'maps';

	/* @var string $version Number of MapSVG version the map was created in */
	public $version = MAPSVG_VERSION;

	/* @var string $options Map options */
	public $options;

	public function setOptions($options) {
		$this->options = $options;
	}

}