var _ = require('lodash'),
    Geoservices = require('geoservices'),
    client = new Geoservices(),
    Terraformer = require('terraformer');
Terraformer.ArcGIS = require('terraformer-arcgis-parser');

var locatedKey = 'withLocation',
    unlocatedKey = 'withoutLocation';

var locTypeGeo = 'location',
    locTypeLocationBBox = 'bbox',
    locTypeGnipProfile = 'profile';

function locationCoordinates(gnipRecord) {
  // Could be .geo, .location.geo, or .gnip.profileLocations[0].geo
  // Note, that, confusingly, .geo is in lat/lon, whereas the others are in lon/lat 
  var coordinates = null;

  if (gnipRecord.hasOwnProperty('geo')) {
    gnipRecord.__parsedLocationType = locTypeGeo;
    coordinates = [gnipRecord.geo.coordinates[1], gnipRecord.geo.coordinates[0]];
  } else if (gnipRecord.hasOwnProperty('location') &&
             gnipRecord.location.hasOwnProperty('geo')) { // TODO - Make more specific
    var bbox = gnipRecord.location.geo.coordinates[0], // [bl, tl, tr, br]
        xmin = bbox[0][0], ymin = bbox[0][1],
        xmax = bbox[2][0], ymax = bbox[2][1];
    gnipRecord.__parsedLocationType = locTypeLocationBBox;
    coordinates = [(xmin + xmax) / 2, (ymin + ymax) / 2];
  } else if (gnipRecord.gnip.hasOwnProperty('profileLocations') &&
             {}.toString.call(gnipRecord.gnip.profileLocations) === '[object Array]' &&
             gnipRecord.gnip.profileLocations.length > 0 &&
             gnipRecord.gnip.profileLocations[0].hasOwnProperty('geo')) {
    gnipRecord.__parsedLocationType = locTypeGnipProfile;
    coordinates = gnipRecord.gnip.profileLocations[0].geo.coordinates;
  }

  return coordinates;
}

function gnipRecordHasLocationInformation(gnipRecord, excludeNullIsland) {
  var coordinates = locationCoordinates(gnipRecord),
      coordinateOK = coordinates !== null;
  if (coordinateOK && excludeNullIsland && coordinates[0] === 0 && coordinates[1] === 0) {
    coordinateOK = false;
    console.warn('Possible erroneous coordinates ' + JSON.stringify(coordinates) + ' on record ' + gnipRecord.id + ' (' + gnipRecord.link + ')');
  }
  return coordinateOK;
}

function preprocessGnipRecords(gnipRecords, excludeNullIslands) {
  return _.groupBy(gnipRecords, function(gnipRecord) { 
    return gnipRecordHasLocationInformation(gnipRecord, excludeNullIslands)?locatedKey:unlocatedKey;
  });
}



function sanitizeGnipRecord(gnipRecord) {
  // Make sure that commonly missing fields have a sensible fallback for the rest of the parser
  gnipRecord.actor.location = gnipRecord.actor.location || { objectType: '', displayName: '' };
  gnipRecord.gnip.language = gnipRecord.gnip.language || { value: '' };
}

function appendLocationInfo(attributes, gnipRecord) {
  var coordinates = locationCoordinates(gnipRecord);

  if (gnipRecord.hasOwnProperty('__parsedLocationType')) {
    var locationAttributes = {
      'loc_type': gnipRecord.__parsedLocationType
    };

    if (gnipRecord.__parsedLocationType === locTypeLocationBBox) {
      locationAttributes = {
        'loc_type': locTypeLocationBBox,
        'loc_displayName': gnipRecord.location.displayName,
        'loc_name': gnipRecord.location.name,
        'loc_country': gnipRecord.location.country_code,
        'loc_countryCode': gnipRecord.location.twitter_country_code
      };
    } else if (gnipRecord.__parsedLocationType === locTypeGnipProfile) {
      var gnipProfileLocation = gnipRecord.gnip.profileLocations[0];
      locationAttributes = {
        'loc_type': locTypeGnipProfile,
        'loc_displayName': gnipProfileLocation.displayName,
        'loc_name': gnipProfileLocation.displayName,
        'loc_country': gnipProfileLocation.address.country,
        'loc_countryCode': gnipProfileLocation.address.countryCode,
        'gnip_profileLoc_adr_locality': gnipProfileLocation.address.locality,
        'gnip_profileLoc_adr_region': gnipProfileLocation.address.region,
        'gnip_profileLoc_adr_subRegion': gnipProfileLocation.address.subRegion
      };

      _.merge(attributes, locationAttributes);
    }
  }

  return coordinates;
}

