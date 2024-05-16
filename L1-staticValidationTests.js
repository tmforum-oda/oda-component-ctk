/* eslint-disable no-undef */
const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;
const YAML = require('yaml');
const process = require('process');
const COMPONENT = 'Component';
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

console.log('***************************************************************************');
console.log('Open Digital Architecture - Component Test Kit CTK Level 1 Static Tests');
console.log('***************************************************************************');
console.log();
const components = process.env.components.split(',');

components.forEach((componentEnvelopeName) => {
  const file = fs.readFileSync(componentEnvelopeName, 'utf8');
  const documentArray = YAML.parseAllDocuments(file);
  const componentDoc = getComponentDocument(documentArray);

  describe('Step 0: Basic file tests for component ' + componentEnvelopeName, function () {
    it('File naming convention', function () {
      const nameArray = componentEnvelopeName.split('.');
      expect(nameArray[nameArray.length - 2], "Filename should end '.component.yaml'").to.equal('component');
      expect(nameArray[nameArray.length - 1], "Filename should end '.component.yaml'").to.equal('yaml');
    });

    it('Valid YAML document(s)', function () { // check that the file contains 1 or more YAML documents and that documents parse with zero errors
      expect(documentArray, 'The file should contain at least one YAML document.').to.be.a('array');
      expect(documentArray.length, 'The file should contain at least one YAML document.').to.be.greaterThan(0);
      // go through each document checking for errors
      documentArray.forEach(doc => {
        expect(doc.errors.length, 'YAML parsing error.' + doc.errors.toString()).to.equal(0);
      });
    });
  }); //end of Step 0

  describe('Step 1: Check ODA-Component Metadata for component ' + componentEnvelopeName, function () {
    this.timeout(15000);

    const componentDoc = getComponentDocument(documentArray);

    it('Contains document of kind: component', function () {
      expect(componentDoc, "The document should have a field of 'kind: Component'. It used to be component but should be Component, as kind should be in CamelCase.").to.not.be.null;
    });

    it('Component apiVersion "' + componentDoc.get('apiVersion') + '" is within supported versions', function () {
      const supportedVersions = ['oda.tmforum.org/v1alpha2', 'oda.tmforum.org/v1alpha3', 'oda.tmforum.org/v1alpha4', 'oda.tmforum.org/v1beta1', 'oda.tmforum.org/v1beta2', 'oda.tmforum.org/v1beta3'];
      expect(componentDoc.get('apiVersion'), "Component should have an 'apiVersion' field of type string").to.be.a('string');
      expect(componentDoc.get('apiVersion')).to.be.oneOf(supportedVersions, "'apiVersion' should be within supported versions " + supportedVersions);
    });

    it('Component has metadata', function () {
      expect(componentDoc.get('metadata'), "Component should have a 'metadata' field of type object").to.be.a('object');
    });

    it('Metadata has name and labels', function () {
      const metadata = componentDoc.get('metadata');
      expect(metadata.get('name'), "Metadata should have a 'name' field of type string").to.be.a('string');
      expect(metadata.get('labels'), "Metadata should have a 'labels' field of type object").to.be.a('object');
    });

    it('Component has spec', function () {
      expect(componentDoc.get('spec'), "Component should have a 'spec' field of type object").to.be.a('object');
    });

    it('Spec has type, version, description, maintainers, owners', function () {
      const spec = componentDoc.get('spec');
     // expect(spec.get('type'), "Spec should have a 'type' field of type string").to.be.a('string');
      expect(spec.get('version'), "Spec should have a 'version' field of type string").to.be.a('string');
      expect(spec.get('description'), "Spec should have a 'description' field of type string").to.be.a('string');
      expect(spec.get('maintainers'), "Spec should have a 'maintainers' field of type object").to.be.a('object');
      expect(spec.get('owners'), "Spec should have a 'owners' field of type object").to.be.a('object');
    });

    const versionsWithDependant = ['oda.tmforum.org/v1alpha1', 'oda.tmforum.org/v1alpha2'];
    if (versionsWithDependant.includes(componentDoc.get('apiVersion'))) {
      it('Spec has coreFunction with exposedAPIs and dependantAPIs', function () {
        const coreFunction = componentDoc.get('spec').get('coreFunction');
        //const coreFunction = spec.get('coreFunction');
        expect(coreFunction, 'Spec has a coreFunction field of type object').to.be.a('object');
        expect(coreFunction.get('exposedAPIs'), "coreFunction should have a 'exposedAPIs' field of type object").to.be.a('object');
        expect(coreFunction.get('dependantAPIs'), "coreFunction should have a 'dependantAPIs' field of type object").to.be.a('object');
      });
    } else {
      it('Spec has coreFunction with exposedAPIs and dependentAPIs', function () {
        const coreFunction = componentDoc.get('spec').get('coreFunction');
        expect(coreFunction, 'Spec has a coreFunction field of type object').to.be.a('object');
        expect(coreFunction.get('exposedAPIs'), "coreFunction should have a 'exposedAPIs' field of type object").to.be.a('object');
        expect(coreFunction.get('dependentAPIs'), "coreFunction should have a 'dependentAPIs' field of type object").to.be.a('object');
      });
    }

    const versionsWithAccessibleSwagger = ['oda.tmforum.org/v1alpha3', 'oda.tmforum.org/v1alpha4', 'oda.tmforum.org/v1beta1'];
    if (versionsWithAccessibleSwagger.includes(componentDoc.get('apiVersion'))) {
      it('Swagger file of coreFunction exposedAPIs and dependentAPIs is accessible', async function () {
        const coreFunction = componentDoc.get('spec').get('coreFunction');
        await checkApiAccessibility(coreFunction.get('exposedAPIs'));
        await checkApiAccessibility(coreFunction.get('dependentAPIs'));
      });
    }

    const versionsWithdependentAPIsInManagementandSecurity = ['oda.tmforum.org/v1beta1'];
    if (versionsWithdependentAPIsInManagementandSecurity.includes(componentDoc.get('apiVersion'))) {
      it('Swagger file of management exposedAPIs and dependentAPIs is accessible (for openapis)', async function () {
        const management = componentDoc.get('spec').get('management');
        await checkApiAccessibility(management.get('exposedAPIs'), 'openapi');
        await checkApiAccessibility(management.get('dependentAPIs'), 'openapi');
      });

      it('Swagger file of security exposedAPIs and dependentAPIs is accessible (for openapis)', async function () {
        const security = componentDoc.get('spec').get('security');
        await checkApiAccessibility(security.get('exposedAPIs'), 'openapi');
        await checkApiAccessibility(security.get('dependentAPIs'), 'openapi');
      });
    }else {
      it('Spec has management function', function () {
        const management = componentDoc.get('spec').get('managementFunction')
        expect(management, 'Spec has a management function field of type object').to.be.a('object')
      });
      it('Spec has security function', function () {
        const security = componentDoc.get('spec').get('securityFunction')
        expect(security, 'Spec has a security function field of type object').to.be.a('object')
      });
    }
    const versionsWithRoleInObject = ['oda.tmforum.org/v1alpha2', 'oda.tmforum.org/v1alpha3', 'oda.tmforum.org/v1alpha4']
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
      });
    }
    const versionsWithRoleInArray = ['oda.tmforum.org/v1beta1']
    if (versionsWithRoleInArray.indexOf(componentDoc.get('apiVersion')) > -1) {
      it('Security has partyrole', function () {
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
      });
    }

    const versionsWithControllerRole = ['oda.tmforum.org/v1alpha3', 'oda.tmforum.org/v1alpha4', 'oda.tmforum.org/v1beta1']
    if (versionsWithControllerRole.indexOf(componentDoc.get('apiVersion')) > -1) {
      it('Security has controllerRole', function () {
        const spec = componentDoc.get('spec')
        const security = spec.get('security')
        const controllerRole = security.get('controllerRole')
        expect(controllerRole, 'security object includes a controllerRole property of type string').to.be.a('string')
      });
    }
  }); //end of Step 1

  describe('Step 2: Check any standard kubernetes resources are labelled for component ' + componentEnvelopeName, function () {
    const componentDoc = getComponentDocument(documentArray);
    const metadata = componentDoc.get('metadata')
    const componentName = metadata.get('name')
    // go through all the other resources in the envelope and check that they are labelled with this name
    for (const docKey in documentArray) {
      testResource(docKey, componentName)
    }
  }) //end of Step 2
  
  function testResource (i, inComponentName) {
    it('Resource ' + i + ' is labelled', function () {
      const docResource = documentArray[i]
      const docMetadata = docResource.get('metadata')
      expect(docMetadata, 'Resource has a metadata field of type object').to.be.a('object')
      const docName = docMetadata.get('name')
      const docLabels = docMetadata.get('labels')
      expect(docLabels, docName + ' resource has a metadata field with labels of type object').to.be.a('object')
      const componentNameLabel = docLabels.get('oda.tmforum.org/componentName')
      expect(componentNameLabel, docName + ' resource has a oda.tmforum.org/componentName label of type string').to.be.a('string')
      expect(componentNameLabel, docName + " resource has a oda.tmforum.org/componentName label matching the component name '" + inComponentName + "'").to.equal(inComponentName)
    })
  }

});

function getComponentDocument(documentArray) {
  return documentArray.find(doc => doc.get('kind') === COMPONENT) || null;
}

async function checkApiAccessibility(apiList, apiType = null) {
  const items = apiList.items;
  for (const item of items) {
    if (!apiType || item.get('apitype') === apiType) {
      const specification = item.get('specification');
      const [httpScheme, serverAndPath] = specification.split('://');
      const server = serverAndPath.split('/')[0];
      const apiPath = '/' + serverAndPath.split(/\/(.+)/)[1];
      const res = await chai.request(httpScheme + '://' + server).get(apiPath).send();
      expect(res.status, `Swagger ${specification} has a return code of 200`).to.equal(200);
    }
  }
}
