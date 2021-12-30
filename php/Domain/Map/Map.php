<?php
namespace MapSVG;

/**
 * Map class.
 */
class Map extends Model implements \JsonSerializable {

	public static $slugOne  = 'map';
	public static $slugMany = 'maps';

	/* @var ObjectsRepository $objects Custom DB objects */
	public $objects;

	/* @var RegionsRepository $regions Regions */
	public $regions;

	/* @var string Map title */
	public $title;

	/* @var array Map options */
	public $options;

	/* @var boolean Map optionsBroken state, when json_decode from DB failed */
	public $optionsBroken;

	/* @var string $svgFilePath Path to SVG file */
	public $svgFilePath;

	/* @var SVGFile $svgFile SVG file object instance */
	private $svgFile;

	/**
     * @var string $svgFileLastChanged - Timestamp of the last changes in SVG file.
	 * Added as a parameter to the SVG file URL to avoid cache issues
	 */
	public $svgFileLastChanged;

    /**
     * @var $status - defines if the map should be deleted
     */
    public $status;

    /**
     * @var $statusChangedAt - if status is 0 , the map will be deleted after 48 hours from this timestamp
     */
    public $statusChangedAt;

	/* @var string $version Number of MapSVG version the map was created in */
	public $version = MAPSVG_VERSION;

	/* @var bool $renderJsonWithObjects Defines if the list of child Objects should be included in JSON */
	private $renderJsonWithObjects = false;

	/* @var bool $renderJsonWithRegions Defines if the list of child Regions should be included in JSON */
	private $renderJsonWithRegions = false;

	/* @var bool $renderJsonWithData Defines if Schema should be included in JSON */
	private $renderJsonWithSchema = false;



	public function __construct( $data ) {
		parent::__construct( $data );

        if(!isset($this->optionsBroken)){
            $this->setOptionsBroken(false);
        }
        if($this->optionsBroken){
            return;
        }

		if(!isset($this->options['database'])){
			$this->options['database'] = ['pagination'=>["on" => true, "perpage" => 30]];
		}

		// If map ID is provided, create instances of Regions and Objects repositories
		if($this->id){
			if(!isset($this->options['database']['regionsTableName'])){
				$this->options['database']['regionsTableName'] = 'regions_'.$this->id;
			}
			if(!isset($this->options['database']['objectsTableName'])){
				$this->options['database']['objectsTableName'] = 'objects_'.$this->id;
			}

			$this->regions = new RegionsRepository($this->options['database']['regionsTableName']);
			$this->objects = new ObjectsRepository($this->options['database']['objectsTableName']);
		}

		if(!isset($this->status)){
		    $this->setStatus(1);
        }

		// Set up title based on the file name
		if(!isset($this->title) && isset($this->options) && isset($this->options['source'])){
			if(!isset($this->options['title']) || empty($this->options['title'])){
				$this->options['title'] = ucwords(str_replace('-',' ', basename($this->options['source'], '.svg')));
			}
			$this->setTitle($this->options['title']);
		}
	}

	/**
	 * Returns map essential data
	 * @return array
	 */
	public function getData() {
		$data = array(
			'id' => $this->id,
			'title' => $this->title,
			'options' => $this->options,
			'svgFilePath' => $this->svgFilePath,
			'svgFileLastChanged' => $this->svgFileLastChanged,
			'version' => $this->version,
            'status' => $this->status,
            'statusChangedAt' => $this->statusChangedAt
		);
		if($this->optionsBroken){
            $data['optionsBroken'] = true;
        }
		return $data;
	}
    public function setStatus($status)
    {
      $this->status = $status;
      $this->setStatusChangedAt();
    }

    public function setStatusChangedAt()
    {
      $this->statusChangedAt = date('Y-m-d H:i:s');
    }

