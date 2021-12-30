<?php

namespace MapSVG;

use JsonSerializable;

/**
 * Core Repository class.
 * Doing CRUD operations for Entities in the database.
 * Stores cached list of Entities received from the last query.
 * Contains Schema of the Entity.
 * @package MapSVG
 */
class Repository implements JsonSerializable {

	/** @var string Name of the Entity class */
	public static $className = 'Object';

	/* @var Database $db Database instance */
	protected $db;

	/* @var string $id Unique short name of the table */
	public $id;

	/* @var array  Array of Entities received from the database */
	protected $objects;

	/* @var Schema $schema  Class containing the list of DB fields and their settings */
	public $schema;

	/* @var boolean Whether output JSON data should be provided with the Schema */
	private $renderJsonWithSchema = false;

	public function __construct(string $tableName = null)
	{
		$this->db = Database::get();

		if($tableName !== null){
			$this->id = $tableName;
			$this->loadSchema();
		} else {
			$this->loadSchema(static::getDefaultSchema());
			$this->id = $this->schema->name;
		}
	}

	/**
	 * Instance builder - calls setter methods for every given parameter
	 * @param array $params
	 * @return $this
	 */
	public function build(array $params)
	{
		foreach($params as $paramName => $options){
			$methodName = 'set'.ucfirst($paramName);
			if(method_exists($this, $methodName)){
				$this->{$methodName}($options);
			}
		}
		return $this;
	}

	/**
	 * Returns the namespaced Entity class name
	 * @return string
	 */
	public function getModelClass()
	{
		return __NAMESPACE__.'\\'.static::$className;
	}

	/**
	 * Creates new instance of the Entity class
	 * @return string
	 */
	public function newObject($data){
		$class = $this->getModelClass();
		return new $class($data);
	}

	/**
	 * Tells that the result JSON should be provided with the Schema
	 * @return string
	 */
	public function withSchema(){
		$this->renderJsonWithSchema = true;
	}

	/**
	 * Specifies what data should be used for json_encode()
	 * @return string
	 */
	public function jsonSerialize()
	{
		$data = new \stdClass();
		if(empty($this->objects)){
			$this->fill();
		}
		$data->{static::getSlugMany()} = $this->objects;
		if($this->renderJsonWithSchema){
			$data->schema = $this->schema;
		}
		return $data;
	}

	/**
	 * Fills repository cache with Entities by using the Query object
	 * @param Query $query - Query for the database
	 * @param boolean $skipSchema - whether Schema loading should be skipped
	 * @return string
	 */
	public function fill($query = array(), $skipSchema = false)
	{
		$query = new Query($query);
		$this->objects = $this->find($query);
		if(!$skipSchema) {
			$this->loadSchema();
		}
		return $this;
	}

	/**
	 * Clears the Entity table in the database
	 */
	public function clear()
	{
		$this->db->query("DELETE FROM ".$this->getTableName());
	}

	/**
	 * Returns the Schema
	 * @return Schema
	 */
	public function getSchema()
	{
		return $this->schema;
	}

	/**
	 * Returns the entity class name without the namespace
	 * @return string
	 */
	public function getClassName()
	{
		return static::$className;
	}

	/**
	 * Returns the ID (short Entity table name)
	 * @return string
	 */
	public function getId()
	{
		return $this->id;
	}

	/**
	 * Returns a cached array of Entity objects
	 * @return array
	 */
	public function getObjects()
	{
		return $this->objects;
	}

	/**
	 * Loads Entity table schema
	 * @param array|null $schema
	 */
	private function loadSchema(array $schema = null)
	{

		if($schema){
			$this->schema = new Schema($schema);
		} else {
			$schemaRepo = new SchemaRepository();
			$this->schema = $schemaRepo->findByName($this->getTableNameShort());
		}
	}

	/**
	 * Returns a singular slug for the Entity (example: "car")
	 * @return mixed
	 */
	public function getSlugOne(){
		$class = $this->getModelClass();
		return $class::$slugOne;
	}

