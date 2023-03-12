const fs = require('fs')

const Validator = require('jsonschema').Validator

config = JSON.parse(fs.readFileSync('../config.json'))

const pmCollection = require('./CTK-Product_Catalog-4.0.0.postman_collection.json')


headers = []
Object.keys(config.headers).forEach(function (header) {
  h = {
    key: header,
    value: config.headers[header]
  }
  headers.push(h)
})

pmCollection.item.forEach(function (i, indexi) {
  i.item.forEach(function (ii, indexii) {
    pmCollection.item[indexi].item[indexii].request.header = headers
  })
})

Object.keys(config.payloads).forEach(resource => {
  const v = new Validator()
  const schema = require('./schemas/' + resource + '.schema.json')
  valid = v.validate(config.payloads[resource].POST.payload, schema)
  if (!valid.valid) {
    console.log('ERROR: Resource ' + resource + ' on config.json ' + valid.errors[0].message)
    console.log('Fix your example to continue')
    process.exit(0)
  }
  if (resource == 'ProductSpecification') {
    pmCollection.item[0].item[0].request.body.raw = JSON.stringify(config.payloads[resource].POST.payload)
  }
  if (resource == 'ProductOffering') {
    pmCollection.item[3].item[0].request.body.raw = JSON.stringify(config.payloads[resource].POST.payload)
  }
  if (resource == 'ProductOfferingPrice') {
    pmCollection.item[6].item[0].request.body.raw = JSON.stringify(config.payloads[resource].POST.payload)
  }
})
fs.writeFileSync('pmtest.json', JSON.stringify(pmCollection))


exportEnvironment(config.url)

function exportEnvironment (url) {
  const fs = require('fs')
  const environmentFile = 'TMFENV-V4.0.0.postman_environment.json'
  const content = fs.readFileSync(environmentFile, 'utf8')
  const envJson = JSON.parse(content)
  envJson.name = 'TMForumv4'
  envJson.values.forEach(element => {
    if (element.key == 'Product_Catalog') {
      element.value = config.url
    }
  })
  jsonData = JSON.stringify(envJson)
  fs.writeFileSync('TMFENV.json', jsonData)
  runNewman()
}

function runNewman () {
  const newman = require('newman')

  newman.run({
    collection: pmCollection,
    environment: require('./TMFENV.json'),
    insecure: true,
    reporters: ['allure', 'html', 'json'],
    reporter: {
      html: {
        export: '../../../results/api-ctk/TMF620-Results.html' // If not specified, the file will be written to `newman/` in the current working directory.
        // template: './customTemplate.hbs' // optional, this will be picked up relative to the directory that Newman runs in.
      },
      json: {
        export: '../../../results/api-ctk/TMF620-Results.json'
      }
      //qallure: {
        //export: '../../../allure-results'
      //}
    }
  }).on('start', function (err, args) {
    console.log('running a collection...')
  }).on('done', function (err, summary) {
    if (err || summary.error) {
      if (err) {
        console.error('collection run encountered an error. ' + err)
        process.exit(2)
      }
      if (summary.error) {
        console.log("Collected run completed but with errors, please check htmlResults.html for details. Your API didn't pass the Conformance Test Kit.")
        process.exit(1)
      }
    } else {
      console.log('...Conformance Test Kit executed all the tests, check htmlResults.html and jsonResults.json for your test results.\n...If you are looking for certification, please contact TM Forum.')
      process.exit(0)
    }
  })
}
