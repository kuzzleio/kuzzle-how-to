# Massive Data Import to Kuzzle with Geofencing subscription

## Introduction

When processing large volumes of data with Kuzzle, you may need to import large datasets quickly.  

Kuzzle offers two massive data import systems according to your needs.  
In some cases, you only want to quickly import data into the database to make subsequent queries on and in others you need all the features (Real-Time notifications, ...) of Kuzzle also during import.

In this How-To, we will explore the two massive import techniques of Kuzzle.
For this example we will use data from the NYC Yellow Taxi dataset.  

## Architecture

We will be using the standard Kuzzle stack (Kuzzle, Elasticsearch and Redis). (Check [docker-compose.yml](docker-compose.yml) for more details)

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

The first way to import important data sets into Kuzzle is to use the [Bulk Controller](https://docs.kuzzle.io/api-documentation/controller-bulk/) [import action](https://docs.kuzzle.io/api-documentation/controller-bulk/import/).
Its operation and syntax is similar to that of the [Elasticsearch Bulk API](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/docs-bulk.html).

This method is very fast but it writes almost directly in Elasticsearch. Other Kuzzle features such as [Real-Time Notifications](https://docs.kuzzle.io/guide/essentials/real-time/) will not be available.  

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
    console.error('Error: ');
    console.dir(error, {colors: true, depth: null})
    process.exit(1);
  })
  .then(() => {
    console.log(`${bulkQuery.body.bulkData.length / 2} lines inserted`);
  })
```

The second method is about half as fast but it allows you to benefit from all the usual features of Kuzzle.  

It uses the [Document Controller's mCreate](https://docs.kuzzle.io/api-documentation/controller-document/m-create/) action to insert multiple documents into the same query.  
The creation of documents will send notifications to customers who have subscribed to a request corresponding to them.  

The documents to be inserted will have to be collected in a table before being passed to the [SDK method](https://docs.kuzzle.io/sdk-reference/collection/mcreate-document/) corresponding to the mCreate action of the Document Controller :

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
    console.dir(error, {depth: null, colors: true});
    process.exit(1);
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
time docker-compose exec kuzzle node /scripts/load_bulk.js

time docker-compose exec kuzzle node /scripts/load_mcreate.js
```

On a laptop with a I5-7300U CPU @ 2.60 GHz, 16GiB of RAM and a SSD it takes approximatively 1 minutes to load 1 millions of document in Kuzzle with the Bulk Api method and approximatively 2 minutes with mCreate method.  

As we can see, although the bulk method is twice as fast as the mcreate method, it doesn't trigger any subscription notification.  
