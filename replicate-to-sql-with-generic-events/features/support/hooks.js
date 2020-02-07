const { BeforeAll, After } = require('cucumber'),
  { Kuzzle, WebSocket } = require('kuzzle-sdk'),
  KWorld = require('./world'),
  { spawnSync } = require('child_process');

BeforeAll(async function() {
  let maxTries = 10;
  let connected = false;
  let curl;

  const world = new KWorld();

  while (!connected && maxTries > 0) {
    curl = spawnSync('curl', [`${world.host}:${world.port}`]);

    if (curl.status === 0) {
      connected = true;
    } else {
      console.log(`[${maxTries}] Waiting for kuzzle..`);
      maxTries -= 1;
      spawnSync('sleep', ['5']);
    }
  }

  if (!connected) {
    return new Error('Unable to start docker-compose stack');
  }

  const kuzzle = new Kuzzle(new WebSocket('localhost'));
  const index = 'nyc-open-data';
  const collection = 'yellow-taxi';

  try {
    await kuzzle.index.create(index);
    await kuzzle.collection.create(index, collection);
  } catch (error) {
    return new Error(error);
  }

  After(function() {
    if (this.kuzzle && typeof this.kuzzle.disconnect === 'function') {
      this.kuzzle.disconnect();
    }
  });
});
