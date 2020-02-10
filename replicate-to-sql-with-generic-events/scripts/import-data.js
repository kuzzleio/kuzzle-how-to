const fs = require('fs');
const readline = require('readline');
const { Kuzzle, WebSocket } = require('kuzzle-sdk');
const {
  createIndexIfNotExists,
  createCollectionIfNotExists
} = require('./utils');

const pathToFile = 'samples/Yellow_taxi.csv';

const kuzzle = new Kuzzle(new WebSocket('localhost'));

const indexName = 'nyc-open-data';
const collectionName = 'yellow-taxi';

function formatDocument(fields = []) {
  return {
    VendorID: fields[0],
    tpep_pickup_datetime: fields[1],
    tpep_dropoff_datetime: fields[2],
    passenger_count: fields[3],
    trip_distance: fields[4],
    RatecodeID: fields[5],
    store_and_fwd_flag: fields[6],
    PULocationID: fields[7],
    DOLocationID: fields[8],
    payment_type: fields[9],
    fare_amount: fields[10],
    extra: fields[11],
    mta_tax: fields[12],
    tip_amount: fields[13],
    tolls_amount: fields[14],
    improvement_surcharge: fields[15],
    total_amount: fields[16]
  };
}

function loadData() {
  return new Promise((resolve, reject) => {
    const documents = [];
    const dataFile = readline.createInterface({
      input: fs.createReadStream(pathToFile)
    });

    let headerSkipped = false;
    dataFile.on('line', line => {
      if (headerSkipped) {
        const fields = line.split(',');

        documents.push({
          body: formatDocument(fields)
        });
      } else {
        headerSkipped = true;
      }
    });

    dataFile.on('close', () => {
      if (documents.length > 0) {
        kuzzle.document
          .mCreate(indexName, collectionName, documents)
          .then(response => {
            console.log(`Created ${response.successes.length} documents`);
            kuzzle.collection
              .refresh(indexName, collectionName)
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
      } else {
        reject(new Error('No documents to insert'));
      }
    });
  });
}

async function run() {
  try {
    await kuzzle.connect();
    await createIndexIfNotExists(kuzzle, indexName);
    await createCollectionIfNotExists(kuzzle, indexName, collectionName);
    await loadData();
  } catch (error) {
    throw new Error(error);
  } finally {
    kuzzle.disconnect();
  }
}

run()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
