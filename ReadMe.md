esri-gnip
=========

A simple node package to parse and write Gnip JSON records into an [ArcGIS Feature Service](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Feature_Service/02r3000000z2000000/).

## Requirements
1. Gnip data - A set of Gnip records in [Gnip JSON format](http://support.gnip.com/sources/twitter/data_format.html), retrieved from the [Gnip APIs](http://support.gnip.com/apis/). See also [gnip-reader](https://www.npmjs.org/package/gnip-reader). Contact these [guys](http://gnip.com/) if you need to get data.
2. A pre-configured ArcGIS Online [Feature Service](https://developers.arcgis.com/en/) to store the data. See details below to configure your [target Feature Service](#creating-a-target-feature-service).
3. [node.js](http://nodejs.org)

## Usage
### Installing
    $ npm install esri-gnip

### Writing to an ArcGIS Feature Service
You must have the URL to a target Feature Service with editing enabled and a specific set of attributes (see [Creating a target Feature Service](#creating-a-target-feature-service) below).

Once you have that URL, use the esri-gnip module like this:

``` JavaScript
var esriGnip = require('esri-gnip');

// The REST Endpoint URL of the target Feature Service
var featureServiceURL = 'http://services.arcgis.com/...../arcgis/rest/services/Gnip/FeatureServer/0';

var myGnip = new esriGnip.Writer(featureServiceURL, function(err, metadata) {
  if (err) {
    console.error(err);
  } else {
    this.postGnipRecordsToFeatureService([ /* array of gnip records */ ], function(err, results) {
      if (err) {
        console.error(err);
      } else {
        console.log(results);
      }
    });
  }
});
```

#### Output
The `results` callback parameter will look like this:

``` JavaScript
{
  arcgisRecords: [],    // arcGISRecords
  unlocated: [],        // gnipRecords
  translationErrors: [] // translationErrors
}
```

A `translationError` is structured as follows:

``` JavaScript
{
  translationError: { 
    message: '<string>', 
    stack: '<string>'
  },
  record: { /* a Gnip record */ }
}
```

#### Options
You can pass in an options object instead of a URL as the first parameter to `new esriGnip.Writer()`. The options object must contail a `url` property:
``` JavaScript
var esriGnip = require('esri-gnip');

var options = {
  // The REST Endpoint URL of the target Feature Service
  url: 'http://services.arcgis.com/...../arcgis/rest/services/Gnip/FeatureServer/0'
};

var myGnip = new esriGnip.Writer(options, function(err, metadata) {
  // See above
});
```

**Note**: you should avoid sending too many Gnip records in a single call to `.postGnipRecordsToFeatureService()` to avoid the POST call becoming too large. While the Feature Service will likely handle it, it could cause HTTP timeouts. Informal tests have shown that 50-100 records per post is a reasonable and very safe limit.

### Authentication
The options parameter can optionally contain a `token` property for authentication with the target Feature Service, in case that feature service is not public:

``` JavaScript
var esriGnip = require('esri-gnip');

var options = {
  // The REST Endpoint URL of the target Feature Service
  url: 'http://services.arcgis.com/...../arcgis/rest/services/Gnip/FeatureServer/0',
  token: '<some-authentication-token>'
};

var myGnip = new esriGnip.Writer(options, function(err, metadata) {
  // See above
});
```

### Excluding records at [0,0]
All too often a poorly geolocated record will have a coordinate of [0,0]. It is very rare that this is actually the correct coordinate. You can exclude these records from consideration by setting the `excludeNullIslands` property of the options parameter to `true`:

``` JavaScript
var esriGnip = require('esri-gnip');

var options = {
  // The REST Endpoint URL of the target Feature Service
  url: 'http://services.arcgis.com/...../arcgis/rest/services/Gnip/FeatureServer/0',
  excludeNullIslands: true
};

var myGnip = new esriGnip.Writer(options, function(err, metadata) {
  // See above
});
```

If `excludeNullIslands` is set to `true`, records with coordinates of [0,0] will be included in the `unlocated` output property and will not be added to the target feature service.

### Parsing Gnip JSON records
To simply parse an array of Gnip records without posting to an ArcGIS FeatureService, call `parse()`:

``` JavaScript
var esriGnip = require('esri-gnip');
var output = esriGnip.parse([ /* array of gnip records */ ]);
```

Where `output` will look like the `results` callback parameter in `.postGnipRecordsToFeatureService()` described above.

You can optionally reject Gnip records that have a location of [0,0] by passing `true` as the second parameter to `.parse()`. Such records will be included in the `unlocated` output property.

## Creating a target Feature Service
A target feature service of the correct schema is required to write Gnip records to. Follow these instructions to create such a feature service from the [pre-created template](http://services.arcgis.com/OfH668nDRN7tbJh0/arcgis/rest/services/Gnip/FeatureServer/0).

1. Log in [here](https://www.arcgis.com/home/signin.html) with your ArcGIS Online account.
2. Browse to `My Content`, then select `Create Layer`
3. Choose `an existing feature layer` in the pulldown.
4. Select the `Enter a URL to a feature layer` radio button.
5. Paste [http://services.arcgis.com/OfH668nDRN7tbJh0/arcgis/rest/services/Gnip/FeatureServer/0](http://services.arcgis.com/OfH668nDRN7tbJh0/arcgis/rest/services/Gnip/FeatureServer/0) into the `Url` field.
6. (Optional) Rename the layer.
7. Click `Next`
8. Click `Next` to accept the default extent.
9. Enter a `Title`
10. Enter at least one `Tag`
11. (Optional) update the `Summary` and/or `Folder`
12. Click `Done`

You will be taken to the new Feature Service's *item page*. To get the REST Endpoint URL, click the layer name in the `Layers` section (or click the caret next to it to display the popup menu and select `Service URL`). The URL of the newly opened page is the REST Endpoint needed by esri-gnip and will look similar to the URL in Step 5 above.

NOTE: Go here to get a free [ArcGIS Developer subscription](https://developers.arcgis.com/en/) or a trial [ArcGIS Online Organization subscription](http://www.arcgis.com/home/). 


## Resources

* [ArcGIS REST Specification](http://resources.arcgis.com/en/help/arcgis-rest-api/)
* [node.js documentation](http://nodejs.org/api/)
* [Terraformer](https://github.com/esri/terraformer)
* [Geoservices-js](https://github.com/Esri/geoservices-js)
* [Gnip Documentation](http://support.gnip.com/sources/twitter/data_format.html) (incomplete)
* [Gnip Test Records](example/example-gnip-data.json)

## Notes
* Gnip records with no location information are not added.
* Gnip records with coordinates of [0,0] can optionally be considered to have no location (see [Excluding records at [0,0]](#excluding-records-at-00)  and [Parsing Gnip JSON records](#parsing-gnip-json-records) above).
* Advanced users can use the `Gnip.sd` Service Definition file included in this repo to create a suitable target Feature Service. `Gnip.sd` can be used with ArcGIS Online or ArcGIS Server. It will create a Feature Service named `Gnip`, so ensure there is no pre-existing Feature Service of that name before use.

## Issues

Find a bug or want to request a new feature?  Please let us know by submitting an Issue.

## Contributing

Anyone and everyone is welcome to contribute.

## Licensing
Copyright 2014 Esri

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's [license.txt](license.txt) file.
[](Esri Tags: NodeJS GeoServices REST Gnip)
[](Esri Language: JavaScript)
