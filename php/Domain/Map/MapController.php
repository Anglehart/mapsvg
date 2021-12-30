<?php
namespace MapSVG;

/**
 * Map Controller Class
 * @package MapSVG
 */
class MapController extends Controller {

	/**
	 * Returns a map by ID
	 * @param \WP_REST_Request $request
	 *
	 * @return \WP_REST_Response
	 * @throws \Exception
	 */
	public static function get($request){
		$mapsRepository = new MapsRepository();
		$response   = array();
		$map = $mapsRepository->findById($request['id']);
		$response['map'] = $map;
		return self::render($response, 200);;
	}

	/**
	 * Creates a new map
	 *
	 * @param \WP_REST_Request $request
	 *
	 * @return \WP_REST_Response
	 * @throws \Exception
	 */
	public static function create($request){

		$mapData = $request['map'];

		$mapsRepository = new MapsRepository();

        $mapData["options"] = json_decode($mapData["options"], true);
        $mapData["options"]["filtersSchema"] =
            [["type" => "select","db_type" => "varchar(255)","label" => "Category","name" => "category","searchable" => "","multiselect" => "","optionsGrouped" => "","options" => [["label" => "First","value" => "1"],["label" => "Second","value" => "2"],["label" => "Third","value" => "3"]],"optionsDict" => ["1" => "First","2" => "Second","3" => "Third"],"parameterName" => "Object.category","parameterNameShort" => "category","placeholder" => "","visible" => true],["type" => "distance","db_type" => "varchar(255)","label" => "Search by address","name" => "distance","value" => "","searchable" => "","options" => [["value" => "10","default" => true,"selected" => true],["value" => "30","default" => false],["value" => "50","default" => false],["value" => "100","default" => false]],"optionsDict" => [],"distanceControl" => "select","distanceUnits" => "km","distanceUnitsLabel" => "km","fromLabel" => "from","addressField" => true,"addressFieldPlaceholder" => "Address","userLocationButton" => "","placeholder" => "","language" => "","country" => "","searchByZip" => "","zipLength" => 5,"parameterName" => "","parameterNameShort" => "","visible" => true]];
        $mapData["options"] = json_encode($mapData["options"], JSON_UNESCAPED_UNICODE);


		$map = $mapsRepository->create([
			'options' => $mapData['options'],
			'version' => MAPSVG_VERSION
		]);

		return self::render(['map' => $map], 200);
	}

