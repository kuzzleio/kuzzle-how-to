Feature: Core Plugin Boilerplate functional tests

  Scenario: Hook events
    Given a running instance of Kuzzle with a client connected
    When I create the document "anti-citoyen-1"
    Then I should encounter the log "hook action create on document anti-citoyen-1"

  Scenario: Pipe events
    Given a running instance of Kuzzle with a client connected
    And I create the document "anti-citoyen-2"
    When I delete the document "anti-citoyen-2"
    Then I should encounter the log "pipe action delete on document anti-citoyen-2"

  Scenario: Controller action
    Given a running instance of Kuzzle with a client connected
    When I request the route "/say-something/loin_de_tissa"
    Then I should encounter the log "controller myNewController action myNewAction param loin_de_tissa"

  Scenario: Authentication strategy
    Given a running instance of Kuzzle with a client connected
    And I create an user using my new "dummy" strategy
    When I can login my user using my new "dummy" strategy
    Then I am successfully logged in

  Scenario: SDK usage
    Given a running instance of Kuzzle with a client connected
    And I create the document "anti-citoyen-3"
    When I execute a query to the SDK usage action with document id "anti-citoyen-3"
    Then I should encounter the log "Document anti-citoyen-3 found"
