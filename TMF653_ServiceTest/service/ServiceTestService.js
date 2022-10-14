'use strict';

//Minimal Service with filtering (equality match only) and attribute selection
//Error Handing Need to define a global error hqndler
//Paging and Range based Iterator to be added
//Notification to be added add listener and implement hub

const util = require('util');
const uuid = require('uuid');

const mongoUtils = require('../utils/mongoUtils');
const swaggerUtils = require('../utils/swaggerUtils');
const notificationUtils = require('../utils/notificationUtils');

const {sendDoc} = require('../utils/mongoUtils');

const {setBaseProperties, traverse, 
       addHref, processCommonAttributes } = require('../utils/operationsUtils');

const {validateRequest} = require('../utils/ruleUtils');

const {processAssignmentRules} = require('../utils/operations');

const {getPayloadType, getPayloadSchema, getResponseType} = require('../utils/swaggerUtils');

const {updateQueryServiceType, updatePayloadServiceType, cleanPayloadServiceType} = require('../utils/swaggerUtils');

const {TError, TErrorEnum, sendError} = require('../utils/errorUtils');

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

exports.createServiceTest = function(req, res, next) {
  /**
   * Creates a ServiceTest
   * This operation creates a ServiceTest entity.
   *
   * serviceTest ServiceTest_Create The ServiceTest to be created
   * returns ServiceTest
   **/

  console.log('createServiceTest :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulCreate - argument serviceTest */
  
  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req, 'createServiceTest', payload))
    .then(payload => traverse(req, requestSchema, payload,[],getPayloadType(req)))
    .then(payload => processCommonAttributes(req, resourceType, payload))
    .then(payload => processAssignmentRules('createServiceTest', payload))
    .then(payload => {

      const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

      payload = swaggerUtils.updatePayloadServiceType(payload, req,'');

      mongoUtils.connect().then(db => {
        db.collection(resourceType)
          .insertOne(payload)
          .then(() => {

            payload = cleanPayloadServiceType(payload);

            sendDoc(res, 201, payload);
            notificationUtils.publish(req,payload);
          })
          .catch((error) => {
            console.log("createServiceTest: error=" + error);
            sendError(res, internalError);
          })
      })
      .catch((error) => {
        console.log("createServiceTest: error=" + error);
        sendError(res, internalError);
      })
    })
    .catch( error => {
      console.log("createServiceTest: error=" + error.toString());
      sendError(res, error);
    });

    console.log('=============================================');
    console.log('Run CTK Here')

    // "startDateTime": "2000-01-23T04:56:07.000+00:00",
    // "endDateTime": "2000-01-23T04:56:07.000+00:00",
    /*
    "testMeasure": [
      {
        "metricDescription": "metricDescription",
        "metricName": "metricName",
        "unitOfMeasure": "unitOfMeasure",
        "@baseType": "@baseType",
        "captureDateTime": "2000-01-23T04:56:07.000+00:00",
        "@type": "@type",
        "accuracy": 0.8008282,
        "captureMethod": "captureMethod",
        "ruleViolation": [
          {
            "conformanceComparatorExact": true,
            "conformanceComparatorLower": "conformanceComparatorLower",
            "conformanceComparatorUpper": "conformanceComparatorUpper",
            "@type": "@type",
            "description": "description",
            "thresholdRuleSeverity": "thresholdRuleSeverity",
            "appliedConsequence": [
              {
                "appliedAction": "appliedAction",
                "repeatAction": true,
                "@baseType": "@baseType",
                "@type": "@type",
                "name": "name",
                "description": "description",
                "@schemaLocation": "http://example.com/aeiou"
              },
              {
                "appliedAction": "appliedAction",
                "repeatAction": true,
                "@baseType": "@baseType",
                "@type": "@type",
                "name": "name",
                "description": "description",
                "@schemaLocation": "http://example.com/aeiou"
              }
            ],
            "@baseType": "@baseType",
            "tolerancePeriod": {
              "amount": 1,
              "units": "units"
            },
            "numberOfAllowedCrossing": 6,
            "conformanceTargetUpper": "conformanceTargetUpper",
            "name": "name",
            "@schemaLocation": "http://example.com/aeiou",
            "conformanceTargetLower": "conformanceTargetLower",
            "conformanceTargetExact": "conformanceTargetExact"
          },
          {
            "conformanceComparatorExact": true,
            "conformanceComparatorLower": "conformanceComparatorLower",
            "conformanceComparatorUpper": "conformanceComparatorUpper",
            "@type": "@type",
            "description": "description",
            "thresholdRuleSeverity": "thresholdRuleSeverity",
            "appliedConsequence": [
              {
                "appliedAction": "appliedAction",
                "repeatAction": true,
                "@baseType": "@baseType",
                "@type": "@type",
                "name": "name",
                "description": "description",
                "@schemaLocation": "http://example.com/aeiou"
              },
              {
                "appliedAction": "appliedAction",
                "repeatAction": true,
                "@baseType": "@baseType",
                "@type": "@type",
                "name": "name",
                "description": "description",
                "@schemaLocation": "http://example.com/aeiou"
              }
            ],
            "@baseType": "@baseType",
            "tolerancePeriod": {
              "amount": 1,
              "units": "units"
            },
            "numberOfAllowedCrossing": 6,
            "conformanceTargetUpper": "conformanceTargetUpper",
            "name": "name",
            "@schemaLocation": "http://example.com/aeiou",
            "conformanceTargetLower": "conformanceTargetLower",
            "conformanceTargetExact": "conformanceTargetExact"
          }
        ],
        "@schemaLocation": "http://example.com/aeiou",
        "metricHref": "metricHref",
        "value": {
          "characteristicRelationship": [
            {
              "relationshipType": "relationshipType",
              "@baseType": "@baseType",
              "@type": "@type",
              "id": "id",
              "href": "http://example.com/aeiou",
              "@schemaLocation": "http://example.com/aeiou"
            },
            {
              "relationshipType": "relationshipType",
              "@baseType": "@baseType",
              "@type": "@type",
              "id": "id",
              "href": "http://example.com/aeiou",
              "@schemaLocation": "http://example.com/aeiou"
            }
          ],
          "@baseType": "@baseType",
          "@type": "@type",
          "valueType": "valueType",
          "name": "name",
          "id": "id",
          "@schemaLocation": "http://example.com/aeiou",
          "value": {}
        }
      },
      {
        "metricDescription": "metricDescription",
        "metricName": "metricName",
        "unitOfMeasure": "unitOfMeasure",
        "@baseType": "@baseType",
        "captureDateTime": "2000-01-23T04:56:07.000+00:00",
        "@type": "@type",
        "accuracy": 0.8008282,
        "captureMethod": "captureMethod",
        "ruleViolation": [
          {
            "conformanceComparatorExact": true,
            "conformanceComparatorLower": "conformanceComparatorLower",
            "conformanceComparatorUpper": "conformanceComparatorUpper",
            "@type": "@type",
            "description": "description",
            "thresholdRuleSeverity": "thresholdRuleSeverity",
            "appliedConsequence": [
              {
                "appliedAction": "appliedAction",
                "repeatAction": true,
                "@baseType": "@baseType",
                "@type": "@type",
                "name": "name",
                "description": "description",
                "@schemaLocation": "http://example.com/aeiou"
              },
              {
                "appliedAction": "appliedAction",
                "repeatAction": true,
                "@baseType": "@baseType",
                "@type": "@type",
                "name": "name",
                "description": "description",
                "@schemaLocation": "http://example.com/aeiou"
              }
            ],
            "@baseType": "@baseType",
            "tolerancePeriod": {
              "amount": 1,
              "units": "units"
            },
            "numberOfAllowedCrossing": 6,
            "conformanceTargetUpper": "conformanceTargetUpper",
            "name": "name",
            "@schemaLocation": "http://example.com/aeiou",
            "conformanceTargetLower": "conformanceTargetLower",
            "conformanceTargetExact": "conformanceTargetExact"
          },
          {
            "conformanceComparatorExact": true,
            "conformanceComparatorLower": "conformanceComparatorLower",
            "conformanceComparatorUpper": "conformanceComparatorUpper",
            "@type": "@type",
            "description": "description",
            "thresholdRuleSeverity": "thresholdRuleSeverity",
            "appliedConsequence": [
              {
                "appliedAction": "appliedAction",
                "repeatAction": true,
                "@baseType": "@baseType",
                "@type": "@type",
                "name": "name",
                "description": "description",
                "@schemaLocation": "http://example.com/aeiou"
              },
              {
                "appliedAction": "appliedAction",
                "repeatAction": true,
                "@baseType": "@baseType",
                "@type": "@type",
                "name": "name",
                "description": "description",
                "@schemaLocation": "http://example.com/aeiou"
              }
            ],
            "@baseType": "@baseType",
            "tolerancePeriod": {
              "amount": 1,
              "units": "units"
            },
            "numberOfAllowedCrossing": 6,
            "conformanceTargetUpper": "conformanceTargetUpper",
            "name": "name",
            "@schemaLocation": "http://example.com/aeiou",
            "conformanceTargetLower": "conformanceTargetLower",
            "conformanceTargetExact": "conformanceTargetExact"
          }
        ],
        "@schemaLocation": "http://example.com/aeiou",
        "metricHref": "metricHref",
        "value": {
          "characteristicRelationship": [
            {
              "relationshipType": "relationshipType",
              "@baseType": "@baseType",
              "@type": "@type",
              "id": "id",
              "href": "http://example.com/aeiou",
              "@schemaLocation": "http://example.com/aeiou"
            },
            {
              "relationshipType": "relationshipType",
              "@baseType": "@baseType",
              "@type": "@type",
              "id": "id",
              "href": "http://example.com/aeiou",
              "@schemaLocation": "http://example.com/aeiou"
            }
          ],
          "@baseType": "@baseType",
          "@type": "@type",
          "valueType": "valueType",
          "name": "name",
          "id": "id",
          "@schemaLocation": "http://example.com/aeiou",
          "value": {}
        }
      }
    ],
    */
};

