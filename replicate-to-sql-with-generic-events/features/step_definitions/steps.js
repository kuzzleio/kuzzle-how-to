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
const pluginPath = 'plugins/enabled/replicate-to-sql-with-generic-events/scripts';

const options = { env: {'COMPOSE_INTERACTIVE_NO_CLI': 1 }, stream: 'all' };

Given(/A Kuzzle stack with Postgres running/, async function() {
  this.kuzzle = new Kuzzle(new WebSocket('localhost'));
  this.postgres = new PostgresWrapper(localConfig);
  await this.kuzzle.connect();
  this.pool = await this.postgres.connect();
});

Then(/I can load the test data into Kuzzle/, function(done) {
  const scriptPath = `${pluginPath}/import-data.js`;
  spawn('docker-compose', ['exec', 'kuzzle', 'node', scriptPath], options)
    .run(function(err, stdout, exitcode) {
      if (err || exitcode === 1) {
        throw new Error('failed to execute test');
      } else {
        done();
      }
    });
});

Then(/I can check that data are in postgres and kuzzle/, function(done) {
  const scriptPath = `${pluginPath}/count-data.js`;
  spawn('docker-compose', ['exec', 'kuzzle', 'node', scriptPath], options)
    .run(function(err, stdout, exitcode) {
      if (err || exitcode === 1) {
        throw new Error('failed to execute test');
      } else {
        done();
      }
    });
});

Then(/I can delete data into Kuzzle/, function(done) {
  const scriptPath = `${pluginPath}/delete-data.js`;
  spawn('docker-compose', ['exec', 'kuzzle', 'node', scriptPath], options)
    .run(function(err, stdout, exitcode) {
      if (err || exitcode === 1) {
        throw new Error('failed to execute test');
      } else {
        done();
      }
    });
});

Then(/I can check that data are not in postgres and kuzzle/, function(done) {
  const scriptPath = `${pluginPath}/count-data.js`;
  spawn('docker-compose', ['exec', 'kuzzle', 'node', scriptPath], options)
    .run(function(err, stdout, exitcode) {
      if (err || exitcode === 1) {
        throw new Error('failed to execute test');
      } else {
        done();
      }
    });
});
