const fs = require('fs');


var Validator = require('jsonschema').Validator;




config = JSON.parse(fs.readFileSync('../config.json'))

var pmCollection = require('./TMF669-PartyRole-v4.0.0.testkit.json');


exportEnvironment(config['url'])

headers = []
Object.keys(config['headers']).forEach(function(header){
    h = {
        "key": header,
        "value": config['headers'][header]
    }
    headers.push(h);
});
pmCollection['item'].forEach(function(i, indexi){
    i['item'].forEach(function(ii, indexii){
        pmCollection['item'][indexi]['item'][indexii]['request']['header'] = headers
    });
});

fs.writeFileSync('pmtest.json',JSON.stringify(pmCollection))
Object.keys(config['payloads']).forEach(resource => {
    var v = new Validator();
    var schema = require('./schemas/'+resource+'.schema.json');
    valid = v.validate(config['payloads'][resource]['POST']['payload'], schema);
    if (!valid.valid) {
        console.log("ERROR: Resource " + resource + " on config.json " + valid.errors[0]['message'])
        console.log('Fix your example to continue')
        process.exit(0)
    }
    
    //                if (resource == "PartyRole") {
    //                    pmCollection['item'][0]['item'][0]['request']['body']['raw'] = JSON.stringify(config['payloads'][resource]['POST']['payload'])
    //                }
                
    
});








function exportEnvironment(url) {

    var fs = require('fs');
    var environmentFile = "TMFENV-V4.0.0.postman_environment.json";
    var content = fs.readFileSync(environmentFile, "utf8");
    var envJson = JSON.parse(content);
    envJson.name = "TMForumv4";
    envJson.values.forEach(element => {
        if (element.key == "Party_Role") {
            element.value = config['url'];
        }
    });
    jsonData = JSON.stringify(envJson);
    fs.writeFileSync("TMFENV.json", jsonData);
    runNewman()

}

function runNewman() {
    var newman = require('newman');

    newman.run({
        collection: pmCollection,
        environment: require('./TMFENV.json'),
        insecure: true,
        reporters: ['html', 'json'],
        reporter: {
            html: {
                export: '../htmlResults.html', // If not specified, the file will be written to `newman/` in the current working directory.
                //template: './customTemplate.hbs' // optional, this will be picked up relative to the directory that Newman runs in.
            },
            json: {
                export: '../jsonResults.json'
            }
        }
    }).on('start', function (err, args) {
        console.log('running a collection...');
    }).on('done', function (err, summary) {
        if (err || summary.error) {
            if (err) {
                console.error('collection run encountered an error. ' + err);
                process.exit(2)
            }
            if (summary.error) {
                console.log("Collected run completed but with errors, please check htmlResults.html for details. Your API didn't pass the Conformance Test Kit.");
                process.exit(1)
            }

        } else {
            console.log('...Conformance Test Kit executed all the tests, check htmlResults.html and jsonResults.json for your test results.\n...If you are looking for certification, please contact TM Forum.');
            process.exit(0)
        }
    });
}