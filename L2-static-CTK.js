const Mocha = require('mocha')
const process = require('process')
const fs = require('fs')
const mochaOptions = require('./.mocharc.json')


// create an environment variable with list of components to test. Either find all components in components folder or the single component passed as a command-line arguement
if (process.argv.length > 2) {
  process.env.components = process.argv[2]
} else {
  // look for components folder at ../components and load all files with .component.yaml into environmnet variable
  const componentsFolder = './components/'
  const fileArray = []
  fs.readdirSync(componentsFolder).filter(fn => fn.endsWith('.yaml')).forEach(file => {
    fileArray.push('./components/' + file)
  })
  process.env.components = fileArray.join(',')
}

const mocha = new Mocha({
  ...mochaOptions,
  reporterOptions: {
    reportFilename: '[status]_[datetime]-Specific_static-report',
    json: false
  },
})


mocha.addFile('L2-staticValidationTests.js')

// Run the test.
mocha.run(function (failures) {
  process.exitCode = failures ? 1 : 0 // exit with non-zero status if there were failures
})
