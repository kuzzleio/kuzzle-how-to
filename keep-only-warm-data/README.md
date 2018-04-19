# Keeping only warm data in Kuzzle

## Requirements

Kuzzle : `>= 1.2.11`  

## Introduction

Kuzzle is capable of handling  large amounts of data while maintaining a high level of performance.  
However, in some scenarios,  it can be useful  to manage a smaller volume of data in Kuzzle and use a secondary datastore synchronized with Kuzzle (see [How-To Synchronize Kuzzle with another database](../sync-data-to-another-database)) to maintain a larger dataset.
This is commonly referred to as a Hot/Warm architecture, where only the most recent data would be kept in Kuzzle. Such an architecture is used in scenarios where “Hot” data needs to be accessed quickly and “Warm” data needs to be maintained but is not accessed frequently.  
This could be the case for an App that uses a “Hot” store to provide data to its users and a “Warm” store to generate insights into user behavior through analytics.

## Architecture

We will be using the open-source Kuzzle stack. (Check [docker-compose.yml](docker-compose.yml) for more details)

Kuzzle will store “Hot” data in the `yellow-taxi` collection of the `nyc-open-data` index. This data will have the following mapping:

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

For our tests, documents will be inserted directly in Elasticsearch, without going through Kuzzle, in order to be able to change the value of the metadata field `createdAt` at our convenience.  

For that we will use the Elasticsearch [Bulk API](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/docs-bulk.html).  

## Cleaning old data

Since we only want to keep relevant data in Kuzzle, we need to  remove any older and irrelevant data . However, we cannot use the traditional Kuzzle APIs to do this because these changes could automatically be propagated to another external database (see [How-To Synchronize Kuzzle with another database](../sync-data-to-another-database)). So, we will bypass the Kuzzle API and use the Elasticsearch API instead.  

To delete data through the Elasticsearch API, we will perform a query that targets the oldest documents based on the `createdAt` field in the metadata. This field stores the date the document was created in Epoch-millis format.

Kuzzle uses a trash system to indicate that a document has been deleted and should no longer appear in search results. A [garbage collector](https://docs.kuzzle.io/guide/essentials/document-metadata/#garbage-collection) then periodically deletes these documents based on the `active` metadata field.   
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

You can try this How-to yourself  by using the supplied [docker-compose.yml](docker-compose.yml) as well as the [databaseCleaner.js](scripts/databaseCleaner.js) script.  

This script lets you specify a retention period to delete all documents prior to this period.  

A test dataset is also available via the [loadData.js](scripts/loadData.js) script. This script will load one document per day over a period of two months directly into Elasticsearch.  

Start by launching the containers with Docker Compose:

```bash
docker-compose up
```

Then load the test data by running the following command:

```bash
docker-compose exec kuzzle node /scripts/loadData.js
```

Verify the number of imported documents:

```bash
docker-compose exec kuzzle node /scripts/countData.js
```

Now we can use our Kuzzle cleaner script.

```bash
docker-compose exec kuzzle node /scripts/databaseCleaner.js --help
  Usage: databaseCleaner [options]

  Options:

    -h, --host <s>        Elastic host (default: elasticsearch)
    -p, --port <n>        Elastic port (default: 9200)
    -i, --index <s>       Index name
    -c, --collection <s>  Collection name
    -r, --retention <s>   Retention time specified in days (d), hours (h) or minutes (m) (default: 30d)
    --confirm             Confirm deletion
    -h, --help            output usage information

# Show documents older than 30 days
docker-compose exec kuzzle node /scripts/databaseCleaner.js -i nyc-open-data -c yellow-taxi -r 30d
# Use --confirm to delete matching documents
docker-compose exec kuzzle node /scripts/databaseCleaner.js -i nyc-open-data -c yellow-taxi -r 30d --confirm
```

Check documents deletion:

```bash
docker-compose exec kuzzle node /scripts/countData.js
```
