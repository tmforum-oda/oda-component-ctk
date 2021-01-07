var Mocha = require('mocha')
const process = require('process')
const fs = require('fs');

// create an environment variable with list of components to test. Either find all components in components folder or the single component passed as a command-line arguement
if (process.argv.length>2) {
  componentEnvelopeName = process.argv[2];
  process.env.components = componentEnvelopeName;
}
else {
  // look for components folder at ../components and load all files with .component.yaml into environmnet variable
  const componentsFolder = './components/';
  var fileArray = [];
  fs.readdirSync(componentsFolder).filter(fn => fn.endsWith('.yaml')).forEach(file => {
    fileArray.push('./components/' + file);
  });
  process.env.components = fileArray.join(',');
}


var mocha = new Mocha({
  reporter: 'spec'
});

mocha.addFile('staticValidationTests.js');

// Run the test.
mocha.run(function(failures) {
  process.exitCode = failures ? 1 : 0;  // exit with non-zero status if there were failures
});
