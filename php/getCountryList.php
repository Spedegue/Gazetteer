<?php

$url ='countries_large.geo.json';


$countries = json_decode(file_get_contents($url), true);

$countryList = array();

$output = $countries['features'];
foreach($countries['features'] as $key => $val){
    if($val['properties']["ISO_A3"] != "-99"){
    array_push($countryList, $val['properties']['ADMIN']);
}
}


sort($countryList);
	echo json_encode($countryList); 
?>