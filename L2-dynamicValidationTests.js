/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const fs = require('fs')
const chai = require('chai')
const YAML = require('yaml')
const process = require('process')
const k8s = require('@kubernetes/client-node')
var chaiFiles = require('chai-files');
chai.use(chaiFiles)
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const expect = chai.expect
const COMPONENT = 'component'

const ctkPaths = {
  'Product Catalog Management':
      { '4.0.0': 'TMF620_Product_catalog_V4-0-0' },
  'Party Role Management':
      { '4.0.0': 'TMF669-PartyRole-security-min' },
  'Product Inventory':
      { '4.0.0': 'TMF637-ProductInventory_V4-0-0' }
}
const kc = new k8s.KubeConfig()
kc.loadFromDefault()

console.log('***************************************************************************')
console.log('Open Digital Architecture - Component Test Kit CTK Level 2 Dynamic Tests')
console.log('***************************************************************************')
console.log()

const NAMESPACE = process.env.NAMESPACE
const HEADER = process.env.HEADER
const components = process.env.components.split(',')
for (const index in components) {
  const componentEnvelopeName = components[index]
  let documentArray = []
  const file = fs.readFileSync(componentEnvelopeName, 'utf8')
  documentArray = YAML.parseAllDocuments(file)
  const componentDoc = getComponentDocument(documentArray)
  const componentAPIVersion = componentDoc.get('apiVersion')
  const metadata = componentDoc.get('metadata')
  const componentName = metadata.get('name')
  const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api)
  const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi)
  describe('Step 0: Basic environment connectivity tests', function () {
    it('Kubectl configured correctly', function (done) {
      k8sCoreApi.listNamespacedPod(NAMESPACE).then((res) => {
        expect(res, "Kubectl should return pods in 'components' namespace").to.be.a('object')
        done()
      })
    })
  })

  describe('Step 1: Check metadata for component ' + componentEnvelopeName, function () {
    it('Component can be found', function (done) {
      k8sCustomApi.listNamespacedCustomObject('oda.tmforum.org', 'v1alpha4', NAMESPACE, 'components', undefined, undefined, 'metadata.name=' + componentName)
        .then(function (res) {
          const numberOfComponentsFound = res.body.items.length
          expect(numberOfComponentsFound, 'Should find 1 component with name ' + componentName).to.equal(1)
          done()
        }).catch(done)
    })

    it('Component has deployed successfully (summary/status.deployment_status: Complete)', function (done) {
      k8sCustomApi.listNamespacedCustomObject('oda.tmforum.org', 'v1alpha4', NAMESPACE, 'components', undefined, undefined, 'metadata.name=' + componentName)
        .then(function (res) {
          const status = res.body.items[0].status
          expect(status['summary/status'].deployment_status, 'status.summary/status.deployment_status is Complete').to.equal('Complete')
          done()
        }).catch(done)
    })



  })

  // get Component resource
  k8sCustomApi.listNamespacedCustomObject('oda.tmforum.org', 'v1alpha4', NAMESPACE, 'components', undefined, undefined, 'metadata.name=' + componentName).then(function (res) {
    describe('Step 2 run CTK on each mandatory API from Golden Component ', function () {
      // get the component details
      const status = res.body.items[0].status
      const spec = res.body.items[0].spec
      const type = spec.type
      const version = spec.version

      // find the corresponding 'Golden Component'
      const goldenComponentFilename = type + '-v' + version.split('.').join('-') + '.yaml'

      it("type and version match one of the 'Golden Components'", function (done) {
        expect(type, "Spec should have a 'type' field of type string").to.be.a('string')
        expect(version, "Spec should have a 'version' field of type string").to.be.a('string')
        expect(chaiFiles.file('./golden-components/' + goldenComponentFilename)).to.exist
        done()
      })

      let file
      let loadedGoldenComponent = false
      try {
        file = fs.readFileSync('./golden-components/' + goldenComponentFilename, 'utf8')
        loadedGoldenComponent = true
      } catch (err) {
        loadedGoldenComponent = false
      }

      if (loadedGoldenComponent) {
        documentArray = YAML.parseAllDocuments(file)
        const goldenComponent = documentArray[0]
        const goldenExposedAPI = goldenComponent.get('spec').get('coreFunction').get('exposedAPIs')
        const goldenExposedAPIArray = goldenExposedAPI.items

        // run the CTK Corresponding to each API in the Golden Components coreFunction/exposedAPIs
        for (const key in goldenExposedAPIArray) {
          const goldenAPIName = goldenExposedAPIArray[key].get('name')
          it('Executing OpenAPI CTK for ' + goldenAPIName + ': check /results folder for your results.', async function () {
            this.timeout(120000) // 2 minute timeout
            const goldenAPISpec = goldenExposedAPIArray[key].get('specification')
            const goldenAPIobject = await getSchemaFromURL(goldenAPISpec)

            // look in the current component spec for an API with the same title and version
            let foundAPI = false
            let targetCTKTitle, targetCTKVersion, targetAPIName
            const exposedAPIArray = spec.coreFunction.exposedAPIs
            for (const exposedAPIArrayKey in exposedAPIArray) {
              if ('specification' in exposedAPIArray[exposedAPIArrayKey]) {
                const exposedAPISpec = exposedAPIArray[exposedAPIArrayKey].specification
                const exposedAPIobject = await getSchemaFromURL(exposedAPISpec)
                if ((exposedAPIobject.info.title === goldenAPIobject.info.title) && (exposedAPIobject.info.version === goldenAPIobject.info.version)) {
                  foundAPI = true
                  targetCTKTitle = goldenAPIobject.info.title
                  targetCTKVersion = goldenAPIobject.info.version
                  targetAPIName = componentName + '-' + exposedAPIArray[exposedAPIArrayKey].name
                }
              }
            }
            expect(foundAPI, "Found '" + goldenAPIobject.info.title + "' API with version '" + goldenAPIobject.info.version + "'").to.equal(true)
            // Look up the OpenAPI CTK name for this API/Version
            const ctkName = ctkPaths[targetCTKTitle][targetCTKVersion]
            // configure and set-up the CTK
            CTKConfig = JSON.parse(fs.readFileSync('./api-ctk/' + ctkName + '/config.json'))
            // update the API URL in config from Component
            const coreAPIsArray = status.coreAPIs
            for (const statusAPIKey in coreAPIsArray) {
              if('name' in coreAPIsArray[statusAPIKey]){
                if (coreAPIsArray[statusAPIKey].name === targetAPIName) {
                  CTKConfig.url = coreAPIsArray[statusAPIKey].url + '/'
                }
              }
            }

            if (HEADER !== '') {
              // add authToken headder
              headerName = HEADER.split(':')[0]
              headerValue = HEADER.split(':')[1]
              CTKConfig.headers[headerName] = headerValue
            }

            fs.writeFileSync('./api-ctk/' + ctkName + '/config.json', JSON.stringify(CTKConfig))

            // execute the CTK
            const { execSync } = require('child_process')
            execSync('npm start', { cwd: './api-ctk/' + ctkName + '/ctk' })
            this.timeout(120000) 

            // move the CTK results to the /results folder
            let oldPath = './api-ctk/' + ctkName + '/htmlResults.html'
            let newPath = './results/' + ctkName + '.html'
            fs.renameSync(oldPath, newPath, function (err) {
              if (err) throw err
            })
            oldPath = './api-ctk/' + ctkName + '/jsonResults.json'
            newPath = './results/' + ctkName + '.json'
            fs.renameSync(oldPath, newPath, function (err) {
              if (err) throw err
            })

            // check the results
            testResults = JSON.parse(fs.readFileSync(newPath))
            const numberOfFailures = testResults.run.failures.length
            expect(numberOfFailures, 'Test result should have zero failures - check /results folder for details.').to.equal(0)
          })
        }
      }
    })

    describe('Step 3 run party role CTK against component security implementation', function () {
      // get the component details
      const status = res.body.items[0].status

      it('Executing OpenAPI CTK for partyrole: check /results folder for your results.', async function () {
        this.timeout(120000) // 2 minute timeout
        const ctkName = ctkPaths['Party Role Management']['4.0.0']
        // configure and set-up the CTK
        CTKConfig = JSON.parse(fs.readFileSync('./api-ctk/' + ctkName + '/config.json'))
        CTKConfig.url = status.securityAPIs.partyrole.url + '/'
        if (HEADER !== '') {
          // add authToken headder
          headerName = HEADER.split(':')[0]
          headerValue = HEADER.split(':')[1]
          CTKConfig.headers[headerName] = headerValue
        }
        fs.writeFileSync('./api-ctk/' + ctkName + '/config.json', JSON.stringify(CTKConfig))
        // execute the CTK
        const { execSync } = require('child_process')
        execSync('npm start', { cwd: './api-ctk/' + ctkName + '/ctk' })
        // move the CTK results to the /results folder
        let oldPath = './api-ctk/' + ctkName + '/htmlResults.html'
        let newPath = './results/' + ctkName + '.html'
        fs.renameSync(oldPath, newPath, function (err) {
          if (err) throw err
        })
        oldPath = './api-ctk/' + ctkName + '/jsonResults.json'
        newPath = './results/' + ctkName + '.json'
        fs.renameSync(oldPath, newPath, function (err) {
          if (err) throw err
        })

        // check the results
        testResults = JSON.parse(fs.readFileSync(newPath))
        const numberOfFailures = testResults.run.failures.length
        expect(numberOfFailures, 'Test result should have zero failures - check /results folder for details.').to.equal(0)
      })
    })
  })
}

function getComponentDocument (inDocumentArray) {
  // go through each document checking for a kind: component
  for (const docKey in inDocumentArray) {
    if (inDocumentArray[docKey].get('kind') === COMPONENT) {
      return inDocumentArray[docKey]
    }
  }
  return null
}

async function getSchemaFromURL(inURL) {
  const httpScheme = inURL.split('://')[0] + '://'
  const server = inURL.split('://')[1].split('/')[0]
  const apiPath = '/' + inURL.split('://')[1].split(/\/(.+)/)[1]
  const APIresponse = await chai.request(httpScheme + server).get(apiPath).send()
  const APIobject = JSON.parse(APIresponse.res.text)
  return (APIobject)
}
