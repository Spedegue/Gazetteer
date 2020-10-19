//ToDo
// Hide API keys =  weather
//Add default selection of radio buttons?
//Currency exchange rates?
//Restructure code to be more logical - place necessary code in document.ready
//Massive refactor to include new geoJSON using two letter code
//Style the extramarkers to match colour scheme - number white rather than black
//Handle null values for display info
//bottom buttons when screen is smaller

//Global variables to store the users coordinates, coutries for the autoselect, and polygon of current country
let userCoords = {};
const countryList = [];
let countryOutline;

const weatherUrl =
  'https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid=3f47e7abc196db007ccb9df586b8592a';

//Set details for different map displays
const dark = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }
);
const satellite = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    minZoom: 1,
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  }
);

const light = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }
);

const earthAtNight = L.tileLayer(
  'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}',
  {
    attribution:
      'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
    maxZoom: 8,
    minZoom: 2,
    format: 'jpg',
    time: '',
    tilematrixset: 'GoogleMapsCompatible_Level',
  }
);
const temp = L.tileLayer(weatherUrl, {
  tileSize: 512,
  zoomOffset: -1,
  layer: 'temp_new',
  minZoom: 2,
});
const precipitation = L.tileLayer(weatherUrl, {
  tileSize: 512,
  minZoom: 2,
  zoomOffset: -1,
  layer: 'precipitation_new',
});
//Create map and set its default layer to the dark theme
const map = L.map('map', {
  layers: [dark],
});

//Add the different tile layers to the control button and add the button to the map
const baseMaps = {
  Light: light,
  Dark: dark,
  Satellite: satellite,
  'Earth At Night': earthAtNight,
};
const weatherOverlays = {
  Temperature: temp,
  Precipitation: precipitation,
};
L.control.layers(baseMaps, weatherOverlays).addTo(map);

//Initialise the layer groups to be populated with markers
const earthquakeLayer = L.layerGroup();
const cityLayer = L.layerGroup();
const monumentLayer = L.layerGroup();
const monumentMarkers = L.markerClusterGroup({
  iconCreateFunction: (cluster) => {
    return L.divIcon({
      html: `<div><span>${cluster.getChildCount()}</span></div>`,
      className: 'monument-marker-cluster marker-cluster',
      iconSize: new L.Point(40, 40),
    });
  },
});

//Populate the countryList array to be used with the autocomplete.
const getCountryList = () => {
  const url = 'php/getCountryList.php';
  $.getJSON(url, (data) => {
    $(data).each((key, value) => {
      countryList.push(value);
    });
  });
};

//Get info for selected country
const getCountryInfo = (countryCode) => {
  $.ajax({
    url: 'php/getCountryInfo.php',
    dataType: 'json',
    type: 'POST',
    data: {
      countryCode: countryCode,
    },
  }).done((result) => {
    const c = result.data;
    //Use the returned info to create new Country class
    const activeCountry = new Country(
      c.name,
      c.alpha2Code,
      c.area,
      c.flag,
      c.capital,
      c.population,
      c.currencies[0].name,
      c.currencies[0].symbol
    );
    //Display info and fetch & create markers for the cities, monuments, and earthquakes
    activeCountry.displayInfo();
    activeCountry.getCities();
    activeCountry.getMonuments();
    activeCountry.getBoundingBox();
  });
};

//Handle selection of a new country
//The PHP routines will search the json file by either name or 3-letter code depending on the action that triggered it
//Autocomplete is populated by the json file so the names will always be a match, but other sources names may differ slightly so the code is preferred
const selectNewCountry = (country, type) => {
  const start = Date.now();

  $.ajax({
    url: 'php/getPolygon.php',
    type: 'POST',
    dataType: 'json',
    data: {
      country: country,
      type: type,
    },
  })
    .done((result) => {
      const countryCode = result['properties']['ISO_A3'];
      //If a polygon is already drawn, clear it
      if (countryOutline) {
        countryOutline.clearLayers();
      }
      countryOutline = L.geoJSON(result, {
        style: {
          color: '#fd7e14',
        },
      }).addTo(map);
      map.fitBounds(countryOutline.getBounds());
      getCountryInfo(countryCode);

      console.log(Date.now() - start);
    })
    .fail(() => {
      console.log('Error in selectNewCountry');
    });
};

