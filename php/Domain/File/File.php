<?php

namespace MapSVG;

class File implements FileInterface {

	public $relativeUrl;
	public $serverPath;
	public $pathShort;
	public $name;
	public $body;

	public function __construct($file) {
		if(isset($file['relativeUrl'])){
			$this->setRelativeUrl($file['relativeUrl']);
            $path = $this->convertUrlToServerPath($this->relativeUrl);
            $this->setServerPath($path);
		} elseif(isset($file['serverPath'])){
			$this->setServerPath($file['serverPath']);
			$this->updateRelativeUrl();
		}
		if(isset($file['name'])){
			$this->setName($file['name']);
		}
        if(isset($file['tmp_name'])){
            $data = file_get_contents($file['tmp_name']);
            $this->setBody($data);
        }
        if(!function_exists('wp_get_current_user')) {
            include_once(ABSPATH . "wp-includes/pluggable.php");
        }
		if(isset($this->relativeUrl) && !isset($this->name)){
			$this->setName(sanitize_file_name(basename($this->relativeUrl)));
		}
	}

	public function setName($name){
		$this->name = $name;
	}
	public function getName(){
		return $this->name;
	}

	public function convertServerPathToUrl($path){
        if(strpos($path, MAPSVG_MAPS_DIR) !== false){
            $expl = $this->getLastTwoFolders(MAPSVG_MAPS_DIR, DIRECTORY_SEPARATOR);
            list($junk,$important_stuff) = explode($expl, $path);
            $rel = parse_url(MAPSVG_MAPS_URL);
            $important_stuff = ltrim(str_replace("\\","/",$important_stuff), "/");
            return $rel["path"].$important_stuff;
        } else {
            $expl = $this->getLastTwoFolders(MAPSVG_UPLOADS_DIR, DIRECTORY_SEPARATOR);
            list($junk,$important_stuff) = explode($expl, $path);
            $important_stuff = ltrim(str_replace("\\","/",$important_stuff), "/");
            $rel = parse_url(MAPSVG_UPLOADS_URL);
            return $rel["path"].$important_stuff;
        }
    }

    protected function getLastTwoFolders($path, $separator){
        $parts = explode($separator, $path);
        $total = count($parts);
        $res = $parts[$total-2] . $separator . $parts[$total-1];
        return $res;
    }

	public function convertUrlToServerPath($url){
        $rel = parse_url(MAPSVG_MAPS_URL);
	    if(strpos($url, $rel["path"]) !== false){
            $expl = $this->getLastTwoFolders(MAPSVG_MAPS_DIR, DIRECTORY_SEPARATOR);
            list($junk,$important_stuff) = explode($expl, $url);
            $important_stuff = str_replace("/",DIRECTORY_SEPARATOR,$important_stuff);
            return MAPSVG_MAPS_DIR.$important_stuff;
        } else {
            $expl = $this->getLastTwoFolders(MAPSVG_UPLOADS_DIR, DIRECTORY_SEPARATOR);
            list($junk,$important_stuff) = explode($expl, $url);
            $important_stuff = str_replace("/",DIRECTORY_SEPARATOR,$important_stuff);
            return MAPSVG_UPLOADS_DIR.$important_stuff;
        }
    }

	public function setServerPath($path){
        $this->serverPath = $path;
	}

	public function setRelativeUrl($url){
        $this->relativeUrl = $url;
        $uploadsRelativeUrl =  parse_url(MAPSVG_UPLOADS_URL, PHP_URL_PATH);
        $mapsRelativeUrl = parse_url(MAPSVG_MAPS_URL, PHP_URL_PATH);
        $this->pathShort = str_replace(array($uploadsRelativeUrl, $mapsRelativeUrl), '', $this->relativeUrl);
        $rel = parse_url(MAPSVG_UPLOADS_URL);
        if(strpos($this->relativeUrl, $rel["path"]) !== false){
            $this->pathShort = "uploads/" . $this->pathShort;
        }
    }

    public function updateRelativeUrl(){
        $url = $this->convertServerPathToUrl($this->serverPath);
        $this->setRelativeUrl($url);
    }

	public function getRelativeUrl(){
		return $this->relativeUrl;
	}

	public function setBody($data){
		$this->body = $data;
	}
	public function getBody(){
		return $this->body;
	}

}
