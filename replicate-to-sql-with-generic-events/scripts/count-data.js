const { Kuzzle, WebSocket } = require('kuzzle-sdk');
const { PostgresWrapper, pgConfigLocal } = require('../lib/postgres');

const kuzzle = new Kuzzle(new WebSocket('localhost'));

async function countFromPostgres() {
  const postgres = new PostgresWrapper(pgConfigLocal);
  const client = await postgres.connect();
  const pgResponse = await postgres.countData(client);
  client.release();

  return pgResponse.rows[0].count;
}

async function run() {
  try {
    const indexName = 'nyc-open-data';
    const collectionName = 'yellow-taxi';
    await kuzzle.connect();
    const count = await kuzzle.document.count(indexName, collectionName);
    const pgCount = await countFromPostgres();
    console.log(`Documents : ${count}, ${pgCount}`);
  }
  finally {
    kuzzle.disconnect();
  }
}

run().then(process.exit(0));
