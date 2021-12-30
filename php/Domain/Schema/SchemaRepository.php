<?php

namespace MapSVG;

class SchemaRepository extends Repository {

	public static $className = 'Schema';

	public function getTableName() {
		return $this->db->mapsvg_prefix . 'schema';
	}

	public function getTableNameShort() {
		return 'schema';
	}

	/**
	 * Find schema by Collection name
	 *
	 * @param $name string Collection name
	 * @return Schema|bool Returns Schema, if found; bool false if not found.
	 */
	function findByName($name){
		$res = $this->db->get_row("SELECT * FROM ".$this->getTableName()." WHERE `name` = '".$name."'", ARRAY_A);
		if($res){
			$data = $this->decodeParams($res);
			$schema =  new Schema($data);
			return $schema;
		} else {
			return false;
		}
	}

	/**
	 * Creates a new schema and table
	 *
	 * @param $schema array|Schema schema of a table
	 * @return Schema
	 */
	function create($data)
	{
		if(isset($data['id'])){
			unset($data['id']);
		}

		$schema = parent::create($data);
		$this->tableSet($schema);

		return $schema;
	}

	/**
	 * @param $schema array options
	 * @param $skip_db_update bool If true, table will not be altered (only the schema is saved)
	 * @return Schema
	 */
	public function update($data, $skip_db_update = false){

		if(!($data instanceof Schema)){
			/** @var $schema Schema */
			$schema = $this->findById($data['id']);
			$schema->update($data);
		} else {
			$schema = $data;
		}

		$params = $this->encodeParams($schema->getData());
		$this->db->update($this->getTableName(), $params, array('id' => $params['id']));

		if(!$skip_db_update){
			$this->tableSet($schema);
		}

		return $schema;
	}

	/**
	 * Create or alter custom table structure
	 */
	private function tableSet($schema) {

		$fields                 = array();

		$childTableName = $this->db->mapsvg_prefix.$schema->name;

		$old_searchable_fields  = $schema->getSearchableFields($schema->getPrevFields(), true, true);
		$searchable_fields      = $schema->getSearchableFields(null, true, true);
		$new_field_names        = array('id');
		$primary_key            = '';
		$update_options         = array();
		$new_options            = array();
		$prev_options           = array();
		$clear_fields           = array();

		foreach($schema->getFields() as $field){

			$field = (array)$field;

			if($field['type'] == 'id' && $field['db_type'] == 'varchar(255)') {
				$primary_key = 'PRIMARY KEY  (id(40))';
			} else {
				$primary_key = 'PRIMARY KEY  (id)';
			}

			if($field['type'] == 'select'){
				if(!isset($field['multiselect'])){
					$field['multiselect'] = false;
				}
			}

			if($field['type'] == 'select' && $field['multiselect'] === true){
				$field['type'] = 'text';
			}

			$field_create_db_string = '`'.$field['name'].'` '.$field['db_type'].( isset($field['db_default']) ? ' DEFAULT '.$field['db_default'] : '' );
			if(isset($field['not_null']) && $field['not_null']){
				$field_create_db_string .= ' NOT NULL';
			}
			if(isset($field['auto_increment']) && $field['auto_increment']){
				$field_create_db_string .= ' AUTO_INCREMENT';
			}
			$fields[]          = $field_create_db_string;
			$new_field_names[] = $field['name'];

			if(($field['type'] == 'select' && $field['multiselect'] !== true) || $field['type'] == 'radio' || $field['type'] == 'status'){
				$db_string = $field['name'].'_text varchar(255)';
				if(isset($field['db_default'])){
					$option = array();
					foreach($field['options'] as $opt){
						$opt = (array)$opt;
						if((string)$opt['value'] === (string)$field['db_default']){
							$db_string .= " DEFAULT '".$opt['label']."'";
							break;
						}
					}
				}
				$fields[] = $db_string;
				$new_field_names[] = $field['name'].'_text';
			}

			if(isset($field['type']) && $field['type'] == 'location'){
				$fields[] = 'location_lat FLOAT(10,7)';
				$fields[] = 'location_lng FLOAT(10,7)';
				$fields[] = 'location_x FLOAT';
				$fields[] = 'location_y FLOAT';
				$fields[] = 'location_address TEXT';
				$fields[] = 'location_img varchar(255)';
				$new_field_names[] = 'location_lat';
				$new_field_names[] = 'location_lng';
				$new_field_names[] = 'location_x';
				$new_field_names[] = 'location_y';
				$new_field_names[] = 'location_address';
				$new_field_names[] = 'location_img';
			}

			if(isset($field['options']) && $field['type'] != 'region'){
				$new_options[$field['name']] = array();
				foreach($field['options'] as $o){
					$o = (array)$o;
					$new_options[$field['name']][(string)$o['value']] = $o['label'];
				}
			}
		}

		if(!empty($schema->getPrevFields())) foreach($schema->getPrevFields() as $_field){
			$_field = json_decode(json_encode($_field, JSON_UNESCAPED_UNICODE), true);

			if(isset($_field['options']) && $_field['type']!='marker'&&$_field['type']!='region'){
				$prev_options[$_field['name']] = array();
				foreach($_field['options'] as $_o){
					$prev_options[$_field['name']][(string)$_o['value']] = $_o['label'];
				}
				if(!isset($prev_options[$_field['name']]) || !is_array($prev_options[$_field['name']]))
					$prev_options[$_field['name']] = array();
				if(!isset($new_options[$_field['name']]) || !is_array($new_options[$_field['name']]))
					$new_options[$_field['name']] = array();

				$diff = array_diff_assoc($new_options[$_field['name']], $prev_options[$_field['name']]);
				if(!isset($_field['multiselect'])){
					$_field['multiselect'] = false;
				}

				if($diff){
					$update_options[] = array('name'             => $_field['name'],
					                          'type'             => $_field['type'],
					                          'next_multiselect' => (bool)$_field['multiselect'],
					                          'prev_multiselect' => (bool)$_field['multiselect'],
					                          'options'          => $diff
					);
				}

				if($_field['type']=='select' && ((bool)$_field['multiselect'] != (bool)$_field['multiselect'])){
					$clear_fields[] = $_field['name'];
				}
			}
		}


		$table_exists = $this->db->get_var('SHOW TABLES LIKE \''.$childTableName.'\'');

		if($table_exists && ($searchable_fields != $old_searchable_fields)){
			$index = $this->db->get_row('SHOW INDEX FROM '.$childTableName.' WHERE Key_name = \'_keywords\';', OBJECT);
			if($index){
				$this->db->query('DROP INDEX `_keywords` ON '.$childTableName);
			}
		}

		$charset_collate = "default character set utf8\ncollate utf8_unicode_ci";
		if(!empty($searchable_fields)){
			$searchable_fields = ",\nFULLTEXT KEY _keywords (".implode(',', $searchable_fields).')';
		} else {
			$searchable_fields = '';
		}

		if(version_compare($this->db->db_version(), '5.6.0', '<')){
			$engine = " ENGINE=MyISAM ";
		} else {
			$engine = " ENGINE=InnoDB ";
		}


		$sql = "CREATE TABLE $childTableName (
".implode(",\n", $fields).",
".$primary_key.$searchable_fields."
) ".$engine.$charset_collate;

