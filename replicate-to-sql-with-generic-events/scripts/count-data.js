const { Kuzzle, WebSocket } = require('kuzzle-sdk');
const { PostgresWrapper } = require('../lib/postgres');

const kuzzle = new Kuzzle(new WebSocket('localhost'));

async function run() {
  try {
    await kuzzle.connect();
    const postgres = new PostgresWrapper({
      user: 'my_user',
      host: 'localhost',
      database: 'postgres',
      password: 'password',
      port: 5432
    });
    const indexName = 'nyc-open-data';
    const collectionName = 'yellow-taxi';
    await kuzzle.collection.refresh(indexName, collectionName);
    const count = await kuzzle.document.count(indexName, collectionName);
    postgres.connect();
    const pgResponse = await postgres.countData();
    postgres.end();
    console.log(`Documents : ${count}, ${pgResponse.rows[0].count}`);
  } catch (error) {
    throw new Error(error);
  } finally {
    kuzzle.disconnect();
  }
}

run()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
