<?php

namespace MapSVG;

class RegionsRepository extends Repository {

	public static $className = 'Region';

	public function getTableName()
	{
		return $this->db->mapsvg_prefix . $this->id;
	}

	/**
	 * Updates all provided regions in the database
	 * @param array $objects
	 */
	public function createOrUpdateAll($objects){
		$fields = array();
		$duplicateUpdateMysql = array();
		foreach($objects as $object){
			$keys = array_keys($object);
			if(array_diff($keys, $fields)){
				$fields = $keys;
			}
		}

		$_fields = array();
		foreach($fields as $k=>$v){
			$_fields[$k] = '`'.$v.'`';
			$duplicateUpdateMysql[] = '`'.$v.'` = VALUES(`'.$v.'`)';
		}

		$regions = array();
		foreach($objects as $k=>$object){
			$data = array();
			foreach($fields as $key=>$fieldName){
                $data[$fieldName] = isset($object[$fieldName]) ? esc_sql($object[$fieldName]) : '';
			}
			$regions[] = "('".implode("','", $data)."')";
		}

		$this->db->query('INSERT INTO '.static::getTableName().' ('.implode(',',$_fields).') VALUES '.implode(',',$regions).' ON DUPLICATE KEY UPDATE '.implode(',',$duplicateUpdateMysql));

	}

	/**
	 * Returns an array of searchable fields
	 * @return array [["name"=>string, "type"=>string], ...]
	 */
	public function getSearchableFields() {
		$fields = parent::getSearchableFields();
		$fields[] = array('name'=>'id', 'type'=>'id');
		$fields[] = array('name'=>'title', 'type'=>'text');
		return $fields;
	}



}
