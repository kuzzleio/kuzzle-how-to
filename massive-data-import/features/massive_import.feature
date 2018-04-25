Feature: How-To End2End test

  Scenario: Play the How-To
    Given A Kuzzle stack running
    Then I can load the dataset with bulk import
    Then I can load the dataset with mCreate and a subscription
