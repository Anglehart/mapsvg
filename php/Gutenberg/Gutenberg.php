<?php

namespace MapSVG;

class Gutenberg
{

    private $mappablePostTypes;

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

        $this->mappablePostTypes = \MapSVG\Options::get('mappable_post_types');
        $this->addLocationFieldToPosts();

        if(!empty($this->mappablePostTypes)){
            foreach($this->mappablePostTypes as $postType){
                add_action( 'rest_after_insert_'.$postType, [$this, 'updatePostData'], 10, 2);
                add_action( 'untrash_'.$postType, [$this, 'updatePostData'] );
                add_action( 'wp_trash_'.$postType, [$this, 'deletePostData'] );
            }
        }
    }

    function addLocationFieldToPosts() {
        if(!empty($this->mappablePostTypes)){
            foreach($this->mappablePostTypes as $postType) {
                add_post_type_support($postType, 'custom-fields');
                register_meta('post', 'mapsvg_location', array(
                    'object_subtype' => $postType,
                    'show_in_rest' => true,
                    'type' => 'string',
                    'single' => true,
                ));
            }
        }
    }
}
