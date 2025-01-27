//Create  country class with methods for displaying data

class Country {
  constructor(
    name,
    alpha2Code,
    area,
    flag,
    capital,
    population,
    currency,
    currencySymbol
  ) {
    this.name = name;
    this.alpha2Code = alpha2Code;
    this.area = area || 'Not Found';
    this.flag = flag;
    this.capital = capital || 'Not Found';
    this.population = population || 'Not Found';
    this.currency = currency || 'Not Found';
    this.currencySymbol = currencySymbol || '';
  }
  //Fetch most populous cities for active country and add markers to the city layer group
  getCities() {
    //Clear existing city markers from previous country
    cityLayer.clearLayers();
    $.ajax({
      url: 'php/getCityData.php',
      dataType: 'json',
      type: 'POST',
      data: {
        countryCode: this.alpha2Code,
      },
    })
      .done((result) => {
        const marker = L.ExtraMarkers.icon({
          icon: ' fa-location-arrow',
          markerColor: '#BBDEF0',
          shape: 'square',
          svg: true,
          prefix: 'fa',
        });
        const capitalMarker = L.ExtraMarkers.icon({
          icon: ' fa-location-arrow',
          markerColor: '#2C95C9',
          shape: 'star',
          svg: true,
          prefix: 'fa',
        });
        result['data'].forEach((city) => {
          //Check if the city is the capital
          if (city.fcode == 'PPLC') {
            //Change marker to indicate the capital
            const newMarker = L.marker([city.lat, city.lng], {
              icon: capitalMarker,
              type: 'city',
              name: city.name,
              population: city.population,
              latitude: city.lat,
              longitude: city.lng,
              capital: true,
              geonameId: city.geonameId,
            }).addTo(cityLayer);
            newMarker.on('click', infoPopup);
          } else {
            const newMarker = L.marker([city.lat, city.lng], {
              icon: marker,
              type: 'city',
              name: city.name,
              population: city.population,
              latitude: city.lat,
              longitude: city.lng,
              geonameId: city.geonameId,
            }).addTo(cityLayer);
            newMarker.on('click', infoPopup);
          }
        });
      })
      .fail(() => {
        $('#modalTitle').html(`Error`);
        $('#modalBody').html(
          'Unfortunately there was an error fetching city information. Please try again or select a different country.'
        );
        $('#infoModal').modal();
      });
  }

  //Get list of monuments for selected country and add them to a layer group
  getMonuments() {
    //Clear any existing markers from previous country
    monumentLayer.clearLayers();
    monumentMarkers.clearLayers(monumentLayer);
    $.ajax({
      url: 'php/getMonuments.php',
      dataType: 'json',
      type: 'POST',
      data: {
        countryCode: this.alpha2Code,
      },
    })
      .done((result) => {
        const marker = L.ExtraMarkers.icon({
          icon: 'fa-binoculars',
          markerColor: '#AFD5AA',
          shape: 'penta',
          svg: true,
          prefix: 'fa',
        });
        result['data'].forEach((monument) => {
          const newMarker = L.marker([monument.lat, monument.lng], {
            icon: marker,
            name: monument.name,
            latitude: monument.lat,
            longitude: monument.lng,
            type: 'monument',
            geonameId: monument.geonameId,
          }).addTo(monumentLayer);
          newMarker.on('click', infoPopup);
        });
        monumentMarkers.addLayer(monumentLayer);
      })
      .fail(() => {
        $('#modalTitle').html(`Error`);
        $('#modalBody').html(
          'Unfortunately there was an error fetching the monument data. Please try selecting a different country'
        );
        $('#infoModal').modal();
      });
  }

  //Get earthquake data
  getEarthquakes(north, south, east, west) {
    //Clear all the markers from the previous country
    earthquakeLayer.clearLayers();
    $.ajax({
      url: 'php/getEarthquakes.php',
      dataType: 'json',
      type: 'POST',
      data: {
        north: north,
        south: south,
        east: east,
        west: west,
      },
    })
      .done((result) => {
        result['data'].forEach((quake) => {
          const newQuake = L.circle([quake.lat, quake.lng], {
            color: '#dc3545',
            fillColor: '#9C1C28',
            fillOpacity: 0.5,
            //Cube the magnitude to emphasise difference, otherwise all circles will appear more or less the same size
            radius: Math.pow(quake.magnitude, 3) * 500,
          }).addTo(earthquakeLayer);

          newQuake.bindPopup(
            `Magnitude: ${quake.magnitude} <br> Date: ${quake.datetime}`
          );
        });
      })
      .fail(() => {
        $('#modalTitle').html(`Error`);
        $('#modalBody').html(
          'Unfortunately there was an error fetching the earthquake data. Please try selecting a different country'
        );
        $('#infoModal').modal();
      });
  }

  //Get bounding box of country from code then set the properties
  getBoundingBox() {
    $.ajax({
      url: 'php/getBoundingBox.php',
      dataType: 'json',
      type: 'POST',
      data: {
        countryCode: this.alpha2Code,
      },
    })
      .done((result) => {
        //Set limits for the country's bounding box
        const { north, south, east, west } = result['data'][0];
        this.getEarthquakes(north, south, east, west);
      })
      .fail(() => {
        $('#modalTitle').html(`Error`);
        $('#modalBody').html(
          'Unfortunately there was an error fetching the earthquake data. Please try selecting a different country'
        );
        $('#infoModal').modal();
      });
  }

  //Display info for selected country
  displayInfo() {
    $('#flag').attr('src', this.flag);
    $('#area').html(` ${this.area}`);
    $('#capital').html(` ${this.capital}`);

    $('#currency').html(` ${this.currency} (${this.currencySymbol})`);
    $('#population').html(` ${this.population}`);
  }
}