	/**
	 * Creates a new map based on the settings of a v2.4.1 map
	 *
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function createFromV2($request){

		$mapsRepository = new MapsRepository();
		$schemaRepo = new SchemaRepository();

		$mapData = $request['map'];

		if(is_string($mapData['options'])){
			$mapData['options'] = json_decode($mapData['options'], true);
		}

		$map = $mapsRepository->create([
			'options' => $mapData['options'],
			'version' => MAPSVG_VERSION
		]);

		// 1. Add tooltip/popover fields to regions and objects tables
		$schemaRegions = $map->regions->getSchema();

		$addTooltipToRegions = false;
		$addPopoverToRegions = false;
		$addTooltipToObjects = false;
		$addPopoverToObjects = false;

		$goToLinkRegion = false;
		$goToLinkMarker = false;

		if(isset($mapData['options']['regions'])){

			// Set disabled status
			$update = false;
			$statusData = array();
			foreach($mapData['options']['regions'] as $region){
				if( isset($region['href']) ||
				    isset($region['disabled']) ||
				   (isset($region['tooltip']) && strlen($region['tooltip']) > 0) ||
				   (isset($region['popover']) && strlen($region['popover']) > 0)
				){
					$_data = array(
						'id' => $region['id']
					);

					if(isset($region['href'])){
						$_data['link'] = $region['href'];
						$goToLinkRegion = true;
					}
					if(isset($region['disabled'])){
						$_data['status'] = filter_var($region['disabled'], FILTER_VALIDATE_BOOLEAN);
					}
					if(isset($region['tooltip']) && strlen($region['tooltip']) > 0){
						$addTooltipToRegions = true;
						$_data['tooltip'] = $region['tooltip'];
					}

					if(isset($region['popover']) && strlen($region['popover']) > 0){
						$addPopoverToRegions = true;
						$_data['popover'] = $region['popover'];
					}
					$updateData[] = $_data;
				}
			}

			if($addPopoverToRegions){
				$schemaRegions->addField( array(
					"name"    => "popover",
					"label"   => "Popover",
					"type"    => "textarea",
					"db_type" => "text",
					"visible" => true,
					"html" => true,
					"help" => "You can use HTML in this field"
				));
			}
			if($addTooltipToRegions){
				$schemaRegions->addField( array(
					"name"    => "tooltip",
					"label"   => "Tooltip",
					"type"    => "textarea",
					"db_type" => "text",
					"visible" => true,
					"html" => true,
					"help" => "You can use HTML in this field"
				) );
			}
			if($addPopoverToRegions || $addTooltipToRegions) {
				$schemaRepo->update( $schemaRegions );
			}

			if(count($updateData) > 0){
				$map->regions->createOrUpdateAll($updateData);
			}


		}

		if(isset($mapData['options']['markers'])) {
			foreach ( $mapData['options']['markers'] as $marker) {
				if ( isset( $marker['tooltip'] ) && strlen( $marker['tooltip'] ) > 0 ) {
					$addTooltipToObjects = true;
				}
				if ( isset( $marker['popover'] ) && strlen( $marker['popover'] ) > 0 ) {
					$addPopoverToObjects = true;
				}
			}

			$schemaObjects = $map->objects->getSchema();

			if($addPopoverToObjects) {
				$schemaObjects->addField( array(
					"name"    => "popover",
					"label"   => "Popover",
					"type"    => "textarea",
					"db_type" => "text",
					"visible" => true,
					"html" => true,
					"help" => "You can use HTML in this field"
				) );
			}
			if($addTooltipToObjects) {
				$schemaObjects->addField( array(
					"name"    => "tooltip",
					"label"   => "Tooltip",
					"type"    => "textarea",
					"db_type" => "text",
					"visible" => true,
					"html" => true,
				     "help" => "You can use HTML in this field"
				));
			}
			if($addPopoverToObjects || $addTooltipToObjects){
				$schemaRepo->update( $schemaObjects );
			}
		}

		// 2. Add data from map.options.regions to the regions table
		// 3. Convert map.options.markers to objects and insert to the objects table
		if(isset($mapData['options']['markers'])){
			foreach($mapData['options']['markers'] as $marker){
				$object = array(
					'location' => array(
						'img' => $marker['src']
					)
				);
				if(isset($marker['href'])){
					$object['link'] = $marker['href'];
					$goToLinkMarker = true;
				}
				if(isset($marker['geoCoords'])){
					$object['location']['geoPoint'] = array("lat" => $marker['geoCoords'][0], "lng" => $marker['geoCoords'][1]);
				}
				if(isset($marker['x']) && isset($marker['y'])){
					$object['location']['svgPoint'] = array("x" => $marker['x'], "y" => $marker['y']);
				}
				$map->objects->create($object);
			}
		}
		// 4. Move events
		$oldEvents = [
			'afterLoad'=>['afterLoad'],
			'beforeLoad'=>['beforeLoad'],
			'onClick'=>['click.region','click.marker'],
			'mouseOver'=>['mouseover.region','mouseover.marker'],
			'mouseOut'=>['mouseout.region','mouseout.marker']
		];

		$mapData['options']['events'] = array();
		foreach($oldEvents as $oldEvtName => $newEvents){
			if(isset($mapData['options'][$oldEvtName])){
				foreach($newEvents as $newEventName){
					$map->options['events'][$newEventName] = $mapData['options'][$oldEvtName];
				}
			}
		}

		// 5. If gauge == ON add the "choropleth" fields to regions
		// TODO Vyacheslav: Проверить работу после апгрейда choropleth механик
		if(isset($mapData['options']['choropleth']) && isset($mapData['options']['choropleth']['on']) && filter_var($mapData['options']['choropleth']['on'], FILTER_VALIDATE_BOOLEAN)){
			$map->options['choropleth']['sourceField'] = 'stat';
			$schemaRegions->addField(array(
				"name" => "stat",
				"label" => "Stat",
				"type" => "text",
				"db_type" => "varchar(10)",
				"visible" => true
			));
			$schemaRepo->update($schemaRegions);
			foreach($mapData['options']['regions'] as $region){
				if(isset($region['gaugeValue'])){
					$newRegionData = array(
						'id' => $region['id'],
						'stat' => $region['gaugeValue']
					);
					$map->regions->update($newRegionData);
				}
			}
		}

		// 6. Convert menu
		if(isset($map->options['menu']) && isset($map->options['menu']['on']) && filter_var($map->options['menu']['on'], FILTER_VALIDATE_BOOLEAN)){
			$map->options['menu']['source'] = 'regions';
			$map->options['containers'] = ["leftSidebar" => ["on" => true]];
		} elseif(isset($map->options['menuMarkers']) && isset($map->options['menuMarkers']['on']) && filter_var($map->options['menuMarkers']['on'], FILTER_VALIDATE_BOOLEAN)){
			$map->options['menuMarkers']['source'] = 'database';
			$map->options['containers'] = ["leftSidebar" => ["on" => true]];
		}

		// 7. Convert templates, set actions
		if(!isset($map->options['tooltips'])){
			$map->options['tooltips'] = [];
		}
		$map->options['tooltips']['on'] = true;
		$map->options['actions']['region']['click']['showPopover'] = true;
		$map->options['actions']['region']['click']['showDetails'] = false;
		$map->options['actions']['marker']['click']['showPopover'] = true;
		$map->options['actions']['marker']['click']['showDetails'] = false;
		$map->options['actions']['directoryItem']['click']['showPopover'] = true;
		$map->options['actions']['directoryItem']['click']['showDetails'] = false;
		if($goToLinkMarker){
			$map->options['actions']['marker']['click']['showPopover'] = false;
			$map->options['actions']['marker']['click']['goToLink'] = true;
		}
		if($goToLinkRegion){
			$map->options['actions']['region']['click']['showPopover'] = false;
			$map->options['actions']['region']['click']['goToLink'] = true;
		}
		$map->options['templates']['popoverMarker'] = '{{popover}}';
		$map->options['templates']['popoverRegion'] = '{{popover}}';
		$map->options['templates']['tooltipMarker'] = '{{tooltip}}';
		$map->options['templates']['tooltipRegion'] = '{{tooltip}}';

		$mapsRepository->update($map);

		return self::render(['map' => $map], 200);;
	}

	/**
	 * Creates a copy of a map
	 * @param \WP_REST_Request $request
	 *
	 * @return \WP_REST_Response
	 * @throws \Exception
	 */
	public static function copy($request){
		$repository = new MapsRepository();
		$newMap = $repository->copy($request['id'], json_decode($request['options'], true));
		return self::render(['map' => $newMap], 200);
	}

