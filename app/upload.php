<?php
    define('UPLOAD_DIR', 'images/');
    include('DataBase.php');

    //create image file from base64 sting
	$img = $_POST['imgBase64'];
	$img = str_replace('data:image/png;base64,', '', $img);
	$img = str_replace(' ', '+', $img);
	$data = base64_decode($img);
    $fileName = uniqid() . '.png';
	$file = UPLOAD_DIR . $fileName;
	$success = file_put_contents($file, $data);


    $dataBase = Database::getInstance();
    $success = $dataBase->addImage($fileName, $_POST['artist']);

    if ($success !== false) {
        echo '{"error": false, "insertID: '.$success.'}';
    } else {
	    echo '{"error":"Unable to save the file."}';
    }
