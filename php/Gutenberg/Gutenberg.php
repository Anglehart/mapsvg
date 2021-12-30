<?php

namespace MapSVG;

class Gutenberg
{
    function updatePostData($postOrId){

        $db = Database::get();

        if(!is_object($postOrId)){
            $post = get_post($postOrId);
        } else {
            $post = $postOrId;
        }

        $id = $post->ID;

        $table = 'posts_'.$post->post_type;

        $schemaRepo = new SchemaRepository();
        $schema = $schemaRepo->findOne(["name"=>$table]);

        if(!$schema){
            return false;
        }

        $meta = get_post_meta($id, 'mapsvg_location', true);
        $location = json_decode($meta, true);

        $params = array(
            'post'  => $id,
            'location' => $location
        );

        if (!$location['geoPoint']) {
            $this->deletePostData($id);
            return;
        }

        $postsRepo = new ObjectsRepository($table);
        $post = $postsRepo->findOne(["post" => $id]);

        if ($post){
            $post->update($params);
            $postsRepo->update($post);
        } else {
            $postsRepo->create($params);
        }
    }

    function deletePostData($postID) {
        $post = get_post($postID);
        $table = 'posts_'.$post->post_type;
        $postsRepo = new ObjectsRepository($table);
        $postInMapsvgTable = $postsRepo->findOne(["post" =>  $postID]);
        $postsRepo->delete($postInMapsvgTable->id);
    }

    function init(){

        $this->addLocationFieldToPosts();

        $mappable_post_types = Options::get('mappable_post_types');

        if(!empty($mappable_post_types)){
            foreach($mappable_post_types as $post_type){
                add_action( 'rest_after_insert_'.$post_type, [$this, 'updatePostData'], 10, 2);
                add_action( 'untrash_'.$post_type, [$this, 'updatePostData'] );
                add_action( 'wp_trash_'.$post_type, [$this, 'deletePostData'] );
            }
        }
    }

    function addLocationFieldToPosts() {
        register_meta('post', 'mapsvg_location', array(
            'object_subtype' => 'page',
            'show_in_rest' => true,
            'type' => 'string',
            'single' => true,
        ));
        register_meta('post', 'mapsvg_location', array(
            'object_subtype' => 'post',
            'show_in_rest' => true,
            'type' => 'string',
            'single' => true,
        ));
    }
}