	/**
	 * Updates a map
	 * @param \WP_REST_Request $request
	 *
	 * @return \WP_REST_Response
	 * @throws \Exception
	 */
	public static function update($request){

        $mapData = (array)$request['map'];

		// Prevent blockage by Apache's mod_sec
		if(isset($request['map']) && isset($request['map']['options'])) {
            $mapData['options'] = str_replace("!mapsvg-encoded-slct", "select", $mapData['options']);
            $mapData['options'] = str_replace("!mapsvg-encoded-tbl", "table", $mapData['options']);
            $mapData['options'] = str_replace("!mapsvg-encoded-db", "database", $mapData['options']);
            $mapData['options'] = str_replace("!mapsvg-encoded-vc", "varchar", $mapData['options']);
            $mapData['options'] = str_replace("!mapsvg-encoded-int", "int(11)", $mapData['options']);
        }

        $mapsRepository = new MapsRepository();
        $map = $mapsRepository->findById($mapData['id']);
        $map->update($mapData);
        $mapsRepository->update($map);

        return self::render([], 200);
	}

	/**
	 * Updates a map status by ID
	 * @param \WP_REST_Request $request
	 * @return \WP_REST_Response
	 */
	public static function delete($request){

		$mapsRepository = new MapsRepository();
		$map = $mapsRepository->findById($request['id']);
		$map->setStatus(0);
		$mapsRepository->update($map);

		return self::render([], 200);
	}


}
