const { Kuzzle, WebSocket } = require('kuzzle-sdk');
const { PostgresWrapper, pgConfigLocal } = require('../lib/postgres');

async function run() {
  const kuzzle = new Kuzzle(new WebSocket('localhost'));

  try {
    const indexName = 'nyc-open-data';
    const collectionName = 'yellow-taxi';
    const postgres = new PostgresWrapper(pgConfigLocal);

    await kuzzle.connect();
    await kuzzle.collection.refresh(indexName, collectionName);
    const count = await kuzzle.document.count(indexName, collectionName);
    await postgres.connect();
    const pgResponse = await postgres.countData();
    await postgres.end();
    console.log(`Documents : ${count}, ${pgResponse.rows[0].count}`);
  } catch (error) {
    throw error;
  } finally {
    kuzzle.disconnect();
  }
}

run();
