const { Kuzzle, WebSocket } = require('kuzzle-sdk');
const { PostgresWrapper, pgConfigLocal } = require('../lib/postgres');

async function countFromPostgres() {
  const postgres = new PostgresWrapper(pgConfigLocal);
  await postgres.connect();
  const pgResponse = await postgres.countData();
  await postgres.end();

  return pgResponse.rows[0].count;
}

async function run() {
  const kuzzle = new Kuzzle(new WebSocket('localhost'));

  try {
    const indexName = 'nyc-open-data';
    const collectionName = 'yellow-taxi';

    await kuzzle.connect();
    await kuzzle.collection.refresh(indexName, collectionName);
    const count = await kuzzle.document.count(indexName, collectionName);
    const pgCount = await countFromPostgres();
    console.log(`Documents : ${count}, ${pgCount}`);  
  }
  catch (error) {
    throw error;
  }
  finally {
    kuzzle.disconnect();
  }
}

run();
