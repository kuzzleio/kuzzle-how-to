const
  Kuzzle = require('kuzzle-sdk'),
  Cassandra = require('cassandra-driver'),
  fs = require('fs');

const cassandraClient = new Cassandra.Client({ contactPoints: [ 'cassandra', 'localhost' ] });
const kuzzle = new Kuzzle('localhost', { port: 7512 })

kuzzle
  .collection('yellow-taxi', 'nyc-open-data')
  .countPromise({})
  .then(result => {
    console.log(`Kuzzle: Total documents in nyc-open-data.yellow-taxi : ${result}`)

    const cassandraPromise =
      cassandraClient
        .execute('SELECT COUNT(*) FROM nyc_open_data.yellow_taxi')
        .then(result => {
          console.log(`Cassandra: Total lines in nyc_open_data.yellow_taxi : ${result.rows[0].count}`)
          process.exit(0);
        })
        .catch(error => {
          console.log(`Cassandra: Error: ${error}`)
          process.exit(1);
        });
  })
  .catch(error => {
    console.log(`Kuzzle: Error: ${error}`)
    process.exit(1);
  });
