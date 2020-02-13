'use strict';

const { Given, Then } = require('cucumber');
const { Kuzzle, WebSocket } = require('kuzzle-sdk');
const { spawn } = require('nexpect');
const { PostgresWrapper, pgConfigLocal } = require('../../lib/postgres');

Given(/A Kuzzle stack with Postgres running/, async function() {
  this.kuzzle = new Kuzzle(new WebSocket('localhost'));
  this.postgres = new PostgresWrapper(pgConfigLocal);
  await this.kuzzle.connect();
  await this.postgres.connect();
});

Then(/I can load the test data into Kuzzle/, function(done) {
  spawn('node', ['scripts/import-data.js']).run(function(error) {
    if (error) {
      done(error);
    }
    else {
      done();
    }
  });
});

Then(/I can check that data are in postgres and kuzzle/, function(done) {
  spawn('node', ['scripts/count-data.js']).run(function(error) {
    if (error) {
      done(error);
    }
    else {
      done();
    }
  });
});

Then(/I can delete data into Kuzzle/, function(done) {
  spawn('node', ['scripts/delete-data.js']).run(function(error) {
    if (error) {
      done(error);
    }
    else {
      done();
    }
  });
});

Then(/I can check that data are not in postgres and kuzzle/, function(done) {
  spawn('node', ['scripts/count-data.js']).run(function(error) {
    if (error) {
      done(error);
    }
    else {
      done();
    }
  });
});
