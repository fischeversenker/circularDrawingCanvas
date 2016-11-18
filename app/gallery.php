<?php
define('DATABASE_FILE', 'images.db');

$dataBase = unserialize(file_get_contents(DATABASE_FILE));
echo json_encode($dataBase);

