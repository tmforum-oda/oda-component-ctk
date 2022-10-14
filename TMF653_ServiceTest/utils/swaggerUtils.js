'use strict';

var fs = require('fs'),
    path = require('path'),
    jsyaml = require('js-yaml');

const {TError, TErrorEnum} = require('../utils/errorUtils');

var spec = null;
var swaggerDoc = null;

function getSwaggerDoc() {
  if(swaggerDoc==null) {
    spec = fs.readFileSync(path.join(__dirname,'../api/swagger.yaml'), 'utf8');
    swaggerDoc = jsyaml.safeLoad(spec);
  };
  return swaggerDoc;
}

function getTypeDefinition(type) {
  var def;
  const meta = getSwaggerDoc();

  // console.log("getTypeDefinition:: meta=" + JSON.stringify(meta.definitions[type],null,2));

  if(!(meta==undefined || meta.definitions==undefined || meta.definitions[type]==undefined)) { 
   // meta.definitions[type].properties==undefined)) {
    def = meta.definitions[type];
  }
  return def;

}


function getResponseType(req) {
	var type;
	const swaggerDoc = getSwaggerDoc();

	//
	// All of this is just to get a proper type also for delete operations
	// 
  
  // "operationPath": [
  //   "paths",
  //   "/orderManagement/2.0/serviceOrder",
  //   "get"
  // ],

	// var pathpattern = req.swagger.operationParameters[0].path[1];

  var pathpattern = req.swagger.operationPath[1];

	if(swaggerDoc.paths[pathpattern] !== undefined ) {
		// lookup the type of the base post or get operation for the url
	 	//
	 	// "/productCatalogManagement/v2/catalog/{id}": {
    //    "get": {
    //      "responses": {
    //         "200": {
    //            "schema": {
    //                "items": {
    //                    "$ref": "#/definitions/TMF620Catalog"
    //
    // and without the items part if not returning an array

		var p = swaggerDoc.paths[pathpattern];

		// console.log("getResponseType: p=" + JSON.stringify(p,null,2));

		// not all APIs have support for GET all resources
		// in these cases, we should be able to pick the correct type using the post path
		// TODO: What if not a post operation for these cases?

		if( p.post !== undefined && p.post.responses["201"] !== undefined) {
			p = p.post.responses["201"];
		} else if( p.post !== undefined && p.post.responses["200"] !== undefined) {
			p = p.post.responses["200"];
		} else if( p.get !== undefined && p.get.responses["200"] !== undefined) {
			p = p.get.responses["200"];
		}

		if(p.schema!==undefined) {
			if(p.schema.$ref !== undefined) {
				type = p.schema.$ref; 
			} else if(p.schema.items.$ref !== undefined) {
				type = p.schema.items.$ref;
			}
		} 

		if(type !== undefined) {
			// now type should be something like  "$ref": "#/definitions/TMF620Catalog"
			// select the last part
			type = type.split('/').slice(-1)[0];
		}
	}

	return type;
}

function getPayloadSchema(req) {
	var schema;
	var type;
	const swaggerDoc = getSwaggerDoc();

	var pathpattern = req.swagger.operationParameters[0].path[1];

	if(swaggerDoc.paths[pathpattern] !== undefined ) {
	
		var p = swaggerDoc.paths[pathpattern];

		// console.log("getPayloadSchema: p=" + JSON.stringify(p,null,2));
		// console.log("getPayloadSchema: op=" + req.method);

		p = p[req.method.toLowerCase()];

	  p.parameters.every(function(param) {
	    if(param.in === 'body') {
	      schema = param.schema;
	      return false; // break 
	    }
	    return true; // continue with next
	  });
	 
		if(schema!==undefined) {
			if(schema.$ref !== undefined) {
				type = schema.$ref; 
			} else if(schema.items.$ref !== undefined) {
				type = schema.items.$ref;
			}
		} 

		if(type !== undefined) {
			// now type should be something like  "$ref": "#/definitions/TMF620Catalog"
			// select the last part
			type = type.split('/').slice(-1)[0];
			schema = getTypeDefinition(type);

			return schema;

		}
	}

	return undefined;

}


function getPayload(req) {
  return new Promise(function(resolve, reject) {
    const payloadType=getPayloadType(req);
    if(payloadType) {
      if(req.swagger.params[payloadType] != null) {
        return resolve(req.swagger.params[payloadType].value);
      }
    };
    reject(new TError(TErrorEnum.INVALID_BODY,"Payload not found"))
  });
}

function getPayloadType(req) {
  var payloadType=null;
  req.swagger.operationParameters.every(function(param) {
    if(param.schema.in === 'body') {
      payloadType = param.schema.name;
      return false; // break 
    }
    return true; // continue with next
  });
  return payloadType;
};

function getPayloadSchema_old(req) {
  var schema=null;
  req.swagger.operationParameters.every(function(param) {
    if(param.schema.in === 'body') {
    	console.log("getPayloadSchema:: keys=" + Object.keys(param.schema));
    	console.log("getPayloadSchema:: schema=" + JSON.stringify(param.schema.schema,null,2));
      schema = param.schema.schema;
      return false; // break 
    }
    return true; // continue with next
  });
  return schema;
};

function getURLScheme() {
  return "http";
}

function getHost() {
  const swaggerDoc = getSwaggerDoc();
  return swaggerDoc.host;
}

function hasProperty (obj, path) {
  var arr = path.split('.');
  while (arr.length && (obj = obj[arr.shift()]));
  return (obj !== undefined);
}

const SERVICE_TYPE = "service_type";

function getRequestServiceType(req) {
	var res;
  if(req.swagger.params[SERVICE_TYPE]!==undefined) {
  	res=req.swagger.params[SERVICE_TYPE];
  }  
  return res;
}

function updateQueryServiceType(query, req, idparam) {

  // console.log("query: " + JSON.stringify(query,null,2));

  if(req.swagger.params[SERVICE_TYPE]!==undefined) {
    query.criteria._serviceType = req.swagger.params[SERVICE_TYPE].value;
    if(idparam===SERVICE_TYPE) {
      delete query.criteria.id;
    }
  }  
  return query;
}

function updatePayloadServiceType(payload, req, idparam) {

  if(req.swagger.params[SERVICE_TYPE]!==undefined) {
    payload._serviceType = req.swagger.params[SERVICE_TYPE].value;
  } 
  return payload;
}

function cleanPayloadServiceType(payload) {
  delete payload._serviceType;
  return payload
}



module.exports = { 
                   getSwaggerDoc, 
                   getTypeDefinition,
                   getResponseType, 
				   				 getPayloadType, 
				   				 getPayloadSchema, 
				   				 getPayload, 
				   				 getURLScheme,
				   				 getHost,

									 getRequestServiceType,
                   updateQueryServiceType,
                   updatePayloadServiceType,
                   cleanPayloadServiceType

				   			 };