exports.deleteServiceTest = function(req, res, next) {
  /**
   * Deletes a ServiceTest
   * This operation deletes a ServiceTest entity.
   *
   * id String Identifier of the ServiceTest
   * no response value expected for this operation
   **/

  console.log('deleteServiceTest :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulDestroy */

  const id = String(req.swagger.params.id.value);

  var query = {
    id: id
  };

  query = swaggerUtils.updateQueryServiceType(query, req,'id');

  const resourceType = getResponseType(req); 

  const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

  mongoUtils.connect().then(db => {
    db.collection(resourceType)
      .deleteOne(query)
      .then(doc => {
        if (doc.result.n == 1) {
           sendDoc(res, 204, {});
           notificationUtils.publish(req,doc);
        } else { 
           sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"No resource with given id found"));
        }
      }).catch(error => sendError(res, internalError))
  })
  .catch(error => sendError(res, internalError));




};

exports.listServiceTest = function(req, res, next) {
  /**
   * List or find ServiceTest objects
   * This operation list or find ServiceTest entities
   *
   * fields String Comma-separated properties to be provided in response (optional)
   * offset Integer Requested index for start of resources to be provided in response (optional)
   * limit Integer Requested number of resources to be provided in response (optional)
   * returns List
   **/

  console.log('listServiceTest :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulIndex */
 
  var query = mongoUtils.getMongoQuery(req);

  query = swaggerUtils.updateQueryServiceType(query, req,'');

  const resourceType = getResponseType(req);

  const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");
  
  const generateQueryString = function(query,offset,limit) {
    var res='';
    var first=true;
    if(query.options.projection) {
      const fields=Object.keys(query.options.projection);
      res = res + '?fields=' + fields.join(',');
      first=false;
    }
    
    const delim = first ? '?' : '&';
    res = res + delim + "offset="+offset;
  
    if(query.options.limit) {
      const delim = first ? '?' : '&';
      res = res + delim + "limit="+limit;
    }

    return res;
  }

  const generateLink = function(query,skip,limit,type) {
    const basePath = req.url.replace(/\?.*$/,"");
    const hostPath = swaggerUtils.getURLScheme() + "://" + req.headers.host + basePath;
    return '"<' + hostPath + generateQueryString(query,skip,limit) + '>; rel="' + type + '"';
  }

  const setLinks = function(res,query,skip,limit,totalSize) {
    const links = [];
    links.push(generateLink(query,skip,limit,"self"));
    if(limit) {
      if(skip+limit<totalSize) {
        if(skip+2*limit<totalSize) {
          links.push(generateLink(query,skip+limit,limit,"next"));
        } else {
          links.push(generateLink(query,skip+limit,totalSize-skip-limit,"next"));
        }
        links.push(generateLink(query,totalSize-limit,limit,"last"));
      } 
      if(skip-limit>0) {
        links.push(generateLink(query,skip-limit,limit,"prev"));
      } else if(skip>0) {
        links.push(generateLink(query,0,skip,"prev"));
      }
    }
    res.setHeader('Link',links.join(', '));
  }

  // Find some documents based on criteria plus attribute selection
  mongoUtils.connect()
  .then(db => {
    db.collection(resourceType).stats()
    .then(stats => {
      const totalSize=stats.count;
      db.collection(resourceType)
      .find(query.criteria, query.options).toArray()
      .then(doc => {
        doc = cleanPayloadServiceType(doc);
        res.setHeader('X-Total-Count',totalSize);
        res.setHeader('X-Result-Count',doc.length);
        var skip = query.options.skip!==undefined ? parseInt(query.options.skip) : 0;
        var limit;
        if(query.options.limit!==undefined) limit = parseInt(query.options.limit);        
        if(limit || skip>0) setLinks(res,query,skip,limit,totalSize);

        var code = 200;
        if(limit && doc.length<totalSize) code=206;
        sendDoc(res, code, doc);
      })
      .catch(error => {
        console.log("listServiceTest: error=" + error);
        sendError(res, internalError);
      })
    })
    .catch(error => {
      console.log("listServiceTest: error=" + error);
      sendError(res, internalError);
    })
  })
  .catch(error => {
    console.log("listServiceTest: error=" + error);
    sendError(res, internalError);
  })



};

exports.patchServiceTest = function(req, res, next) {
  /**
   * Updates partially a ServiceTest
   * This operation updates partially a ServiceTest entity.
   *
   * id String Identifier of the ServiceTest
   * serviceTest ServiceTest_Update The ServiceTest to be updated
   * returns ServiceTest
   **/

  console.log('patchServiceTest :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulPatch */

  const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Unable to update resource");

  const resourceType = getResponseType(req);
  const requestSchema = getPayloadSchema(req);

  const id = String(req.swagger.params.id.value);
  var query = {
   id: id
  };

  query = swaggerUtils.updateQueryServiceType(query, req, 'id');

  swaggerUtils.getPayload(req)
    .then(payload => validateRequest(req,'patchServiceTest',payload))
    .then(payload => traverse(req,requestSchema,payload,[],getPayloadType(req)))
    .then(payload => {

      mongoUtils.connect().then(db => {
        // first check if resource exists
        db.collection(resourceType)
        .findOne(query)
        .then(old => {
          if (old==undefined) {
            return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"No resource with given id"));
          }

          payload = swaggerUtils.updatePayloadServiceType(payload, req, 'id');
          
          // then update and return the complete resource
          db.collection(resourceType)
            .updateOne(query, {$set: payload}, {upsert: false})
            .then(() => {
              db.collection(resourceType).findOne(query)
                .then((doc) => {

                  doc = swaggerUtils.cleanPayloadServiceType(doc);

                  sendDoc(res, 200, doc);
                  notificationUtils.publish(req,doc,old);
                })
                .catch((error) => {
                  console.log("patchServiceTest error=" + error);
                  return sendError(res, internalError);
                });
            })
            .catch((error) => {
              console.log("patchServiceTest error=" + error);
              return sendError(res, internalError);
            })
          })
        .catch((error) => {
          console.log("patchServiceTest error=" + error);
          return sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"No resource with given id"));
        });        
      })
      .catch((error) => {
        console.log("patchServiceTest error=" + error);
        return sendError(res, internalError);
      });
  })
  .catch(error => {
    console.log("patchServiceTest error=" + error);
    return sendError(res, error);
  });




};

