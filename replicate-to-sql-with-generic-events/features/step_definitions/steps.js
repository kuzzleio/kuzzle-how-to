'use strict';

const { Given, Then } = require('cucumber'),
  { Kuzzle, WebSocket } = require('kuzzle-sdk'),
  { spawn } = require('nexpect');

Given(/A Kuzzle stack with Postgres running/, function() {
  try {
    this.kuzzle = new Kuzzle(new WebSocket('localhost'));
  } catch (error) {
    throw new Error(error);
  }
});

Then(/I can load the test data into Kuzzle/, function(cb) {
  spawn('node', ['scripts/import-data.js'])
    .expect('Created 99 documents')
    .run(function(error, stdout) {
      if (error) {
        cb(error);
      }
      console.log(stdout);
      cb();
    });
});

Then(/I can check that data are in postgres and kuzzle/, function(cb) {
  spawn('node', ['scripts/count-data.js'])
    .expect('Documents : 99, 99')
    .run(function(error, stdout) {
      if (error) {
        cb(error);
      }
      console.log(stdout);
      cb();
    });
});

Then(/I can delete data into Kuzzle/, function(cb) {
  spawn('node', ['scripts/delete-data.js'])
    .expect('Deleted 99 documents')
    .run(function(error, stdout) {
      if (error) {
        cb(error);
      }
      console.log(stdout);
      cb();
    });
});

Then(/I can check that data are not in postgres and kuzzle/, function(cb) {
  spawn('node', ['scripts/count-data.js'])
    .expect('Documents : 0, 0')
    .run(function(error, stdout) {
      if (error) {
        cb(error);
      }
      console.log(stdout);
      cb();
    });
});
