<?php

//$url = 'http://api.geonames.org/countryCodeJSON?lat='.$_REQUEST['lat'].'&lng='.$_REQUEST['long'].'&username=spedegue';

$url = 'https://api.opencagedata.com/geocode/v1/json?q='.$_REQUEST['lat'].','.$_REQUEST['long'].'&pretty=1&key=';
$ch = curl_init();

//curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);

	$result=curl_exec($ch);

	curl_close($ch);

	$decode = json_decode($result,true);	

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";

	
    $output['data'] = $decode['results'];
    
	
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 


?>
