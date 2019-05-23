const
  Cassandra = require('cassandra-driver'),
  {
    Kuzzle,
    WebSocket
  } = require('kuzzle-sdk');

  const cassandraClient = new Cassandra.Client({ contactPoints: [ 'cassandra', 'localhost' ] });
  const kuzzle = new Kuzzle(new WebSocket('localhost'));

kuzzle.on('networkError', console.error);

kuzzle.connect()
  .then(() => kuzzle.document.count('nyc-open-data', 'yellow-taxi'))
  .then(count => {
    console.log(`Kuzzle: Total documents in nyc-open-data.yellow-taxi : ${count}`);

    return cassandraClient.execute('SELECT COUNT(*) FROM nyc_open_data.yellow_taxi');
  })
  .then(result => {
    console.log(`Cassandra: Total lines in nyc_open_data.yellow_taxi : ${result.rows[0].count}`);
    return cassandraClient.shutdown();
  })
  .then(() => kuzzle.disconnect());