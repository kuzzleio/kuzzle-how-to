const { BeforeAll, After } = require('cucumber');
const { spawnSync } = require('child_process');

const KWorld = require('./world');

const ONE_MINUTE = 60000;

async function testKWorld(world) {
  await new Promise(resolve => setTimeout(resolve, 5000));
  const curl = spawnSync('curl', [`${world.host}:${world.port}`]);
  return curl.status === 0;
}

BeforeAll({ timeout: ONE_MINUTE }, async function() {
  let maxTries = 10;
  const world = new KWorld();
  let connected = await testKWorld(world);
  while (!connected && maxTries > 0) {
    maxTries--;
    console.log(`[${maxTries}] Trying to connect ...`);
    connected = await testKWorld(world);
  }

  if (!connected) {
    throw new Error('could not start Kuzzle stack');
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