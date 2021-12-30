<?php

namespace MapSVG;

/**
 * Options Controller.
 * Contains just one "update" method that updates options in the database.
 * @package MapSVG
 */
class OptionsController extends Controller {

    public static function update($request){

        $options = json_decode($request['options'], true);
        foreach($options as $key => $value){
            if(is_string($value)){
                $value = trim($value);
            }
            Options::set($key, $value);
            if($key === 'mappable_post_types'){
                static::maybeCreateMappablePostTables($value);
            }
        }

        return new \WP_REST_Response(Options::getAll(), 200);
    }

    /**
     * @param $postTypes
     */
    public static function maybeCreateMappablePostTables($postTypes){
        foreach($postTypes as $postType){
            $tableName = 'posts_'.$postType;
            $tableExists = Repository::tableExists($tableName);
            if(!$tableExists){
                Repository::createRepository(["name"=>$tableName, "fields"=>[
                    [
                        "name" => "id",
                        "label" => "ID",
                        "type" => "id",
                        "db_type" => "int(11)",
                        "visible" => true,
                        "protected" => true,
                        "auto_increment" => true
                    ],
                    [
                        "name" => "location",
                        "label" => "Location",
                        "type" => "location",
                        "db_type" => "text",
                        "visible" => true,
                        "searchable" => true
                    ],
                    [
                        "name" => "post",
                        "label" => "Post",
                        "type" => "post",
                        "db_type" => "int(11)",
                        "visible" => true,
                        "readonly" => true
                    ],
                ]]);
            }
        }
    }
}
