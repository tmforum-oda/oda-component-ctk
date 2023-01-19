'use strict';

const {getSwaggerDoc} = require('../utils/swaggerUtils');

//
// The EntryPoint is the equivalent of the home-page for the API.
//

function entrypoint(req, res) {
  const swaggerDoc = getSwaggerDoc();
  
  if (req.url=='/') {
    var linksObject = {}
    linksObject.self = {
      "href": swaggerDoc.basePath
    };
    // add swagger info details to self link
    for (var infoKey in swaggerDoc.info) {
      linksObject.self[infoKey] = swaggerDoc.info[infoKey];
    }
    // go through every operation in every path to create additional links
    for (var pathKey in swaggerDoc.paths) {
      for (var methodKey in swaggerDoc.paths[pathKey]) {
        linksObject[swaggerDoc.paths[pathKey][methodKey].operationId] = {
          "href": stripTrailingSlash(swaggerDoc.basePath) + pathKey,
          "method" : methodKey.toUpperCase(),
          "description" : swaggerDoc.paths[pathKey][methodKey].description
        }
      }
    }
    var responseJSON = {
      "_links": linksObject
    }
    res.end(JSON.stringify(responseJSON));  
  }
  else {
    console.log('Return 404 error for url ' + req.url);
    res.statusCode=404;
    res.end('Endpoint not found. Try ' + swaggerDoc.basePath);
  }
}

function stripTrailingSlash(str) {
    if(str.substr(-1) === '/') {
        return str.substr(0, str.length - 1);
    }
    return str;
  }
module.exports = { entrypoint };

