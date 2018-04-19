Feature: How-To End2End test

  Scenario: Play the How-To
    Given A Kuzzle stack running
    Then I can load data in the past
    Then I can remove data older than 30 days
