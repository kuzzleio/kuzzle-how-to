const
  Kuzzle = require('kuzzle-sdk'),
  fs = require('fs'),
  readline = require('readline');

const step = 100000;

let
  inserted = 0,
  headerSkipped = false;

const kuzzle = new Kuzzle('localhost', error => {
  if (error) {
    console.error('Error: ', error);
    process.exit(1);
  }

  let bulk = [];

  const dataFile = readline.createInterface({
    input: fs.createReadStream('/yellow_taxi/yellow_taxi_data.csv')
  });

  dataFile.on('line', line => {
    if (headerSkipped) {
      const fields = line.split(',');
      bulk.push({index: {_index : "nyc-open-data", _type: "yellow-taxi"}});
      bulk.push({
        pickup_datetime: fields[1],
        dropoff_datetime: fields[2],
        passenger_count: fields[3],
        trip_distance: fields[4],
        pickup_position: {lon: fields[5], lat: fields[6]},
        dropoff_position: {lon: fields[9], lat: fields[10]},
        fare_amount: fields[18]
      });

      if (bulk.length === step * 2) {
        const packet = bulk;
        bulk = [];
        dataFile.pause();
        bulkInsert(packet).then(() => dataFile.resume());
      }
    }
    else {
      headerSkipped = true;
    }
  });

  dataFile.on('close', () => {
    if (bulk.length > 0) {
      bulkInsert(bulk).then(() => kuzzle.disconnect());
    }
  });
});

function bulkInsert(bulkData) {
  return new Promise(resolve => {
    const bulkQuery = { body: { bulkData } };

    kuzzle
      .queryPromise({ controller: 'bulk', action: 'import' }, bulkQuery)
      .catch(error => {
        if (error.status = 206) {
          console.error(`PartialError: ${error.errors.length} documents insertion fail`);
        } else {
          console.error('Error: ');
          console.dir(error, {colors: true, depth: null});
        }
        process.exit(1);
      })
      .then(() => {
        inserted += bulkData.length / 2;
        console.log(`${inserted} lines inserted`);
        return resolve();
      });
    });
}
