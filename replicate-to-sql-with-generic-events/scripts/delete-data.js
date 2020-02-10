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
    await kuzzle.document.mDelete(indexName, collectionName, ids);
  } catch (error) {
    throw new Error(error);
  }
}

async function run() {
  try {
    await kuzzle.connect();
    const datas = await searchData();
    await deleteData(datas.map(d => d._id));
  } catch (error) {
    console.error(error);
  } finally {
    kuzzle.disconnect();
  }
}

run();
