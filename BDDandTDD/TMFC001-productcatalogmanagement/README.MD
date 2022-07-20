Using BDD to define Component Features using Scenarios
------------------------------------------------------

This repository is experimenting using Behavior-driven development (BDD) to document the functionality of an ODA component. 

Using the Cucumber.js (https://cucumber.io/) implementation of BDD, you describe the features of a component in a feature file using the Gherkin language (https://cucumber.io/docs/gherkin/reference/).

We are basing the example feature on the [IG1228 use-case UC002 Browse B2C Catalogue](https://projects.tmforum.org/wiki/display/PUB/Use+Case+UC002%3A+Browse+B2C+catalogue+and+check+Fiber+technical+eligibility+v1). The features file in the Gherkin language looks like:


 ![Feature](images/feature.png)


This describes a business friendly structure with the feature description and some scenarios where you can test that feature in the *When* *Then* format.



A list of features described in this way would be included in the *Golden Component* definition for each functional component.


Generating automated tests from features
----------------------------------------

Assuming you have created the feature in a file called `./features/IG1228-UC002-Browse-B2C-Catalogue.feature` you can run the test by typing:

```
./node_modules/.bin/cucumber-js ./features/IG1228-UC002-Browse-B2C-Catalogue.feature
```
You should see some warnings, because we haven’t told Cucumber.js how each step is actually implemented yet.The warnings are designed to help you develop the actual tests. For example, you will see something like:

```
Warnings:

1) Scenario: Load the product categories # features\IG1228-UC002-Browse-B2C-Catalogue.feature:3
   ? When we request the products categories
       Undefined. Implement with the following snippet:


         When('we request the products categories', function () {
           // Write code here that turns the phrase above into concrete actions
           return 'pending';
         });

   ? Then we should receive list of categories
       | category name            | description                       |
       | Internet line of product | Fiber and ADSL broadband products |
       | Mobile line of product   | Mobile phones and packages        |
       | IoT line of product      | IoT devices and solutions         |
       Undefined. Implement with the following snippet:

         Then('we should receive list of categories', function (dataTable) {
           // Write code here that turns the phrase above into concrete actions
           return 'pending';
         });
```


If you copy the code snippets into a file `./features/steps/IG1228-UC002-Steps.v1.js' and then fill in the actual test details, then you will see the tests start to succeed (or at least different warning messages!).

There is a good tutorial on Cucumber javascript framework at https://www.testim.io/blog/cucumber-js-for-bdd-an-introductory-tutorial-with-examples/


Running the BDD scripts
-----------------------

type:
```
npm start
```
