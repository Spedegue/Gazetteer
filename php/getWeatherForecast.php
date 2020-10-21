<?php

$url = "https://api.openweathermap.org/data/2.5/onecall?lat=".$_REQUEST['latitude']."&lon=".$_REQUEST['longitude']."&exclude=hourly,minutely&units=metric&appid=";

$ch = curl_init();

$ch = curl_init();

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_URL,$url);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $result=curl_exec($ch);

	curl_close($ch);

    $decode = json_decode($result,true);	
    
    $output['status']['code'] = "200";
	$output['status']['name'] = "ok";

	
    $output['data'] = $decode;
    
	
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 



?>
