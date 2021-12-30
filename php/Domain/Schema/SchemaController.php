<?php
namespace MapSVG;

class SchemaController extends Controller {

    /**
     * Returns all schemas
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public static function index($request){
        $schemaRepository = new SchemaRepository();
        $response   = array();
        $query = new Query($request->get_params());
        $response['schemas'] = $schemaRepository->find($query);

        return new \WP_REST_Response($response, 200);
    }

    /**
	 * Creates new schema
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function create( $request ) {
		$schemaRepository = new SchemaRepository();
		$response = array();
		$data = static::formatReceivedData($request['schema']);
		$response['schema'] = $schemaRepository->create($data);
		return self::render($response, 200);
	}

	/**
	 * Updates schema
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function update( $request ) {
		$schemaRepository = new SchemaRepository();
		$data = static::formatReceivedData($request['schema']);
		$schemaRepository->update($data);
		return self::render([], 200);
	}

	/**
	 * Workaround for Apache mod_sec module that blocks request by special words
	 * such as "select, table, database, varchar".
	 * Those words are replaced by MapSVG with special placeholders on the client side
	 * before sending the data to server. Then those placeholders need to be replaced back with the words.
	 *
	 * @param array $data
	 * @return array
	 */
	public static function formatReceivedData($data){

		if(isset($data)){
			if(!is_string($data)){
				$data = json_encode($data, JSON_UNESCAPED_UNICODE);
			}
			$data = str_replace("!mapsvg-encoded-slct", "select",   $data);
			$data = str_replace("!mapsvg-encoded-tbl",  "table",    $data);
			$data = str_replace("!mapsvg-encoded-db",   "database", $data);
			$data = str_replace("!mapsvg-encoded-vc",   "varchar",  $data);
			$data = str_replace("!mapsvg-encoded-int",   "int(11)",  $data);
			$data = json_decode($data, true);
		}
		return $data;
	}
}
