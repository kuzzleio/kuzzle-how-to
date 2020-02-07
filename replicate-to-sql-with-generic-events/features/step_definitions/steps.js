'use strict';

const
  {
    Given,
    When,
    Then
  } = require('cucumber'),
  Kuzzle = require('kuzzle-sdk'),
  nexpect = require('nexpect'),
  { spawnSync } = require('child_process');

Given(/a running instance of Kuzzle with a client connected/, function (callback) {
  this.kuzzle = new Kuzzle(this.host, { port: this.port }, error => {
    callback(error);
  });
});

When(/I (create|update|delete) the document "([^"]*)"/, function (action, document, callback) {
  const collection = this.kuzzle.collection('test-collection', 'test-index');
  collection[`${action}DocumentPromise`](document, { name: 'gordon', age: 42 })
    .then(() => callback())
    .catch(error => callback(error));
});

Then(/I should encounter the log "([^"]*)"/, function (expectedLog, callback) {
  nexpect
    .spawn('docker-compose -f ./docker/docker-compose.yml logs kuzzle')
    .wait(expectedLog, () => callback())
    .run(error => {
      if (error) {
        return callback(error);
      }

      return callback(new Error(`"${expectedLog}" not found in logs`));
    });
});

When(/I request the route "([^"]*)"/, function (route, callback) {
  const url = `http://${this.host}:${this.port}/_plugin/kuzzle-core-plugin-boilerplate${route}`;
  const curl = spawnSync('curl', [url]);

  if (curl.status === 0) {
    callback();
  } else {
    callback(new Error(`Can not reach Kuzzle: ${curl.stdout.toString()}`));
  }
});

When(/I create an user using my new "(\w+)" strategy/, function (strategy, callback) {
  const user = {
    content: {
      profileIds: ['admin']
    },
    credentials: {
      [strategy]: {
        username: 'hackerman',
        password: 'itshackingtime'
      }
    }
  };

  this.kuzzle
    .security
    .createUserPromise('hackerman', user, {})
    .then(() => callback())
    .catch(() => callback());
});

Then(/I can login my user using my new "(\w+)" strategy/, function (strategy, callback) {
  const credentials = {
    username: 'hackerman',
    password: 'itshackingtime'
  };

  this.kuzzle
    .loginPromise(strategy, credentials)
    .then(() => callback())
    .catch(error => callback(error));
});

Then('I am successfully logged in', function (callback) {
  if (this.kuzzle.getJwtToken()) {
    callback();
  } else {
    callback(new Error('User not loggued in (JWT Token not present)'));
  }
});

When(/I execute a query to the SDK usage action with document id "([^"]*)"/, function (documentId, callback) {
  const args = {
    controller: 'kuzzle-core-plugin-boilerplate/myNewController',
    action: 'getDocument'
  };

  const query = {
    documentId,
    indexName: 'test-index',
    collectionName: 'test-collection'
  };

  this.kuzzle
    .queryPromise(args, query)
    .then(() => callback())
    .catch(error => callback(error));
});
