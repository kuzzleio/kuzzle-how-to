Feature: How-To End2End test

  Scenario: Play the How-To
    Given A Kuzzle stack with Cassandra running
    Then I can check the Cassandra plugin presence
    Then I can load the test data into Kuzzle
    Then I can check if they are synchronized in Cassandra
