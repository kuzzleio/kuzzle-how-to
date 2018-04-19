const
  Kuzzle = require('kuzzle-sdk'),
  fs = require('fs'),
  readline = require('readline');

const step = 100000;
const fileName = './yellow_taxi_data.csv';
const hostName = 'localhost';

let
  inserted = 0,
  headerSkipped = false;

const kuzzle = new Kuzzle(hostName, error => {
  if (error) {
    console.error('Error: ', error);
    process.exit(1);
  }
  let documents = [];

  const dataFile = readline.createInterface({
    input: fs.createReadStream(fileName)
  });

  dataFile.on('line', line => {
    if (headerSkipped) {
      const fields = line.split(',');
      documents.push({
        body: {
          pickup_datetime: fields[1],
          dropoff_datetime: fields[2],
          passenger_count: fields[3],
          trip_distance: fields[4],
          pickup_position: {lon: Number.parseFloat(fields[5]), lat: Number.parseFloat(fields[6])},
          dropoff_position: {lon: Number.parseFloat(fields[9]), lat: Number.parseFloat(fields[10])},
          fare_amount: fields[18]
        }
      });

      if (documents.length === step) {
        const packet = documents;
        documents = [];
        dataFile.pause();
        mcreate(packet).then(() => dataFile.resume());
      }
    }
    else {
      headerSkipped = true;
    }
  });

  dataFile.on('close', () => {
    if (documents.length > 0) {
      mcreate(documents).then(() => kuzzle.disconnect());
    }
  });
});

function mcreate(docs) {
  return kuzzle.collection('yellow-taxi', 'nyc-open-data')
    .mCreateDocumentPromise(docs)
    .then(() => {
      inserted += docs.length;
      console.log(`${inserted} lines inserted`);
    })
    .catch(error => {
      if (error.status = 206) {
        console.error(`PartialError: ${error.errors.length} documents insertion fail`);
      } else {
        console.error('Error: ');
        console.dir(error, {colors: true, depth: null});
      }
    });
}
