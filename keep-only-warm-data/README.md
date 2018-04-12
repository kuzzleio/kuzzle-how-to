# Keep only warm data into Kuzzle

## Requirements

Kuzzle : `>= 1.2.11`  
Elasticsearch : `>= 5.4.1`  
Redis : `>= 3.2`  

## Introduction

Kuzzle is capable of managing a very large number of documents and offering very good performances.  
However in a Big Data context, it can be interesting to rationalize the cost of the infrastructure necessary to Kuzzle by keeping on Kuzzle only the relevant data.  
Coupled with a secondary database, Kuzzle can be used in a Hot/Warm architecture where the most recent data is kept on Kuzzle and the oldest data in a secondary DBMS.  

In most cases, deleting your oldest data from Kuzzle will only make sense if you have previously dumped it into another database. (see [How-To Synchronize Kuzzle with another database](../sync-data-to-another-database))

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

In addition to document content, Kuzzle stores a set of [metadata](https://docs.kuzzle.io/guide/essentials/document-metadata/) in Elasticsearch. These metadata are contained in the `_kuzzle_info` field (exposed as `_meta` in Kuzzle API).  

The documents will be inserted directly in Elasticsearch, without going through Kuzzle, in order to be able to change the value of the metadata field `createdAt` at our convenience.  

For that we will use the Elasticsearch [Bulk API](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/docs-bulk.html).  

## Clean old data

The objective is to delete the oldest data from Kuzzle. However it is excluded to use the traditional Kuzzle APIs to do this because these changes could be automatically replicated in a possible external database (see [How-To Synchronize Kuzzle with another database](../sync-data-to-another-database)).  

So we will bypass Kuzzle and use the Elasticsearch API directly.  

We will perform a query targeting the oldest documents based on the `createdAt` field in the Kuzzle metadata that indicates the date the document was created in milli timestamp format.

Kuzzle uses a trash system to indicate that a document has been deleted and should no longer appear in search results. A [garbage collector](https://docs.kuzzle.io/guide/essentials/document-metadata/#garbage-collection) then periodically deletes tagged the Elasticsearch documents.   
We should therefore only take into account files that are still active, for this we will use the `active` metadata field.

```js
// Get all documents created before the 12 April 2018
const query = {
  index: 'nyc-open-data',
  type: 'yellow-taxi',
  body: {
    query: {
      bool: {
        filter: [
          {
            range: {
              '_kuzzle_info.createdAt': {
                lte: 1523522843802 // 2018-04-12T08:47:29
              }
            }
          },
          {
            term: {
              '_kuzzle_info.active': true
            }
          }
        ]
      }
    }
  }
};
```

Then, we use the official [Elasticsearch client](https://github.com/elastic/elasticsearch-js) to execute a [deleteByQuery](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-deletebyquery) request with our filters.  

```js
const elasticsearchClient = new ElasticSearch.Client({ host: 'localhost:9200' });

elasticsearchClient
  .deleteByQuery(query)
  .then(response => {
    console.log(`Delete ${response.deleted} documents created before 2018-04-12`);
    process.exit(0);
  }, error => {
    console.log(`Error retrieving documents : ${error.message}`);
    process.exit(1);
  });
```

## Try it yourself

You try by yourself the concepts developed in this How-To using the supplied [docker-compose.yml](docker-compose.yml) as well as the [database-cleaner.js](scripts/database-cleaner.js) script.  

This script allows you to specify a retention period for document retention. It will delete all documents prior to this period.  

A test dataset is also available via the [load_data.js](scripts/load_data.js) script. This script will allow us to load directly into Elasticsearch one document per day over a period of two months.  

We start by launching the containers with Docker Compose:

```bash
docker-compose up
```

Then we load our test data:

```bash
docker-compose exec kuzzle node /scripts/load_data.js
```

Now we can use our Kuzzle cleaner script.

```bash
docker-compose exec kuzzle node /scripts/database-cleaner.js --help

# Show documents older than 30 days
docker-compose exec kuzzle node /scripts/database-cleaner.js -i nyc-open-data -c yellow-taxi -r 30d
# Use --confirm to delete matching documents
docker-compose exec kuzzle node /scripts/database-cleaner.js -i nyc-open-data -c yellow-taxi -r 30d --confirm
```
