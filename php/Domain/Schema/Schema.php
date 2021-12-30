<?php
namespace MapSVG;

/**
 * Class that stores information about custom table structure.
 * @package MapSVG
 */
class Schema extends Model {

	public static $slugOne  = 'schema';
	public static $slugMany = 'schemas';

	public $id;
	public $name;
	public $title;
	public $fields = array();

	private $prevFields = array();

	/**
	 * Get all fields types from regions / database table schema
	 *
	 * @return array|bool List of field types
	 */
	function getFieldTypes()
	{
		$db_types = array();
		foreach($this->fields as $s){
			$db_types[$s->name] = $s->type;

			if($s->name === 'post_id'){
                $db_types['post'] = 'post';
            }
		}
		return $db_types;
	}

	function getFieldNames()
	{
		$db_names = array();
		foreach($this->fields as $s){
			$db_names[] = $s->name;
		}
		return $db_names;
	}

	public function getFields()
	{
		return $this->fields;
	}

	public function setName($name){
		$this->name = str_replace(' ','_', $name);
	}
	public function getName(){
		return $this->name;
	}
	public function setTitle($title){
		$this->title = $title;
	}
	public function getTitle(){
		return $this->title;
	}
	public function setType($type){
		$this->type = $type == 'regions' ? 'regions' : 'custom';
	}
	public function getType(){
		return $this->type;
	}

	public function setPrevFields(){
		if(!empty($this->fields)){
			$this->prevFields = $this->fields;
		}
	}
	public function getPrevFields(){
		return $this->prevFields;
	}
	public function clearPrevFields(){
		return $this->prevFields = array();
	}


	public function setFields($fields){

		$this->setPrevFields();

		if(is_string($fields)){
			$fields = json_decode($fields);
		}
		$this->fields = array();

		if($fields) foreach($fields as $key=>$field){
			$this->fields[$key] = $this->formatField((object)$field);
		}

		return true;
	}

	public function getFieldsOptions(){
		$fieldsOptions = array();
		if(is_array($this->fields)){
			foreach ($this->fields as $field) {
				if(isset($field->options)){
					$optionsDict = new \stdClass();
					$fieldsOptions[$field->name] = array();
					foreach($field->options as $option){
						$key = isset($option->value) ? $option->value : $option->id;
						$optionsDict->{$key} = $option;
						$fieldsOptions[$field->name][$key] = (array)$option;
					}
				}
			}
		}
	}

	public function getMultiselectFields(){
		$fieldsOptions = array();
		if(is_array($this->fields)){
			foreach ($this->fields as $field) {
				if(isset($field->options)) {
					if ( isset( $field->multiselect ) && $field->multiselect === true ) {
						$this->dbFieldsMultiselect->{$field->name} = true;
					}
				}
			}
		}

	}

	public function addField($field, $prepend = false){
		$this->setPrevFields();

		if(!is_object($field)){
            $field = json_decode(json_encode($field), FALSE);
        }

		if($prepend){
			$this->fields = array_merge([$field], $this->fields);
		} else {
			$this->fields[] = $this->formatField((object)$field);
		}
	}

	public function removeField($fieldName){
		$this->setPrevFields();
		for($i = 0; $i < count($this->fields); $i++){
			$field = $this->fields[$i];
			if($field->name === $fieldName){
				array_splice($this->fields, $i, 1);
			}
		}
	}

	public function getField($fieldName){
		$resultField = false;
		if(!empty($this->fields)){
            foreach($this->fields as $field){
                if($field->name === $fieldName){
                    $resultField = $field;
                }
            }
        }
		return $resultField;
	}

	public function renameField($currentName, $newName){
		$resultField = false;
		foreach($this->fields as $key=>$field){
			if($field->name === $currentName){
                $this->fields[$key]->name = $newName;
			}
		}
	}

	public function getFieldOptions($fieldName){
		$fields = $this->getField($fieldName);
		$options = array();
		foreach($fields->options as $option){
			$key = isset($option->value) ? $option->value : $option->id;
			$options[$key] = (array)$option;
		}
		return $options;
	}

	public function formatField($field){
		$booleans = array('searchable', 'readonly','protected','visible','auto_increment','not_null');
		foreach($booleans as $booleanFieldName){
			if(isset($field->{$booleanFieldName})){
				$field->{$booleanFieldName} = filter_var($field->{$booleanFieldName}, FILTER_VALIDATE_BOOLEAN);
			}
		}
		return $field;
	}

	public function getSearchableFields($fields = null, $onlyNames = false, $onlyFulltext = false)
	{
		$searchable_fields = array();

		$_fields = $fields ? $fields : $this->fields;

		foreach($_fields as $field){
			if(isset($field->searchable) && $field->searchable === true){
				$field = (array)$field;
				if($field['type'] === 'location'){
					$field['name'] = $field['name'].'_address';
				} elseif($field['type'] === 'select' || $field['type'] === 'radio') {
					$field['name'] = $field['name'] . '_text';
				}
				if($onlyFulltext === false){
					$searchable_fields[] = $field;
				} else {
				    // Don't add incompatible column types to fulltext index
				    if($field["db_type"] !== "text" && $field["db_type"] !== "longtext" && strpos($field["db_type"], "varchar") === false){
				        continue;
                    }
					if($field['type']==='text'){
						if(!isset($field['searchType']) || $field['searchType'] === 'fulltext'){
							$searchable_fields[] = $field;
						}
					} else {
						$searchable_fields[] = $field;
					}
				}
			}
		}
		if($onlyNames){
			$names = [];
			foreach($searchable_fields as $field){
				$names[] = $field['name'];
			}
			return $names;
		} else {
			return json_decode(json_encode($searchable_fields, JSON_UNESCAPED_UNICODE), true);
		}
	}


}
