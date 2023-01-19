'use strict';

const uuid = require('uuid');

const request = require('request');
const rp = require('request-promise');
const queryToMongo = require('query-to-mongo');
const querystring = require('querystring');

const { transform, isEqual, isObject, isArray } = require('lodash');

const swaggerUtils = require('./swaggerUtils');
const mongoUtils = require('./mongoUtils');

const { TError, TErrorEnum, sendError } = require('./errorUtils');
const { getResponseType, getPayloadType, getPayloadSchema, getRequestServiceType } = require('./swaggerUtils');
const { traverse, processCommonAttributes } = require('./operationsUtils');
const { processAssignmentRulesByType } = require('./operations');

const { sendDoc } = require('./mongoUtils');

const HUB = "HUB";

function index(req, res, next) {

  console.log('index :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  var query = mongoUtils.getMongoQuery(req);

  query.criteria._serviceGroup  = getServiceGroup(req);
    
  // Find some documents based on criteria plus attribute selection
  mongoUtils.connect().then(db => {
    db.collection(HUB)
      .find(query.criteria, query.options).toArray()
      .then(doc => clean(doc))
      .then(doc => sendDoc(res, 200, doc))
      .catch(error => {
        console.log("hub index: error=" + error);
        sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Database error"));
      });
  })
  .catch(error => {
    console.log("hub index: error=" + error);
    sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Database connect error"));
  });


}

function show(req, res, next) {

  console.log('show :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  try {
    const key = Object.keys(req.swagger.params)[0];
    const id = String(req.swagger.params[key].value);

    var query = mongoUtils.getMongoQuery(req);
    query.criteria.id = id;
    query.criteria._serviceGroup  = getServiceGroup(req);

    console.log("query: " + JSON.stringify(query,null,2));

    mongoUtils.connect().then(db => {
      db.collection(HUB)
        .findOne(query.criteria, query.options)
        .then(doc => clean(doc))
        .then(doc => {
          if(isObject(doc)) {
            sendDoc(res, 200, doc)
          } else {
            sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"No resource with given id found"));
          }
        })
        .catch(error => {
          console.log("hub show: error=" + error);
          sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Database error"));
        });
    })
    .catch(error => {
      console.log("hub show: error=" + error);
      sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Database connect error"));
    });

  } catch(err) {
    sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Parameter processing erro"));
  }

}

