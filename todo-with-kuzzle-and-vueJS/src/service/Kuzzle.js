const {
  Kuzzle,
  WebSocket
} = require('kuzzle-sdk');

const kuzzle = new Kuzzle(
  new WebSocket('10.35.250.194')
);

kuzzle.on('networkError', error => {
  console.error('Network Error: ', error);
});

export default kuzzle;
