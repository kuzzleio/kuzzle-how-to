Feature: Replicate to sql with generic events functional tests

  Scenario: Play the How-To
    Given A Kuzzle stack with Postgres running
    Then I can load the test data into Kuzzle
    Then I can check that data are in postgres and kuzzle
    Then I can delete data into Kuzzle
    Then I can check that data are not in postgres and kuzzle