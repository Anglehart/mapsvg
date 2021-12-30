<?php


namespace MapSVG;


/**
 * Сlass that manages global MapSVG settings in the database
 * @package MapSVG
 */
class Options {

	/**
	 * Returns the list of all MapSVG options (key/value pairs).
	 * @return array
	 */
	public static function getAll(){
		$db = Database::get();
		$res = $db->get_results("SELECT * FROM ".$db->mapsvg_prefix."settings", ARRAY_A);
		$response = array();
		foreach($res as $re){
            $response[$re['key']] = static::decodeValue($re['key'], $re['value']);
		}
		return $response;
	}

	/**
	 * Returns an option value by its name
	 * @return mixed
	 */
	public static function get($field){
		$db = Database::get();
        $value = $db->get_var("SELECT value FROM ".$db->mapsvg_prefix."settings WHERE `key`='".esc_sql($field)."'");
        return static::decodeValue($field, $value);
	}

	/**
	 * Sets an option value
	 * @return void
	 */
	public static function set($field, $value){
		$db = Database::get();
        $value = static::encodeValue($field, $value);
		$db->replace($db->mapsvg_prefix."settings", ["key"=>$field, "value" => $value]);
	}

    /**
     * Sets an option value
     * @param array $fields
     * @return void
     */
    public static function setAll($fields){
        $db = Database::get();
        foreach($fields as $key => $value){
            static::set($key, $value);
        }
    }

    public static function decodeValue($field, $value){
        if($field === 'seen_whats_new') {
            $value = (bool)$value;
            return $value;
        } elseif($field === 'mappable_post_types') {
            return json_decode($value, true);
        } else {
            return $value;
        }
    }
    public static function encodeValue($field, $value){
        if($field === 'mappable_post_types'){
            return json_encode($value, JSON_UNESCAPED_UNICODE);
        } else {
            return $value;
        }
    }
}
