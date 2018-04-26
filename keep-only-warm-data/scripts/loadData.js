const
  fs = require('fs'),
  readline = require('readline'),
  moment = require('moment'),
  ElasticSearch = require('elasticsearch');

const
  dataPath = '/yellow_taxi/yellow_taxi_data.csv',
  batchSize = 1,
  maxDocuments = 60,
  host = 'elasticsearch',
  port = 9200;

let
  inserted = 0,
  headerSkipped = false,
  currentDay = 0;

const currentDate = moment().subtract(currentDay, 'days');

const documents = [];

function flatten(arr) {
  return arr.reduce((flat, toFlatten) => flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten), []);
}

const elasticsearchClient = new ElasticSearch.Client({
  host: `${host}:${port}`
});

const dataFile = readline.createInterface({
  input: fs.createReadStream(dataPath)
});

dataFile.on('line', line => {
  if (headerSkipped) {
    const fields = line.split(',');

    documents.push({
      pickup_datetime: fields[1],
      dropoff_datetime: fields[2],
      passenger_count: fields[3],
      trip_distance: fields[4],
      pickup_position: { lon: Number.parseFloat(fields[5]), lat: Number.parseFloat(fields[6]) },
      dropoff_position: { lon: Number.parseFloat(fields[9]), lat: Number.parseFloat(fields[10]) },
      fare_amount: fields[18]
    });

    if (documents.length === batchSize) {
      const packet = createPacket(documents);
      inserted += documents.length;
      documents = [];

      if (inserted - batchSize >= maxDocuments) {
        dataFile.close();
      } else {
        dataFile.pause();
        console.log(`Insert ${batchSize} documents (${inserted}/${maxDocuments}) at date ${currentDate.format('DD/MM/YYYY')}`);
        bulkImport(packet).then(() => {
          dataFile.resume();
        }).catch(error => {
          console.log(error);
          process.exit(1);
        });
      }
    }
  }
  else {
    headerSkipped = true;
  }
});

dataFile.on('close', () => {
  if (documents.length > 0) {
    const packet = createPacket(documents);

    bulkImport(packet).then(() => true);
  }
});

function createPacket(docs) {
  const kuzzle_meta = {
    _kuzzle_info: {
      active:     true,
      author:     '-1',
      updater:    null,
      updatedAt:  null,
      deletedAt:  null,
      createdAt:  currentDate.valueOf() // Date in milli timestamp
    }
  };

  currentDay += 1;
  currentDate = moment().subtract(currentDay, 'days');

  return flatten(docs.map(document => {
    return [
      { index: { _index : 'nyc-open-data', _type: 'yellow-taxi' } },
      Object.assign({}, kuzzle_meta, document)
    ];
  }));
}

function bulkImport(packet) {
  return elasticsearchClient.bulk({
    body: packet
  });
}
