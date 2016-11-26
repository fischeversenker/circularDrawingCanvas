<?php

include('DataBase.php');

$dataBase = Database::getInstance();

$allImages = $dataBase->getAllImages();


echo json_encode(array(
    'images' => $allImages
));
