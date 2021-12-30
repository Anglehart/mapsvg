<?php

namespace MapSVG;

class Upgrade {

	private $db;

	public function __construct() {
		$this->db = Database::get();
		$this->charset = "default character set utf8\ncollate utf8_unicode_ci";

    }

    public function upgradeMapToV6(){
        $this->v6AddR2oTable();
        $this->v6AddSettingsTable();
        $this->v6AddMapsTable();
        $this->v6UpgradeSchemaTable();
        $this->copyDbAndRegionsTables();
        $this->v6RenameFields();
    }

    public function upgradeMapToV3()
    {
        $this->v3AddSchemaTable();
        $this->v3AddR2dTable();
    }



    function getOldOptions(){
		return $this->db->get_results("
            SELECT meta_value FROM ".$this->db->postmeta." WHERE meta_key = 'mapsvg_options'
        ");
	}

	/**
	 * [Deprecated]
	 *
	 * Get outdated maps that need to be updated
	 * @return array
	 */
	function getOutdated(){
		$r = $this->db->get_results("
            SELECT t.pid as id, t.ver as version FROM (SELECT p.ID as pid, pm.meta_value as ver FROM ".$this->db->posts." p
            LEFT JOIN ".$this->db->postmeta." pm ON pm.post_id = p.ID AND pm.meta_key = 'mapsvg_version'
            WHERE p.post_type='mapsvg') t WHERE t.ver != '".MAPSVG_VERSION."' OR t.ver IS NULL
        ");

		$maps_outdated = array();

		if($r)
			foreach ( $r as $other_version ){
				if($other_version->version == null || version_compare($other_version->version, '2.0.0', '<')){
					$maps_outdated[$other_version->id] = $other_version->version ? $other_version->version : '1.6.4' ;
				}
			}


		return $maps_outdated;
	}

	/**
	 * [Deprecated]
	 *
	 * Upgrade outdated maps
	 *
	 * @param $maps
	 * List of maps to be upgraded
	 *
	 * @return int
	 * Number of updated maps
	 */
	function updateOutdatedMaps($maps){
		$i = 0;
		if($maps)
			foreach($maps as $id=>$version){
				if($version == null || version_compare($version,'2.0.0','<'))
					if(updateMapTo2($id))
						$i++;
			}
		return $i;
	}

	/**
	 * Upgrade map to version 2.0
	 *
	 * @param $id
	 * Map ID
	 *
	 * @return bool
	 * Returns true if the map was updated
	 */
	function updateMapTo2($id){
		$d = get_post_meta($id,'mapsvg_options');
		if($d && isset($d[0]['m']))
			$data = $d[0]['m'];
		else
			return false;

		$events = array();
		if(isset($d[0]['events']))
			foreach($d[0]['events'] as $key=>$val)
				if(!empty($val))
					$events[$key] = $val;


		if(isset($data['pan'])){
			// do
			$data['scroll'] = array('on'=>($data['pan']=="1"));
			unset($data['pan']);
		}


		if(isset($data['zoom'])){
			$data['zoom'] = array('on'=>($data['zoom']=="1"));
		}else{
			$data['zoom'] = array();
		}

		if(isset($data['zoomButtons'])){
			$data['zoom']['buttons'] = array('location'=>$data['zoomButtons']['location']);
			unset($data['zoomButtons']);
		}
		if(isset($data['zoomLimit'])){
			$data['zoom']['limit'] = $data['zoomLimit'];
			unset($data['zoomLimit']);
		}
		if(isset($data['zoomDelta'])){
			unset($data['zoomDelta']);
		}
		if(isset($data['popover'])){
			unset($data['popover']);
		}

		if(isset($data['tooltipsMode'])){
			$data['tooltips'] = array('mode'=>($data['tooltipsMode']=='names'?'id':'off'));
			unset($data['tooltipsMode']);
		}

		if(isset($data['regions'])){
			if(count($data['regions'])>0){
				foreach($data['regions'] as &$r){
					if(isset($r['attr'])){
						foreach($r['attr'] as $key=>$value){
							if(!empty($value))
								$r[$key] = $value;
						}
						unset($r['attr']);
					}
				}
			}
		}

		if(isset($data['marks'])){
			if(count($data['marks'])>0){
				$data['markers'] = $data['marks'];
				$inc = 0;
				foreach($data['markers'] as &$m){
					$m['id'] = 'marker_'.$inc;
					$inc++;
					if(isset($m['attrs'])){
						foreach($m['attrs'] as $key=>$value){
							if(!empty($value))
								$m[$key] = $value;
						}
						unset($m['attrs']);
					}
				}
			}
			unset($data['marks']);
		}

		$data = json_encode($data);
		// We should add events to options separately as they
		// shouldn't be enclosed with quotes by json_encode
		$str = array();
		if(!empty($events)){
			foreach($events as $e=>$func)
				$str[] = $e.':'.stripslashes_deep($func);
			$events = implode(',',$str);

			$data = substr($data,0,-1).','.$events.'}';
		}

		//        $data = str_replace("'","\'",$data);
		$data = addslashes($data);

		//    delete_post_meta($id, 'mapsvg_options');
		mapsvg_save(array('map_id'=>$id, 'mapsvg_data'=>$data));

		return true;
	}

	/**
	 * Rollback map upgrades. Used in case of any problems.
	 */
	function rollBack(){
		$res = $this->db->get_results("
            SELECT post_id, meta_value FROM ".$this->db->postmeta." WHERE meta_key = 'mapsvg_options'
        ");
		foreach ( $res as $r ){
			delete_post_meta($r->post_id, 'mapsvg_version');
		}
	}

	/**
	 * Upgrades database structure
	 */
	function updateDbCheck() {

        $dbVersion = $this->isSettingsTableExists() ? Options::get('db_version') : false;

		if(!$dbVersion) {
		    // Fix things broken by v6.0.0
            $broken_settings_table_exists = $this->db->get_var('SHOW TABLES LIKE \'' . $this->db->prefix . 'mapsvg_settings\'');
            if($broken_settings_table_exists){
                $this->fixThingsBrokenByV6Release();
            }
            $dbVersion = '1.0.0';
		}

		if(version_compare($dbVersion, MAPSVG_VERSION, '<')) {
			if(version_compare($dbVersion, '3.0.0', '<')) {
                $this->upgradeMapToV3();
            }
			if(version_compare($dbVersion, '6.0.0', '<')) {
                $this->upgradeMapToV6();
            }
			Options::set('db_version', MAPSVG_VERSION);
		}
	}

	private function fixThingsBrokenByV6Release(){
	    $this->db->query("ALTER TABLE ".$this->db->prefix."mapsvg_schema CHANGE `name` `table_name` varchar(255)");
	    $this->db->query("UPDATE ".$this->db->prefix."mapsvg_schema SET table_name = CONCAT('".$this->db->prefix."mapsvg_',table_name)");
	    $this->db->query("DROP TABLE ".$this->db->prefix."mapsvg_settings");
	    $this->db->query("DROP TABLE ".$this->db->prefix."mapsvg_r2o");
	    $this->db->query("DROP TABLE ".$this->db->prefix."mapsvg_maps");
        $tables = $this->db->get_results('SHOW TABLES LIKE \'%mapsvg_regions_%\'');
        if(!empty($tables)) foreach ($tables as $tableName){
            $name = array_values(get_object_vars($tableName));
            $tableName = $name[0];
            $this->db->query("ALTER TABLE ".$tableName." ADD `region_title` varchar(255)");
        }
        $tables = $this->db->get_results('SHOW TABLES LIKE \'%mapsvg_regions_%\'');
        if(!empty($tables)) foreach ($tables as $tableName){
            $name = array_values(get_object_vars($tableName));
            $tableName = $name[0];
            $this->db->query("ALTER TABLE ".$tableName." ADD `region_title` varchar(255)");
        }
        $tables = $this->db->get_results('SHOW TABLES LIKE \'%mapsvg_objects_%\'');
        if(!empty($tables)) foreach ($tables as $tableName){
            $name = array_values(get_object_vars($tableName));
            $tableName = $name[0];
            $this->db->query("DROP TABLE ".$tableName);
            $parts = explode("_",$tableName);
            $id = $parts[count($parts)-1];
            $this->db->query("DELETE FROM ".$this->db->prefix."mapsvg_schema WHERE table_name = 'objects_".$id."'");
            $this->db->query("DELETE FROM ".$this->db->prefix."mapsvg_schema WHERE table_name = 'regions_".$id."'");
            $this->db->query("DROP TABLE ".$this->db->prefix."mapsvg_regions_".$id);
        }

    }


    function v6RenameFields() {
        $schemasRepo = new SchemaRepository();
        $schemas = $schemasRepo->find();

	    $dbIdField = [
			"name" => "id",
			"label" => "ID",
			"type" => "id",
			"db_type" => "int(11)",
			"visible" => true,
			"protected" => true,
			"searchable" => true
        ];

	    $regionIdField = [
			"name" => "id",
			"label" => "ID",
			"type" => "id",
			"db_type" => "varchar(255)",
			"visible" => true,
			"protected" => true,
			"searchable" => true
        ];

	    $regionTitleField = [
		    "name" => "title",
			"label" => "Title",
			"type" => "text",
			"db_type" => "varchar(255)",
			"visible" => true,
			"searchable" => true
	    ];

        foreach($schemas as $schema) {
        	$postField = $schema->getField("post_id");
        	if($postField){
		        $schema->renameField('post_id', 'post');
		        $this->db->query('ALTER TABLE ' . $this->db->mapsvg_prefix . $schema->name.' CHANGE `post_id` `post` int(11)');
	        }
            if(strpos($schema->name, "database_") === 0) {
                $idField = $schema->getField("id");
                if(!$idField){
                    $schema->addField($dbIdField, true);
                }
            }
            if(strpos($schema->name, "regions_") === 0) {
                $titleField = $schema->getField("title");
                if(!$titleField) {
                    $schema->addField($regionTitleField, true);
                }
                $idField = $schema->getField("id");
                if(!$idField) {
                    $schema->addField($regionIdField, true);
                }
	            $this->db->query('ALTER TABLE ' . $this->db->mapsvg_prefix . $schema->name.' CHANGE `region_title` `title` varchar(255)');
            }
            $schemasRepo->update($schema, true);
        }
    }

    public function v6UpgradeSchemaTable()
    {

        $schemaTableName = $this->db->mapsvg_prefix . "schema";
        $schemaTableExists = $this->db->get_var('SHOW TABLES LIKE \'' . $schemaTableName . '\'');

        if(!$schemaTableExists){
            $this->db->query("CREATE TABLE " . $schemaTableName . " (`id` int(11) AUTO_INCREMENT, `title` varchar(255) DEFAULT '', `name` varchar(255) DEFAULT '', `fields` longtext, PRIMARY KEY (id))" . $this->charset);
            $this->db->query("INSERT INTO " . $schemaTableName. " (`id`, `name`, `fields`) SELECT id, REPLACE(table_name, '" . $this->db->prefix . "mapsvg_',''), fields from " . $this->db->prefix . "mapsvg_schema");
        }

//        $tableSchema = $this->db->get_results("DESCRIBE " . $this->db->prefix . "mapsvg_schema");
//        $fields = array();
//        foreach ($tableSchema as $fieldData) {
//            $fields[] = $fieldData->Field;
//        }
//        if (in_array('name', $fields) === false) {
//            $this->db->query('ALTER TABLE ' . $this->db->prefix . 'mapsvg_schema ADD `name` VARCHAR(255) AFTER table_name');
//            $this->db->query("UPDATE " . $this->db->prefix . "mapsvg_schema SET `name`= REPLACE(table_name, '" . $this->db->prefix . "mapsvg_','')");
//            $this->db->query('ALTER TABLE ' . $this->db->prefix . 'mapsvg_schema DROP COLUMN `table_name`');
//        }
//        if (in_array('title', $fields) === false) {
//            $this->db->query('ALTER TABLE ' . $this->db->prefix . 'mapsvg_schema ADD `title` VARCHAR(255) AFTER `id`');
//        }
        $mapsRepo = new MapsRepository();
        $maps = $mapsRepo->find();
        foreach($maps as $map){
            $options = $map->options;
            if(!$options['database']){
                $options['database'] = [];
            }
            $options['database']['regionsTableName'] = 'regions_'.$map->id;
            $options['database']['objectsTableName'] = 'database_'.$map->id;
            if($options['tooltips'] && $options['tooltips']['on'] === true){
                if(!$options['actions']){
                    $options['actions'] = [
                        'region' => ['mouseover'=>[]],
                        'marker' => ['mouseover'=>[]]
                    ];
                }
                $options['actions']['region']['mouseover']['showTooltip'] = true;
                $options['actions']['marker']['mouseover']['showTooltip'] = true;
            }

            $map->setOptions($options);
            $mapsRepo->update($map);
        }
    }

    public function v6AddMapsTable()
    {
	    $mapsTableName = $this->db->mapsvg_prefix."maps";
        $map_table_exists = $this->db->get_var('SHOW TABLES LIKE \'' .$mapsTableName . '\'');
        if (!$map_table_exists) {
            $charset_collate = "default character set utf8\ncollate utf8_unicode_ci";
            $this->db->query("CREATE TABLE " . $mapsTableName . " (`id` int(11) AUTO_INCREMENT, `title` varchar(255) DEFAULT '', `options` longtext DEFAULT '', `svgFilePath` varchar(500), `svgFileLastChanged` int(11) UNSIGNED, `version` varchar(20), `status` tinyint(1) UNSIGNED default 1,`statusChangedAt` timestamp, PRIMARY KEY (id))" . $charset_collate);
            $this->db->query("INSERT INTO " . $mapsTableName . " (`id`, `title`, `options`) SELECT id, post_title, post_content from " . $this->db->prefix . "posts where post_type='mapsvg'");
            // TODO postpone this to v6.0.1
	        //$this->db->query("DELETE FROM " . $this->db->prefix . "posts where post_type='mapsvg'");

            $maps = $this->db->get_results("SELECT `id`, `options` from " . $mapsTableName, ARRAY_A);
            foreach ($maps as $map) {
                $data = array();
                $data['version'] = get_post_meta($map['id'], 'mapsvg_version', true);
                if (!$data['version']) {
                    $data['version'] = '1.0.0';
                }
                // Maps prior to v3.0.0 stored data as a JS object instead of JSON
                // So don't transfer those maps options
                // They will be loaded from wp_posts
                if (version_compare($data['version'], '3.0.0', '<')) {
                    $data['options'] = '{}';
                    $data['svgFileLastChanged'] = 0;
                } else {
                    $options = json_decode($map['options'], true);
                    $data['svgFilePath'] = $options['source'];
                    $file = new SVGFile(array('path' => $options['source']));
                    $data['svgFileLastChanged'] = $file->lastChanged();
                }
                $this->db->update($mapsTableName, $data, array('id' => $map['id']));
            }
        }
    }

    public function copyDbAndRegionsTables(){
        $tables = $this->db->get_results('SHOW TABLES LIKE \'%mapsvg_database_%\'');
        if(!empty($tables)) foreach ($tables as $tableName){
        	$name = array_values(get_object_vars($tableName));
	        $tableName = $name[0];
            $parts = explode("_", $tableName);
            $id = end($parts);
            $newTableName = str_replace("mapsvg_",MAPSVG_PREFIX, $tableName);
            $this->db->query("CREATE TABLE ".$newTableName." LIKE ".$tableName);
            $this->db->query("INSERT INTO ".$newTableName." SELECT * FROM ".$tableName);
            $this->db->query('update '.$newTableName.' set regions = replace(regions,"}",",\"tableName\": \"regions_'.$id.'\"}")');
        }
        $tables = $this->db->get_results('SHOW TABLES LIKE \'%mapsvg_regions_%\'');
        if(!empty($tables)) foreach ($tables as $tableName){
	        $name = array_values(get_object_vars($tableName));
	        $tableName = $name[0];
            $newTableName = str_replace("mapsvg_",MAPSVG_PREFIX, $tableName);
            $this->db->query("CREATE TABLE ".$newTableName." LIKE ".$tableName);
            $this->db->query("INSERT INTO ".$newTableName." SELECT * FROM ".$tableName);
        }
    }

    public function v6AddSettingsTable()
    {
        if (!$this->isSettingsTableExists()) {
            $settingsTableName = $this->db->mapsvg_prefix. "settings";
            $this->db->query("CREATE TABLE `" . $settingsTableName . "` (`key` varchar(100), `value` varchar(100), PRIMARY KEY (`key`)) " . $this->charset);
            $oldOptions = array('mapsvg_purchase_code', 'mapsvg_google_api_key', 'mapsvg_google_geocoding_api_key');
            foreach ($oldOptions as $optionName) {
                $optionValue = get_option($optionName);
                if ($optionValue) {
                    $optionName = str_replace('mapsvg_', '', $optionName);
                    $pair = array('key' => $optionName, 'value' => $optionValue);
                    $this->db->insert($settingsTableName, $pair);
                }
            }
        }
    }

    public function v6AddR2oTable()
    {
        $r2o_table_exists = $this->db->get_var('SHOW TABLES LIKE \'' . $this->db->mapsvg_prefix.'r2o\'');
        if (!$r2o_table_exists) {
            $this->db->query("CREATE TABLE " . $this->db->mapsvg_prefix . "r2o (objects_table varchar(100), regions_table varchar(100), region_id varchar(100), object_id int(11), INDEX (objects_table, regions_table, region_id)) " . $this->charset);
            $this->db->query("INSERT INTO " . $this->db->mapsvg_prefix . "r2o (`objects_table`, `regions_table`, `region_id`, `object_id`) SELECT CONCAT('objects_',map_id), CONCAT('regions_',map_id), `region_id`, `object_id` from " . $this->db->prefix . "mapsvg_r2d");
//            $this->db->query("DROP TABLE " . $this->db->prefix . "mapsvg_r2d");
        }
    }

    /**
     * @return string
     */
    public function v3AddSchemaTable()
    {
        $schema_table_exists = $this->db->get_var('SHOW TABLES LIKE \'' . $this->db->prefix . 'mapsvg_schema\'');
        if (!$schema_table_exists) {
            $charset_collate = "default character set utf8\ncollate utf8_unicode_ci";
            $this->db->query("CREATE TABLE " . $this->db->prefix . "mapsvg_schema (id int(11) AUTO_INCREMENT, table_name VARCHAR (255), fields text, PRIMARY KEY (id)) " . $charset_collate);
        }
    }

    public function v3AddR2dTable()
    {
        $r2d_table_exists = $this->db->get_var('SHOW TABLES LIKE \'' . $this->db->prefix . 'mapsvg_r2d\'');
        if (!$r2d_table_exists) {
            $charset_collate = "default character set utf8\ncollate utf8_unicode_ci";
            $this->db->query("CREATE TABLE " . $this->db->prefix . "mapsvg_r2d (map_id int(11), region_id varchar(255), object_id int(11), INDEX (map_id, region_id), INDEX(map_id, object_id)) " . $charset_collate);
        }
    }

    /**
     * @return string|null
     */
    public function isSettingsTableExists()
    {
        $settings_table_exists = $this->db->get_var('SHOW TABLES LIKE \'' . $this->db->mapsvg_prefix . 'settings\'');
        return $settings_table_exists;
    }
}
