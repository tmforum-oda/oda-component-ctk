'use strict';

const {TError, TErrorEnum} = require('../utils/errorUtils');

const { getRequestServiceType, getTypeDefinition } = require('./swaggerUtils');


function processAssignmentRules(operation, doc) {
  return new Promise(function(resolve, reject) {

    //
    // TMF620_Product_Catalog
    //

    if (operation === 'tMF620createCatalog'){
      //doc.lifecycleStatus= "Active";
    }
    
    //
    // TMF641B_Service_Ordering_Conformance_Profile_R18.0.0.docx
    //
    if (operation === 'tMF641serviceOrderCreate'){
      doc.state = 'acknowledged';
      doc.startDate = (new Date()).toISOString(); 
      doc.orderDate = (new Date()).toISOString();
      doc.orderItem.forEach(item => item.state = 'acknowledged' );
    } 

    //
    // TMF645B_Service_Qualification_Conformance_Profile_R18.0.0.docx
    //
    if (operation === 'tMF645serviceQualificationCreate'){
      doc.state = 'acknowledged';
      doc.serviceQualificationDate = (new Date()).toISOString(); 

      doc.serviceQualificationItem.forEach(item => item.state = 'acknowledged');
    } 

    //
    // TMF646B_Appointment_API_Conformance_Profile_R18.0.0.docx
    //
    if (operation === 'tMF646appointmentCreate'){
      doc.status = 'initialized';
      doc.creationDate = (new Date()).toISOString(); 
    } 

    //
    // TMF648B_Quote_Management_Conformance_Profile_R17.5.0.docx
    //
    if (operation === 'tMF648quoteCreate '){
      doc.state = 'inProgress';
      doc.quoteDate = (new Date()).toISOString();
      doc.quoteItem.forEach(item => item.state = 'inProgress' ); 

      if(doc.note && !doc.note.date) doc.note.date = (new Date()).toISOString(); // TODO: Check
    }
    //
    //  TMF666-AccountManagement
    //
    if (operation === 'tMF666createPartyAccount'){
      doc.state = 'acknowledged';
    }
    
    //
    // CTK-TMF679-ProductOfferingQualification-R18.0
    //
    if (operation === 'tMF679productOfferingQualificationCreate'){
      doc.productOfferingQualificationDateTime = (new Date()).toISOString();
      doc.state = 'acknowledged';
      doc.productOfferingQualificationItem.forEach(item => item.state = 'acknowledged' );
      doc.productOfferingQualificationItem.forEach(item => item.qualificationItemResult = 'qualified' );
    }
    if (operation === 'createBucket' || operation === "createTopupBalance" || operation === "createAdjustBalance"){
      doc.status = "Active";
    }
    resolve(doc);

  });
};


function processAssignmentRulesByType(req, type, doc) {
  return new Promise(function(resolve, reject) {

    // NaaS specifics
    if(type!==undefined && type==='ResponseHub') {
      // - "createdTime"
      // - "id"
      // - "serviceType"

      var typedef = getTypeDefinition(type);

      if(typedef.properties!==undefined) {
        typedef = typedef.properties;
      }
      
      if(typedef.createdTime!==undefined && doc.createdTime===undefined) {
        doc.createdTime = (new Date()).toISOString();
      }

      if(typedef.id!==undefined && doc.id==undefined) {
        doc.id = uuid.v4();
      };

      if(typedef.serviceType!==undefined && doc.serviceType==undefined) {
        const res = getRequestServiceType(req);
        if(res!==undefined) {
          doc.serviceType = res.value;
        }
      }

    }

    resolve(doc);
  
  });

}

module.exports = { processAssignmentRules, processAssignmentRulesByType };
