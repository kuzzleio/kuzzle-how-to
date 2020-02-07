const { Kuzzle, WebSocket } = require('kuzzle-sdk');

const kuzzle = new Kuzzle(new WebSocket('localhost'));

function exitProcess() {
  process.exit(1);
}

const indexName = 'nyc-open-data';
const collectionName = 'yellow-taxi';

async function searchData() {
  try {
    const result = await kuzzle.document.search(indexName, collectionName);
    return result.hits;
  } catch (error) {
    return [];
  }
}

async function deleteData(ids = []) {
  try {
    console.log(ids);
    const response = await kuzzle.document.mDelete(indexName, collectionName, ids);
    console.log(`Successfully deleted ${response.successes.length} documents`);
  } catch (error) {
    throw new Error(error);
  }
}

function disconnect() {
  kuzzle.disconnect();
  exitProcess();
}

async function run() {
  try {
    await kuzzle.connect();
    const datas = await searchData();
    await deleteData(datas.map(d => d._id));
  } catch (error) {
    console.error(error);
  } finally {
    disconnect();
  }
}

run();
