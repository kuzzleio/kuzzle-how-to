const Kuzzle = require('kuzzle-sdk');

const timeSquareArea = {
  topLeft: { lat: 40.759507, lon: -73.985384 },
  bottomRight: { lat: 40.758372, lon: -73.984591 }
};

let count = 0;

const kuzzle = new Kuzzle('localhost', error => {
  if (error) {
    console.error('Error: ', error);
    process.exit(1);
  }

  kuzzle
    .collection('yellow-taxi', 'nyc-open-data')
    .subscribe({geoBoundingBox: {dropoff_position: timeSquareArea}}, (err, notification) => {
      count++;
      console.log(`[${count}] ${notification.document.content.passenger_count} passengers just arrived, and paid ${notification.document.content.fare_amount}$`);
    })
    .onDone(() => console.log('Subscribed. Waiting for passengers...'));
});
