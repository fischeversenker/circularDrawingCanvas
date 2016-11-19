<?php
	// requires php5
	define('DATABASE_FILE', 'images.db');
	define('UPLOAD_DIR', 'images/');

	$img = $_POST['imgBase64'];
	$img = str_replace('data:image/png;base64,', '', $img);
	$img = str_replace(' ', '+', $img);
	$data = base64_decode($img);
    $fileName = uniqid() . '.png';
	$file = UPLOAD_DIR . $fileName;
	$success = file_put_contents($file, $data);

	if (!file_exists(DATABASE_FILE)) {
	    file_put_contents(DATABASE_FILE, serialize(array(
	        'images' => array()
	    )));
	}
	var_dump($_POST);
	$dataBase = unserialize(file_get_contents(DATABASE_FILE));
    array_push($dataBase[images], array(
        'name' => $fileName,
        'artist' => $_POST['artist'],
    ));
    file_put_contents(DATABASE_FILE, serialize($dataBase));
	print $success ? $file : 'Unable to save the file.';
?>