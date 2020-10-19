//Create POI class with methods for displaying information about city and monument markers

class PointOfInterest {
  constructor(latitude, longitude, geonameId, name, population, type) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.geonameId = geonameId;
    this.name = name;
    this.population = population;
    this.type = type;
  }

  //Degrees to radians for getDistancefromLatLon
  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  //Calculate distance based on coordinates - Stolen from somebody who is much better at maths than me
  getDistanceFromLatLonInKm(lat1, lon1) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(this.latitude - lat1);
    const dLon = this.deg2rad(this.longitude - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(this.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    this.distance = d.toFixed();
  }

  //Get wikipedia article for the POI and display a short extract
  getWikiDetails() {
    $.ajax({
      url: 'php/getWikiUrl.php',
      dataType: 'json',
      type: 'POST',
      data: {
        geonameId: this.geonameId,
      },
    })
      .then((result) => {
        const data = result['data'];
        this.timeZone = data.timezone.timeZoneId;
        this.wikiUrl = data.wikipediaURL;
        const title = this.wikiUrl.split('/')[2];
        this.displayInfo();
        $.ajax({
          url: 'php/getWikiSummary.php',
          dataType: 'json',
          type: 'POST',
          data: {
            title: title,
          },
        })
          .done((result) => {
            const data = Object.values(result['data'])[0];
            const extract = data['extract'];
            //Extracts have '(listen)' where the wikipedia sound button would be, remove it
            const regex = /\(listen\)/;
            this.cleanExtract = extract.replace(regex, '');
            this.displayWikiDetails();
          })
          .fail(() => {
            this.displayInfo();
            this.wikiFailure();
          });
      })
      .fail(() => {
        this.displayInfo();
        this.wikiFailure();
      });
  }
  //Add wiki details to the modal
  displayWikiDetails() {
    $('#modalBody').html(
      `${this.cleanExtract}<br><a href=https://${this.wikiUrl} target="_blank">Full Wikipedia Article</a>`
    );
  }

  //get current time at marker
  getTime() {
    const date = new Date();

    this.time = date.toLocaleString('en-GB', {
      //Pass in the timezone to get the proper time for the coordinates
      timeZone: this.timeZone,
      timeStyle: 'short',
    });
  }

  //If no article is found
  wikiFailure() {
    $('#modalBody').html(
      `No wikipedia article could be found for this ${this.type}.`
    );
  }

  //Get current weather & forecast. Also get current time included in json
  getWeatherInfo() {
    $.ajax({
      url: 'php/getWeatherForecast.php',
      type: 'POST',
      dataType: 'json',
      data: {
        latitude: this.latitude,
        longitude: this.longitude,
      },
    }).done((result) => {
      const data = result.data;
      this.currentWeather = data.current.weather[0];
      this.currentTemp = data.current.temp;
      this.humidity = data.current.humidity;
      this.pressure = data.current.pressure;
      this.dailyWeather = data.daily;
      this.displayWeather();
    });
  }

  //Add weather info to the modal
  displayWeather() {
    const forecast = [];
    //Set up a counter to be used to set up index of forecast array
    let i = 0;
    this.dailyWeather.forEach((day) => {
      //dt is in seconds so it needs to be converted to milliseconds
      const date = new Date(day.dt * 1000);
      //Make sure the correct day is displayed for the timezone
      const dayOfWeek = date.toLocaleString('en-GB', {
        timeZone: this.timeZone,
        weekday: 'long',
      });

      $(`#forecastImg${i}`).attr(
        'src',
        `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`
      );
      $(`#forecast${i}`).html(
        `<li>${dayOfWeek}</li><li>${
          day.weather[0].description
        }</li><li>Min Temp:&nbsp;${day.temp.min.toFixed()}&#8451;</li><li>Max Temp:&nbsp;${day.temp.max.toFixed()}&#8451;</li>`
      );

      i++;
    });

    //Display current weather info for location
    $('#weatherImage').attr(
      'src',
      `https://openweathermap.org/img/wn/${this.currentWeather.icon}@2x.png`
    );
    $('#weatherModalList').html(
      `<li>${
        this.currentWeather.description
      }</li><li>Temperature:&nbsp; ${this.currentTemp.toFixed()}&#8451;</li><li>Humidity:&nbsp;${
        this.humidity
      }%</li><li>Pressure:&nbsp${this.pressure}mb</li>`
    );
  }
}

class Monument extends PointOfInterest {
  constructor(latitude, longitude, geonameId, name) {
    super(latitude, longitude, geonameId, name);
    this.type = 'monument';
  }
  //Add general info to the modal then display it
  displayInfo() {
    this.getTime();
    $('#modalTitle').html(`${this.name}`);
    $('#modalInfo').html(
      `<li>Current Time: &nbsp; ${this.time}</li><li>Latitude: &nbsp; ${this.latitude}</li><li>Longitude: &nbsp; ${this.longitude}</li><li>Distance from your location: &nbsp; ${this.distance}km</li>`
    );
    $('#wikiInfo').removeClass('show');
    $('#forecastInfo').removeClass('show');
    $('#weatherInfo').removeClass('show');
    $('#generalInfo').addClass('show');
    $('#infoModal').modal();
  }
}

class City extends PointOfInterest {
  constructor(latitude, longitude, geonameId, name, population, type) {
    super(latitude, longitude, geonameId, name, population, type);
  }

  displayInfo() {
    this.getTime();
    $('#modalTitle').html(`${this.name}`);
    $('#modalInfo').html(
      `<li>Current Time: &nbsp; ${this.time}</li><li>Estimated Population: &nbsp; ${this.population}</li>
      <li>Latitude: &nbsp; ${this.latitude}</li><li>Longitude: &nbsp; ${this.longitude}</li><li>Distance from your location: &nbsp; ${this.distance}km</li>`
    );
    $('#wikiInfo').removeClass('show');
    $('#forecastInfo').removeClass('show');
    $('#weatherInfo').removeClass('show');
    $('#generalInfo').addClass('show');
    $('#infoModal').modal();
  }
}
