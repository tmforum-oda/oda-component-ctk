/* eslint-disable no-undef */
const fs = require('fs')
const chai = require('chai')
const expect = chai.expect
const YAML = require('yaml')
const process = require('process')
const COMPONENT = 'component'
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
var chaiFiles = require('chai-files');
chai.use(chaiFiles)

console.log('***************************************************************************')
console.log('Open Digital Architecture - Component Test Kit CTK Level 2 Static Tests')
console.log('***************************************************************************')
console.log()
const components = process.env.components.split(',')

for (const index in components) {
  const componentEnvelopeName = components[index]
  let documentArray = []
  const file = fs.readFileSync(componentEnvelopeName, 'utf8')
  describe('Step 0: Basic file tests for component ' + componentEnvelopeName, function () {
    it('File naming convention', function (done) {
      const nameArray = componentEnvelopeName.split('.')
      expect(nameArray[nameArray.length - 2], "Filename should end '.component.yaml'").to.equal('component')
      expect(nameArray[nameArray.length - 1], "Filename should end '.component.yaml'").to.equal('yaml')
      done()
    })

    it('Valid YAML document(s)', function (done) { // check that the file contains 1 or more YAML documents and that documents parse with zero errors
      documentArray = YAML.parseAllDocuments(file)
      expect(documentArray, 'The file shold contain at least one YAML document.').to.be.a('array')
      expect(documentArray.length, 'The file shold contain at least one YAML document.').to.be.greaterThan(0)
      // go through each document checking for errors
      for (const docKey in documentArray) {
        expect(documentArray[docKey].errors.length, 'YAML parsing error.' + documentArray[docKey].errors.toString()).to.equal(0)
      }
      done()
    })
  })

  describe('Step 1: Check ODA-Component Metadata for component ' + componentEnvelopeName, function () {
    this.timeout(15000)

    documentArray = YAML.parseAllDocuments(file)
    const componentDoc = getComponentDocument(documentArray)

    it('Contains document of kind: component', function (done) {
      // eslint-disable-next-line no-unused-expressions
      expect(componentDoc, "The document should have a field of 'kind: component'.").to.not.be.null
      done()
    })

    it('Component apiVersion "' + componentDoc.get('apiVersion') + '" is within supported versions', function (done) {
      const supportedVersions = ['oda.tmforum.org/v1alpha1', 'oda.tmforum.org/v1alpha2', 'oda.tmforum.org/v1alpha3']

      expect(componentDoc.get('apiVersion'), "Component should have an 'apiVersion' field of type string").to.be.a('string')
      expect(componentDoc.get('apiVersion')).to.be.oneOf(supportedVersions, "'apiVersion' should be within supported versions " + supportedVersions);
      done()
    })

    it('Component has spec', function (done) {
      expect(componentDoc.get('spec'), "Component should have a 'spec' field of type object").to.be.a('object')
      done()
    })

    it("type and version match one of the 'Golden Components'", function (done) {
      const spec = componentDoc.get('spec')
      const type = spec.get('type')
      const version = spec.get('version')
      const goldenComponentFilename = type + '-v' + version.split('.').join('-') + '.yaml'
      expect(type, "Spec should have a 'type' field of type string").to.be.a('string')
      expect(version, "Spec should have a 'version' field of type string").to.be.a('string')
      expect(chaiFiles.file('./golden-components/' + goldenComponentFilename)).to.exist
      done()
    })
  })

  describe("Step 2: Check any APIs in 'Golden Component' are specified in component " + componentEnvelopeName, function () {
    this.timeout(15000)
    documentArray = YAML.parseAllDocuments(file)
    const componentDoc = getComponentDocument(documentArray)
    it("exposedAPIs in 'Golden Components' have corresponding exposedAPI in component", async function () {
      const spec = componentDoc.get('spec')
      const exposedAPIArray = componentDoc.get('spec').get('coreFunction').get('exposedAPIs').items
      const type = spec.get('type')
      const version = spec.get('version')
      const goldenComponentFilename = type + '-v' + version.split('.').join('-') + '.yaml'
      const file = fs.readFileSync('./golden-components/' + goldenComponentFilename, 'utf8')
      documentArray = YAML.parseAllDocuments(file)
      const goldenComponent = documentArray[0]
      expect(goldenComponent, "Golden Component should be of type object").to.be.a('object')
      const goldenExposedAPI = goldenComponent.get('spec').get('coreFunction').get('exposedAPIs')
      const goldenExposedAPIArray = goldenExposedAPI.items
      for (const key in goldenExposedAPIArray) {
        const goldenAPISpec = goldenExposedAPIArray[key].get('specification')
        const goldenAPIobject = await getSchemaFromURL(goldenAPISpec)
        // look in the current component spec for an API with the same title and version
        let foundAPI = false
        for (const exposedAPIArrayKey in exposedAPIArray) {
          const exposedAPISpec = exposedAPIArray[exposedAPIArrayKey].get('specification')
          const exposedAPIobject = await getSchemaFromURL(exposedAPISpec)
          if ((exposedAPIobject.info.title === goldenAPIobject.info.title) && (exposedAPIobject.info.version === goldenAPIobject.info.version)) {
            foundAPI = true
          }
        }
        expect(foundAPI, "Found '" + goldenAPIobject.info.title + "' API with version '" + goldenAPIobject.info.version + "'").to.equal(true)
      }
      expect(version, "Spec should have a 'version' field of type string").to.be.a('string')
      expect(chaiFiles.file('./golden-components/' + goldenComponentFilename)).to.exist
    })
  })

  function testResource (i, inComponentName) {
    it('Resource ' + i + ' is labelled', function (done) {
      const docResource = documentArray[i]
      const docMetadata = docResource.get('metadata')
      expect(docMetadata, 'Resource has a metadata field of type object').to.be.a('object')
      const docName = docMetadata.get('name')
      const docLabels = docMetadata.get('labels')
      expect(docLabels, docName + ' resource has a metadata field with labels of type object').to.be.a('object')
      const componentNameLabel = docLabels.get('oda.tmforum.org/componentName')
      expect(componentNameLabel, docName + ' resource has a oda.tmforum.org/componentName label of type string').to.be.a('string')
      expect(componentNameLabel, docName + " resource has a oda.tmforum.org/componentName label matching the component name '" + inComponentName + "'").to.equal(inComponentName)

      done()
    })
  }
}

function getComponentDocument (inDocumentArray) {
  // go through each document checking for a kind: component
  for (const docKey in inDocumentArray) {
    if (inDocumentArray[docKey].get('kind') === COMPONENT) {
      return inDocumentArray[docKey]
    }
  }
  return null
};

async function getSchemaFromURL(inURL) {
  const httpScheme = inURL.split('://')[0] + '://'
  const server = inURL.split('://')[1].split('/')[0]
  const apiPath = '/' + inURL.split('://')[1].split(/\/(.+)/)[1]
  const APIresponse = await chai.request(httpScheme + server).get(apiPath).send()
  expect(APIresponse.res.statusCode, 'Expect to be able to download API Schema from URL').to.equal(200)
  const APIobject = JSON.parse(APIresponse.res.text)
  return (APIobject)
}
