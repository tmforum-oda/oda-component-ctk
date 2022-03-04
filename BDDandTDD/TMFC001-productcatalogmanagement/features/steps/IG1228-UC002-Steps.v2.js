const { Given, When, Then, After } = require('@cucumber/cucumber');
const componentUtils = require('component-utils')
const fs = require('fs')
const chai = require('chai')
const chaiHttp = require('chai-http')
const YAML = require('yaml')
const process = require('process')
const k8s = require('@kubernetes/client-node')

chai.use(chaiHttp)
const expect = chai.expect
const COMPONENT = 'component'
const NAMESPACE = process.env.NAMESPACE
const HEADER = process.env.HEADER
const kc = new k8s.KubeConfig()
kc.loadFromDefault()

Given('An initial catalog populated with product category data', async function () {
  // Write code here that turns the phrase above into concrete actions

  // get access to the Product Catalog API
  console.log('Getting access to the Product Catalog API')
  var apiList = await componentUtils.getCoreAPIs()
  console.log(apiList)
  await componentUtils.loadTestData('./test-data/product-categories.config.json', apiList[0].url)

  // get the initial data from the product-categories.config.json file
  
  return 'pending'
})

When('we request the products categories', async function () {
  // write implementation here
  return 'pending'
})

Then('we should receive list of categories', async function (dataTable) {
  // write implementation here
  return 'pending'
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