    /**
	 * Defines data that should be passed to json_encode()
	 * @return array|mixed
	 */
	public function jsonSerialize()
	{

		$data = $this->getData();
		if(isset($data['optionsBroken'])){
		    return $data;
        }

		if($this->renderJsonWithRegions){
            $sortBy  = ( isset($this->options['menu']) && $this->options['menu']['source'] == 'regions' ? (isset($this->options['menu']['sortBy']) ?  $this->options['menu']['sortBy'] : 'id') : ( isset($this->options['menu']) && strpos($this->options['source'],'geo-cal') !== false ? 'title' : 'id' ) );
            $sortDir = isset($this->options['menu']) &&  $this->options['menu']['source'] == 'regions' ? (isset($this->options['menu']['sortDirection']) ?  $this->options['menu']['sortDirection'] : 'desc') : 'asc';
            $sort = [["field" => $sortBy, "order" => $sortDir]];

            $regionsQuery = array(
                'perpage' => 0,
                'sortBy'  => ( isset($this->options['menu']) && $this->options['menu']['source'] == 'regions' ? (isset($this->options['menu']['sortBy']) ?  $this->options['menu']['sortBy'] : 'id'): ( isset($options['menu']) && strpos($this->options['source'],'geo-cal') !== false ? 'title' : 'id' ) ),
                "sort" => $sort
            );
            if(isset($this->options['menu']) && isset($this->options['menu']['filterout']) && $this->options['menu']['source']=='regions' && !empty($this->options['menu']['filterout']['field'])){
                $regionsQuery['filterout'][$this->options['menu']['filterout']['field']] = $this->options['menu']['filterout']['val'];
            }
            if($this->regions) $this->regions->fill($regionsQuery);

            if($this->renderJsonWithSchema){
                if($this->regions) $this->regions->withSchema();
            }
            $data['options']['data_regions'] = $this->regions;
        }
        if($this->renderJsonWithObjects){
            $sortBy  = ( isset($this->options['menu']) && $this->options['menu']['source'] == 'database' ? (isset($this->options['menu']['sortBy']) ?  $this->options['menu']['sortBy'] : 'id') : ( isset($this->options['menu']) && strpos($this->options['source'],'geo-cal') !== false ? 'title' : 'id' ) );
            $sortDir = isset($this->options['menu']) &&  $this->options['menu']['source'] == 'database' ? (isset($this->options['menu']['sortDirection']) ?  $this->options['menu']['sortDirection'] : 'desc') : 'asc';
            $sort = [["field" => $sortBy, "order" => $sortDir]];

            $objectsQuery = array(
                'perpage' => isset($this->options['database']) && (int)$this->options['database']['pagination']['on'] ? $this->options['database']['pagination']['perpage'] : 0,
                "sort" => $sort
            );
            if(isset($this->options['menu']) && isset($this->options['menu']['filterout']) && $this->options['menu']['source']=='database' && !empty($this->options['menu']['filterout']['field'])) {
                $objectsQuery['filterout'][ $this->options['menu']['filterout']['field'] ] = $this->options['menu']['filterout']['val'];
            }

            if($this->objects) $this->objects->fill($objectsQuery);

            if($this->renderJsonWithSchema){
                if($this->objects) $this->objects->withSchema();
            }
            $data['options']['data_objects'] = $this->objects;
        }

		$data['options']['id'] = $this->id;
		$data['options']['version'] = $this->version;

		return $data;
	}

	/**
	 * Defines whether JSON should contain Regions/Objects arrays
	 */
	public function withObjects(){
		$this->renderJsonWithObjects = true;
	}

	/**
	 * Defines whether JSON should contain Regions/Objects arrays
	 */
	public function withRegions(){
		$this->renderJsonWithRegions = true;
	}

	/**
	 * Defines whether JSON should contain Schema
	 */
	public function withSchema(){
		$this->renderJsonWithSchema = true;
	}

	/**
	 * Sets map title
	 * @param string|null $title
	 */
	public function setTitle($title = null){
		$this->title = $title;
	}

	/**
	 * Sets SVG file path and loads its "modified" timestamp
	 * @param string|null $svgFilePath
	 */
	public function setSvgFilePath($svgFilePath = null){
		if($this->svgFilePath !== $svgFilePath){
			$this->svgFilePath = $svgFilePath;
			$this->svgFile = new SVGFile(array('relativeUrl'=>$this->svgFilePath));
			$this->setSvgFileLastChanged($this->svgFile->lastChanged());
		}
	}

	/**
	 * Sets the timestamp of the last changes in the file
	 * @param string|null $svgFileLastChanged
	 */
	public function setSvgFileLastChanged($svgFileLastChanged = null){
		$this->svgFileLastChanged = (int)$svgFileLastChanged;
	}

	/**
	 * Sets map ID
	 * @param int $id
	 */
	public function setId($id = 0){
		$this->id = $id;
	}

	/**
	 * Sets map options broken state
	 * @param $options
	 */
	public function setOptionsBroken($value){
        $this->optionsBroken = $value;
    }
	/**
	 * Sets map options
	 * @param $options
	 */
	public function setOptions($options){
	    // todo вот тут ломается апгрейд
		if(is_string($options)){
			$tryDecode = json_decode($options, true);
			if(!$tryDecode){
			    $this->setOptionsBroken(true);
                $this->options = $options;
            } else {
			    $this->options = $tryDecode;
            }
		} else {
            $this->options = $options;
        }
		if($this->options && is_array($this->options) && isset($this->options['source'])){
            $this->setOptionsBroken(false);
            $filePath = isset($this->options['source']) ? $this->options['source'] : '';
            $this->setSvgFilePath($filePath);
        } else {
            $this->setOptionsBroken(true);
            return;
        }

	}

	/**
	 * Sets the version number of MapSVG the map was created in
	 * @param $options
	 */
	public function setVersion($version){
		$this->version = $version;
	}