exports.retrieveServiceTest = function(req, res, next) {
  /**
   * Retrieves a ServiceTest by ID
   * This operation retrieves a ServiceTest entity. Attribute selection is enabled for all first level attributes.
   *
   * id String Identifier of the ServiceTest
   * fields String Comma-separated properties to provide in response (optional)
   * returns ServiceTest
   **/

  console.log('retrieveServiceTest :: ' + req.method + ' ' + req.url + ' ' + req.headers.host);

  /* matching isRestfulShow */

  var id = String(req.swagger.params.id.value);

  var query = mongoUtils.getMongoQuery(req);
  query.criteria.id = id

  query = swaggerUtils.updateQueryServiceType(query, req,'id');

  const resourceType = getResponseType(req); 

  const internalError =  new TError(TErrorEnum.INTERNAL_SERVER_ERROR, "Internal database error");

  mongoUtils.connect().then(db => {
    db.collection(resourceType)
      .findOne(query.criteria, query.options)
      .then(doc => {
        if(doc) {
          doc = cleanPayloadServiceType(doc);
          sendDoc(res, 200, doc)
        } else {
          sendError(res, new TError(TErrorEnum.RESOURCE_NOT_FOUND,"No resource with given id found"));
        }
      })
      .catch(error => {
        console.log("retrieveServiceTest: error=" + error);
        sendError(res, internalError);
      });
  })
  .catch(error => {
    console.log("retrieveServiceTest: error=" + error);
    sendError(res, internalError);
  });




};



