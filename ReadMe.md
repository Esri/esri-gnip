esri-gnip
=========

A simple node package to parse Gnip records into ArcGIS JSON, and to write Gnip records to an [ArcGIS Feature Service](http://resources.arcgis.com/en/help/arcgis-rest-api/#/Feature_Service/02r3000000z2000000/).

Gnip records without location information will be stripped out and ignored.

## Requirements
* [node.js](http://nodejs.org)
* To write records:
    * An ArcGIS Online account ([Developer](https://developers.arcgis.com/en/) or [Organization](http://www.arcgis.com/home/) will work).
    * A published, editable Feature Service matching the [`Gnip.sd`](Gnip.sd) Service Definition. See [here](http://doc.arcgis.com/en/arcgis-online/share-maps/add-items.htm#ESRI_SECTION1_FFA71B14C6EE459B8E1BEBC8100010DF) for more details.

##Usage
###Parsing
To parse an array of Gnip records:

``` JavaScript
var esriGnip = require('esri-gnip');
var output = esriGnip.parse(gnipTestData);
```

Where `output` will be an object of structue:

``` JSON
{
  arcgisRecords: [],    // arcGISRecords
  unlocated: [],        // gnipRecords
  translationErrors: [] // translationErrors
}
```

and a `translationError` looks like:

``` JSON
{
  translationError: { 
    message: '<string>', 
    stack: '<string>'
  },
  record: '<gnipRecord>'
}
```

You can optionally reject Gnip records that have a location of `[0,0]` by passing `true` as the second parameter to `.parse()`.

###Writing
You must first publish a suitable FeatureService on ArcGIS Online (see [requirements](#Requirements)).

Once you have a service endpoint:

``` JavaScript
var esriGnip = require('esri-gnip');

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

Note, you should avoid sending too many records in a single call to `.postGnipRecordsToFeatureService()`.

##Known Limitations
* Authentication and tokenization is not implemented. Target FeatureServices must be public.

## Resources

* [ArcGIS REST Specification](http://resources.arcgis.com/en/help/arcgis-rest-api/)
* [node.js documentation](http://nodejs.org/api/)
* [Terraformer](https://github.com/esri/terraformer)
* [Gnip Documentation](http://support.gnip.com/sources/twitter/data_format.html) (incomplete)
* [Gnip Test Records](test-data/gniptest.json)

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
