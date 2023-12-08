Feature: IG1228-T002-Browse B2C Catalogue

    Scenario: Load the product categories
        Given An empty product catalog
        Given A product catalog populated with 'category' data
            | name                      | description                                       |
            | Internet line of product  | Fiber and ADSL broadband products                 |
            | Mobile line of product    | Mobile phones and packages                        |
            | IoT line of product       | IoT devices and solutions                         |
        When we request a list of 'category' resources
        Then we should see 'category' data
            | name                      | description                                       |
            | Internet line of product  | Fiber and ADSL broadband products                 |
            | Mobile line of product    | Mobile phones and packages                        |
            | IoT line of product       | IoT devices and solutions                         |

    Scenario: Load the product offers and view offers filtered by category
        Given A catalog populated with 'productoffering' data linked to 'category' resources
            | name                      | description                                       | category                  |
            | Fiber Offering 1          | 50 Mbps Fiber broadband                           | Internet line of product  |
            | Fiber Offering 2          | 100 Mbps Fiber broadband                          | Internet line of product  |
            | Fiber + Mobile Offering 3 | 100 Mbps Fiber broadband + Unlimited data mobile  | Internet line of product  |
            | 4G IoT Dongle             | 4G Dongle with 5 Mbps mobile broadband service    | IoT line of product       |
        When we select 'productoffering' filtered by 'category.name' equal to 'Internet line of product'
        Then we should see 'productoffering' data
            | name                      | description                                       |
            | Fiber Offering 1          | 50 Mbps Fiber broadband                           |
            | Fiber Offering 2          | 100 Mbps Fiber broadband                          |
            | Fiber + Mobile Offering 3 | 100 Mbps Fiber broadband + Unlimited data mobile  |
        When we select 'productoffering' filtered by 'category.name' equal to 'IoT line of product'
        Then we should see 'productoffering' data
            | name                      | description                                       |
            | 4G IoT Dongle             | 4G Dongle with 5 Mbps mobile broadband service    |
 
