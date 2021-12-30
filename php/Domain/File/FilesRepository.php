<?php


namespace MapSVG;


class FilesRepository {

	public $readFolders;
	public $writeToFolder;
	public $rootDir;
	public $modelClass = 'File';
	public $fileTypes = array('svg');

	public function __construct(array $readFolders = null, $writeToFolder = null, array $fileTypes = array('svg')) {
		$this->readFolders = $readFolders;
		$this->writeToFolder = $writeToFolder;
		$this->rootDir = str_replace(['\\', '/'], DIRECTORY_SEPARATOR, ABSPATH);
		$this->fileTypes = $fileTypes;
	}

	public function getModelClass(){
		return __NAMESPACE__.'\\'.$this->modelClass;
	}

	public function newFile($data){
		$class = $this->getModelClass();
		return new $class($data);
	}

	/**
	 * Get the list of all SVG files
	 *
	 * @return array List of the maps
	 */
	public function find(){

		$files = array();

		foreach ($this->readFolders as $folder){
			if(is_dir($folder)) {
				foreach ( new \RecursiveIteratorIterator( new \RecursiveDirectoryIterator( $folder ) ) as $filename ) {
					if(in_array(pathinfo($filename, PATHINFO_EXTENSION), $this->fileTypes) ) {
						$path   = str_replace( '\\', '/', str_replace( $this->rootDir, '/', $filename ) );
						$files[] = $this->newFile( array(
							"path" => $path
						));
					}
				}
			}
		}

		sort($files);

		return $files;
	}

	public function checkUploadDir(){
		$mapsvg_error = false;
		if(!file_exists($this->writeToFolder)){
			if(!wp_mkdir_p($this->writeToFolder))
				$mapsvg_error = "Unable to create directory ".$this->writeToFolder.". Is its parent directory writable by the server?";
		}else{
			if(!wp_is_writable($this->writeToFolder))
				$mapsvg_error = $this->writeToFolder." is not writable. Please change the folder permissions.";
		}
		return $mapsvg_error;
	}

	/**
	 * Updates SVG file edits (the function is used by "Edit SVG file" mode in MapSVG)
	 * @param FileInterface $file
	 * @return FileInterface
	 * @throws \Exception
	 */
	function update($file){
		$this->save($file);
		return $file;
	}


	/**
	 * Make a copy of one of the included SVG files, which are "read-only", put the copy to "uploads" folder
	 * so users could edit the SVG file.
	 * @param FileInterface $file
	 * @return FileInterface
	 * @throws \Exception
	 */
	public function copy(FileInterface $file){

		$actual_name = pathinfo($file->name,PATHINFO_FILENAME);
		$original_name = $actual_name;
		$extension = pathinfo($file->name, PATHINFO_EXTENSION);

		$i = 1;
		$last_exising_number = 1;

		while(file_exists($this->writeToFolder.DIRECTORY_SEPARATOR.$actual_name.".".$extension))
		{
			if(strpos($original_name, '_') !== false ){
				$parts = explode('_',$original_name);
				$number = array_pop($parts);
				if(is_numeric($number)){
                    $number = (int)$number;
					$last_exising_number = $number + 1;
				}
				$parts[] = $last_exising_number;
				$actual_name = implode('_',$parts);
			} else {
				$actual_name = (string)$original_name.'_'.$i;
				$i++;
			}
		}

		$newfile =  $this->writeToFolder.DIRECTORY_SEPARATOR.$actual_name.".".$extension;

		$root = ABSPATH;
		$root = wp_normalize_path($root);
		list($junk,$important_stuff) = explode(basename(WP_CONTENT_DIR), $file->path);
		$fileNameFrom = WP_CONTENT_DIR.$important_stuff;

		$error = $this->checkUploadDir();

		if(!$error){
			if(!copy($fileNameFrom, $newfile)){
				$error = "Failed to copy the file";
			}
		}

		if(!$error){
			return $this->newFile(array('path'=>$newfile));
		}else{
			throw new \Exception($error, 400);
		}
	}

	/**
	 * Creates new SVG file
	 * @param FileInterface $file
	 * @returns FileInterface
	 */
	public function create($file){
		$this->save($file);
		return $file;
	}

	/**
	 * @param FileInterface $file
	 * @returns FileInterface
	 * @throws \Exception
	 */
	public function save(FileInterface $file) {

		$mapsvg_error = $this->checkUploadDir();

		if ( ! $mapsvg_error ) {
			if(!$file->pathFull){
				$file->setPath($this->writeToFolder . DIRECTORY_SEPARATOR . $file->name);

			}
			$_file = fopen( $file->pathFull , 'w' );
			$res = fwrite( $_file, $file->body);
			fclose( $_file );

			if($res === false){
				throw new \Exception('Can\'t write data to the file', 400);
			}
			return $this;
		} else {
			throw new \Exception($mapsvg_error, 400);
		}
	}

	/**
	 * @param FileInterface $file
	 * @returns FileInterface
	 * @throws \Exception
	 */
	public function upload($_file) {

		$mapsvg_error = $this->checkUploadDir();

		if ( ! $mapsvg_error ) {

			$fileClass = $this->getModelClass();

			$file = new $fileClass(array('path' => $this->writeToFolder.DIRECTORY_SEPARATOR.$_file['name']));

			if(move_uploaded_file($_file['tmp_name'], $file->pathFull)){
				return $file;
			} else {
				throw new \Exception('Can\'t upload the file', 400);
			}
		} else {
			throw new \Exception($mapsvg_error, 400);
		}
	}


}
