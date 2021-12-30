<?php


namespace MapSVG;


class MapsV2Repository extends MapsRepository {

	public static $className = 'MapV2';

	/**
	 * Finds a mapV2 by ID.
	 *
	 * @param $id
	 *
	 * @return bool|ObjectDynamic
	 */
	public function findById($id){

		$data = $this->db->get_row("SELECT * FROM `" . $this->getTableName() . "` WHERE id='" . $id . "'", ARRAY_A);

		$data['options'] = $this->db->get_var("SELECT post_content FROM ".$this->db->posts." WHERE ID=".$id);

		if($data){
			$data = $this->decodeParams($data);
			$object = $this->newObject($data);
			return $object;
		} else {
			return false;
		}
	}

	/**
	 * Formats Map parameters for the insertion to a database.
	 *
	 * @param $data - Raw data received from a client
	 * @param bool $convert - ?
	 *
	 * @return array - Array of formatted parameters
	 */
	public function encodeParams($data, $convert = false) {

		if(method_exists($data, 'getData')){
			$data = $data->getData();
		}

		return $data;
	}

	public function decodeParams($data){
		$data = (array)$data;
		if(isset($data['id'])){
			$data['id'] = (int)$data['id'];
		}
		return $data;
	}
}