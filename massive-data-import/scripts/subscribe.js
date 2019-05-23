const {
  Kuzzle,
  WebSocket
} = require('kuzzle-sdk');

const
  timeSquareArea = {
    topLeft: { lat: 40.759507, lon: -73.985384 },
    bottomRight: { lat: 40.758372, lon: -73.984591 }
  },
  filters = {
    geoBoundingBox: {
      dropoff_position: timeSquareArea
    }
  };

let count = 0;

const kuzzle = new Kuzzle(new WebSocket('localhost'));

kuzzle.on('networkError', console.error);

kuzzle.connect()
  .then(() => {
    return kuzzle.realtime.subscribe('nyc-open-data', 'yellow-taxi', filters, notification => {
      const document = notification.result._source;
      count++;
      console.log(`[${count}] ${document.passenger_count} passengers just arrived, and paid ${document.fare_amount}$`);
    });
  })
  .then(() => console.log('Subscribed. Waiting for passengers...'));