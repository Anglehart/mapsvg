<?php


namespace MapSVG;


class PostsRepository {
	/**
	 * Find posts by title.
	 * Used in MapSVG Database forms, when users attaches posts to MapSVG DB objects
	 */
	public function find($query){

		$db = Database::get();

		$results = $db->get_results("SELECT id, post_title, post_content FROM ".$db->posts()." WHERE post_type='".esc_sql($query->filters['post_type'])."' AND post_title LIKE '".esc_sql($query->search)."%' AND post_status='publish' LIMIT 20", ARRAY_A);
		foreach($results as $key => $post){
            $results[$key]['url'] = get_permalink($post['id']);
			if (function_exists('get_fields') ) {
				$post["acf"] = get_fields($post["id"]);
			}
		}

		return $results;
	}
}
