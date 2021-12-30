<?php
namespace MapSVG;

/**
 * Class that recursively updates a map, starting from the lowest version
 * and going up through all updates until the last version.
 */
class MapUpdater {

	protected $db;

	public function __construct() {
		$this->db = Database::get();
	}

	/**
	 * Checks the map version and upgrades it if necessary
	 *
	 * @param integer $map_id Map ID
	 *
	 * @param string $map_version Map version number
	 *
	 * @return bool Returns FALSE if the map version is the same as current MapSVG version
	 */
	function maybeUpdate($map){

		if($map->version === MAPSVG_VERSION){
			return false;
		}

		// Update the map
		$versions = explode(' ',MAPSVG_INCOMPATIBLE_VERSIONS);
		foreach($versions as $version){
			if(version_compare($map->version, $version, '<')){
				$this->upgradeToVersion($map, $version);
			}
		}
	}

	/**
	 * Upgrades map settings to the version number provided in the parameters
	 *
	 * @param $map_id
	 * Map ID
	 *
	 * @param $update_to
	 * Version number the map needs to be updated to
	 *
	 * @param $current_version
	 * Current version number of the map
	 *
	 * @param array $params
	 * Extra options
	 *
	 * @return bool
	 */
	function upgradeToVersion($map, $update_to, $params = array()){

		$mapsRepo = new MapsRepository();

		switch ($update_to){
			case '6.0.0':

				$mapsRepo = new MapsRepository();

				$events = $map->options['events'];
				foreach($events as $eventName => $eventFunc){
					// 1. Remove .getData() from everywhere
					$eventFunc = str_replace('.getData()','',$eventFunc);
					// 2. Replace mapsvg.database
					$eventFunc = str_replace('this.database','this.objectsRepository',$eventFunc);
					$eventFunc = str_replace('mapsvg.database','mapsvg.objectsRepository',$eventFunc);
					// 3. Replace mapsvg.regionsDatabase
					$eventFunc = str_replace('this.regionsDatabase','this.regionsRepository',$eventFunc);
					$eventFunc = str_replace('mapsvg.regionsDatabase','mapsvg.regionsRepository',$eventFunc);
					$events[$eventName] = $eventFunc;
					// 4. Replace events
					$eventFunc = str_replace('mapsvg.on(','mapsvg.events.on(',$eventFunc);
					$eventFunc = str_replace('objectsRepository.on(','objectsRepository.events.on(',$eventFunc);
					$eventFunc = str_replace('regionsRepository.on(','regionsRepository.events.on(',$eventFunc);
					$events[$eventName] = $eventFunc;
				}
				$map->options['events'] = $events;

				break;
			case '5.0.0':

				if(version_compare($map->version, '3.2.0', '<')){
					return false;
				}

				$schemaRepo = new SchemaRepository();
				$schema = $map->objects->getSchema();

				// Some maps are missing schema
				if(!$schema){
				    break;
                }

				if(!empty($schema->fields)) {
                    foreach ($schema->fields as $field) {
                        if ($field->type === 'marker') {
                            $schema_with_markers = true;
                        }
                    }
                }

				$location_field = array('label'=>'Location','name'=>'location','type'=>'location','db_type'=>'text', 'visible' => true);
				$location_field = (object)$location_field;

				if($schema_with_markers){
					//2. Iterate over found schemas to update them
					$schema->addField($location_field);
					$schemaRepo->update($schema);

                    //4. SELECT id, marker FROM table_xxx
                    $rows = $this->db->get_results('SELECT id, marker FROM '.$this->db->prefix."mapsvg_database_".$map->id, ARRAY_A);
                    if($rows){
                        // Iterate over all rows in the table and build "location" from "marker"
                        foreach($rows as $row){
                            $location = array();
                            $marker = json_decode($row['marker'], true);
                            if(isset($marker['geoCoords']) && isset($marker['geoCoords'][0]) && isset($marker['geoCoords'][1])){
                                $location['location_lat'] = $marker['geoCoords'][0];
                                $location['location_lng'] = $marker['geoCoords'][1];
                            } else if (isset($marker['xy'])){
                                $location['location_x'] = $marker['xy'][0];
                                $location['location_y'] = $marker['xy'][1];
                            } else if (isset($marker['x']) && isset($marker['y'])){
                                $location['location_x'] = $marker['x'];
                                $location['location_y'] = $marker['y'];
                            }
                            if(isset($marker['src'])){
                                $arr = explode('/',$marker['src']);
                                $location['location_img'] = array_pop($arr);
                            }
                            // Update DB record, add location data
                            $this->db->update($this->db->prefix."mapsvg_database_".$map->id, $location, array('id'=>$row['id']));
                        }
                    }

					// If ALL rows (ONLY) were converted successfully then remove the marker column
					// $new_schema = $new_schema - marker_col;
					$schema->removeField('marker');
					$schemaRepo->update($schema);
				}

				break;

			case '3.2.0':

			    break;

				if(version_compare($map->version, '3.0.0', '<')){
					return false;
				}

				$schemaRepo = new SchemaRepository();

				// 1. Change region_id to regions (to allow multiple regions)
				$table = $this->db->mapsvg_prefix.'database_'.$map->id;
				$regions_table = $this->db->mapsvg_prefix.'regions_'.$map->id;
				if($this->db->get_row('SHOW TABLES LIKE \''.$table.'\'') && $this->db->get_row('SHOW COLUMNS FROM '.$table.' LIKE \'region_id\'')){
					$this->db->query('UPDATE  '.$table.' t1, '.$regions_table.' t2 SET t1.region_id_text = CONCAT(\'[{"id": "\', t2.id, \'", "title": "\', t2.title,\'"}]\') WHERE t1.region_id = t2.id');
					$this->db->query('ALTER TABLE '.$table.' DROP COLUMN `region_id`');
					$this->db->query('ALTER TABLE '.$table.' CHANGE `region_id_text` `regions` TEXT');
				}
				$schemaName = str_replace($this->db->mapsvg_prefix,"",$table);
				$schema = $this->db->get_var('SELECT fields FROM '.$this->db->mapsvg_prefix.'schema WHERE name=\''.$schemaName.'\'');
				if($schema){
					$schema = str_replace('"name":"region_id"','"name":"regions"',$schema);
					$this->db->query('UPDATE '.$this->db->mapsvg_prefix.'schema SET `fields`=\''.$schema.'\'  WHERE name=\''.$schemaName.'\'');
				}


				// 2. Check if there is "status"/ "status_text" field in regions table and if there is, rename it to "_status"
				$schema = $map->regions->getSchema();
				if(!$schema){
//                    $map->regions = RegionsRepository::createRepository('regions_' . $map->id);
//                    $map->setRegionsTable();
				}else{
					$need_rename_status_field = false;
					$need_rename_status_text_field = false;
					foreach($schema as &$field){
						if($field->name === 'status'){
							$field->name = '_status';
							$need_rename_status_field = $field->db_type;
						}elseif($field->name === 'status_text'){
							$field->name = '_status_text';
							$need_rename_status_text_field = $field->db_type;
						}
					}
					$schemaRepo->update($schema);
					if($need_rename_status_field){
						$this->db->query('ALTER TABLE '.$regions_table.' CHANGE `status` `_status` '.$need_rename_status_field);
					}
					if($need_rename_status_text_field){
						$this->db->query('ALTER TABLE '.$regions_table.' CHANGE `status_text` `_status_text` '.$need_rename_status_text_field);
					}
				}


				// 3. Add "status" field to regions table (new feature instead of "disabled" Region property)
				$disabledColor = isset($params['disabledColor']) && !empty($params['disabledColor']) ? $params['disabledColor'] : '';

				$obj = new stdClass();
				$obj->{'1'} = array("label"=>"Enabled","value"=>'1',"color"=>"","disabled"=>false);
				$obj->{'0'} = array("label"=>"Disabled","value"=>'0',"color"=> $disabledColor,"disabled"=>true);

				$status_field = array(
					'type'=>'status',
					'db_type'=>'varchar (255)',
					'label'=> 'Status',
					'name'=> 'status',
					'visible'=>true,
					'options'=>array(
						$obj->{'1'},
						$obj->{'0'}
					),
					'optionsDict' => $obj
				);

				$schema->addField($status_field);
				$schemaRepo->update($schema);

				// 4. Get enabled/disabled status from regions and convert it into status
				$this->db->query('UPDATE '.$regions_table.' SET status=1');

				if(isset($params['disabledRegions'])){
					foreach($params['disabledRegions'] as $d_id){
						$this->db->update($regions_table, array('status'=>0), array('id'=>$d_id));
					}
				}

				break;
			case '2.0.0':

			    break;

				$_data = $this->getMetaOptions($map->id);

				$data = $_data['m'];

				$events = array();
				if(isset($_data['events']))
					foreach($_data['events'] as $key=>$val)
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

				$data = addslashes($data);

				mapsvg_save(array('map_id'=>$map->id, 'mapsvg_data'=>$data));

				// Update map version
				update_post_meta($map->id, 'mapsvg_version', '2.0.0');

				break;
			default:
				null;
		}

        $map->setVersion($update_to);
        $mapsRepo->update($map);
	}

}
