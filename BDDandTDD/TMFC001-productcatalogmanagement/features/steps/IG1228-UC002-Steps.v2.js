const { When, Then, After } = require('cucumber');
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

When('we request the products categories', async function () {
    // write implementation here
    return 'pending'
});

Then('we should receive list of categories', async function (dataTable) {
    // write implementation here
    return 'pending'
});

When('we select Internet line of product', async function () {
    // write implementation here
    return 'pending'
});

Then('we should receive list of offers', async function (dataTable) {
    // write implementation here
    return 'pending'
});

