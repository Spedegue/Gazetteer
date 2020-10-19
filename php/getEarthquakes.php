<?php

ini_set('display_errors', 'On');
error_reporting(E_ALL);

 $url = 'http://api.geonames.org/earthquakesJSON?north='.$_REQUEST['north'].'&south='.$_REQUEST['south'].'&east='.$_REQUEST['east'].'&west='.$_REQUEST['west'].'&maxRows=10&username=spedegue';

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$result = curl_exec($ch);

curl_close($ch);

$decode = json_decode($result, true);

$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['data'] = $decode['earthquakes'];

header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output);

?>