//Use the users coordinates to get the name of their country
const getCountryFromCoords = (latitude, longitude) => {
  $.ajax({
    url: 'php/getCountryFromCoords.php',
    type: 'POST',
    dataType: 'json',
    data: {
      lat: latitude,
      long: longitude,
    },
  })
    .done((result) => {
      const data = result.data[0].components;
      const alpha3Code = data['ISO_3166-1_alpha-3'];
      $('#countrySearch').val(data.country);
      adjustFontToFitSearchbar(data.country);
      selectNewCountry(alpha3Code, 'code');
    })
    .fail(() => {
      $('#modalTitle').html(`Error`);
      $('#modalBody').html(
        'Unfortunately there was an error finding a country for these coordinates. Please try a different location'
      );
      $('#infoModal').modal();
    });
};

//Find the user location and uses it to locate country on the map
const jumpToUserLocation = () => {
  //Check to see if user's browser supports navigator, although if it doesn't user probably has bigger issues than my app not working
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        //Save the lat & long and pass it to the function to get the country
        const { longitude, latitude } = position.coords;
        //Store the coors in a global to be used later to calculate distances
        userCoords = {
          longitude: longitude,
          latitude: latitude,
        };
        getCountryFromCoords(latitude, longitude);
      },
      (error) => {
        //If user denies location access, default to UK
        selectNewCountry('GBR', 'code');
        userCoords = {
          longitude: -0.118092,
          latitude: 51.509865,
        };
        $('#modalTitle').html(`Location Request Denied`);
        $('#modalBody').html(
          'This app uses your location to display distances and initiate to your country. Sending you to the UK by default, distances shown will be based on London.'
        );
        $('#infoModal').modal();
      }
    );
  } else {
    selectNewCountry('GBR', 'code');
  }
};

//Event triggered when a country is selected from the searchbar
const handleSearchbarChange = (event, ui) => {
  const country = ui.item.value;
  adjustFontToFitSearchbar(country);
  selectNewCountry(country, 'name');
};

//Adjust font height to make sure country name fits the searchbar
const adjustFontToFitSearchbar = (country) => {
  if (country.length > 25) {
    $('#countrySearch').css('font-size', '0.8em');
  } else {
    $('#countrySearch').css('font-size', '1.4em');
  }
};

//Handle map click
const getCountryFromClick = (event) => {
  const { lat, lng } = event.latlng;
  getCountryFromCoords(lat, lng);
};

//Associate the autocomplete field with the list of countries and set the function to be triggered when a country is selected
$('#countrySearch').autocomplete({
  source: countryList,
  minLength: 2,
  select: handleSearchbarChange,
  position: { my: 'top', at: 'bottom', of: '#countrySearch' },
});

//Create a pop up when a monument marker is clicked
const infoPopup = (event) => {
  let marker;
  const markerDetails = event.target.options;
  //create either new city or monument object
  if (markerDetails.type == 'city') {
    marker = new City(
      markerDetails.latitude,
      markerDetails.longitude,
      markerDetails.geonameId,
      markerDetails.name,
      markerDetails.population,
      markerDetails.type
    );
    // Get weather for city
    marker.getWeatherInfo();
  } else if (markerDetails.type == 'monument') {
    marker = new Monument(
      markerDetails.latitude,
      markerDetails.longitude,
      markerDetails.geonameId,
      markerDetails.name,
      markerDetails.type
    );
  }
  //Get distance between marker and user
  marker.getDistanceFromLatLonInKm(userCoords.latitude, userCoords.longitude);
  marker.getWikiDetails();
};

//Remove Loading Screen
const removeLoader = () => {
  console.log('still checking');
  //Check if a country has been loaded, if so then remove loading screen. Otherwise keep checking at short intervals until it has.
  if (countryOutline) {
    $('#preloader')
      .delay(100)
      .fadeOut('slow', () => {
        $(this).remove();
      });
    clearInterval(checkInterval);
  }
};
let checkInterval = setInterval(removeLoader, 50);

//When HTML is rendered...
$(document).ready(() => {
  jumpToUserLocation();

  removeLoader();

  //Populate list of countries
  getCountryList();

  //Clear the searchbar of text when it is clicked for a smoother experience
  $('#countrySearch').click(() => $('#countrySearch').val(''));

  //Change country based on map click
  map.on('click', getCountryFromClick);

  $('#earthquakeBtn').click(() => {
    map.removeLayer(cityLayer);
    map.removeLayer(monumentMarkers);
    earthquakeLayer.addTo(map);
  });

  $('#cityBtn').click(() => {
    map.removeLayer(earthquakeLayer);
    map.removeLayer(monumentMarkers);
    map.addLayer(cityLayer);
  });

  $('#monumentBtn').click(() => {
    map.removeLayer(earthquakeLayer);
    map.removeLayer(cityLayer);
    map.addLayer(monumentMarkers);
  });
});
