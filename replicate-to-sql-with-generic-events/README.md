---
code: true
type: page
title: Replicate to a sql database using Generic events
description: How to replicate to a sql database using Generic events
---

# Replicate to a sql database using Generic events

## Requirements

Kuzzle : `>=2.0.0 <3.0.0`

## Introduction

In this tutorial you will see how to use generic events to trigger action while doing actions such as insert or delete.

1. We will create a plugin [listening synchronously](https://docs.kuzzle.io/core/2/plugins/guides/pipes/) to Document Controller events in order to report document changes in PostgresSQL.
1. We will use [Generic events](https://docs.kuzzle.io/core/2/plugins/guides/events/generic-document-events/) to trigger some controller's actions.
1. We will be using the open-source Kuzzle stack. (Check [docker-compose.yml](docker-compose.yml) for more details)

Here we will used Generic events to copy all documents inside an postgres database when a new insert happen on The Kuzzle server, and we will do the same action when Kuzzle erase/delete data from the datastorage.

## Usage

In order to use this how to, you will need docker and docker-compose to be installed.

1. Run the script `run_tests.sh` to test the full how-to

## Explanation

3 scripts have been created, and they allow you to test this plugin.

* import-data.js load open data into kuzzle.
* count-data.js count data inside the kuzzle ES datastore and the postgres Database.
* delete-data.js search all data inside the kuzzle datastore and delete them.

We will be using this data model to load data into kuzzle, and replicate this into Postgres using the same model. Those data are load from the file located in `samples/Yellow_taxi.csv`

```javascript
function formatDocument(fields = []) {
  return {
    VendorID: fields[0],
    tpep_pickup_datetime: fields[1],
    tpep_dropoff_datetime: fields[2],
    passenger_count: fields[3],
    trip_distance: fields[4],
    RatecodeID: fields[5],
    store_and_fwd_flag: fields[6],
    PULocationID: fields[7],
    DOLocationID: fields[8],
    payment_type: fields[9],
    fare_amount: fields[10],
    extra: fields[11],
    mta_tax: fields[12],
    tip_amount: fields[13],
    tolls_amount: fields[14],
    improvement_surcharge: fields[15],
    total_amount: fields[16]
  };
}
```
In the [scripts/import-data.js](scripts/import-data.js) We parse the whole csv documents using the `readline` core package of NodeJS and then use the `mCreate` method from the [document controller](https://docs.kuzzle.io/sdk/js/7/controllers/document/m-create/). This will generate multiple events for each entries.

```javascript
async function loadData() {
  const documents = await getDocuments();

  if (documents.length > 0) {
    const response = await kuzzle.document.mCreate(indexName, collectionName, documents);
    console.log(`Created ${response.successes.length} documents`);
  } else {
    throw new Error('No documents to insert');
  }
}
```

We then complete the script by

1. connecting to the running kuzzle instance.
1. loading Index/Collection inside the storage layer, witch is [Elasticseach](https://www.elastic.co/guide/index.html)
1. Load all data inside Kuzzle.

```javascript
async function run() {
  try {
    await kuzzle.connect();
    await createIndexIfNotExists(kuzzle, indexName);
    await createCollectionIfNotExists(kuzzle, indexName, collectionName);
    await loadData();
  }
  catch (error) {
    throw error;
  } 
  finally {
    kuzzle.disconnect();
  }
}

```

Looking at the [Plugin file](lib/index.js), we can observe how __Generic Events__ are being catch by the Plugin.

```javascript
class CorePlugin {
  constructor() {
    this.context = null;
    this.config = {};
    this.pipes = {
      'generic:document:afterWrite': 'afterWrite',
      'generic:document:afterDelete': 'afterDelete'
    };
  }
}
```

By declaring `this.pipes` inside the constructor of the plugin we can catch events emitted by the core of kuzzle. Here, we will be listening to 

1. `generic:document:afterWrite` an event emitted right after documents have been written.
1. `generic:document:afterDelete` an event emitted right after documents have been deleted.

```javascript
async afterWrite(documents = []) {
    try {
      await this.pg.connect();
      const docs = documents.map(doc => this.pg.insert(this.getProperties(doc)));
      await Promise.all(docs);
      await this.pg.end();
      return documents;
    }
    catch (error) {
      throw error;
    }
}
async afterDelete(documents = []) {
    try {
      await this.pg.connect();
      const docs = documents.map(doc => this.pg.delete(doc._id));
      await Promise.all(docs);
      await this.pg.end();
      return documents;
    }
    catch (error) {
      throw error;
    }
}
```

Each event is link to a function inside the Plugin class. Theses function takes two parameters the first one is

* `documents` which is an array of each documents added by one request
* `request` which is a [Kuzzle API Request](https://docs.kuzzle.io/core/2/plugins/plugin-context/constructors/request#request)


Many more Generic events exists, you can think of many use cases that will fits your needs.

We used [Postgres wrapper](https://node-postgres.com/), witch is the most widely used postgres driver on npm.

```javascript
const { Pool } = require('pg');

function createClient(config) {
    const client = new Pool(config);
    this.client = client;
}
```

Once the client is instanciated, we can use the Insert sql method to pipe data from Kuzzle to postgres. To properly use the driver, you need a little work to format your request like so:

```bash
INSERT INTO yellow_taxi (VendorID, tpep_pickup_datetime, ...) VALUES ($1, $2, ...); # And the you populate placeholder's data given an array of values.
```

```javascript

function formatPlaceholders(values) {
    return values.map((_, i) => `$${i + 1}`).join(',');
}

async insert(data) {
    const [ params, values ] = Object.entries(data);
    const indexes = this.formatPlaceholders(values);
    const query = `INSERT INTO yellow_taxi (${params.join(',')}) VALUES(${indexes})`;
    return this.client.query(query, values);;
}
```

By launching the `run_tests.sh` you will execute all steps decribed in the section below.

### Try it yourself

> If you want to start the stack yourself run `cd /project/ && docker-compose -f docker-compose.yml up`

Launch all test in this specific order to fully test this plugin.

1. `node scripts/import-data.js`
1. `node scripts/count-data.js`
1. `node scripts/delete-data.js`
1. `node scripts/count-data.js`

For those who are not familiar with the postgres sql here is a short cheatsheet.

* Connect to the postgres docker `docker exec -ti <docker postgre id> bash`
* Once you are inside the docker launch `psql` to connect to the postgres shell
* List all db `\l`
* Connect to a db `\c <dbname>`
* List all tables `\d`
* List data inside a table`SELECT * FROM yellow_taxi`


Hope you enjoyed this How-to, be sure to read them all to give you a wide variety of usages about Kuzzle !!

Hope to see you soon on [Gitter](https://gitter.im/kuzzleio/kuzzle)

[You can also see this on Github](https://github.com/kuzzleio/kuzzle-how-to/tree/master/replicate-to-sql-with-generic-events)