const { Given, When, Then, After } = require('@cucumber/cucumber');
const fs = require('fs')
const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = require('assert');
const YAML = require('yaml')
const k8s = require('@kubernetes/client-node')
const componentUtils = require('component-utils')

chai.use(chaiHttp)
const expect = chai.expect
const COMPONENT = 'component'
const NAMESPACE = 'components'
const TEST_DATA_FILE = './test-data/product-categories.config.json'
const HTTP_OK = 200

const kc = new k8s.KubeConfig()
kc.loadFromDefault()

const componentInstanceName = 'r1-productcatalog'

function getComponentDocument (inDocumentArray) {
  // go through each document checking for a kind: component
  for (const docKey in inDocumentArray) {
    if (inDocumentArray[docKey].get('kind') === COMPONENT) {
      return inDocumentArray[docKey]
    }
  }
  return null
}

Given('An initial catalog populated with product category data', async function () {
  // get access to the Product Catalog API
  const productCatalogAPIURL = await componentUtils.getAPIURL(componentInstanceName, 'productcatalogmanagement', NAMESPACE)
  assert.notEqual(productCatalogAPIURL, null, "Can't find Product Catalog API")

  // get the initial data from the product-categories.config.json file
  const loadSuccessful = await componentUtils.loadTestData(TEST_DATA_FILE, productCatalogAPIURL)
  assert.equal(loadSuccessful, true, 'Failed to load test data')
})

When('we request the products categories', async function () {
  // get access to the Product Catalog API
  const productCatalogAPIURL = await componentUtils.getAPIURL(componentInstanceName, 'productcatalogmanagement', NAMESPACE)
  assert.notEqual(productCatalogAPIURL, null, "Can't find Product Catalog API")

  const response = await chai.request(productCatalogAPIURL).get('/category')
  assert.equal(response.status, HTTP_OK, 'Failed to get product categories')

  this.returnData = response.body
})

Then('we should receive list of categories', async function (dataTable) {
  // check the response matches the test data
  const valid = await componentUtils.validateReturnData(TEST_DATA_FILE, this.returnData)
  assert.equal(valid, true, 'Product categories do not match test data')
})

Given('An initial catalog populated with product offer data linked to {string} category', function (string) {
  // Write code here that turns the phrase above into concrete actions
  return 'pending'
})

When('we select Internet line of product category', function () {
  // Write code here that turns the phrase above into concrete actions
  return 'pending'
})

Then('we should receive list of offers', async function (dataTable) {
  // write implementation here
  return 'pending'
})
