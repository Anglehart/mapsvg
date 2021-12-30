<?php

namespace MapSVG;

class MapsRepository extends Repository {

	public static $className = 'Map';

	/**
	 * Returns table name for the ObjectDynamic
	 * @return string
	 */
	public function getTableName() {
		return $this->db->mapsvg_prefix . "maps";
	}

	/**
	 * Returns short table name for the ObjectDynamic
	 * @return string
	 */
	public function getTableNameShort() {
		return 'maps';
	}

	/**
	 * Formats Map parameters for the insertion to a database.
	 *
	 * @param $data - Raw data received from a client
	 * @param bool $convert - ?
	 *
	 * @return array - Array of formatted parameters
	 */
	public function encodeParams($data, $convert = false)
    {

        if (is_object($data) && method_exists($data, 'getData')) {
            $data = $data->getData();
        }

        if (isset($data['optionsBroken'])) {
            unset($data['optionsBroken']);
            unset($data['options']);
        } else {
            if (!$data['options']) {
                // Don't save broken JSON
                unset($data['options']);
            } else {
                if (!is_string($data['options'])) {
                    $data['options'] = json_encode($data['options'], JSON_UNESCAPED_UNICODE);
                }
            }
        }

		return $data;
	}


	public function decodeParams($data){
		$data = (array)$data;
		if(isset($data['id'])){
			$data['id'] = (int)$data['id'];
		}
		if(isset($data['options'])){
			$tryDecode = json_decode($data['options'], true);
			if(!$tryDecode){
			    $data['optionsBroken'] = true;
            } else {
			    $data['options'] = $tryDecode;
            }
		}
		return $data;
	}

//	/**
//	 * Formats Map parameters after retrieving from a database.
//	 *
//	 * @param $data - ata received from a database
//	 *
//	 * @return array - Array of formatted parameters
//	 */
//	public function decodeParams(array $data) {
//		if(is_string($data['options'])){
//			$data['options'] = json_decode($data['options']);
//		}
//
//		return $data;
//	}

	/**
	 * Creates a new map.
	 * @param array $data - map options
	 * @return Map
	 */
	public function create($data, $skipRepoCreate = false){

		$map = parent::create($data);

		if(!$skipRepoCreate){
            $map->regions = RegionsRepository::createRepository('regions_' . $map->id);
            $map->objects = ObjectsRepository::createRepository('objects_' . $map->id);
            $map->setRegionsTable();
        }

		return $map;
	}

	/**
	 * Updates map options and regions table.
	 * @param array $data - map options
	 * @return Map
	 */
	public function update( $map ) {
		parent::update( $map );
	}

	/**
	 * Updates map options and regions table from SVG file.
	 * @param array $data - map options
	 * @param boolean $updateTitles
	 * @return Map
	 */
	public function updateFromSvg( $map, $updateTitles = null) {
		parent::update( $map );
		$prefix = isset($map->options['regionPrefix']) ? $map->options['regionPrefix'] : '';

		/** @var $map Map */
		$map->setRegionsTable($prefix, $updateTitles);
}

	/**
	 * Finds a map by ID.
	 *
	 * @param $id
	 *
	 * @return Map
	 */
	public function findById($id){
		$map = parent::findById($id);
		return $map;
	}

	/**
	 * Copies map and all related things: Regions table, Objects table, SVG File.
	 *
	 * @param int $id - ID of the map that needs to be copied
	 * @param array $newData - Array of new parameter values for the copied map. Used to pass new Map title.
	 *
	 * @return mixed
	 * @throws \Exception
	 */
	public function copy($id, $newData){

//		require_once MAPSVG_PLUGIN_DIR . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'Domain'. DIRECTORY_SEPARATOR . 'SVGFile' . DIRECTORY_SEPARATOR . 'SVGFile.php';

		$newData['title'] = stripslashes(strip_tags($newData['title']));
		$map = $this->findById($id);

		// Copy SVG file
        $filesRepo = new SVGFileRepository();
        $file = new SVGFile(["relativeUrl" => $map->options['source']]);

		try {
            $newFile = $filesRepo->copy($file);
			$map->options['source'] = $newFile->relativeUrl;
			$map->setSvgFilePath($newFile->relativeUrl);
		}catch (\Exception $err){
			throw new \Exception('Can\'t copy the SVG file.', 400);
		}

		// If SVG file was copied, create new map in DB
		$newMapData = $map->getData();
		$newMapData['title'] = $newData['title'];
		$newMapData['options']['title'] = $newData['title'];
		unset($newMapData['id']);
		$newMap = $this->create($newMapData,true);

		if(isset($newMapData['options']['css'])){
			$mapUpdate = array('id'=> $newMap->id, 'options'=>$newMapData['options']);
			$mapUpdate['options']['css'] = str_replace('#mapsvg-map-'. $map->id, '#mapsvg-map-'.$newMap->id, $newMapData['options']['css']);
//			$mapUpdate['options']['css'] = str_replace('#mapsvg-map-'. $map->id, '{{mapsvg_gallery '.$newMap->id, $newMapData['options']['css']);
			$this->update($mapUpdate);
		}

		$this->copyTables($map, $newMap);

		return $newMap;
	}

