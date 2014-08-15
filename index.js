var _ = require('lodash'),
    Geoservices = require('geoservices'),
    client = new Geoservices(),
    Terraformer = require('terraformer');
Terraformer.ArcGIS = require('terraformer-arcgis-parser');

var locatedKey = 'withLocation',
    unlocatedKey = 'withoutLocation';

function sanitizeGnipRecord(gnipRecord) {
  gnipRecord.actor.location = gnipRecord.actor.location || { objectType: '', displayName: '' };
}

function gnipToArcGIS(gnipRecord) {
  sanitizeGnipRecord(gnipRecord);

  // Translate it to ArcGIS Table Structure
  var gnipProfileLocation = gnipRecord.gnip.profileLocations[0],
      attributes = {
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
    'gnip_language': gnipRecord.gnip.language.value,//gnipRecord.gnip.language,
    'gnip_profileLoc_type': gnipProfileLocation.objectType,
    'gnip_profileLoc_displayName': gnipProfileLocation.displayName,
    'gnip_profileLoc_adr_country': gnipProfileLocation.address.country,
    'gnip_profileLoc_adr_countryCode': gnipProfileLocation.address.countryCode,
    'gnip_profileLoc_adr_locality': gnipProfileLocation.address.locality,
    'gnip_profileLoc_adr_region': gnipProfileLocation.address.region,
    'gnip_profileLoc_adr_subRegion': gnipProfileLocation.address.subRegion
  };

  var recordLocation = new Terraformer.Point(gnipProfileLocation.geo.coordinates);

  var arcgisRecord = {
    geometry: Terraformer.ArcGIS.convert(recordLocation.toMercator()),
    attributes: attributes
  };

  return arcgisRecord;
}

function gnipRecordHasLocationInformation(record) {
  return _.has(record.gnip, 'profileLocations') &&
         _.isArray(record.gnip.profileLocations) && 
         record.gnip.profileLocations.length > 0;
}

function preprocessGnipRecords(records) {
  return _.groupBy(records, function(record) { 
    return gnipRecordHasLocationInformation(record)?locatedKey:unlocatedKey;
  });
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
  var featureService = new client.featureservice({
    url: this.options.url
  }, function(err, metadata) {
    if (err) {
      if ({}.toString.call(err) === '[object String]') {
        err = {message: err};
      }
      console.error('ERROR connecting to Feature Service: ' + err.message);
    } else {
      this.featureServiceLoaded = true;
    }
    if (initializationCallback) {
      initializationCallback(err, metadata);
    }
  }.bind(this));


  /// Methods
  /// =======

  // Call this with an array of Gnip records to write them to the FeatureLayer.
  this.postGnipRecordsToFeatureService = function(gnipRecords, callback) {
    var processedRecords = preprocessGnipRecords(gnipRecords);
    var arcGISRecords = _.map(processedRecords[locatedKey], function(gnipItem) { 
      return gnipToArcGIS(gnipItem);
    });

    featureService.add({features: arcGISRecords}, function(err, data) {
      if (err) {
        callback(err);
      } else {
        var successes = _.filter(data.addResults, {success: true}),
            failures  = _.filter(data.addResults, {success: false});
        callback(null, {
          successes: successes, 
          failures: failures, 
          skipped: processedRecords[unlocatedKey]
        });
      }
    });
  }
}

module.exports = exports = EsriGnip;
