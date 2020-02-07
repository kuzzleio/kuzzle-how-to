const
  {
    BeforeAll,
    After
  } = require('cucumber'),
  Kuzzle = require('kuzzle-sdk'),
  KWorld = require('./world'),
  { spawnSync } = require('child_process');

BeforeAll(function(callback) {
  let maxTries = 10;
  let connected = false;
  let curl;

  const world = new KWorld();

  while (! connected && maxTries > 0) {
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
    return callback(new Error('Unable to start docker-compose stack'));
  }

  const kuzzle = new Kuzzle(world.host, { port: world.port }, error => {
    if (error) {
      return callback(error);
    }

    kuzzle
      .createIndexPromise('test-index')
      .then(() => kuzzle.collection('test-collection', 'test-index').createPromise())
      .then(() => callback())
      .catch(err => callback(err))
      .finally(() => kuzzle.disconnect());
  });

  After(function () {
    if (this.kuzzle && typeof this.kuzzle.disconnect === 'function') {
      this.kuzzle.disconnect();
    }
  });
});
