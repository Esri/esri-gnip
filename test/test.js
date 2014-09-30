var esriGnip = require('../index');

var featureServiceURL = 'http://services.arcgis.com/OfH668nDRN7tbJh0/arcgis/rest/services/Gnip/FeatureServer/0';

var gnipTestData = require('./gniptest.json').results;

var myGnip = new esriGnip.Writer(featureServiceURL, function(err, metadata) {
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

var output = esriGnip.parse(gnipTestData);
console.log('Parsed ' + output.arcgisRecords.length + ' records. Found ' + output.unlocated.length + ' without location info.');
if (output.translationErrors.length > 0) {
  console.log(output.translationErrors.length + ' failed to parse.');
  console.log(output.translationErrors);
}
