var EsriGnip = require('./index');

var featureServiceURL = 'http://services.arcgis.com/OfH668nDRN7tbJh0/arcgis/rest/services/Gnip/FeatureServer/0';

var gnipTestData = require('./test-data/gniptest.json').results;

var myGnip = EsriGnip(featureServiceURL, function(err, metadata) {
  if (err) {
    console.error(err);
  } else {
    console.log('myGnip Initialized to ' + featureServiceURL);
    this.postGnipRecordsToFeatureService(gnipTestData, function(err, results) {
      if (err) {
        console.error(err);
      } else {
        console.log(results);
      }
    });
  }
});
