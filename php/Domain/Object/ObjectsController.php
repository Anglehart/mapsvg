<?php

namespace MapSVG;

use Clockwork\Request\Log;

/**
 * Objects Controller Class
 * @package MapSVG
 */
class ObjectsController extends Controller {

	public static function create($request){
		$objectsRepository = new ObjectsRepository( $request['_collection_name']);
		$response = array();
		$response['object'] = $objectsRepository->create($request['object']);
		Logger::info($response['object']);
		return self::render($response, 200);
	}

	public static function get($request){
		$objectsRepository = new ObjectsRepository( $request['_collection_name']);
		$response   = array();
		$response['object'] = $objectsRepository->findById($request['id']);
		if($response['object']){
			return self::render($response, 200);
		} else {
			return self::render(["message"=>"Object not found"], 404);
		}
	}

	public static function index($request) {
		$objectsRepository = new ObjectsRepository( $request['_collection_name']);
		$response   = array();

		$query = new Query($request->get_params());

		$response['objects'] = $objectsRepository->find($query);

		if($query->withSchema){
			$response['schema'] = $objectsRepository->getSchema();
		}
		return self::render($response, 200);
	}

	public static function clear($request) {
		$objectsRepository = new ObjectsRepository( $request['_collection_name']);
		$objectsRepository->clear();
		return self::render([], 200);
	}

	public static function update($request) {
		$objectsRepository = new ObjectsRepository( $request['_collection_name']);
		$object = $objectsRepository->findById($request['object']['id']);
        $objectData = $object->getData();
        $object->update($request['object']);
		$objectsRepository->update($object);
        $schema = $objectsRepository->getSchema();
        if(strpos($schema->name, "posts_") !== false) {
            $objectData = $object->getData();
            if($objectData['post']){
                if($request['object']['location']){
                    update_post_meta($objectData['post']->id, "mapsvg_location", json_encode($objectData['location'], JSON_UNESCAPED_UNICODE));
                } else {
                    delete_post_meta($objectData['post']->id, "mapsvg_location");
                }
            }
        }
		return self::render([], 200);
	}

	public static function delete($request) {

        $objectsRepository = new ObjectsRepository( $request['_collection_name']);
        $object = $objectsRepository->findById($request['id']);
        $schema = $objectsRepository->getSchema();
        if(strpos($schema->name, "posts_") !== false) {
            $objectData = $object->getData();
            if($objectData['post']){
                if($request['object']['location']){
                    update_post_meta($objectData['post']->id, "mapsvg_location", json_encode($objectData['location'], JSON_UNESCAPED_UNICODE));
                } else {
                    delete_post_meta($objectData['post']->id, "mapsvg_location");
                }
            }
        }

		$objectsRepository->delete($request['id']);
		return self::render([], 200);
	}

	/**
	 * Imports data from a CSV file
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function import($request) {

		$objectsRepository = new ObjectsRepository( $request['_collection_name']);

		$data = json_decode($request[$objectsRepository->getSlugMany()], true);
		$convertLatLngToAddress = filter_var($request['convertLatlngToAddress'], FILTER_VALIDATE_BOOLEAN);
		$objectsRepository->import($data, $convertLatLngToAddress);

        if(isset($objectsRepository->geocodingErrors) && count($objectsRepository->geocodingErrors) > 0){
            $response = [];
            $response["error"] = ["geocodingError" => $objectsRepository->geocodingErrors];
            return self::render($response, 400);
        } else {
            return self::render([], 200);
        }
 	}
}
