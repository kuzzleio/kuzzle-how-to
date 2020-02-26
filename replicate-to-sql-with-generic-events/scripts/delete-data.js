const { Kuzzle, WebSocket } = require('kuzzle-sdk');

const kuzzle = new Kuzzle(new WebSocket('localhost'));

const indexName = 'nyc-open-data';
const collectionName = 'yellow-taxi';

async function run() {
  try {
    await kuzzle.connect();
    const result = await kuzzle.document.search(indexName, collectionName, {}, { size: 500 });
    const willDeleteIds = result.hits.map(d => d._id);
    const response = await kuzzle.document.mDelete(indexName, collectionName, willDeleteIds);
    console.log(`Deleted ${response.successes.length} documents`);
    kuzzle.disconnect();
    process.exit(0);
  }
  catch(error) {
    console.error(error);
    process.exit(1);
  }
}

run();