function gnipToArcGIS(gnipRecord) {
  sanitizeGnipRecord(gnipRecord);

  // Translate it to ArcGIS Table Structure
  var coordinates = null,
      mercatorGeom = null,
      attributes;
  try {
    attributes = {
      'activity_id': gnipRecord.id,
      'body': gnipRecord.body,
      'verb': gnipRecord.verb,
      'postedTime': new Date(gnipRecord.postedTime),
      'link': gnipRecord.link,
      'retweetCount': gnipRecord.retweetCount,
      'favoritesCount': gnipRecord.favoritesCount,
      'actor_id': gnipRecord.actor.id,
      'actor_type': gnipRecord.actor.objectType,
      'actor_link': gnipRecord.actor.link,
      'actor_displayName': gnipRecord.actor.displayName,
      'actor_image': gnipRecord.actor.image,
      'actor_summary': gnipRecord.actor.summary,
      'actor_postedTime': new Date(gnipRecord.actor.postedTime),
      'actor_friendsCount': gnipRecord.actor.friendsCount,
      'actor_followsCount': gnipRecord.actor.followersCount,
      'actor_listedCount': gnipRecord.actor.listedCount,
      'actor_statusesCount': gnipRecord.actor.statusesCount,
      'actor_favoritesCount': gnipRecord.actor.favoritesCount,
      'actor_timezone': gnipRecord.actor.twitterTimeZone,
      'actor_utcOffset': parseInt(gnipRecord.actor.utcOffset), // Maybe be safer?
      'actor_verified': gnipRecord.actor.verified,
      'actor_preferredUsername': gnipRecord.actor.preferredUsername,
      'actor_languages': gnipRecord.actor.languages[0],
      'actor_location_type': gnipRecord.actor.location.objectType,
      'actor_location_displayName': gnipRecord.actor.location.displayName,
      'generator_displayName': gnipRecord.generator.displayName,
      'generator_link': gnipRecord.generator.link,
      'provider_type': gnipRecord.provider.objectType,
      'provider_displayName': gnipRecord.provider.displayName,
      'provider_link': gnipRecord.provider.link,
      'object_type': gnipRecord.object.objectType,
      'object_id': gnipRecord.object.id,
      'object_summary': gnipRecord.object.summary,
      'object_link': gnipRecord.object.link,
      'object_postedTime': new Date(gnipRecord.object.postedTime),
      'twitter_hashtags': '',
      'twitter_symbols': '',
      'twitter_urls': '',
      'twitter_userMentions': '',
      'twitter_filter_level': gnipRecord.twitter_filter_level,
      'twitter_language': gnipRecord.twitter_lang,
      'gnip_klout_score': gnipRecord.gnip.klout_score,
      'gnip_language': gnipRecord.gnip.language.value
    };

    coordinates = appendLocationInfo(attributes, gnipRecord);
  } catch (ex) {
    console.log(ex);
    console.log(gnipRecord);
    return {
      translationError: {
        message: ex.message,
        stack: ex.stack
      },
      record: gnipRecord
    };
  }

  if (coordinates !== null) {
    var recordLocation = new Terraformer.Point(coordinates);
    mercatorGeom = Terraformer.ArcGIS.convert(recordLocation.toMercator());
  }

  var arcgisRecord = {
    geometry: mercatorGeom,
    attributes: attributes
  };

  return arcgisRecord;
}

function parseGnipToArcGIS(gnipRecords, excludeNullIslands) {
  excludeNullIslands = excludeNullIslands === true;

  var processedRecords = preprocessGnipRecords(gnipRecords, excludeNullIslands);
  var arcGISRecords = _.map(processedRecords[locatedKey], function(gnipItem) { 
    return gnipToArcGIS(gnipItem);
  });
  var translationErrors = _.remove(arcGISRecords, function(item) {
    return item.hasOwnProperty('translationError');
  });

  return {
    arcgisRecords: arcGISRecords,
    unlocated: processedRecords[unlocatedKey],
    translationErrors: translationErrors
  };
}



function EsriGnip(options, initializationCallback) {
  // Object properties
  this.options = {};
  this.featureServiceLoaded = false;


  // Make sure at least a URL parameter was passed in.
  var type = {}.toString.call(options);
  if (type === '[object String]') {
    this.options.url = options;
  } else if (type === '[object Object]' && options.hasOwnProperty('url')) {
    this.options = options;
  } else {
    console.error('**** Invalid options ****');
    console.error('        Please pass a valid URL or options object, e.g. {url: <URL>}');
    console.error('**** You must initialize EsriGnip with a valid URL to a target FeatureService Layer');
    console.error('**** You can create one with this Service Definition: http://geeknixta.maps.arcgis.com/home/item.html?id=0580fcb7e14a45efb6f4439337baa6e0');
    throw 'Invalid options - please pass a valid URL or options object, e.g. {url: <URL>}';
  }



  // Create a new FeatureService connection to the target layer and callback when done.
  var fsOptions = {
    url: this.options.url
  };
  if (options.hasOwnProperty('token')) {
    fsOptions.token = options.token;
  }
  var featureService = new client.featureservice(fsOptions, function(err, metadata) {
    if (err) {
      if ({}.toString.call(err) === '[object String]') {
        err = {message: err};
      }
      console.error('ERROR connecting to Feature Service: ' + err.message);
    } else {
      this.featureServiceLoaded = true;
    }
    if (initializationCallback) {
      initializationCallback.bind(this)(err, metadata);
    }
  }.bind(this));


  /// Methods
  /// =======

  // Call this with an array of Gnip records to write them to the FeatureLayer.
  this.postGnipRecordsToFeatureService = function(gnipRecords, callback) {
    var output = parseGnipToArcGIS(gnipRecords),
        arcGISRecords = output.arcgisRecords;
    delete output.arcgisRecords;

    featureService.add({features: arcGISRecords}, function(err, data) {
      if (err) {
        callback(err, output);
      } else {
        output.successes = _.filter(data.addResults, {success: true});
        output.failures = _.filter(data.addResults, {success: false});
        callback(null, output);
      }
    });
  };
}

exports.Writer = EsriGnip;
exports.parse = parseGnipToArcGIS;

