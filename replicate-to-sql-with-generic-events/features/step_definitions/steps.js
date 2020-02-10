'use strict';

const { Given, Then } = require('cucumber'),
  { Kuzzle, WebSocket } = require('kuzzle-sdk'),
  { exec } = require('child_process');

Given(/A Kuzzle stack with Postgres running/, function() {
  try {
    this.kuzzle = new Kuzzle(new WebSocket('localhost'));
  } catch (error) {
    throw new Error(error);
  }
});

Then(/I can load the test data into Kuzzle/, function(cb) {
  exec('node scripts/import-data.js', function(error) {
    if (error) {
      cb(error);
    }
    cb();
  });
});

Then(/I can check that data are in postgres and kuzzle/, function(cb) {
  exec('node scripts/count-data.js', function(error, stdout) {
    if (error) {
      console.error('error', error);
      cb(error);
    }

    console.log('before', stdout);
    cb();
  });
});

Then(/I can delete data into Kuzzle/, function(cb) {
  exec('node scripts/delete-data.js', function(error, stdout) {
    if (error) {
      console.error('error', error);
      cb(error);
    }

    console.log(stdout);
    cb();
  });
});

Then(/I can check that data are not in postgres and kuzzle/, function(cb) {
  exec('node scripts/count-data.js', function(error, stdout) {
    if (error) {
      cb(error);
    }
    console.log('After', stdout);
    cb();
  });
});
