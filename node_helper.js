/*********************************

  Node Helper for MMM-WUWeatherForecast.

  This helper is responsible for the data pull from Weather Underground's
  API. At a minimum the API key, Latitude and Longitude
  parameters must be provided.  If any of these are missing, the
  request to Weather Underground will not be executed, and instead an error
  will be output the the MagicMirror log.

  Additional, this module supplies two optional parameters:

    units - one of "standard", "metric" or "imperial"
    lang - Any of the languages Weather Underground supports, as listed here: https://docs.weather.com/weather-api/

  The Weather Underground API request looks like this:

    https://api.weather.com/v3/wx/forecast/daily/5day?geocode={lat},{lon}&format=json&units={units}&language={lang}&apiKey={API key}

*********************************/

const Log = require("logger");
const NodeHelper = require("node_helper");
const moment = require("moment");

module.exports = NodeHelper.create({

  start() {
    Log.log("Starting node_helper for: " + this.name);
  },

  async socketNotificationReceived(notification, payload){
    var self = this;
    if (notification === "WUWEATHER_FORECAST_GET") {
      if (payload.apikey == null || payload.apikey == "") {
        Log.log( "[MMM-WUWeatherForecast] " + moment().format("D-MMM-YY HH:mm") + " ** ERROR ** No API key configured. Get an API key at https://www.weather.com/" );
      } else if (payload.latitude == null || payload.latitude == "" || payload.longitude == null || payload.longitude == "") {
        Log.log( "[MMM-WUWeatherForecast] " + moment().format("D-MMM-YY HH:mm") + " ** ERROR ** Latitude and/or longitude not provided." );
      } else {
        // Construct Weather Underground API request
        // Example endpoint: https://api.weather.com/v3/wx/forecast/daily/5day?geocode={lat},{lon}&format=json&units=m&language=en-US&apiKey={apiKey}
        var url = payload.apiBaseURL +
          "geocode=" + payload.latitude + "," + payload.longitude +
          "&format=json" +
          "&units=" + payload.units +
          "&language=" + payload.language +
          "&apiKey=" + payload.apikey;

        if (typeof self.config !== "undefined"){
          if (self.config.debug === true){
            Log.log(self.name+" Fetching url: "+url)
          }
        }

        fetch(url)
          .then(response => {
            if (response.status !== 200){
              console.log(response)
            } else {
              return response.json()
            }
          }).then(data => {
            if (typeof data !== "undefined") {
              data.instanceId = payload.instanceId;
              self.sendSocketNotification("WUWEATHER_FORECAST_DATA", data);
            }
          })
          .catch(error => {
            Log.error("[MMM-WUWeatherForecast] " + moment().format("D-MMM-YY HH:mm") + " ** ERROR ** " + error+"\n"+error.stack)
          });
      }
    } else if (notification === "CONFIG") {
      self.config = payload
    }
  },
});