	/**
	 * Returns a plural slug for the Entity (example: "cars")
	 * @return mixed
	 */
	public function getSlugMany(){
		$class = $this->getModelClass();
		return $class::$slugMany;
	}

	/**
	 * Returns a full table name of the Entity
	 * @return mixed
	 */
	public static function tableName(string $shortTableName) {
		$db = Database::get();
		return $db->mapsvg_prefix . $shortTableName;
	}

	/**
	 * Returns a full table name of the Entity
	 * @return mixed
	 */
	public function getTableName() {
		return $this->db->mapsvg_prefix . $this->id;
	}

	/**
	 * Returns a short table name of the Entity (without prefixes)
	 * @return mixed
	 */
	public function getTableNameShort() {
		return $this->id;
	}

	/**
	 * Creates new object
	 * @param array $data
	 */
	public function create($data) {

		if(is_string($data)){
			$data = json_decode($data, true);
		}

		$object    = $this->newObject($data);

		$dataForDB = $this->encodeParams($object->getData());

		$this->db->insert($this->getTableName(), $dataForDB);

		$object->setId($this->db->insert_id);

		return $object;
	}

	/**
	 * Returns a single Entity object by ID
	 * @return mixed
	 */
	public function findById($id)
	{
		$data = $this->db->get_row("SELECT * FROM `" . $this->getTableName() . "` WHERE id='" . $id . "'");
//		var_dump("SELECT * FROM `" . $this->getTableName() . "` WHERE id='" . $id . "'");
//		die();

		if($data){
			$data = $this->decodeParams((array)$data);
			$object = $this->newObject($data);
			return $object;
		} else {
			return false;
		}
	}

    /**
     * Returns a single Entity object by query
     * @param array $where
     * @return mixed
     */
    public function findOne($where)
    {
        $query = new Query(["filters"=>$where, "perpage"=>1]);
        $rows = $this->find($query);
        return $rows[0];
    }



    /**
	 * Returns an array of Entities by provided Query
	 * @param Query $query Query for the database
	 * @return array<Schema>
	 */
	function find(Query $query = null){

		if($query === null){
			$query = new Query(array('perpage' => 0));
		}

		$filters_sql = array();
		$filter_regions = '';

		$start = ($query->page - 1) * $query->perpage;

//		$filters   = isset($query['filters']) ? $query['filters'] : null;
//		$filterout = isset($query['filterout']) ? $query['filterout'] : null;
//		$search    = isset($filters['search']) ? $filters['search'] : null;
//		if(isset($filters['search'])){
//			unset($filters['search']);
//		}
		$search_fallback = isset($query->searchFallback) ? $query->searchFallback === true : false;

		if(empty($this->schema)){
			$this->loadSchema();
			if(!$this->schema){
			    return false;
            }
		}

		$fields            = array();
		$fields_dict       = array();

		$select_distance = '';
		$having = '';

		if(!empty($query->filters)){
			foreach($query->filters as $fieldName=>$fieldValue){
				//            if(in_array($key, $fields)){
				if($fieldValue!=''){

				    if($fieldName === 'distance'){
				        $fieldName = 'location';
                    }

				    $field = $this->schema->getField($fieldName);

				    if(!$field) {
				        continue;
                    }

					if($field->type === 'region'){
						$regions_table = esc_sql($fieldValue['table_name']);
						$regions_array = array();
						foreach($fieldValue['region_ids'] as $rId){
							$regions_array[] = ' r2o.region_id = \''.$rId.'\' ';
						}
						$regions_sql = implode(' OR ', $regions_array);
						$filter_regions = 'INNER JOIN '.$this->db->mapsvg_prefix.'r2o r2o ON r2o.objects_table=\''.$this->getTableNameShort().'\' AND r2o.regions_table=\''.esc_sql($regions_table).'\' AND r2o.object_id=id AND ('.$regions_sql.')';

					} else if ($field->type === 'location'){

						$having = ' HAVING distance < '.esc_sql($fieldValue['length']).' ';

						if(isset($fieldValue['geoPoint'])){
							$geoPoint = $fieldValue['geoPoint'];
							$koef = $fieldValue['units'] === 'mi' ? 3959 : 6371;

							$select_distance = ", (
                                ".$koef." * acos(
                                    cos( radians(".$geoPoint['lat'].") )
                                    * cos( radians( location_lat ) )
                                    * cos( radians( location_lng ) - radians(".$geoPoint['lng'].") )
                                    + sin( radians(".$geoPoint['lat'].") )
                                    * sin( radians( location_lat ) )
                                )
                                ) AS distance ";
						}

					} else {
						if(isset($fields_dict[$fieldName]['multiselect']) && $fields_dict[$fieldName]['multiselect'] === true){
							//                            $filters_sql[] = 'MATCH (`'.$key.'`) AGAINST (\''.esc_sql($fields_dict[$key]['optionsDict']->{$value}).'*\' IN BOOLEAN MODE)';
							if(is_array($fieldValue)){
								foreach($fieldValue as $index=>$v){
									$fieldValue[$index] = '`'.$fieldName.'` LIKE \'%"'.esc_sql($v).'"%\'';
								}
								$filters_sql[] = "(".implode(' AND ', $fieldValue).")";
							} else {
								$filters_sql[] = '`'.$fieldName.'` LIKE \'%"'.esc_sql($fieldValue).'"%\'';
							}
						}else{
							if(is_array($fieldValue)){
								$values = '\''.implode('\',\'', $fieldValue).'\'';
								$filters_sql[] = '`'.$fieldName.'` IN ('.$values.')';
							} else {
								$filters_sql[] = '`'.$fieldName.'`=\''.esc_sql($fieldValue).'\'';
							}
						}
					}
				}
			}
		}

