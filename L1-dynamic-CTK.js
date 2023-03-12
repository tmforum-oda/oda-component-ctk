const Mocha = require('mocha')
const process = require('process')
const mochaOptions = require('./.mocharc.json')

let namespace = 'components' // default
if (process.env.NAMESPACE) {
  namespace = process.env.NAMESPACE
}

let header = '' // default
let numberOfArgs = 0
process.argv.forEach(function (val, index, array) {
  if ((val === '-n') || (val === '--namespace')) {
    numberOfArgs = numberOfArgs + 2
    if (array[index + 1]) {
      namespace = array[index + 1]
    } else {
      console.error('Please provide the namespace value after %s', val)
      process.exit(1)
    }
  }

  if ((val === '-H') || (val === '--header')) {
    numberOfArgs = numberOfArgs + 2
    if (array[index + 1]) {
      header = array[index + 1]
    } else {
      console.error('Please provide the header value after %s', val)
      process.exit(1)
    }
  }  
})

process.env.NAMESPACE = namespace
process.env.HEADER = header

// create an environment variable for the component passed as a command-line arguement
process.env.components = process.argv[numberOfArgs + 2]

const mocha = new Mocha({
  ...mochaOptions,
  reporterOptions: {
    ...mochaOptions.reporterOptions,
    reportFilename: 'Generic_dynamic-report',
    reportTitle: 'Generic Dynamic Validation Tests',
  },
})

mocha.addFile('L1-dynamicValidationTests.js')

// Run the test.
mocha.run(function (failures) {
  process.exitCode = failures ? 1 : 0 // exit with non-zero status if there were failures
})
