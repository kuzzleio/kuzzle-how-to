const { BeforeAll, After } = require('cucumber');
const { spawnSync } = require('child_process');

const KWorld = require('./world');

BeforeAll(function(done) {
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
    return new Error('Unable to start docker-compose stack');
  }

  After(function() {
    if (this.kuzzle && typeof this.kuzzle.disconnect === 'function') {
      this.kuzzle.disconnect();
    }
  });

  done();
});
