# Massive Data Import to Kuzzle

## Requirements

Kuzzle : `>= 1.2.11`  

## Introduction

When processing large volumes of data with Kuzzle, you may need to import large datasets quickly.  

Kuzzle supports two massive data import options:
1. [Bulk Import](https://docs.kuzzle.io/api-documentation/controller-bulk/import/): used when you need to import data as fast as possible
2. [Multi-document Creation](https://docs.kuzzle.io/api-documentation/controller-document/m-create/): used when you want to allow real-time notifications or plugin events during import (this option is a bit slower than the bulk import).

Using an AWS production environment with Kuzzle on a `m5.large`, Elasticsearch on a `i3.xlarge.elasticsearch` and Redis on a `cache.t2.micro` instance, we were able to achieve 9700 docs/sec with Bulk import and 5800 docs/sec with the mCreate route.  

In this How-To, we will explore the two massive import techniques of Kuzzle.  
For this example we will use data from the [NYC Yellow Taxi dataset](https://github.com/kuzzleio/kuzzle-how-to/blob/master/README.md#nyc-open-data-yellow-taxi).  

## Architecture

We will be using the open-source Kuzzle stack. (Check [docker-compose.yml](docker-compose.yml) for more details)

We are going to change some Kuzzle configuration for this How-To to allow insertion of large bulk:
  - `documentsWriteCount` will be set to 100 000
  - `maxRequestSize` will be set to `1GB`

These configuration are set in the [/etc/kuzzle/config](etc/kuzzle/config) , check [Kuzzle Configuration](https://docs.kuzzle.io/guide/essentials/configuration/) for more informations.  

On Kuzzle, the data will be stored in the `yellow-taxi` collection of the `nyc-open-data` index according to the following mapping:

```js
{
  "pickup_datetime":  { "type": "date", "format": "MM/dd/yyyy hh:mm:ss a" },
  "dropoff_datetime": { "type": "date", "format": "MM/dd/yyyy hh:mm:ss a" },
  "passenger_count":  { "type": "long" },
  "trip_distance":    { "type": "double" },
  "pickup_position":  { "type": "geo_point" },
  "dropoff_position": { "type": "geo_point" },
  "fare_amount":      { "type": "double" }
}
```

## Importing data to Kuzzle

### Bulk API

The first way to import important data sets into Kuzzle is to use the [Bulk Controller](https://docs.kuzzle.io/api-documentation/controller-bulk/) [import action](https://docs.kuzzle.io/api-documentation/controller-bulk/import/).
Its operation and syntax is similar to that of the [Elasticsearch Bulk API](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/docs-bulk.html).

This method is very fast but it writes almost directly into Elasticsearch. Other Kuzzle features such as [real-time notifications](https://docs.kuzzle.io/guide/essentials/real-time/) will not be available.  

To use it, you must go directly through a request sent to the Bulk Controller.  
This query contains an array of objects organized by peers. The n element of the array is an object containing the name of the index and the collection and the n+1 element contains the document to insert.  

```js
const bulkQuery = {
  body: {
    bulkData: [
      { index: { _index: 'nyc-open-data', _type: 'yellow-taxi' } },
      {
        pickup_datetime:  '03/01/2016 12:10:28 AM',
        dropoff_datetime: '03/01/2016 12:21:56 AM',
        passenger_count:  '1',
        trip_distance:    '2.5',
        pickup_position:  { lon: '-73.974746704101563', lat: '40.793346405029297' },
        dropoff_position: { lon: '-73.979293823242187', lat: '40.761508941650391' },
        fare_amount:      '11.8'
      },

      { index: { _index: 'nyc-open-data', _type: 'yellow-taxi' } },
      {
        pickup_datetime:  '03/01/2016 12:10:29 AM',
        dropoff_datetime: '03/01/2016 12:19:05 AM',
        passenger_count:  '5',
        trip_distance:    '2.51',
        pickup_position:  { lon: '-73.993759155273438', lat: '40.718101501464844' },
        dropoff_position: { lon: '-73.951248168945312', lat: '40.711910247802734' },
        fare_amount:      '11.3'
      }
    ]
  }
}
```

This request is then sent to the Bulk Controller with the [Kuzzle SDK](https://docs.kuzzle.io/sdk-reference/kuzzle/query/).

```js
kuzzle
  .queryPromise({ controller: 'bulk', action: 'import' }, bulkQuery)
  .catch(error => {
    if (error.status = 206) {
      console.error(`PartialError: ${error.errors.length} documents insertion fail`);
    } else {
      console.error('Error: ');
      console.dir(error, {colors: true, depth: null});
    }
  })
  .then(() => {
    console.log(`${bulkQuery.body.bulkData.length / 2} lines inserted`);
  });
```

### mCreate API

The second method is about half as fast but it allows you to benefit from all the usual Kuzzle features.  

It uses the [Document Controller's mCreate](https://docs.kuzzle.io/api-documentation/controller-document/m-create/) action to insert multiple documents into the same query.  
When a document is created, Kuzzle will send a notification to clients that have subscribed to the document changes.  

We are going to use a geofencing subscription to get notified every time a taxi drop a passenger on the Time Square area.  
First we have to get the coordinate of the top left and the bottom right corner of our area and then we can use the Kuzzle SDK to start our subscription.  

```js
const timeSquareArea = {
  topLeft:      { lat: 40.759507, lon: -73.985384 },
  bottomRight:  { lat: 40.758372, lon: -73.984591 }
};
let count = 0;

kuzzle
  .collection('yellow-taxi', 'nyc-open-data')
  .subscribe({ geoBoundingBox: { dropoff_position: timeSquareArea } }, (err, notification) => {
    count++;
    console.log(`[${count}] ${notification.document.content.passenger_count} passengers just arrived, and paid ${notification.document.content.fare_amount}$`);
  })
  .onDone(() => console.log('Subscribed. Waiting for passengers...'));
```

After that we are going to import our documents.  
The documents to be inserted will have to be collected in an array before being passed to the [SDK method](https://docs.kuzzle.io/sdk-reference/collection/mcreate-document/) corresponding to the mCreate action of the Document Controller :

```js
const documents = [
  {
    pickup_datetime:  '03/01/2016 12:10:29 AM',
    dropoff_datetime: '03/01/2016 12:19:05 AM',
    passenger_count:  '5',
    trip_distance:    '2.51',
    pickup_position:  { lon: '-73.993759155273438', lat: '40.718101501464844' },
    dropoff_position: { lon: '-73.951248168945312', lat: '40.711910247802734' },
    fare_amount:      '11.3'
  },
  {
    pickup_datetime:  '03/01/2016 12:10:28 AM',
    dropoff_datetime: '03/01/2016 12:21:56 AM',
    passenger_count:  '1',
    trip_distance:    '2.5',
    pickup_position:  { lon: '-73.974746704101563', lat: '40.793346405029297' },
    dropoff_position: { lon: '-73.979293823242187', lat: '40.761508941650391' },
    fare_amount:      '11.8'
  }
]

kuzzle
  .collection('yellow-taxi', 'nyc-open-data')
  .mCreateDocumentPromise(documents)
  .then(() => {
    console.log(`${documents.length} lines inserted`);
  })
  .catch(error => {
    if (error.status = 206) {
      console.error(`PartialError: ${error.errors.length} documents insertion fail`);
    } else {
      console.error('Error: ');
      console.dir(error, {colors: true, depth: null});
    }
  });
```

## Try it yourself

You can use the [docker-compose.yml](docker-compose.yml) included in this How-To to test the massive data import.  
The containers are preconfigured to work with NYC Open Data's Yellow Taxi dataset.

```bash
docker-compose up
```

Then in another terminal we are going to subscribe to a room with [geoBoundingBox](https://docs.kuzzle.io/kuzzle-dsl/terms/geo-bounding-box/) corresponding to the Time Square area. We will receive a notification each time a new document corresponds to a passenger dropped in this area.  

```bash
docker-compose exec kuzzle node /scripts/subscribe.js
```

In another terminal we are going to import the dataset with the two methods.

```bash
time docker-compose exec kuzzle node /scripts/loadBulk.js

time docker-compose exec kuzzle node /scripts/loadMCreate.js
```

On a laptop with a I5-7300U CPU @ 2.60 GHz, 16GiB of RAM and a SSD it takes approximately 1 minute to load 1 million documents in Kuzzle using the Bulk Api method and approximately 2 minutes to load the same number of documents with the mCreate method.  
This is 40% faster than the cluster result because we don't have any latency.

In conclusion, Kuzzle offers 2 methods for mass data import, each one with a different purpose:

* [bulk](https://docs.kuzzle.io/api-documentation/controller-bulk/import/) import, an almost direct path to the database: the fastest way to import data into Kuzzle, but with an unfriendly format and no real-time capabilities
* [multi-documents creation](https://docs.kuzzle.io/api-documentation/controller-document/m-create/): allowing any real-time subscribers to be notified about what's going on. While it's quite fast, it's about 40% slower than its bulk method counterpart
