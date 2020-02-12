const { Kuzzle, WebSocket } = require('kuzzle-sdk');

const kuzzle = new Kuzzle(new WebSocket('localhost'));

const indexName = 'nyc-open-data';
const collectionName = 'yellow-taxi';

async function deleteData(ids = []) {
  try {
    const result = kuzzle.document.mDelete(indexName, collectionName, ids);
    await kuzzle.collection.refresh(indexName, collectionName);
    return result;
  }
  catch (error) {
    throw error;
  }
}

async function run() {
  try {
    await kuzzle.connect();
    const result = await kuzzle.document.search(indexName, collectionName, {}, { size: 500 });
    const willDeleteIds = result.hits.map(d => d._id);
    const response = await deleteData(willDeleteIds);
    console.log(`Deleted ${response.successes.length} documents`);
  }
  catch (error) {
    throw error;
  }
  finally {
    kuzzle.disconnect();
  }
}

run();
