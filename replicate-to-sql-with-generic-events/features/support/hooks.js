const { BeforeAll, After } = require('cucumber');
const { spawnSync } = require('child_process');

const KWorld = require('./world');

BeforeAll(async function() {
  let maxTries = 10;
  let connected = false;
  let curl;

  const world = new KWorld();

  while (!connected && maxTries > 0) {
    curl = spawnSync('curl', [`${world.host}:${world.port}`]);

    if (curl.status === 0) {
      connected = true;
    }
    else {
      console.log(`[${maxTries}] Waiting for kuzzle..`);
      maxTries -= 1;
      spawnSync('sleep', ['5']);
    }
  }

  if (!connected) {
    throw new Error('Unable to start docker-compose stack');
  }

  After(async function() {
    if (this.kuzzle && typeof this.kuzzle.disconnect === 'function') {
      this.kuzzle.disconnect();
      console.log('disconnect kuzzle');
    }
    if (this.pool && typeof this.pool.end === 'function') {
      await this.pool.end();
      console.log('disconnect postgres');
    }
  });
});
