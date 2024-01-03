/* eslint-disable no-undef */
const fs = require('fs')
const chai = require('chai')
const expect = chai.expect
const YAML = require('yaml')
const process = require('process')
const COMPONENT = 'component'
const chaiHttp = require('chai-http')
chai.use(chaiHttp)

console.log('***************************************************************************')
console.log('Open Digital Architecture - Component Test Kit CTK Level 1 Static Tests')
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
      expect(documentArray, 'The file should contain at least one YAML document.').to.be.a('array')
      expect(documentArray.length, 'The file should contain at least one YAML document.').to.be.greaterThan(0)
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
      const supportedVersions = ['oda.tmforum.org/v1alpha3', 'oda.tmforum.org/v1alpha4', 'oda.tmforum.org/v1beta1', 'oda.tmforum.org/v1beta2']

      expect(componentDoc.get('apiVersion'), "Component should have an 'apiVersion' field of type string").to.be.a('string')
      expect(componentDoc.get('apiVersion')).to.be.oneOf(supportedVersions, "'apiVersion' should be within supported versions " + supportedVersions);
      done()
    })

    it('Component has metadata', function (done) {
      expect(componentDoc.get('metadata'), "Component should have a 'metadata' field of type object").to.be.a('object')
      done()
    })

    it('Metadata has name and labels', function (done) {
      const metadata = componentDoc.get('metadata')
      expect(metadata.get('name'), "Metadata should have a 'name' field of type string").to.be.a('string')
      expect(metadata.get('labels'), "Metadata should have a 'labels' field of type object").to.be.a('object')
      done()
    })

    it('Component has spec', function (done) {
      expect(componentDoc.get('spec'), "Component should have a 'spec' field of type object").to.be.a('object')
      done()
    })

    it('Spec has version, description, maintainers, owners ', function (done) {
      const spec = componentDoc.get('spec')
      expect(spec.get('version'), "Spec should have a 'version' field of type string").to.be.a('string')
      expect(spec.get('description'), "Spec should have a 'description' field of type string").to.be.a('string')
      expect(spec.get('maintainers'), "Spec should have a 'maintainers' field of type object").to.be.a('object')
      expect(spec.get('owners'), "Spec should have a 'owners' field of type object").to.be.a('object')
      done()
    })

    const versionsWithType = ['oda.tmforum.org/v1alpha3', 'oda.tmforum.org/v1alpha4', 'oda.tmforum.org/v1beta1']
    if (versionsWithType.indexOf(componentDoc.get('apiVersion')) > -1) {
      it('Spec has type', function (done) {
        const spec = componentDoc.get('spec')
        expect(spec.get('type'), "Spec should have a 'type' field of type string").to.be.a('string')
        done()
      })
    } else {
      it('Spec has id, name, functionalBlock', function (done) {
        const spec = componentDoc.get('spec')
        expect(spec.get('id'), "Spec should have a 'id' field of type string").to.be.a('string')
        expect(spec.get('name'), "Spec should have a 'name' field of type string").to.be.a('string')
        expect(spec.get('functionalBlock'), "Spec should have a 'functionalBlock' field of type string").to.be.a('string')
        done()
      })
    }

    it('Spec has coreFunction with exposedAPIs and dependentAPIs', function (done) {
      const spec = componentDoc.get('spec')
      const coreFunction = spec.get('coreFunction')
      expect(coreFunction, 'Spec has a coreFunction field of type object').to.be.a('object')
      expect(coreFunction.get('exposedAPIs'), "coreFunction should have a 'exposedAPIs' field of type object").to.be.a('object')
      expect(coreFunction.get('dependentAPIs'), "coreFunction should have a 'dependentAPIs' field of type object").to.be.a('object')
      done()
    })

    const versionsWithAccessibleSwagger = ['oda.tmforum.org/v1alpha3', 'oda.tmforum.org/v1alpha4', 'oda.tmforum.org/v1beta1']
    if (versionsWithAccessibleSwagger.indexOf(componentDoc.get('apiVersion')) > -1) {
      it('Swagger file of coreFunction exposedAPIs and dependentAPIs is accessible', async function () {
        const spec = componentDoc.get('spec')
        const coreFunction = spec.get('coreFunction')
        expect(coreFunction, 'Spec has a coreFunction field of type object').to.be.a('object')
        expect(coreFunction.get('exposedAPIs'), "coreFunction should have a 'exposedAPIs' field of type object").to.be.a('object')
        expect(coreFunction.get('dependentAPIs'), "coreFunction should have a 'dependentAPIs' field of type object").to.be.a('object')
        const exposedAPIsArray = coreFunction.get('exposedAPIs').items
        for (const key in exposedAPIsArray) {
          const specification = exposedAPIsArray[key].get('specification')
          const httpScheme = specification.split('://')[0] + '://'
          const server = specification.split('://')[1].split('/')[0]
          const apiPath = '/' + specification.split('://')[1].split(/\/(.+)/)[1]
          const res = await chai.request(httpScheme + server).get(apiPath).send()
          expect(res.status, 'Swagger ' + specification + ' has a return code of 200').to.equal(200)
        }
        const dependentAPIs = coreFunction.get('dependentAPIs').items
        for (const key in dependentAPIs) {
          const specification = dependentAPIs[key].get('specification')
          const httpScheme = specification.split('://')[0] + '://'
          const server = specification.split('://')[1].split('/')[0]
          const apiPath = '/' + specification.split('://')[1].split(/\/(.+)/)[1]
          const res = await chai.request(httpScheme + server).get(apiPath).send()
          expect(res.status, 'Swagger ' + specification + ' has a return code of 200').to.equal(200)
        }
      })
    }

    managementSegmentName = 'managementFunction'
    securitySegmentName = 'securityFunction'
    const versionsPreManagementandSecurityFunction = ['oda.tmforum.org/v1alpha3', 'oda.tmforum.org/v1alpha4', 'oda.tmforum.org/v1beta1']
    if (versionsPreManagementandSecurityFunction.indexOf(componentDoc.get('apiVersion')) > -1) {
      managementSegmentName = 'management'
      securitySegmentName = 'security'
    }

    const versionsWithdependentAPIsInManagementandSecurity = ['oda.tmforum.org/v1beta1', 'oda.tmforum.org/v1beta2']
    if (versionsWithdependentAPIsInManagementandSecurity.indexOf(componentDoc.get('apiVersion')) > -1) {
      it('Spec has ' + managementSegmentName + ' with exposedAPIs and dependentAPIs', function (done) {
        const spec = componentDoc.get('spec')
        const management = spec.get(managementSegmentName)
        done()
        expect(management, 'Spec has a ' + managementSegmentName + ' field of type object').to.be.a('object')
        expect(management.get('exposedAPIs'), managementSegmentName + " should have a 'exposedAPIs' field of type object").to.be.a('object')
        expect(management.get('dependentAPIs'), managementSegmentName + " should have a 'dependentAPIs' field of type object").to.be.a('object')
      })

      it('Swagger file of ' + managementSegmentName + ' exposedAPIs and dependentAPIs is accessible (for openapis)', async function () {
        const spec = componentDoc.get('spec')
        const management = spec.get(managementSegmentName)
        expect(management, 'Spec has a management field of type object').to.be.a('object')
        expect(management.get('exposedAPIs'), managementSegmentName + " should have a 'exposedAPIs' field of type object").to.be.a('object')
        expect(management.get('dependentAPIs'), managementSegmentName + " should have a 'dependentAPIs' field of type object").to.be.a('object')
        const exposedAPIsArray = management.get('exposedAPIs').items
        for (const key in exposedAPIsArray) {
          if (exposedAPIsArray[key].get('apitype') === 'openapi') {
            const specification = exposedAPIsArray[key].get('specification')
            const httpScheme = specification.split('://')[0] + '://'
            const server = specification.split('://')[1].split('/')[0]
            const apiPath = '/' + specification.split('://')[1].split(/\/(.+)/)[1]
            const res = await chai.request(httpScheme + server).get(apiPath).send()
            expect(res.status, 'Swagger ' + specification + ' has a return code of 200').to.equal(200)
          }
        }
        const dependentAPIs = management.get('dependentAPIs').items
        for (const key in dependentAPIs) {
          if (dependentAPIs[key].get('apitype') === 'openapi') {
            const specification = dependentAPIs[key].get('specification')
            const httpScheme = specification.split('://')[0] + '://'
            const server = specification.split('://')[1].split('/')[0]
            const apiPath = '/' + specification.split('://')[1].split(/\/(.+)/)[1]
            const res = await chai.request(httpScheme + server).get(apiPath).send()
            expect(res.status, 'Swagger ' + specification + ' has a return code of 200').to.equal(200)
          }
        }
      })
      it('Spec has ' + securitySegmentName + ' with exposedAPIs and dependentAPIs', function (done) {
        const spec = componentDoc.get('spec')
        const security = spec.get(securitySegmentName)
        done()
        expect(security, 'Spec has a ' + securitySegmentName + ' field of type object').to.be.a('object')
        expect(security.get('exposedAPIs'), securitySegmentName + " should have a 'exposedAPIs' field of type object").to.be.a('object')
        expect(security.get('dependentAPIs'), securitySegmentName + " should have a 'dependentAPIs' field of type object").to.be.a('object')
      })

      it('Swagger file of ' + securitySegmentName + ' exposedAPIs and dependentAPIs is accessible (for openapis)', async function () {
        const spec = componentDoc.get('spec')
        const security = spec.get(securitySegmentName)
        expect(security, 'Spec has a security field of type object').to.be.a('object')
        expect(security.get('exposedAPIs'), securitySegmentName + " should have a 'exposedAPIs' field of type object").to.be.a('object')
        expect(security.get('dependentAPIs'), securitySegmentName + " should have a 'dependentAPIs' field of type object").to.be.a('object')
        const exposedAPIsArray = security.get('exposedAPIs').items
        for (const key in exposedAPIsArray) {
          if (exposedAPIsArray[key].get('apitype') === 'openapi') {
            const specification = exposedAPIsArray[key].get('specification')
            const httpScheme = specification.split('://')[0] + '://'
            const server = specification.split('://')[1].split('/')[0]
            const apiPath = '/' + specification.split('://')[1].split(/\/(.+)/)[1]
            const res = await chai.request(httpScheme + server).get(apiPath).send()
            expect(res.status, 'Swagger ' + specification + ' has a return code of 200').to.equal(200)
          }
        }
        const dependentAPIs = security.get('dependentAPIs').items
        for (const key in dependentAPIs) {
          if (dependentAPIs[key].get('apitype') === 'openapi') {
            const specification = dependentAPIs[key].get('specification')
            const httpScheme = specification.split('://')[0] + '://'
            const server = specification.split('://')[1].split('/')[0]
            const apiPath = '/' + specification.split('://')[1].split(/\/(.+)/)[1]
            const res = await chai.request(httpScheme + server).get(apiPath).send()
            expect(res.status, 'Swagger ' + specification + ' has a return code of 200').to.equal(200)
          }
        }
      })
    } else {
      it('Spec has ' + managementSegmentName, function (done) {
        const spec = componentDoc.get('spec')
        const management = spec.get(managementSegmentName)
        done()
        expect(management, 'Spec has a management field of type object').to.be.a('object')
      })
      it('Spec has ' + securitySegmentName, function (done) {
        const spec = componentDoc.get('spec')
        const security = spec.get(securitySegmentName)
        expect(security, 'Spec has a security field of type object').to.be.a('object')
        done()
      })
    }

    const versionsWithRoleInObject = ['oda.tmforum.org/v1alpha3', 'oda.tmforum.org/v1alpha4']
    if (versionsWithRoleInObject.indexOf(componentDoc.get('apiVersion')) > -1) {
      it('Security has partyrole', function (done) {
        const spec = componentDoc.get('spec')
        const security = spec.get('security')
        const partyrole = security.get('partyrole')
        expect(partyrole, 'Security property includes a partyrole field of type object').to.be.a('object')
        const specification = partyrole.get('specification')
        expect(specification, 'partyrole property includes a specification field of type string').to.be.a('string')
        const implementation = partyrole.get('implementation')
        expect(implementation, 'partyrole property includes an implementation field of type string').to.be.a('string')
        const path = partyrole.get('path')
        expect(path, 'partyrole property includes a path field of type string').to.be.a('string')
        done()
      })
    }

    const versionsWithRoleInArray = ['oda.tmforum.org/v1beta1']
    if (versionsWithRoleInArray.indexOf(componentDoc.get('apiVersion')) > -1) {
      it('Security has partyrole', function (done) {
        const spec = componentDoc.get('spec')
        const security = spec.get('security')
        let partyRoleFound = false
        const exposedAPIsArray = security.get('exposedAPIs').items
        for (const api in exposedAPIsArray) {
          if (exposedAPIsArray[api].get('name') === 'partyrole') {
            partyRoleFound = true
          }
        }
        expect(partyRoleFound, 'Security exposedAPIs includes an api named partyrole').to.equal(true)
        done()
      })
    }

    const versionsWithControllerRole = ['oda.tmforum.org/v1alpha3', 'oda.tmforum.org/v1alpha4', 'oda.tmforum.org/v1beta1']
    if (versionsWithControllerRole.indexOf(componentDoc.get('apiVersion')) > -1) {
      it('Security has controllerRole', function (done) {
        const spec = componentDoc.get('spec')
        const security = spec.get('security')
        const controllerRole = security.get('controllerRole')
        expect(controllerRole, 'security object includes a controllerRole property of type string').to.be.a('string')
        done()
      })
    }
  })

  describe('Step 2: Check any standard kubernetes resources are labelled for component ' + componentEnvelopeName, function () {
    documentArray = YAML.parseAllDocuments(file)
    const componentDoc = getComponentDocument(documentArray)
    const metadata = componentDoc.get('metadata')
    const componentName = metadata.get('name')
    // go through all the other resources in the envelope and check that they are labelled with this name
    for (const docKey in documentArray) {
      testResource(docKey, componentName)
    }
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