function register(req, res, next) {

  console.log('register :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);
 
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  swaggerUtils.getPayload(req)
    .then(payload => traverse(req,requestSchema,payload,[]))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRulesByType(req, resourceType, payload))
    .then(payload => {

      var doc = copy(payload);
      doc._serviceGroup = getServiceGroup(req);

      try {
        var queryParam = (doc.query===undefined) ? "" : doc.query;

        // add any additional parameters in the request to the query
        queryParam = addToQuery(queryParam,doc);

        const query = mongoUtils.getMongoQuery(queryParam); 
        doc._query = JSON.stringify(query);

      } catch(err) {
        console.log("notificationUtils::register: error=" + err);
        sendError(res, TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Unable to process request"));
        return;
      }

      mongoUtils.connect().then(db => {
        db.collection(HUB)
          .insertOne(doc)
          .then(() => sendDoc(res, 201, payload))
          .catch((error) => sendError(res, TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Database error")));
      })
      .catch((error) => sendError(res, TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Database error")));

    })
    .catch( error => {
      console.log("register: error=" + error.toString());
      sendError(res, error);
    });

}

function patch(req, res, next) {

  console.log('patch :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  try {
    const key = Object.keys(req.swagger.params)[0];
    const id = String(req.swagger.params[key].value);

    const resourceType = getResponseType(req);
    const requestSchema = getPayloadSchema(req);

    const query = {
      id: id,
      _serviceGroup: getServiceGroup(req)
    };

    const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

    swaggerUtils.getPayload(req)
    .then(payload => traverse(req,requestSchema,payload))
    .then(payload => {

      var doc = copy(payload);

      try {

        var queryParam = (doc.query===undefined) ? "" : doc.query;

        // add any additional parameters in the request to the query
        queryParam = addToQuery(queryParam,doc);

        if(queryParam!=="") {     
          doc._query = JSON.stringify(mongoUtils.getMongoQuery(queryParam));
        }

      } catch(err) {
        sendError(res, TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Unable to process request"));
        return;
      }

      mongoUtils.connect().then(db => {
        db.collection(HUB)
        .updateOne(query, {$set: doc}, {upsert: false})
        .then((resp) => {
          
          console.log("patch: updateOne resp=" + JSON.stringify(resp));

          db.collection(HUB).findOne(query)
            .then((doc) => {
              return sendDoc(res, 201, payload);
            })
            .catch((error) => {
              return sendError(res, internalError);
            });
        })
        .catch((error) => {
          return sendError(res, internalError);
        })
      })
      .catch((error) => {
        return sendError(res, internalError);
      });
    })
    .catch((error) => {
      return sendError(res, internalError);
    });
  } catch(err) {
    console.log("hub update: sendError - last catch");
    sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Unable to process request"));
  }
}

function update(req, res, next) {

  console.log('update :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  try {
    const key = Object.keys(req.swagger.params)[0];
    const id = String(req.swagger.params[key].value);

    const resourceType = getResponseType(req);
    const requestSchema = getPayloadSchema(req);

    const query = {
      id: id,
      _serviceGroup: getServiceGroup(req)
    };

    const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

    swaggerUtils.getPayload(req)
    .then(payload => createReplacement(query, payload))
    .then(doc => {

      if(doc.callback===undefined) {
        sendError(res, TError(TErrorEnum.MISSING_BODY_FIELD, "Callback property missing"));
        return;
      }

      mongoUtils.connect().then(db => {

        db.collection(HUB)
        .replaceOne(query, doc)
        .then(resp => sendReplacementResult(res, resp.result, doc))
        .catch(error => {
          console.log("hub update: error=" + error);
          sendError(res, internalError);
        });
      })
      .catch(error => {
        console.log("hub update: error=" + error);
        sendError(res, internalError);
      });
    })
    .catch(error => {
      console.log("hub update: error=" + error);
      sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Unable to process request"));
    })
  } catch(err) {
    console.log("hub update: sendError - last catch");
    sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Unable to process request"));
  }

}

function createReplacement(query, payload) {
  var doc = copy(payload);
  doc._serviceGroup = query._serviceGroup;
  doc.id = query.id;

  // const queryParam = (doc.query===undefined) ? "" : doc.query;
  // doc._query = JSON.stringify(mongoUtils.getMongoQuery(queryParam));

  var queryParam = (doc.query===undefined) ? "" : doc.query;

  // add any additional parameters in the request to the query
  queryParam = addToQuery(queryParam,doc);

  if(queryParam!=="") {     
    doc._query = JSON.stringify(mongoUtils.getMongoQuery(queryParam));
  }

  return doc;
}

function addToQuery(query, doc) {

  Object.keys(doc).forEach(key => {
    if(key!=='query' && key!=='loopback') {
      const delim = (query!=="") ? "&" : "";
      query = query + delim + key + "=" + doc[key];
    }
  })
  return query;
}

function sendReplacementResult(res,result,doc) {
  if(result!=undefined && result.n==1) {
    return sendDoc(res, 200, clean(doc));
  } else {
    return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"Unable to update resource"));
  }
}

function unregister(req, res, next) {

  console.log('unregister :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  try {
    const key = Object.keys(req.swagger.params)[0];
    const id = String(req.swagger.params[key].value);

    const query = {
      id: id,
      _serviceGroup: getServiceGroup(req)
    };

    console.log("query: " + JSON.stringify(query));

    const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

    mongoUtils.connect().then(db => {
      db.collection(HUB)
      .deleteOne(query)
      .then(doc => {
        if (doc.result.n == 1) {
           sendDoc(res, 204, {});
        } else { 
           sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"No resource with given id"));
        }
      }).catch(error => sendError(res, internalError))
    })
    .catch(error => sendError(res, internalError));

  } catch(err) {
    sendError(res, new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Parameter processing error"));
  }

}


function publish(req,doc,old) {
  const method = req.method; // POST, GET etc
  const resourceType = getResponseType(req).replace(/^TMF.../,"");

  const message = createEventMessage(resourceType, method, doc, old);

  const query = {
    _serviceGroup: getServiceGroup(req)
  };
    
  // Find subscribers for the serviceGroup
  mongoUtils.connect()
  .then(db => {
    db.collection(HUB)
    .find(query).toArray()
    .then(clients => notify(db,clients,message))
    .catch(error => console.log("notify error=" + error))
  })
  .catch(error => console.log("notify error=" + error));

};


function notify(db,clients,message) {
  const EVENTS = "TMPEVENTS";
  db.collection(EVENTS)
  .insertOne(message)
  .then(() => {
    // console.log("sendMessage: start processing");
    const promises = clients.map(client => processMessage(db,client,message));

    const cleanup = function() {
       db.collection(EVENTS)
      .deleteOne(message)
      .then(() => {})
      .catch(err => console.log("notify clean-uperror=" + err))
    };

    Promise.all(promises)
    .then(() => {
      // console.log("sendMessage: finished processing - cleanup");
      cleanup();
    })
    .catch(err => {
      console.log("notify: finished processing - error=" + err);
      cleanup();
    });

  })
  .catch(err => console.log("notify #3 error=" + err));

};

function processMessage(db,client,message) {

  // console.log("processMessage: set-up");

  return new Promise(function(resolve, reject) {
    var query = JSON.parse(client._query);

    if(query!==undefined && query.criteria!==undefined) {
      query.criteria.eventId = message.eventId;
    }

    const EVENTS = "TMPEVENTS";

    db.collection(EVENTS)
    .findOne(query.criteria,query.options)
    .then(doc => clean(doc))
    .then(doc => {
      if(doc===undefined || doc===null) {
        return reject();
      }
      rp({uri: client.callback, method: "POST", body: doc, json: true})
      .then(() => resolve())
      .catch(err => reject(err));
      // console.log("processMessage: done");
    })
    .catch(err => {
      console.log("processMessage error=" + err);
      return reject();
    });
  });

}

function clean(doc) {
  var res=undefined;
  if(doc!==undefined) {
    if(isArray(doc)) {
      res=[];
      doc.forEach( x => res.push(clean(x)));
    } else if (isObject(doc)) {
      res = copy(doc);
      Object.keys(res).forEach(key => {
        if(key.startsWith("_")) {
          delete res[key];
        }
      });
    }
  };
  return res;
}


//
// internal stuff
//
function getServiceGroup(req) {
  // extract from url ala /tmf-api/productCatalogManagement/v2/hub[/:id]- keep the version
  var parts = req.url.split("/");
  parts.splice(4);
  parts.splice(0,2); // remove last parts, remove the prefix, initial / results in empty first part

  return parts.join('/');
}

function copy(doc) {
  return JSON.parse(JSON.stringify(doc));
}

function createEventMessage(resourceType, operation, doc, old) {
  var eventType = resourceType; 

  if(operation === "POST") {
    eventType = eventType + "Creation";
  } else if(operation === "DELETE") {
    eventType = eventType + "Remove";
  } else if(operation === "PUT" || operation === "PATCH") {
    var change = "AttributeValueChange"; 
    if(old!==undefined) {
      const diff = difference(doc,old);
      console.log("createEventMessage: diff=" + JSON.stringify(diff));
      if(diff.state!==undefined || diff.status!==undefined) {
        change = "StateChange"; 
      }
    }
    eventType = eventType + change; 
  }
  eventType = eventType + "Notification";

  var message = {
    eventId: uuid.v4(),
    eventTime: (new Date()).toISOString(),
    eventType: eventType,
    event: {}
  };
  const entity = resourceType.replace(/^\w/, c => c.toLowerCase());
  message.event[entity] = doc;

  return message;

}

/**
 * Deep diff between two object, using lodash
 * @param  {Object} object Object compared
 * @param  {Object} base   Object to compare with
 * @return {Object}        Return a new object who represent the diff
 */
function difference(object, base) {
  return transform(object, (result, value, key) => {
    if (!isEqual(value, base[key])) {
      result[key] = isObject(value) && isObject(base[key]) ? difference(value, base[key]) : value;
    }
  });
}

module.exports = { publish, index, show, register, unregister, patch, update };



