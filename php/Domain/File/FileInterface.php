<?php


namespace MapSVG;


interface FileInterface {
	public function setName(string $name);
	public function getName();
	public function setPath(string $path);
	public function getPath();
	public function setBody(string $data);
	public function getBody();
}