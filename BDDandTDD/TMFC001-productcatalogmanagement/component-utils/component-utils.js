const k8s = require('@kubernetes/client-node')
const fs = require('fs')
const YAML = require('yaml')
const process = require('process')

const COMPONENT = 'component'
const NAMESPACE = 'components'
const HEADER = process.env.HEADER
const kc = new k8s.KubeConfig()
kc.loadFromDefault()
const componentEnvelopeName = "../../v1alpha4.component.yaml"
let documentArray = []
const file = fs.readFileSync(componentEnvelopeName, 'utf8')
documentArray = YAML.parseAllDocuments(file)
const componentDoc = getComponentDocument(documentArray)

function getComponentDocument (inDocumentArray) {
  // go through each document checking for a kind: component
  for (const docKey in inDocumentArray) {
    if (inDocumentArray[docKey].get('kind') === COMPONENT) {
      return inDocumentArray[docKey]
    }
  }
  return null
}

const componentUtils = {
  getCoreAPIs: async function () {
    const metadata = componentDoc.get('metadata')
    const componentName = metadata.get('name')
    const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi)
    const namespacedCustomObject = await k8sCustomApi.listNamespacedCustomObject('oda.tmforum.org', 'v1alpha4', NAMESPACE, 'components', undefined, undefined, 'metadata.name=' + componentName)
    var exposedAPIList = namespacedCustomObject.body.items[0].status.exposedAPIs
    return exposedAPIList
  },
  loadTestData: async function (inTestDataFile, inAPIURL) {
    const testData = JSON.parse(fs.readFileSync(inTestDataFile, 'utf8'))
    console.log('============================================================')
    for(const payload in testData.payloads) {
      const resourceURL = inAPIURL + '/' + payload
      console.log(payload)
      console.log(resourceURL)
      for (const index in testData.payloads[payload]) {
        const body = testData.payloads[payload][index].payload
        console.log(body)
      }
    }
    console.log('============================================================')
  }
}
module.exports = componentUtils