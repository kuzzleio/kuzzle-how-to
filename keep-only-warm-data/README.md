# Keep only warm data into Kuzzle

## Requirements

Kuzzle : `>= 1.2.11`  

## Introduction

Kuzzle is capable of handling large number of documents, with high performances.  
However, it can be interesting to rationalize the cost of the infrastructure necessary to Kuzzle by keeping on Kuzzle only the relevant data.  
Coupled with a secondary database, Kuzzle can be used in a Hot/Warm architecture where the Kuzzle is synchronized with an external database and only the most recent data are kept on Kuzzle. (see [How-To Synchronize Kuzzle with another database](../sync-data-to-another-database))

## Architecture

We will be using the open-source Kuzzle stack. (Check [docker-compose.yml](docker-compose.yml) for more details)

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

Documents will be inserted directly in Elasticsearch, without going through Kuzzle, in order to be able to change the value of the metadata field `createdAt` at our convenience.  

For that we will use the Elasticsearch [Bulk API](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/docs-bulk.html).  

## Clean old data

The objective is to delete the oldest data from Kuzzle. However it is excluded to use the traditional Kuzzle APIs to do this because these changes could be automatically replicated in a possible external database (see [How-To Synchronize Kuzzle with another database](../sync-data-to-another-database)).  

So we will bypass Kuzzle and use the Elasticsearch API directly.  

We will perform a query targeting the oldest documents based on the `createdAt` field in the Kuzzle metadata that indicates the date the document was created in Epoch-millis format.

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
  Usage: database-cleaner [options]

  Options:

    -h, --host <s>        Elastic host (default: elasticsearch)
    -p, --port <n>        Elastic port (default: 9200)
    -i, --index <s>       Index name
    -c, --collection <s>  Collection name
    -r, --retention <s>   Retention time specified in days (d), hours (h) or minutes (m) (default: 30d)
    --confirm             Confirm deletion
    -h, --help            output usage information

# Show documents older than 30 days
docker-compose exec kuzzle node /scripts/database-cleaner.js -i nyc-open-data -c yellow-taxi -r 30d
# Use --confirm to delete matching documents
docker-compose exec kuzzle node /scripts/database-cleaner.js -i nyc-open-data -c yellow-taxi -r 30d --confirm
```
