const { Given, When, Then, After } = require('@cucumber/cucumber');
const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = require('assert');
const componentUtils = require('component-utils')

chai.use(chaiHttp)
const NAMESPACE = 'components'
const HTTP_OK = 200

const componentInstanceName = 'r1-productcatalogmanagement'

let productCatalogAPIURL = null

Given('An empty product catalog', async function () {
  // get access to the Product Catalog API
  productCatalogAPIURL = await componentUtils.getAPIURL(componentInstanceName, 'productcatalogmanagement', NAMESPACE)
  assert.notEqual(productCatalogAPIURL, null, "Can't find Product Catalog API - check that the component is running")

  // delete all productofferingprice resources
  let deleteSuccessful = await componentUtils.deleteTestData('productofferingprice', productCatalogAPIURL)
  assert.equal(deleteSuccessful, true, 'Failed to delete productofferingprice test data')

  // delete all productoffering resources
  deleteSuccessful = await componentUtils.deleteTestData('productoffering', productCatalogAPIURL)
  assert.equal(deleteSuccessful, true, 'Failed to delete productoffering test data')

  // delete all productspecification resources
  deleteSuccessful = await componentUtils.deleteTestData('productspecification', productCatalogAPIURL)
  assert.equal(deleteSuccessful, true, 'Failed to delete productspecification test data')

  // delete all category resources
  deleteSuccessful = await componentUtils.deleteTestData('category', productCatalogAPIURL)
  assert.equal(deleteSuccessful, true, 'Failed to delete category test data')

  // delete all catalog resources
  deleteSuccessful = await componentUtils.deleteTestData('catalog', productCatalogAPIURL)
  assert.equal(deleteSuccessful, true, 'Failed to delete catalog test data')
})

Given('A product catalog populated with {string} data', async function (inputResource, dataTable) {
  // Load the inputResource data from the dataTable
  const loadSuccessful = await componentUtils.loadTestDataFromDataTable(inputResource, dataTable, productCatalogAPIURL)
  assert.equal(loadSuccessful, true, 'Failed to load test data')
})

When('we request a list of {string} resources', async function (inputResource) {
  // get the inputResource resource list
  const response = await chai.request(productCatalogAPIURL).get('/' + inputResource)
  assert.equal(response.status, HTTP_OK, 'Failed to get ' + inputResource + ' list')
  this.returnData = response.body
})

Then('we should see {string} data', async function (inputResource, dataTable) {
  // validate result data against the dataTable
  const valid = await componentUtils.validateReturnDataFromDataTable(inputResource, dataTable, this.returnData, productCatalogAPIURL)
  assert.equal(valid, true, inputResource + ' do not match result data')
})

Given('A catalog populated with {string} data linked to {string} resources', async function (inputResource, linkedResource, dataTable) {
  const resourceData = dataTable.hashes()
  // change the linked resource name to a href link
  for (const index in resourceData) {
    /* the linked resource should look like this:
    [{
      "href": "/category?name=Internet line of product",
      "@referredType": "Category"
    }] */
    resourceData[index][linkedResource] = [{
      href: '/' + linkedResource + '?name=' + resourceData[index][linkedResource],
      "@referredType": linkedResource
    }]
  }
  const testDataObject = { payloads: {} }
  testDataObject.payloads[inputResource] = resourceData
  const loadSuccessful = await componentUtils.loadTestDataFromObject(testDataObject, productCatalogAPIURL)
  assert.equal(loadSuccessful, true, 'Failed to load test data')
})

When('we select {string} filtered by {string} equal to {string}', async function (inResource, inFilter, inFilterValue) {
  // get the resource using a filter
  const response = await chai.request(productCatalogAPIURL).get('/' + inResource + '?' + inFilter + '=' + inFilterValue)
  assert.equal(response.status, HTTP_OK, 'Failed to get ' + inResource + ' list')
  this.returnData = response.body
})

When('We delete a {string} resource', function (inResource, dataTable) {
  // Write code here that turns the phrase above into concrete actions

})

Then('We should not see the {string} resource', function (string) {
  // Write code here that turns the phrase above into concrete actions
  return 'pending'
})