		Logger::info($sql,'Changing MySQL table structure');

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		dbDelta( $sql );

		// DROP removed columns
		$columns = $this->db->get_col( "DESC " . $childTableName, 0 );
		foreach ( $columns as $column_name ) {
			if(!in_array($column_name, $new_field_names)){
				$this->db->query( "ALTER TABLE $childTableName DROP COLUMN $column_name" );
			}
		}

		if($update_options){
			$field = '';
			foreach($update_options as $field){
				foreach($field['options'] as $id=>$label){
					$data = array();
					if($field['type']=='select' && ($field['prev_multiselect']===true || $field['next_multiselect']===true)){
						if($field['prev_multiselect']===true && $field['next_multiselect']===true){
							$prev = $prev_options[$field['name']][$id];
							$this->db->query('UPDATE '.$childTableName.' SET `'.esc_sql($field['name']).'`=REPLACE(`'.esc_sql($field['name']).'`, \'"label":"'.esc_sql($prev).'"\',\'"label":"'.esc_sql($label).'"\')');
						}else{
							$this->db->query('UPDATE '.$childTableName.' SET `'.$field['name'].'`=\'\' ');
						}
					}else{
						$f = $field['name'].'_text';
						$data[$f] = $label;
						$where = array();
						$where[$field['name']] = $id;
						$this->db->update($childTableName, $data, $where);
					}
				}
			}
		}

		if($clear_fields){
			$field = '';
			foreach($clear_fields as $field){
				$this->db->query('UPDATE '.$childTableName.' SET `'.$field.'`=\'\' ');
			}
		}

		// Clear previous fields list
		$schema->clearPrevFields();
	}

	public function decodeParams($data){
		$data['fields'] = json_decode($data['fields']);
		return $data;
	}

	public function encodeParams($data, $options = false){

        if(is_object($data) && method_exists($data, 'getData')){
            $data = $data->getData();
        }

		$data = (array)$data;
		foreach($data as $key=>$val){
		    if($val === null){
		        unset($data[$key]);
            }
        }
		if(!is_string($data['fields'])){
            $data['fields'] = json_encode($data['fields'], JSON_UNESCAPED_UNICODE);
        }
		return $data;
	}


}
