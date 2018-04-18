# Synchronize Kuzzle with another database

## Requirements

Kuzzle : `>= 1.2.11`  
Cassandra : `>= 3`

## Introduction

Kuzzle uses Elasticsearch, which allows it to offer very good search performance on large volumes.  

However, it can also be useful to dump Kuzzle data into external databases, for example if you wanted to store and analyse historical data.  
[Cassandra](https://cassandra.apache.org/) is a distributed NoSQL database designed to handle large volumes of data.  

In this How-To, we will show you how to develop a Kuzzle Plugin that synchonizes Kuzzle's data with any other database system by taking Cassandra as an example.  
For this example we will use data from the NYC Yellow Taxi dataset.  

## Architecture

We will be using the Kuzzle stack (Kuzzle, Elasticsearch and Redis) along with an additional container that runs the Cassandra database. (check [docker-compose.yml](docker-compose.yml) for more details)

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

On Cassandra's side, we will dump the data into the `yellow_taxi` table of the `nyc_open_data` keyspace. (Note the use of `_` instead of `-` because of Cassandra's restrictions)  

In Elasticseach we use the geo_point type to index our documents geographically. With Cassandra, we will have to create a [User Defined Type](https://docs.datastax.com/en/cql/3.3/cql/cql_using/useCreateUDT.html) emulating that type, and we will name it geopoint

Finally an additional column will be created to store the Kuzzle document id (`kuzzle_id`).  

Just like the name of the table and keyspace, the columns will have a structure similar to the Kuzzle mapping :

```
CREATE KEYSPACE IF NOT EXISTS nyc_open_data WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1' };

CREATE TYPE IF NOT EXISTS nyc_open_data.geopoint ( lat double, lon double );

CREATE TABLE IF NOT EXISTS nyc_open_data.yellow_taxi (kuzzle_id text, pickup_datetime timestamp, dropoff_datetime timestamp, passenger_count int, trip_distance double, fare_amount double, pickup_position frozen<geopoint>, dropoff_position frozen<geopoint>, PRIMARY KEY (kuzzle_id));
```

## Plugin development

The [Kuzzle Plugin Engine](https://docs.kuzzle.io/plugins-reference/plugins-features/) lets you extend Kuzzle's functionality by adding code modules that offer auxiliary features. These modules can:

  - Listen asynchronously to events
  - Listen synchronously to events (and intercept a request)
  - Add a controller route
  - Add a new authentication strategy

We will create a plugin [listening asynchronously](https://docs.kuzzle.io/plugins-reference/plugins-features/adding-hooks/) to Document Controller events in order to report document changes in Cassandra.  

### Hook some events

The first step is to declare which [Plugin Events](https://docs.kuzzle.io/kuzzle-events/plugin-events/) we are going to hook. These hooks must be declared in the plugin constructor.  
Each hook is associated with a plugin method that will be called when the event occurs.  

At the Document Controller level, we have two main families of events:
 - actions on a document
 - actions on several documents

We will intercept all of these events after the corresponding action has been taken.

```js
constructor () {
  this.hooks = {
    // Event concerning a single document
    'document:afterCreate':           'hookPutDocument',
    'document:afterCreateOrReplace':  'hookPutDocument',
    'document:afterReplace':          'hookPutDocument',
    'document:afterDelete':           'hookDeleteDocument',
    'document:afterDeleteByQuery':    'hookDeleteDocuments',
    'document:afterUpdate':           'hookUpdateDocument',
    // Event concerning several documents
    'document:afterMCreate':          'hookPutDocuments',
    'document:afterMCreateOrReplace': 'hookPutDocuments',
    'document:afterMReplace':         'hookPutDocuments',
    'document:afterMDelete':          'hookMDeleteDocuments',
    'document:afterMUpdate':          'hookUpdateDocuments',
  };
}
```

Each method will receive a [Request](https://github.com/kuzzleio/kuzzle-common-objects#request) object when an event occurs. Depending on the event triggered, the Request exposes a [Response](https://docs.kuzzle.io/api-documentation/kuzzle-response/) object that will contain the result of the controller's action corresponding to the event.  

In order to reflect the changes in Cassandra, we need to know the content of the document as well as the collection and index it is stored in.

Depending on the triggered event, we will have different Response object formats. (Example for the `create` action : [document:create](https://docs.kuzzle.io/api-documentation/controller-document/create/))
(You can refer to the [Document controller documentation](https://docs.kuzzle.io/api-documentation/controller-document/) for the contents of the Response object)  

For each event, we will transform the input data so that each document has the following format:

```js
{
  _id: "kuzzle id",
  _index: "index name",
  _type: "collection name",
  _source: "document content"
}
```

See the [index.js](lib/index.js) file of the plugin for more details on implementing these transformations.  

Once formatted correctly, the data are passed in one of the two methods of the class performing the insertion of the data in Cassandra.  

### Export data to Cassandra

In order to insert the data in Cassandra, we will use the [Cassandra driver for NodeJS](https://github.com/datastax/nodejs-driver).  
This library will allow us to connect to Cassandra and execute [CQL](http://cassandra.apache.org/doc/latest/cql/) commands.  

We will use the same method for inserts and updates using the CQL keyword [UPDATE](https://docs.datastax.com/en/cql/3.3/cql/cql_reference/cqlUpdate.html?).  
The generated queries will be executed by [batch query](https://docs.datastax.com/en/cql/3.3/cql/cql_reference/cqlBatch.html) for better performance.  

The first step is to cut our document table into smaller pieces so as not to exceed the maximum batch size limit for Cassandra (50 Kb by default).  

For each piece, we will prepare the values to insert in our query: the kuzzle id of the document (`_id`) is excluded and the numerical values are converted into the corresponding type.  

Requests will be in the following form:

```
UPDATE nyc_open_data.yellow_taxi
SET pickup_datetime = ?, dropoff_datetime = ?, passenger_count = ?, trip_distance = ?, fare_amount = ?, pickup_position = ?, dropoff_position = ?
WHERE kuzzle_id = ?
```

Placeholders allow the Cassandra NodeJS driver to correctly map javascript types to Cassandra types.  

Finally we generate a query table that we concatenate to the same batch and then we execute the batch query in a Promise.  

```js
createOrUpdateDocuments (documents) {
  // Split documents array in chunk to avoid the batch size limit
  const chunkedDocuments = chunkArray(documents, this.config.maximumBatchSize);

  const requestPromises =
    chunkedDocuments.map(documentsBatch => {

      // Create an array of update queries and an array of matching values
      const { query, values } = documentsBatch.reduce((memo, document) => {

        // Create the column list with the placeholder
        const columnsList = Object.keys(document._source).filter(key => key !== '_id').map(column => `${column} = ?`).join(', ');

        // Create an array of values to allow the driver to map javascript types to cassandra types
        const valuesList = Object.keys(document._source).filter(key => key !== '_id').map(key => {
          switch (key) {
            case 'trip_distance':
            case 'fare_amount':
              return parseFloat(document._source[key]);
            default:
              return document._source[key];
          }
        }).concat([document._id]);

        // Create the query and replace Cassandra forbidden characters
        const updateQuery = this.normalize(`UPDATE ${document._index}.${document._type} SET ${columnsList} WHERE kuzzle_id = ?`);

        return { query: memo.query.concat([updateQuery]), values: memo.values.concat(valuesList) };
      }, { query: [], values: []});

      const batchQuery = `BEGIN BATCH ${query.join(';')} APPLY BATCH`;

      // Create a promise to execute the query
      return this.client.execute(batchQuery, values, { prepare: true });
    });
  return Promise.all(requestPromises);
}
```
### Try it yourself

You can use the [docker-compose.yml](docker-compose.yml) included in this How-To to test the export plugin to Cassandra.  
The containers are preconfigured to work with NYC Open Data's Yellow Taxi dataset.  

```bash
docker-compose up
```

In another terminal:

```bash
docker-compose exec kuzzle node /yellow_taxi/load_data.js
# or
docker-compose exec kuzzle node /yellow_taxi/load_data.js --max-count 10000 --batch-size 1000
```

On a laptop with a I5-7300U CPU @ 2.60 GHz, 16GiB of RAM and a SSD it takes approximatively 2 minutes to load 1 millions of document in Kuzzle with the Cassandra export.  

We can then check that the import worked as expected:

```bash
docker-compose exec kuzzle node /yellow_taxi/count_data.js
```
