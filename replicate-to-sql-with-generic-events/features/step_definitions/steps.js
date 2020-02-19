'use strict';

const { Given, Then } = require('cucumber');
const { Kuzzle, WebSocket } = require('kuzzle-sdk');
const { spawn } = require('nexpect');
const { PostgresWrapper } = require('../../lib/postgres');

const localConfig = {
  password: 'password',
  database: 'nyc_open_data',
  user: 'my_user',
  port: 5432
};
const pluginPath = '/var/app/plugins/enabled/replicate-to-sql-with-generic-events/';

Given(/A Kuzzle stack with Postgres running/, async function() {
  this.kuzzle = new Kuzzle(new WebSocket('localhost'));
  this.postgres = new PostgresWrapper(localConfig);
  await this.kuzzle.connect();
  this.pool = await this.postgres.connect();
});

Then(/I can load the test data into Kuzzle/, function(done) {
  const scriptPath = `${pluginPath}/import-data.js`;
  spawn('docker-compose exec kuzzle node', [scriptPath]).run(function(error) {
    if (error) {
      console.error(error);
      done(error);
    } else {
      done();
    }
  });
});

Then(/I can check that data are in postgres and kuzzle/, function(done) {
  const scriptPath = `${pluginPath}/count-data.js`;
  spawn('docker-compose exec kuzzle node', [scriptPath]).run(function(error) {
    if (error) {
      console.error(error);
      done(error);
    } else {
      done();
    }
  });
});

Then(/I can delete data into Kuzzle/, function(done) {
  const scriptPath = `${pluginPath}/delete-data.js`;
  spawn('docker-compose exec kuzzle node', [scriptPath]).run(function(error) {
    if (error) {
      console.error(error);
      done(error);
    } else {
      done();
    }
  });
});

Then(/I can check that data are not in postgres and kuzzle/, function(done) {
  const scriptPath = `${pluginPath}/count-data.js`;
  spawn('docker-compose exec kuzzle node', [scriptPath]).run(function(error) {
    if (error) {
      console.error(error);
      done(error);
    } else {
      done();
    }
  });
});
