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
          mcreate(packet).then(() => {
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
        if (documents.length > 0) {
          mcreate(documents).then(() => kuzzle.disconnect());
        }
      }
    });

  const mcreate = documents => {
    return kuzzle.document.mCreate('nyc-open-data', 'yellow-taxi', documents)
      .then(({ total }) => {
        inserted += total;
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
});
