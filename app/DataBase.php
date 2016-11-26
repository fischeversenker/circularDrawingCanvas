<?php

class Database {
	protected static $instance;
	private $sql;

	public static function getInstance()
	{
		if (null === self::$instance)
		{
			self::$instance = new self();
			self::$instance->sql = new SQLite3('data.db');
			self::$instance->initImageTable();
		}
		return self::$instance;
	}

	public function getAllImages() {
        $query = "SELECT * FROM images ";
        $result = $this->sql->query($query);
        return $this->fetchAll($result);

	}
	public function addImage($name, $artist) {
	    $query = "INSERT INTO images (name, artist) VALUES ('$name', '$artist');";
        if ($this->sql->exec($query) ) {
            return $this->sql->lastInsertRowID();
        }
        return false;
	}
	public function Vote4Image() {

	}
	//protected because of singleton
	protected function __constructor() {}

	private function fetchAll($resultSet) {
	    if (!($resultSet instanceof SQLite3Result)) return array();
	    $result = array();
	    while($row = $resultSet->fetchArray(SQLITE3_ASSOC)) {
            array_push($result, $row);
        }
        return $result;
    }
	private function initImageTable() {
		$query = 'CREATE TABLE IF NOT EXISTS images'.
			' (id INTEGER     NOT NULL  PRIMARY KEY   AUTOINCREMENT,'.
			' name      TEXT  NOT NULL,'.
			' votes 	INT   NOT NULL DEFAULT 0,'.
			' votesum	INT   NOT NULL DEFAULT 0,'.
			' artist     CHAR(50))';

		$result = $this->sql->exec($query);
	}
}