	/**
	 * Parses an SVG file, gets all SVG objects that must be added to the "Regions" table
	 * and updates "regions" table in the database
	 *
	 * @param $prefix //If prefix is provided, only SVG objects with the provided prefix get
	 * @param $updateTitles
	 * into the "Regions" list
	 *
	 * @throws \Exception
	 */
	function setRegionsTable($prefix = '', $updateTitles = null){

		// Convert related URL of the file to absolute server path
		if(strpos($this->svgFilePath, basename(WP_CONTENT_DIR))!==false){
			list($junk, $fileServerPath) = explode(basename(WP_CONTENT_DIR), $this->svgFilePath);
			$fileServerPath = WP_CONTENT_DIR.$fileServerPath;
		} else {
			list($junk,$fileServerPath) = explode(basename(MAPSVG_UPLOADS_DIR), $this->svgFilePath);
			$fileServerPath = MAPSVG_UPLOADS_DIR.$fileServerPath;
		}

		if(file_exists($fileServerPath)){
			$svgFile = simplexml_load_file($fileServerPath);
		} else {
			throw new \Exception('File does not exists: '.$fileServerPath, 404);
		}

		// The following list of SVG objects can be converted to Regions
		$allowed_objects = array(null,'path','ellipse','rect','circle','polygon','polyline');

		$namespaces = $svgFile->getDocNamespaces();
		$svgFile->registerXPathNamespace('_ns', $namespaces['']);

		$regions = array();
		$regionIdsFromSvg = array();
		$regionTitlesFromSvg = array();
		$regions_assoc = array();

		$db_types = $this->regions->getSchema()->getFieldTypes();
		$db_types = array_flip($db_types);

		$status_field = isset($db_types['status']);

		// Parse the SVG file, find objects that can be converted to Regions
		while($obj = next($allowed_objects)){
			$nodes = $svgFile->xpath('//_ns:'.$obj);

			if(!empty($nodes)){
				foreach($nodes as $o){

					if(isset($o['id']) && ! empty($o['id'])){

						// Skip the node if it's inside of the <defs></defs> tag
						$defs = $svgFile->xpath('//_ns:'.$obj.'[@id="'.$o['id'].'"]/ancestor::_ns:defs');
						if(!empty($defs)){
							continue;
						}

						if(!$prefix || ($prefix && strpos($o['id'],$prefix)===0)){

							if($prefix && strpos($o['id'],$prefix) === 0){
								// Strip the prefix, if it's provided
								$rid = substr($o['id'], strlen($prefix));
							} else {
								$rid = (string)$o['id'];
							}
							$title               = isset($o['title']) && ! empty($o['title']) ? (string)$o['title'] : '';
							$regions[]           = "('".esc_sql($rid) ."','".esc_sql($title)."'".($status_field? ",1" : "" ).")";
							$region              = array('id'=>$rid, 'title'=>$title);
							$regionsFromSvg[]    = $region;
							$regionIdsFromSvg[]        = $rid;
							$regionTitlesFromSvg[]     = $title;
							$regions_assoc[$rid] = $title;
						}
					}
				}
			}
		}

		sort($regionIdsFromSvg);
		sort($regionTitlesFromSvg);

		// Now compare the list of Regions found in the SVG file
		// with the list of Regions in the database
		$regionsFromDb = $this->regions->find();
		$regionIdsFromDb = array();
		$regionTitlesFromDb = array();

		foreach($regionsFromDb as $region){
			$regionIdsFromDb[] = $region->id;
			$regionTitlesFromDb[] = isset($region->title) ? $region->title : '';
		}

		sort($regionIdsFromDb);
		sort($regionTitlesFromDb);

		// Find the regions presented in DB but missing in SVG
		$uniqueDbRegionsIds = array_diff($regionIdsFromDb, $regionIdsFromSvg);

		// If there is a difference then delete those regions from the database
		foreach($uniqueDbRegionsIds as $id){
			$this->regions->delete($id);
		};

		// Find the regions presented in SVG but missing in DB
		$uniqueSvgRegionsIds = array_diff($regionIdsFromSvg, $regionIdsFromDb);

		// If there is a difference then add regions to database
		$uniqueSvgRegions = [];
		$uniqueSvgRegionsTitles = [];
		if (!empty($uniqueSvgRegionsIds)){
			foreach($regionsFromSvg as $regionFromSvg){
				if (in_array($regionFromSvg['id'], $uniqueSvgRegionsIds)){
					$uniqueSvgRegions[] = $regionFromSvg;
					$uniqueSvgRegionsTitles[] = $regionFromSvg['title'];
				};
			}
			$this->regions->createOrUpdateAll($uniqueSvgRegions);
		}

		// If some titles have changed in the SVG file then update corresponding Regions in the database
		$currentRegionTitlesFromDb = array_merge($regionTitlesFromDb, $uniqueSvgRegionsTitles);
		sort($currentRegionTitlesFromDb);

		$changedRegionTitles = array_diff($regionTitlesFromSvg, $currentRegionTitlesFromDb);

		if((!empty($changedRegionTitles)) && ($updateTitles === true)){
			$changedRegions = [];
			foreach ($regionsFromSvg as $regionFromSvg){
				if (in_array($regionFromSvg['title'], $changedRegionTitles)){
					$changedRegions[] = $regionFromSvg;
				}
			}

			$this->regions->createOrUpdateAll($changedRegions);
		}

	}

}
