'use strict';

const { Given, Then } = require('cucumber'),
  { Kuzzle, WebSocket } = require('kuzzle-sdk'),
  { execSync } = require('child_process');

Given(/A Kuzzle stack with Postgres running/, function(callback) {
  try {
    this.kuzzle = new Kuzzle(new WebSocket('localhost'));
    callback();
  } catch (error) {
    console.error(error);
    callback(error);
  }
});

Then(/I can load the test data into Kuzzle/, function(callback) {
  try {
    execSync('node scripts/import-data.js');
    callback();
  } catch (error) {
    console.error(error);
    callback(error);
  }
});

Then(/I can check that data are in postgres and kuzzle/, function(callback) {
  try {
    execSync('node scripts/count-data.js');
    callback();
  } catch (error) {
    console.error(error);
    callback(error);
  }
});

Then(/I can delete data into Kuzzle/, function(callback) {
  try {
    execSync('node scripts/delete-data.js');
    callback();
  } catch (error) {
    console.error(error);
    callback(error);
  }
});

Then(/I can check that data are not in postgres and kuzzle/, function(
  callback
) {
  try {
    execSync('node scripts/count-data.js');
    callback();
  } catch (error) {
    console.error(error);
    callback(error);
  }
});
