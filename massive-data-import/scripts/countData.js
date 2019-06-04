const {
  Kuzzle,
  WebSocket
} = require('kuzzle-sdk');

const kuzzle = new Kuzzle(new WebSocket('localhost'));

kuzzle.on('networkError', console.error);

kuzzle.connect()
  .then(() => kuzzle.document.count('nyc-open-data', 'yellow-taxi'))
  .then(count => {
    console.log(`Kuzzle: Total documents in nyc-open-data.yellow-taxi : ${count}`);

    return kuzzle.disconnect();
  });
