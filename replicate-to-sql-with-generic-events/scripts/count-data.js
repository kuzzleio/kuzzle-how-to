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

    const count = await kuzzle.document.count('nyc-open-data', 'yellow-taxi');
    postgres.connect();
    const pgResponse = await postgres.countData();
    postgres.end();
    console.log(`Kuzzle: Total documents : ${count}`);
    console.log(`Postgres: Total rows : ${pgResponse.rows[0].count}`);
  } catch (error) {
    console.error(error);
  } finally {
    kuzzle.disconnect();
  }
}

run().catch(console.error);
