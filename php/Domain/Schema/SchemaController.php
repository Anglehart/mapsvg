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
	public static function formatReceivedData(array $data){

		if(isset($data['fields'])){
			if(!is_string($data['fields'])){
				$data['fields'] = json_encode($data['fields'], JSON_UNESCAPED_UNICODE);
			}
			$data['fields'] = str_replace("!mapsvg-encoded-slct", "select",   $data['fields']);
			$data['fields'] = str_replace("!mapsvg-encoded-tbl",  "table",    $data['fields']);
			$data['fields'] = str_replace("!mapsvg-encoded-db",   "database", $data['fields']);
			$data['fields'] = str_replace("!mapsvg-encoded-vc",   "varchar",  $data['fields']);
			$data['fields'] = json_decode($data['fields'], true);
		}
		return $data;
	}
}