const
  Kuzzle = require('kuzzle-sdk');

const kuzzle = new Kuzzle('localhost', { port: 7512 });

kuzzle
  .collection('yellow-taxi', 'nyc-open-data')
  .countPromise({})
  .then(result => {
    console.log(`Kuzzle: Total documents in nyc-open-data.yellow-taxi : ${result}`);

    return kuzzle.disconnect();
});