	/**
	 * Copies Regions and Objects tables from one map to another
	 *
	 * @param $fromMap
	 * @param $toMap
	 *
	 * @return boolean
	 */
	public function copyTables($fromMap, $toMap)
	{
		// Copy regions table
		$regionsSchemaData = $fromMap->regions->getSchema()->getData();
		$regionsSchemaData['name'] = 'regions_'.$toMap->id;
		$schemaRepo = new SchemaRepository();
		$schema = new Schema($regionsSchemaData);
		$newRegionsSchema = $schemaRepo->create($schema->getData());

		$tableNameRegionsOld = $this->db->mapsvg_prefix . $fromMap->regions->getSchema()->name;
		$tableNameRegionsNew = $this->db->mapsvg_prefix . $newRegionsSchema->name;

		$fields = $this->db->get_results("SHOW COLUMNS FROM ".$tableNameRegionsOld);
		foreach($fields as $field){
            $regionFieldNames[] = $field->Field;
        }
        $regionFieldNames = "`".implode("`,`", $regionFieldNames)."`";

		$this->db->query("REPLACE INTO ".$tableNameRegionsNew." (".$regionFieldNames.") SELECT ".$regionFieldNames." FROM ".$tableNameRegionsOld);

		// Copy objects table
		$objectsSchemaData = $fromMap->objects->getSchema()->getData();
		$objectsSchemaData['name'] = 'objects_'.$toMap->id;
		// Fix missing auto_increment
        foreach($objectsSchemaData["fields"] as $key=>$field){
            if($field->name === "id" && !isset($field->auto_increment) && $field->auto_increment !== true){
                $field->auto_increment = true;
                $objectsSchemaData["fields"][$key] = $field;
            }
        }
        $schema = new Schema($objectsSchemaData);
		$newObjectsSchema = $schemaRepo->create($schema->getData());

		$tableNameObjectsOld = $this->db->mapsvg_prefix . $fromMap->objects->getSchema()->name;
		$tableNameObjectsNew = $this->db->mapsvg_prefix . $newObjectsSchema->name;

//        $this->db->query("ALTER TABLE ".$tableNameObjectsNew." CHANGE COLUMN `id` `id` INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 1");

        $fields = $this->db->get_results("SHOW COLUMNS FROM ".$tableNameObjectsOld);
        foreach($fields as $field){
            $fieldNames[] = $field->Field;
        }
		$fieldNames = "`".implode("`,`", $fieldNames)."`";

		$this->db->query("INSERT INTO ".$tableNameObjectsNew." (".$fieldNames.") SELECT ".$fieldNames." FROM ".$tableNameObjectsOld);
		$this->db->query("INSERT INTO ".$this->db->mapsvg_prefix."r2o  (objects_table,regions_table,object_id,region_id) SELECT '".$newObjectsSchema->name."', '".$newRegionsSchema->name."', _r2o.object_id, _r2o.region_id FROM ".$this->db->mapsvg_prefix."r2o _r2o WHERE _r2o.objects_table='".$fromMap->objects->getSchema()->name."' AND _r2o.regions_table='".$fromMap->regions->getSchema()->name."'");

        $mapUpdate = array('id'=> $toMap->id, 'options'=>$toMap->options);
        if(!isset($mapUpdate["options"]["database"])){
            $mapUpdate["options"]["database"] = [];
        }
        $mapUpdate["options"]["database"]["regionsTableName"] = $newRegionsSchema->name;
        $mapUpdate["options"]["database"]["objectsTableName"] = $newObjectsSchema->name;
        $this->update($mapUpdate);

        return true;
	}

	public function fillRegions(){
		$this->regions = \MapSVG\Region::find(null, [
			'perpage' => 0,
			'sortBy' => ( isset($options['menu']) && $options['menu']['source'] == 'regions' ? $options['menu']['sortBy'] : ( isset($options['menu']) && strpos($options['menu']['source'],'geo-cal') !== false ? 'title' : 'id' ) ),
			'sortDir' => isset($options['menu']) &&  $options['menu']['source'] == 'regions' ? $options['menu']['sortDirection'] : 'asc'
		]);
		//$this->regionsSchema = \MapSVG\Schema;
	}

	public function fillObjects(){
		$this->objects = \MapSVG\ObjectDynamic::find(null, [
			'perpage' => isset($options['database']) && (int)$options['database']['pagination']['on'] ? $options['database']['pagination']['perpage'] : 0,
			'sortBy' => ( isset($options['menu']) && $options['menu']['source'] == 'regions' ? $options['menu']['sortBy'] : ( isset($options['menu']) && strpos($options['menu']['source'],'geo-cal') !== false ? 'title' : 'id' ) ),
			'sortDir' => isset($options['menu']) &&  $options['menu']['source'] == 'regions' ? $options['menu']['sortDirection'] : 'asc'
		]);
		//$this->objectsSchema = \MapSVG\Schema;
	}

	function serializeCorrector($serialized_string){
		// at first, check if "fixing" is really needed at all. After that, security checkup.
		if ( @unserialize($serialized_string) !== true &&  preg_match('/^[aOs]:/', $serialized_string) ) {
			$serialized_string = preg_replace_callback( '/s\:(\d+)\:\"(.*?)\";/s',    function($matches){return 's:'.strlen($matches[2]).':"'.$matches[2].'";'; },   $serialized_string );
		}
		return $serialized_string;
	}

	function getMetaOptions($map_id){
		global $wpdb;
		$r = $wpdb->get_row("
                  SELECT meta_value FROM ".$wpdb->postmeta." WHERE post_id='".$map_id."' AND meta_key = 'mapsvg_options'
                ");
		if($r){
			$data = unserialize($this->serializeCorrector($r->meta_value));
		} else {
			$data = array();
		}
		return $data;
	}

	/**
	 * Deletes a map
	 * @param integer $id
	 */
	public function delete($id){

		return $this->db->delete($this->getTableName(), array('id' => $id));
	}

	public function deleteAllRemovedOneDayAgo(){

      return $this->db->query("DELETE FROM ".$this->getTableName()." WHERE status=0 AND statusChangedAt <= DATE_SUB(NOW(), INTERVAL 2 DAY)");
    }

}
