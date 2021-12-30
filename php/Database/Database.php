<?php


namespace MapSVG;


/**
 * Proxy class that redirects all method calls to $wpdb
 * @package MapSVG
 */
class Database {

	private $db;
	public $prefix;
	public $mapsvg_prefix;
	public $posts;
	public $postmeta;
	private static $dbInstance ;
	public $insert_id;

	public function __construct()
	{
		global $wpdb;
		$this->db     = $wpdb;
		$this->mapsvg_prefix = $this->db->prefix . MAPSVG_PREFIX;
		$this->prefix = $this->db->prefix;
		$this->postmeta = $this->db->postmeta;
		$this->posts = $this->db->posts;
	}



	public function db_version(){
		return $this->db->db_version();
	}

	public function posts(){
		return $this->db->posts;
	}

	/* @return Database */
	public static function get()
	{
		if(!self::$dbInstance){
			self::$dbInstance = new self();
		}
		return self::$dbInstance;
	}

	public function getCaller()
	{
		$dbt = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS,4);
		$caller = isset($dbt[3]['function']) ? $dbt[3]['function'] : '';
		return $caller;
	}

	public function handleError($string = '')
	{
		if($this->db->last_error){
			$caller = $this->getCaller();
			Logger::error($this->db->last_error);
//            throw new \Exception('Method: '.$caller.'() / DB failed query'.(MAPSVG_DEBUG ? ': '.$this->db->last_error." / ".$this->db->last_query : ''));
			//throw new \Exception('Method: '.$caller.'() / DB failed query'.(MAPSVG_DEBUG ? ': '.$this->db->last_error." / ".$this->db->last_query : ''));
		}
	}

	public function query($query)
	{
		$time = microtime(true);
		$res = $this->db->query($query);
		$this->handleError($query);
		Logger::addDatabaseQuery($this->db->last_query, $time);
		return $res;
	}

	public function get_col($query, $num)
	{
		$res = $this->db->get_col($query, $num);
		$this->handleError();
		return $res;
	}

	public function get_var($query)
	{
		$time = microtime(true);
		$res = $this->db->get_var($query);
		$this->handleError();
		Logger::addDatabaseQuery($this->db->last_query, $time);
		return $res;
	}

	public function get_row($query, $output = OBJECT)
	{
		$time = microtime(true);
		$res = $this->db->get_row($query, $output);
		$this->handleError();
		Logger::addDatabaseQuery($this->db->last_query, $time);
		return $res;
	}

	public function get_results($query, $responseType = OBJECT)
	{
		$time = microtime(true);
		$res = $this->db->get_results($query, $responseType);
		$this->handleError();
		Logger::addDatabaseQuery($this->db->last_query, $time);
		return $res;
	}

	public function insert($table, $data)
	{
		$time = microtime(true);
		$res = $this->db->insert($table, $data);
		$this->insert_id = $this->db->insert_id;
		$this->handleError();
		Logger::addDatabaseQuery($this->db->last_query, $time);
		return $res;
	}

	public function update($table, $data, $where = null)
	{
		$time = microtime(true);
		$res = $this->db->update($table, $data, $where);
		$this->handleError();
		Logger::addDatabaseQuery($this->db->last_query, $time);
		return $res;
	}

	public function replace($table, $data, $where = null)
	{
		$time = microtime(true);
		$res = $this->db->replace($table, $data, $where);
		$this->handleError();
		Logger::addDatabaseQuery($this->db->last_query, $time);
		return $res;
	}

	public function delete($table, $data)
	{
		$time = microtime(true);
		$res = $this->db->delete($table, $data);
		$this->handleError();
		Logger::addDatabaseQuery($this->db->last_query, $time);
		return $res;
	}

	public function prepare($data, $values)
	{
		return $this->db->prepare($data, $values);
	}
}
