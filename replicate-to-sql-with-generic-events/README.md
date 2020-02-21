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

- import-data.js load data into kuzzle.
- count-data.js count data inside the kuzzle ES datastore and the postgres Database.
- delete-data.js search all data inside the kuzzle datastore and delete them.

We will be using this data model to load data into kuzzle, and replicate them into Postgres using the same model. Those data are loaded from the file located in `samples/Yellow_taxi.csv`

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

In the [scripts/import-data.js](scripts/import-data.js), the whole CSV document is parsed using the `readline` core package of NodeJS and then the `mCreate` method from Kuzzle's [document controller](https://docs.kuzzle.io/sdk/js/7/controllers/document/m-create/) is used. This will generate one event for the entire request, sending an array of new documents as the event payload.

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
1. creating the index/collection that will hold our data
1. loading data to Kuzzle

```javascript
async function run() {
  try {
    await kuzzle.connect();
    await createIndexIfNotExists(kuzzle, indexName);
    await createCollectionIfNotExists(kuzzle, indexName, collectionName);
    await loadData();
  } finally {
    kuzzle.disconnect();
  }
}
```

Looking at the [plugin file](lib/index.js), we can observe how **Generic Events** are being catch by the Plugin.

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
    const promises = documents.map(doc => this.pg.insert(this.getProperties(doc)));
    await Promise.all(promises);

    return documents;
  }

  async afterDelete(documents = []) {
    const promises = documents.map(doc => this.pg.delete(doc._id));
    await Promise.all(promises);

    return documents;
  }
```

More generic and non-generic events can be used: [Kuzzle events documentation](https://docs.kuzzle.io/core/2/plugins/guides/events/intro).

We used the well-known [node-postgres](https://node-postgres.com/) client to interface our plugin with a postgres database.

```javascript
const { Pool } = require('pg');

function createPool(config) {
  const pool = new Pool(config);
}
```

We will use the [Pool](https://node-postgres.com/api/pool) constructor to instanciate the Postgres driver within the kuzzle plugin.

The pool acquires a client from the pool. If the pool is 'full' and all clients are currently checked out, this will wait in a FIFO queue until a client becomes available by it being released back to the pool.

To make a correct insert inside the database, we will use a multiline insert. Since generic events will send a set of records as a payload, it is wise to insert them together rather than one by one.

```javascript
const format = require('pg-format');

async multiLineInsert(docs = []) {
  const keys = docs.length > 0 ? Object.keys(docs[0]).join(',') : {};
  const result = docs.map(doc => Object.values(doc));
  const query = format(`INSERT INTO yellow_taxi (${keys}) VALUES %L`, result);
  return this.pool.query(query);
}
```

By launching the `run_tests.sh` you will execute all steps decribed in the section below.

### Try it yourself

> If you want to start the stack yourself run `cd /project/ && docker-compose -f docker-compose.yml up`

Launch all tests in this specific order to fully test this plugin.

All scripts are located at `/var/app/plugins/enabled/replicate-to-sql-with-generic-events/`

1. `scripts/import-data.js`
1. `scripts/count-data.js`
1. `scripts/delete-data.js`
1. `scripts/count-data.js`

For those who are not familiar with postgres' psql client, here is a short sheatsheet:

- Start the psql client of a dockerized postgres: `docker exec -ti <docker postgre id> psql`
- List all database: `\l`
- Connect to a database: `\c <dbname>`
- List all tables: `\d`
- List data inside a table: `SELECT * FROM yellow_taxi;`

Hope you enjoyed this How-to, be sure to read them all to give you a wide variety of usages about Kuzzle!

Hope to see you soon on [Gitter](https://gitter.im/kuzzleio/kuzzle)

[You can also see this on Github](https://github.com/kuzzleio/kuzzle-how-to/tree/master/replicate-to-sql-with-generic-events)
