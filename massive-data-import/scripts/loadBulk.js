const
  fs = require('fs'),
  readline = require('readline'),
  {
    Kuzzle,
    WebSocket
  } = require('kuzzle-sdk');

const step = 100000;
const fileName = '/yellow_taxi_data.csv';
const testOnly = process.argv[2] == 'test' || false;

if (testOnly) {
  console.log(`Test mode : load only ${step} documents`);
}

let
  inserted = 0,
  headerSkipped = false;

const kuzzle = new Kuzzle(new WebSocket('localhost'));

kuzzle.on('networkError', console.error);

kuzzle.connect()
  .then(() => {
    let bulk = [];

    const dataFile = readline.createInterface({
      input: fs.createReadStream(fileName)
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
          bulkInsert(packet).then(() => {
            if (testOnly) {
              dataFile.close();
            } else {
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
        if (bulk.length > 0) {
          bulkInsert(bulk).then(() => kuzzle.disconnect());
        }
      }
    });

    const bulkInsert = bulkData => {
      console.log("Run query")

      return kuzzle.bulk.import(bulkData)
        .then(({ items, errors }) => {
          if (errors) {
            const failedImports = items.filter(item => item.index.status === 206)
            console.error(`Fail to import ${failedImports.length} documents`);
          }

          const successImports = items.filter(item => item.index.status === 201)
          inserted += successImports.length;

          console.log(`${inserted} documents inserted`);
        })
        .catch(error => {
          console.dir(error, {colors: true, depth: null});
        });
    }
  });