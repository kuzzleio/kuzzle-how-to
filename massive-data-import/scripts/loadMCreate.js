const
  Kuzzle = require('kuzzle-sdk'),
  fs = require('fs'),
  readline = require('readline');

const step = 1500;
let steps = 10;
const fileName = '/yellow_taxi/yellow_taxi_data.csv';
const hostName = 'localhost';
const testOnly = process.argv[2] == 'test' || false;

if (testOnly) {
  console.log(`Test mode : load only ${step} documents`);
}

let
  number = 0,
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
          licence: number,
          pickup_datetime: fields[1],
          dropoff_datetime: fields[2],
          passenger_count: fields[3],
          trip_distance: fields[4],
          pickup_position: {lon: Number.parseFloat(fields[5]), lat: Number.parseFloat(fields[6])},
          dropoff_position: {lon: Number.parseFloat(fields[9]), lat: Number.parseFloat(fields[10])},
          fare_amount: fields[18]
        }
      });

      number += 1;

      if (documents.length === step) {
        const packet = documents;
        documents = [];
        dataFile.pause();
        mcreate(packet).then(() => {
          if (steps === 0) {
            dataFile.close();
          } else {
            steps -= 1;
            dataFile.resume();
          }
        });
      }
    }
    else {
      headerSkipped = true;
    }
  });

  dataFile.on('close', () => {
    // Avoid sending extra data on test mode
    if (testOnly) {
      kuzzle.disconnect();
    } else {
      if (documents.length > 0) {
        mcreate(documents).then(() => kuzzle.disconnect());
      }
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
        console.error('PartialError: ', error);
      } else {
        console.error('Error: ');
        console.dir(error, {colors: true, depth: null});
      }
    });
}