		if(!empty($query->filterout)){
			foreach($query->filterout as $key => $value){
				if($value != '') {
					$filters_sql[] = '`'.$key.'`!=\''.esc_sql($value).'\'';
				}
			}
		}

		// Do text search
		if(!empty($query->search)){

			$searchable_fields = $this->schema->getSearchableFields();

			$like_fields = array();

			if($searchable_fields){
				if(isset($search_fallback) && $search_fallback){
					//                $searchable_fields = explode(',',$searchable_fields);
					foreach($searchable_fields as $f){
						if((isset($f['type']) && $f['type'] == 'region') || (isset($f['multiselect'])&&$f['multiselect']===true))
							$like_fields[] = '`'.$f['name'].'` LIKE \'%"'.esc_sql($query->search).'%\'';
						else
							$like_fields[] = '`'.$f['name'].'` REGEXP \'(^| )'.esc_sql($query->search).'\'';
					}
					$filters_sql[] = '('.implode(' OR ', $like_fields).')';
				}else{
					$_search = array();
					//                $searchable_fields = explode(',',$searchable_fields);
					$match = array();
					$search_like  = array();
					$search_exact = array();
					foreach($searchable_fields as $index=>$f){
						if($f['type'] === 'text') {
							if(isset($f['searchType'])){
								if($f['searchType'] == 'fulltext'){
									$match[] = $f['name'];
								} elseif($f['searchType'] == 'like'){
									$search_like[] = '`'.$f['name'].'` LIKE \''.esc_sql($query->search).'%\'';
								} else {
									$search_exact[] = '`'.$f['name'].'`  = \''.esc_sql($query->search).'\'';
								}
							} else {
								$match[] = $f['name'];
							}
						} else {
							$match[] = $f['name'];
						}
						//                    }
					}
					$text_search_sql = array();
					if(count($match))
						$_search[] = 'MATCH ('.implode(',',$match).') AGAINST (\''.esc_sql($query->search).'*\' IN BOOLEAN MODE)';
					if(!empty($search_like)){
						$_search[] = '('.implode(' OR ', $search_like).')';
					}
					if(!empty($search_exact)){
						$_search[] = '('.implode(' OR ', $search_exact).')';
					}
					$filters_sql[] = '('.implode(' OR ', $_search).')';
				}
			}
		}

		if($filters_sql)
			$filters_sql = ' WHERE '.implode(' AND ', $filters_sql);
		else
			$filters_sql = '';

		$sort  = '';

