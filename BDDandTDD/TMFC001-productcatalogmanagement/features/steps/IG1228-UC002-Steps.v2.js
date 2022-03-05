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
const CATEGORY_TEST_DATA_FILE = './test-data/product-categories.config.json'
const CATEGORY_RESULT_DATA_FILE = './test-data/product-categories.config.json'
const OFFER_TEST_DATA_FILE = './test-data/product-offers-input.config.json'
const OFFER_RESULT_DATA_FILE = './test-data/product-offers-result.config.json'
const HTTP_OK = 200

const kc = new k8s.KubeConfig()
kc.loadFromDefault()

const componentInstanceName = 'r1-productcatalog'

Given('An empty product catalog', async function () {
  // get access to the Product Catalog API
  const productCatalogAPIURL = await componentUtils.getAPIURL(componentInstanceName, 'productcatalogmanagement', NAMESPACE)
  assert.notEqual(productCatalogAPIURL, null, "Can't find Product Catalog API")

  // delete all product offers
  let loadSuccessful = await componentUtils.deleteTestData('productoffering', productCatalogAPIURL)
  assert.equal(loadSuccessful, true, 'Failed to delete productoffering test data')

  // delete all product categories
  loadSuccessful = await componentUtils.deleteTestData('category', productCatalogAPIURL)
  assert.equal(loadSuccessful, true, 'Failed to delete category test data')
})

Given('A catalog populated with product category data', async function () {
  // get access to the Product Catalog API
  const productCatalogAPIURL = await componentUtils.getAPIURL(componentInstanceName, 'productcatalogmanagement', NAMESPACE)
  assert.notEqual(productCatalogAPIURL, null, "Can't find Product Catalog API")

  // get the initial data from the product-categories.config.json file
  const loadSuccessful = await componentUtils.loadTestData(CATEGORY_TEST_DATA_FILE, productCatalogAPIURL)
  assert.equal(loadSuccessful, true, 'Failed to load test data')
})

When('we request the products categories', async function () {
  // get access to the Product Catalog API
  const productCatalogAPIURL = await componentUtils.getAPIURL(componentInstanceName, 'productcatalogmanagement', NAMESPACE)
  assert.notEqual(productCatalogAPIURL, null, "Can't find Product Catalog API")

  // get the product categories
  const response = await chai.request(productCatalogAPIURL).get('/category')
  assert.equal(response.status, HTTP_OK, 'Failed to get product categories')

  this.returnData = response.body
})

Then('we should receive list of categories', async function (dataTable) {
  // get access to the Product Catalog API
  const productCatalogAPIURL = await componentUtils.getAPIURL(componentInstanceName, 'productcatalogmanagement', NAMESPACE)
  assert.notEqual(productCatalogAPIURL, null, "Can't find Product Catalog API")

  // check the response matches the test data
  const valid = await componentUtils.validateReturnData(CATEGORY_RESULT_DATA_FILE, this.returnData, productCatalogAPIURL)
  assert.equal(valid, true, 'Product categories do not match result data')
})

Given('A catalog populated with product offer data linked to {string} category and {string} category', async function (categoryOneString, categoryTwoString, string) {
  console.log(string)
  // get access to the Product Catalog API
  const productCatalogAPIURL = await componentUtils.getAPIURL(componentInstanceName, 'productcatalogmanagement', NAMESPACE)
  assert.notEqual(productCatalogAPIURL, null, "Can't find Product Catalog API")

  // get the initial data from the product-offer.config.json file
  const loadSuccessful = await componentUtils.loadTestData(OFFER_TEST_DATA_FILE, productCatalogAPIURL)
  assert.equal(loadSuccessful, true, 'Failed to load test data')
})

When('we select {string} category', async function (categoryOneString) {
  // get access to the Product Catalog API
  const productCatalogAPIURL = await componentUtils.getAPIURL(componentInstanceName, 'productcatalogmanagement', NAMESPACE)
  assert.notEqual(productCatalogAPIURL, null, "Can't find Product Catalog API")

  // get the product offers
  const response = await chai.request(productCatalogAPIURL).get('/productoffering?category.name=' + categoryOneString)
  assert.equal(response.status, HTTP_OK, 'Failed to get product offers')

  this.returnData = response.body
})

Then('we should receive list of offers', async function (dataTable) {
  // get access to the Product Catalog API
  const productCatalogAPIURL = await componentUtils.getAPIURL(componentInstanceName, 'productcatalogmanagement', NAMESPACE)
  assert.notEqual(productCatalogAPIURL, null, "Can't find Product Catalog API")

  // check the response matches the test data
  const valid = await componentUtils.validateReturnData(OFFER_RESULT_DATA_FILE, this.returnData, productCatalogAPIURL)
  assert.equal(valid, true, 'Product offers do not match result data')
})
