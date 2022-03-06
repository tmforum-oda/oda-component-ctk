const { Given, When, Then, After } = require('@cucumber/cucumber');
const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = require('assert');
const k8s = require('@kubernetes/client-node')
const componentUtils = require('component-utils')

chai.use(chaiHttp)
const NAMESPACE = 'components'
const CATEGORY_RESULT_DATA_FILE = './test-data/product-categories.config.json'
const OFFER_TEST_DATA_FILE = './test-data/product-offers-input.config.json'
const OFFER_RESULT_DATA_FILE = './test-data/product-offers-result.config.json'
const HTTP_OK = 200

const kc = new k8s.KubeConfig()
kc.loadFromDefault()

const componentInstanceName = 'r1-productcatalog'

let productCatalogAPIURL = null

Given('An empty product catalog', async function () {
  // get access to the Product Catalog API
  productCatalogAPIURL = await componentUtils.getAPIURL(componentInstanceName, 'productcatalogmanagement', NAMESPACE)
  assert.notEqual(productCatalogAPIURL, null, "Can't find Product Catalog API")

  // delete all product offers
  let loadSuccessful = await componentUtils.deleteTestData('productoffering', productCatalogAPIURL)
  assert.equal(loadSuccessful, true, 'Failed to delete productoffering test data')

  // delete all product categories
  loadSuccessful = await componentUtils.deleteTestData('category', productCatalogAPIURL)
  assert.equal(loadSuccessful, true, 'Failed to delete category test data')
})

Given('A product catalog populated with {string} data', async function (inputResource, dataTable) {
  // Build the product category data from the dataTable
  const resourceData = dataTable.hashes()
  const testDataObject = { payloads: {} }
  testDataObject.payloads[inputResource] = resourceData
  const loadSuccessful = await componentUtils.loadTestDataFromObject(testDataObject, productCatalogAPIURL)
  assert.equal(loadSuccessful, true, 'Failed to load test data')
})

When('we request a list of {string} resources', async function (inputResource) {
  // get the product categories
  const response = await chai.request(productCatalogAPIURL).get('/' + inputResource)
  assert.equal(response.status, HTTP_OK, 'Failed to get ' + inputResource + ' list')
  this.returnData = response.body
})

Then('we should see {string} data', async function (inputResource, dataTable) {
  // Build the expected result data from the dataTable
  const resourceData = dataTable.hashes()
  const testDataObject = { payloads: {} }
  testDataObject.payloads[inputResource] = resourceData
  const valid = await componentUtils.validateReturnDataFromObject(testDataObject, this.returnData, productCatalogAPIURL)
  assert.equal(valid, true, 'Product categories do not match result data')
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