		if(!empty($query->sort)){
			$sortArray = array();
			$distanceSortPresent = false;
			foreach($query->sort as $group){
				if((isset($group['field']) && isset($group['order'])) && (!empty($group['field']) && in_array(strtolower($group['order']), array('asc','desc')))){
					if($group['field'] === 'distance'){
						$distanceSortPresent = true;
						if(!isset($filters['distance']) || empty($filters['distance'])){
							continue;
						}
					}
					$sortArray[] = '`'.$group['field'].'` '.$group['order'];
				}
			}
			if(isset($filters['distance']) && !empty($filters['distance']) && !$distanceSortPresent){
				array_unshift($sortArray, '`distance` ASC');
			}
			$sort = implode(',',$sortArray);
		} else {
			$sortBy  = 'id';
			$sortDir = 'DESC';
			if(isset($query->sortBy) && !empty($query->sortBy)){
				$sortBy = $this->getSort($query->sortBy);
				$sortBy = '`'.$sortBy.'`';
				if(isset($filters['distance'])){
					$sortBy = 'distance ASC, '.$sortBy.' ';
				}
			}
			if(isset($query->sortDir) && !empty($query->sortDir)){
				if(in_array(strtolower($query->sortDir), array('desc','asc'))){
					$sortDir = $query->sortDir;
				}
			}
			$sort = $sortBy.' '.$sortDir;
		}

		$fields = $query->fields ? '`'.implode('`,`',$query->fields).'`' : '*';

		$query_sql = 'SELECT '.$fields.$select_distance.' FROM '.$this->getTableName().'
        '.$filter_regions.'  
        '.$filters_sql.'    
        '.$having.'     
        '.($sort ? 'ORDER BY '.$sort : '');

		// Easy pagination: take +1 record to check that there are items available for the next page,
		// then remove that extra record
		if($query->perpage > 0){
			$query_sql .= ' LIMIT '.$start.','.($query->perpage + 1);
		}

		Logger::info($query);
		Logger::info($query_sql);

		$data = $this->db->get_results($query_sql, ARRAY_A);

		if($data && $this->schema->getFieldTypes()){
			foreach ($data as $index=>$object){
				$data[$index] = $this->newObject($this->decodeParams($object));
			}
		}

		$response = array();
		if($data){
			$response = $data;
		}

