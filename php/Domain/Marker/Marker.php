<?php

namespace MapSVG;

class Marker extends File {

	public $default;

//	/**
//	 * Get the list all marker images paths from /mapsvg/markers folder
//	 * @return array
//	 */
//	public static function find($options = null){
//
//		$img_files = @scandir(MAPSVG_PINS_DIR);
//		if($img_files){
//			array_shift($img_files);
//			array_shift($img_files);
//		}
//		$safeMarkerImagesURL = self::safeURL(MAPSVG_PINS_URL);
//		$markerImages = array();
//		$allowed =  array('gif','png' ,'jpg','jpeg','svg');
//		foreach($img_files as $p){
//			$ext = pathinfo($p, PATHINFO_EXTENSION);
//			if(in_array($ext,$allowed) )
//				$markerImages[] = array("url"=>$safeMarkerImagesURL.$p, "file"=>$p, "folder"=>'default');
//		}
//
//		$img_files2 = @scandir(MAPSVG_MAPS_UPLOADS_DIR . "/markers");
//		if($img_files2){
//			array_shift($img_files2);
//			array_shift($img_files2);
//			$safeMarkerImagesURL2 = self::safeURL(MAPSVG_MAPS_UPLOADS_URL .'markers/');
//			foreach($img_files2 as $p2){
//				$ext = pathinfo($p2, PATHINFO_EXTENSION);
//				if(in_array($ext, $allowed) )
//					$markerImages[] = array("url"=>$safeMarkerImagesURL2.$p2, "file"=>$p2, "folder"=>'uploads/markers');
//			}
//
//		}
//
//
//		return $markerImages;
//	}
//
//
//	static function checkUploadDir(){
//		$mapsvg_error = false;
//		if(!file_exists(MAPSVG_MAPS_UPLOADS_DIR)){
//			if(!wp_mkdir_p(MAPSVG_MAPS_UPLOADS_DIR))
//				$mapsvg_error = "Unable to create directory ".MAPSVG_MAPS_UPLOADS_DIR.". Is its parent directory writable by the server?";
//		}else{
//			if(!wp_is_writable(MAPSVG_MAPS_UPLOADS_DIR))
//				$mapsvg_error = MAPSVG_MAPS_UPLOADS_DIR." is not writable. Please change folder permissions.";
//		}
//		return $mapsvg_error;
//	}
//
//	static function create($file) {
//
//		mapsvg_check_nonce();
//
//		$mapsvg_error = mapsvg_check_upload_dir();
//
//		if(!$mapsvg_error){
//
//			if (isset($_FILES['file'])) {
//
//				if (!file_exists(MAPSVG_MAPS_UPLOADS_DIR . "/markers")) {
//					mkdir(MAPSVG_MAPS_UPLOADS_DIR . "/markers", 0777, true);
//				}
//				if(move_uploaded_file($_FILES['file']['tmp_name'], MAPSVG_MAPS_UPLOADS_DIR . "/markers/".$_FILES['file']['name'])){
//					$marker = array(
//						'url' => MAPSVG_MAPS_UPLOADS_URL."markers/".$_FILES['file']['name'],
//						'file' => $_FILES['file']['name'],
//						'folder' => 'uploads/markers',
//						'default' => false
//					);
//
//					echo json_encode($marker);
//				} else {
//					echo '{"error": "Can\'t write the file"}';
//				}
//				exit;
//			} else {
//				echo '{"error": "No files to upload"}';
//			}
//
//		}
//	}
//	//add_action('wp_ajax_mapsvg_marker_upload', 'mapsvg_marker_upload');
//
//	/**
//	* Replace http:// and https:// with "//"
//	*
//	* @param $url
//	* URL
//	*
//	* @return string
//	* Formatted URL
//	*/
//	private static function safeURL($url){
//		if(strpos("http://",$url) === 0 || strpos("https://",$url) === 0){
//			$s = explode("://", $url);
//			$url = "//".array_pop($s);
//		}
//		return $url;
//	}

}