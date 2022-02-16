Feature: IG1228-UC002-Browse B2C Catalogue

    Scenario: Load the product categories
        Given An initial catalog populated with product category data
        When we request the products categories
        Then we should receive list of categories
            | category name             | description                                       |
            | Internet line of product  | Fiber and ADSL broadband products                 |
            | Mobile line of product    | Mobile phones and packages                        |
            | IoT line of product       | IoT devices and solutions                         |


    Scenario: Load the product offers
        Given An initial catalog populated with product offer data linked to 'Internet line of product' category
        When we select Internet line of product category
        Then we should receive list of offers
            | product offer             | description                                       |
            | Fiber Offering 1          | 50 Mbps Fiber broadband                           |
            | Fiber Offering 2          | 100 Mbps Fiber broadband                          |
            | Fiber + Mobile Offering 3 | 100 Mbps Fiber broadband + Unlimited data mobile  |
 