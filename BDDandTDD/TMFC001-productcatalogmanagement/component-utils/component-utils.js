const k8s = require('@kubernetes/client-node')
const fs = require('fs')
const YAML = require('yaml')
const axios = require('axios')
const { Console } = require('console')

const kc = new k8s.KubeConfig()
kc.loadFromDefault()

const HTTP_CREATED = 201
const HTTP_OK = 200
const HTTP_DELETE_SUCCESS = 204

async function getReference(inObject, inAPIURL) {
  if (inObject['href']) {
    const response = await axios.get(inAPIURL + inObject['href'])
    inObject['id'] = response.data[0]['id']
    inObject['name'] = response.data[0]['name']
    inObject['href'] = response.data[0]['href']
    return inObject
  }
  return inObject
}

async function resolveReferences(inObject, inAPIURL) {
  // resolve any references in the inObject payload

  for (const parameter in inObject) {
    const parameterValue = inObject[parameter]
    if (Array.isArray(parameterValue)) {
      for (const index in parameterValue) {
        inObject[parameter][index] = await getReference(parameterValue[index], inAPIURL)
      }
    } else if (typeof parameterValue === 'object' && parameterValue !== null) {
      inObject[parameter] = await getReference(parameterValue, inAPIURL)
    }
  }

  return inObject
}

const componentUtils = {

  /**
  * Function that returns the base URL for a given API instance
  * @param    {String} inComponentInstance    Name of the component instance
  * @param    {String} inAPIName              Name of the API that is requested
  * @param    {String} inNamespace            Namespace where the component instance is running
  * @return   {String}         String containing the base URL for the API, or null if the API is not found
  */
  getAPIURL: async function (inComponentInstance, inAPIName, inNamespace) {
    const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi)
    const APIResourceName = inComponentInstance + '-' + inAPIName
    const namespacedCustomObject = await k8sCustomApi.listNamespacedCustomObject('oda.tmforum.org', 'v1alpha4', inNamespace, 'apis', undefined, undefined, 'metadata.name=' + APIResourceName)
    if (namespacedCustomObject.body.items.length === 0) {
      return null // API not found
    }
    var APIURL = namespacedCustomObject.body.items[0].status.apiStatus.url
    return APIURL
  },

  /**
  * Function that deletes test data from the namd API.
  * @param    {String} inResource           Name of the resource to be deleted
  * @param    {String} inAPIURL             Base URL of the API to load the data into
  * @return   {Boolean}          True if the data was deleted successfully, false otherwise
  */
  deleteTestData: async function (inResource, inAPIURL) {
    let loadedSuccessfully = true

    const response = await axios.get(inAPIURL + '/' + inResource)
    if (response.status !== HTTP_OK) {
      loadedSuccessfully = false
    } else {
      for (const index in response.data) {
        const delResponse = await axios.delete(inAPIURL + '/' + inResource + '/' + response.data[index]['id'])
        if (delResponse.status !== HTTP_DELETE_SUCCESS) {
          loadedSuccessfully = false
        }
      }
    }
    return loadedSuccessfully
  },

  /**
  * Function that loads test data from a file into the namd API.
  * @param    {String} inTestDataFile         Filename of the file containing the test data
  * @param    {String} inAPIURL               Base URL of the API to load the data into
  * @return   {Boolean}          True if the data was loaded successfully, false otherwise
  */
  loadTestData: async function (inTestDataFile, inAPIURL) {
    const testData = JSON.parse(fs.readFileSync(inTestDataFile, 'utf8'))
    let loadedSuccessfully = true
    for (const payload in testData.payloads) {
      const resourceURL = inAPIURL + '/' + payload
      for (const index in testData.payloads[payload]) {
        let resourceObject = testData.payloads[payload][index].payload
        resourceObject = await resolveReferences(resourceObject, inAPIURL) // resolve any references in the resourceObject payload
        const response = await axios.post(resourceURL, resourceObject)
        if (response.status !== HTTP_CREATED) {
          loadedSuccessfully = false
        }
      }
    }
    return loadedSuccessfully
  },

  /**
  * Function that compares results data to test data from a file.
  * @param    {String} inTestDataFile         Filename of the file containing the test data
  * @param    {String} inReturnData           Object containing the results data
  * @return   {Boolean}          True if the data matches the test data, false otherwise
  */
  validateReturnData: async function (inResultDataFile, inReturnData, inAPIURL) {
    const resultData = JSON.parse(fs.readFileSync(inResultDataFile, 'utf8'))
    let validatedSuccessfully = true

    // go through each item in test data and compare to return data
    for (const payload in resultData.payloads) {
      for (const index in resultData.payloads[payload]) {
        let body = resultData.payloads[payload][index].payload
        body = await resolveReferences(body, inAPIURL) // resolve any references in the body payload

        // compare body.name and body.description to return data
        let found = false
        for (const returnDataItem in inReturnData) {
          if ((inReturnData[returnDataItem].name === body.name) && (inReturnData[returnDataItem].description === body.description)) {
            found = true
            break
          }
        }
        if (!found) {
          validatedSuccessfully = false
        }
      }
    }
    return validatedSuccessfully
  }
}
module.exports = componentUtils