		return $response;
	}

	/**
	 * Updates an Entity in the database
	 * @param $object
	 *
	 * @return string
	 */
	public function update($object)
	{
		$params = $this->encodeParams($object);
		$this->db->update($this->getTableName(), $params, array('id' => $params['id']));
		return is_object($object) ? $object : $this->newObject($object);
	}

	/**
	 * Deletes an Entity from the database
	 * @param $object
	 *
	 * @return string
	 */
	public function delete($id)
	{
		return $this->db->delete($this->getTableName(), array('id' => $id));
	}


    /**
     * Static method that creates a new table
     * @param string|array $schemaOrName
     * @return string
     */
    public static function createRepository($schemaOrName)
    {
        $repo = new SchemaRepository();
        $name = '';
        if(is_string($schemaOrName)){
            $schemaData = static::getDefaultSchema();
            $schemaData['name'] = $schemaOrName;
        } elseif(is_array($schemaOrName)){
            $schemaData = $schemaOrName;
        }

        $schema = $repo->create($schemaData);
        return new static($schemaData['name']);
    }


    /**
     * Checks whether a table exists
     * @param string $name
     * @return boolean
     */
    public static function tableExists($name)
    {
        $db = Database::get();
        $table_exists = $db->get_var("SHOW TABLES LIKE '".$db->mapsvg_prefix.$name."'");
        return (bool)$table_exists;
    }


	/**
	 * Deletes a table
	 */
	public function deleteTable()
	{
		$this->db->query("DROP TABLE ".$this->getTableName());
		$schemaRepository = new SchemaRepository();
		$schemaRepository->delete($this->schema->id);
	}

	/**
	 * Import CSV data to regions / database
	 */
	public function import(array $data, $convertLatlngToAddress = false){

		$_data  = array();
		$table = $this->getTableName();

		foreach($data as $index => $object){
			$_data[$index] = $this->encodeParams($object, $convertLatlngToAddress);
		}

		$values = array();

		$keys = array_keys($_data[0]);
		$placeholders = array_map(function($key){ return '%s'; }, $keys);

		foreach ( $_data as $object) {
			$values2 = array();
			foreach ( $keys as $key) {
				$values2[] = isset($object[$key]) ? $object[$key] : '';
			}
			$t = $this->db->prepare( "(".implode(',',$placeholders).")",  $values2 );
			$values[] = $t;
		}

		$query = "INSERT INTO ".$table." (`".implode('`,`', $keys)."`) VALUES ";
		$query .= implode( ", ", $values ).' ON DUPLICATE KEY UPDATE ';
		$k = array();
		foreach($keys as $key){
			$k[] .= '`'.$key.'`=VALUES(`'.$key.'`)';
		}
		$query .= implode(', ', $k);

		$this->db->query($query);

		if(isset($_data[0]['regions'])){
			$this->setRelationsForAllObjects();
		}

		return $data;
	}

	/**
	 * Formats data for the insertion into a database
	 *
	 * @param object|array $data
	 * @param bool $convertLatLngToAddress
	 *
	 * @return array
	 */
	public function encodeParams($data, $convertLatLngToAddress = false)
	{

		if(method_exists($data, 'getData')){
			$data = $data->getData();
		}
		if(empty($this->schema)){
			$this->loadSchema();
		}

		$formattedData = array();
		$fieldTypes = $this->schema->getFieldTypes();

		foreach($data as $key => $value){
			$field = $this->schema->getField($key);
			if($field) switch ($field->type){
                case 'post':
                    if(is_array($value)){
                        $formattedData['post'] = $value['id'];
                    } elseif(is_object($value)){
                        $formattedData['post'] = $value->id;
                    } else {
                        $formattedData['post'] = $value;
                    }
                    break;
				case 'region':
					if(!empty($data[$key]) && is_array($data[$key])){
						$formattedData[$key] = json_encode($data[$key], JSON_UNESCAPED_UNICODE);
					} else {
						$formattedData[$key] = '';
					}
					break;
				case 'status':
					$key_text = $key.'_text';
					$options = $this->schema->getFieldOptions($field->name);
                    if(isset($options[$value]['value'])){
                        $formattedData[$key] = $value;
                        $formattedData[$key_text] = $options[$value]['label'];
					}else{
						$formattedData[$key] = '';
						$formattedData[$key.'_text'] = '';
					}
					break;
				case 'select':
				case 'radio':
					$key_text = $key.'_text';
					$fieldOptions = $this->schema->getFieldOptions($field->name);

					if(isset($field->multiselect) && filter_var($field->multiselect, FILTER_VALIDATE_BOOLEAN)) {
						$formattedData[$key] = json_encode($data[$key], JSON_UNESCAPED_UNICODE);
					}else{
						if(isset($fieldOptions[$value])){
							$formattedData[$key] = $value;
							$formattedData[$key_text] = $fieldOptions[$value]['label'];
						}else {
							if($value === ''){
								$formattedData[$key] = '';
								$formattedData[$key_text] = '';
							} else {
							    $options = [];
							    foreach ($fieldOptions as $fieldOptionIndex => $fieldOptionValue){
							        $options[$fieldOptionValue['value']] = $fieldOptions[$fieldOptionIndex];
                                }
								if(isset($options[$value])){
									$formattedData[$key] = $options[$value];
									$formattedData[$key_text] = $value;
								}else {
									$formattedData[$key] = '';
									$formattedData[$key_text] = '';
								}
							}
						}
					}
					break;
				case 'checkbox':
					$formattedData[$key] = (int)($data[$key] === true || $data[$key] === 'true' || $data[$key] === '1' || $data[$key] === 1);
					break;
				case 'image':
				case 'marker':
					if(is_array($data[$key])){
						$formattedData[$key] = json_encode($data[$key], JSON_UNESCAPED_UNICODE);
					}else{
						$formattedData[$key] = $data[$key];
					}
					break;
				case 'location':
					if(!empty($data[$key])){
						$location = array();

						if(is_array($data[$key])){
							$location = $data[$key];
						} else {
							$location = json_decode($data[$key]);
						}

						if(isset($location['geoPoint']) && !empty($location['geoPoint'])) {
							$formattedData['location_lat'] = $location['geoPoint']['lat'];
							$formattedData['location_lng'] = $location['geoPoint']['lng'];
						} else if(isset($location['svgPoint']) && !empty($location['svgPoint'])){
							$formattedData['location_x'] = $location['svgPoint']['x'];
							$formattedData['location_y'] = $location['svgPoint']['y'];
						}
						if(isset($location['address'])){
							$formattedData['location_address'] = isset($location['address']) ? json_encode($location['address'], JSON_UNESCAPED_UNICODE) : '';
						}

						$formattedData['location_img'] = isset($location['img']) ? $location['img'] : '';


						if(!empty($location)){

							$addressYesCoordsNo = (isset($location['address']) && !empty($location['address']) && is_string($location['address']))
							                      && (!isset($location['geoPoint']) || empty($location['geoPoint']));
							$addressNoCoordsYes = (!isset($location['address']) || empty($location['address']))
							                      && (isset($location['geoPoint']) && !empty($location['geoPoint']));

							if($addressYesCoordsNo || $addressNoCoordsYes){
								$geo = new Geocoding();
								if($addressNoCoordsYes){
									$response = $geo->get($location['geoPoint']['lat'].','.$location['geoPoint']['lng'], true, $convertLatLngToAddress);
								} elseif($addressYesCoordsNo){
									$response = $geo->get($location['address']);
								}

								if($response && isset($response['status'])){

									switch($response['status']){
										case 'OK':
											$address = array();
											if($addressNoCoordsYes && $convertLatLngToAddress){
												$result = $response['results'][1];
											} else {
												$result = $response['results'][0];
											}

											if($addressYesCoordsNo){
												$formattedData['location_lat'] = $result['geometry']['location']['lat'];
												$formattedData['location_lng'] = $result['geometry']['location']['lng'];
											} else {
												$formattedData['location_lat'] = $location['geoPoint']['lat'];
												$formattedData['location_lng'] = $location['geoPoint']['lng'];
											}
											$address = array();
											$address['formatted'] = $result['formatted_address'];
											foreach($result['address_components'] as $addr_item){
												$type = $addr_item['types'][0];
												$address[$type] = $addr_item['long_name'];
												if($addr_item['short_name'] != $addr_item['long_name']){
													$address[$type.'_short'] = $addr_item['short_name'];
												}
											}

											$formattedData['location_address'] = json_encode($address, JSON_UNESCAPED_UNICODE);

											break;
										case 'ZERO_RESULTS':
											break;
										case 'OVER_DAILY_LIMIT':
											// TODO notify user that:
											// The API key is missing or invalid.
											// Billing has not been enabled on your account.
											// A self-imposed usage cap has been exceeded.
											// The provided method of payment is no longer valid (for example, a credit card has expired).
											// See the Maps FAQ to learn how to fix this.
											break;
										case 'OVER_QUERY_LIMIT':
											// TODO
											// Tell user to retry tomorrow (notify that some locations where not converted)
											break;
										case 'REQUEST_DENIED':
											// TODO add a field location_error?
											// To mark which locations can still be converted
											break;
										case 'INVALID_REQUEST':
											// TODO add a field location_error?
											// To mark which locations can still be converted
											break;
										case 'UNKNOWN_ERROR':
											// TODO add a field location_error?
											// To mark which locations can still be converted
											break;
										case 'CONNECTION_ERROR':
											// TODO add a field location_error?
											// Don't try to import more locations
											break;
										case 'NO_API_KEY':
											// TODO add a field location_error?
											// Don't try to import more locations
											break;
										default: null;
											break;
									}
								}
							}

						}
					} else {
						$formattedData['location_address'] = '';
						$formattedData['location_lat'] = null;
						$formattedData['location_lng'] = null;
						$formattedData['location_x'] = null;
						$formattedData['location_y'] = null;
						$formattedData['location_img'] = '';
					}
					break;
				default:
					$formattedData[$key] = $value;
					break;
			}
		}

		Logger::info($formattedData);

		return $formattedData;
	}

	public function decodeParams(array $data)
	{
		if(empty($this->schema)){
			$this->loadSchema();
		}

		$data_formatted = array();

		$data_formatted['id'] = $data['id'];

		if(isset($data['id_no_spaces'])){
			$data_formatted['id_no_spaces'] = $data['id_no_spaces'];
		}

		$fieldTypes = $this->schema->getFieldTypes();

		foreach ($fieldTypes as $field_name => $field_type){
			switch ($field_type) {
				case 'status':
					$data_formatted[$field_name] = $data[$field_name];
					if(!empty($data[$field_name.'_text'])){
						$data_formatted[$field_name.'_text'] = $data[$field_name.'_text'];
					}
					break;
				case 'radio':
				case 'select':
					if(strpos($data[$field_name], '[{')===0){
						$data_formatted[$field_name] = json_decode(stripslashes($data[$field_name]));
					} else {
						$data_formatted[$field_name] = $data[$field_name];
					}
					if(!empty($data[$field_name.'_text'])){
						$data_formatted[$field_name.'_text'] = $data[$field_name.'_text'];
					}
					break;
				case 'region':
					if(!empty($data[$field_name])) {
						$data_formatted[$field_name] = json_decode(stripslashes($data[$field_name]));
					}
					break;
				case 'post':
					if(!empty($data['post'])){
						$data_formatted['post'] = (int)$data['post'];
						$data_formatted['post'] = get_post((int)$data['post']);
						if($data_formatted['post']){
							$data_formatted['post']->id = $data_formatted['post']->ID;
							$data_formatted['post']->post_content = wpautop($data_formatted['post']->post_content);
							$data_formatted['post']->url = get_permalink($data_formatted['post']);
							if (function_exists('get_fields') ) {
								$data_formatted['post']->acf = get_fields($data['post_id']);
							}
						}
					}
					break;
				case 'checkbox':
					$data_formatted[$field_name] = (bool)$data[$field_name];
					break;
				case 'image':
				case 'marker':
					$data_formatted[$field_name] = json_decode(stripslashes($data[$field_name]));
					break;
				case 'location':
					if(($data['location_lat'] && $data['location_lng'] &&
                        (float)$data['location_lat'] !== (float)0 && (float)$data['location_lng'] !== (float)0)
                        ||
                        ($data['location_x'] && $data['location_y'])){
						$data_formatted[$field_name] = array(
							'address' => isset($data['location_address']) ? json_decode($data['location_address']) : '',
							'img'     => isset($data['location_img'])     ? $data['location_img'] : ''
						);
						if(!empty($data['location_lat']) && !empty($data['location_lng'])){
							$data_formatted[$field_name]['geoPoint'] = array('lat' => (float)$data['location_lat'], 'lng' => (float)$data['location_lng'] );
						}
						if(!empty($data['location_x']) && !empty($data['location_y'])){
							$data_formatted[$field_name]['svgPoint'] = array('x' => (float)$data['location_x'], 'y' => (float)$data['location_y'] );
						}
					} else {
						$data_formatted[$field_name] = '';
					}
					break;
				default:
					$data_formatted[$field_name] = isset($data[$field_name]) ? $data[$field_name] : '';
					break;
			}
		}

		return $data_formatted;
	}


	public function getSort($sort)
	{
		return $sort;
	}

	/**
	 * Reads the default schema from .json file which should be present in the same folder where
	 * repository class is located
	 *
	 * @return mixed
	 * @throws \ReflectionException
	 */
	public static function getDefaultSchema(){

		$reflector = new \ReflectionClass(get_called_class());
		$filename = $reflector->getFileName();
		$dir = dirname($filename);

		$schema = file_get_contents($dir.'/schema.json');
		$schema = json_decode($schema, true);
		return $schema;
	}
}
