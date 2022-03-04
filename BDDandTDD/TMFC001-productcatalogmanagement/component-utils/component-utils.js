const k8s = require('@kubernetes/client-node')
const fs = require('fs')
const YAML = require('yaml')
const axios = require('axios')

const kc = new k8s.KubeConfig()
kc.loadFromDefault()

const HTTP_CREATED = 201
const componentUtils = {
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
  loadTestData: async function (inTestDataFile, inAPIURL) {
    const testData = JSON.parse(fs.readFileSync(inTestDataFile, 'utf8'))
    let loadedSuccessfully = true
    for (const payload in testData.payloads) {
      const resourceURL = inAPIURL + '/' + payload
      for (const index in testData.payloads[payload]) {
        const body = testData.payloads[payload][index].payload
        const response = await axios.post(resourceURL, body)
        if (response.status !== HTTP_CREATED) {
          loadedSuccessfully = false
        }
      }
    }
    return loadedSuccessfully
  },
  validateReturnData: async function (inTestDataFile, inReturnData) {
    const testData = JSON.parse(fs.readFileSync(inTestDataFile, 'utf8'))
    let validatedSuccessfully = true

    // go through each item in test data and compare to return data
    for(const payload in testData.payloads) {
      for (const index in testData.payloads[payload]) {
        const body = testData.payloads[payload][index].payload

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