const
  Kuzzle = require('kuzzle-sdk'),
  Cassandra = require('cassandra-driver'),
  fs = require('fs');

const cassandraClient = new Cassandra.Client({ contactPoints: [ 'cassandra' ] });

cassandraClient
  .execute('SELECT COUNT(*) FROM nyc_open_data.yellow_taxi')
  .then(result => {
    console.log(`Cassandra: Total lines in nyc_open_data.yellow_taxi : ${result.rows[0].count}`)
  })
  .catch(error => {
    console.log(`Cassandra: Error: ${error}`)
    process.exit(1)
  });

const kuzzle = new Kuzzle('localhost', { port: 7512 }, error => {
  if (error) {
    console.error('Kuzzle: Error: ', error);
    process.exit(1);
  }

  kuzzle
    .collection('yellow-taxi', 'nyc-open-data')
    .countPromise({})
    .then(result => {
      console.log(`Kuzzle: Total documents in nyc-open-data.yellow-taxi : ${result}`)
    })
    .catch(error => {
      console.log(`Kuzzle: Error: ${error}`)
    });

});
