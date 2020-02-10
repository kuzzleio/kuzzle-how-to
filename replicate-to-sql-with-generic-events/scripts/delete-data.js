const { Kuzzle, WebSocket } = require('kuzzle-sdk');

const kuzzle = new Kuzzle(new WebSocket('localhost'));

const indexName = 'nyc-open-data';
const collectionName = 'yellow-taxi';

async function searchData() {
  try {
    const result = await kuzzle.document.search(
      indexName,
      collectionName,
      {},
      { size: 500 }
    );
    return result.hits;
  } catch (error) {
    return [];
  }
}

async function deleteData(ids = []) {
  try {
    const result = kuzzle.document.mDelete(indexName, collectionName, ids);
    await kuzzle.collection.refresh(indexName, collectionName);
    return result;
  } catch (error) {
    throw new Error(error);
  }
}

async function run() {
  try {
    await kuzzle.connect();
    const datas = await searchData();
    const response = await deleteData(datas.map(d => d._id));
    console.log(`Deleted ${response.successes.length} documents`);
  } catch (error) {
    throw new Error(error);
  } finally {
    kuzzle.disconnect();
  }
}

run()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
