---
code: true
type: page
title: Replicate to a sql database using Genegic events
description: How to replicate to a sql database using Genegic events
---

# Replicate to a sql database using Genegic events

## Requirements

Kuzzle : `>=2.0.0 <3.0.0`

## Introduction

In this tutorial you will see how to use generic events to trigger action while doing actions such as insert or delete.

[Generic events](https://docs.kuzzle.io/core/2/plugins/guides/events/generic-document-events/) are triggered by some controller's actions. They are mainly used to apply actions at certain points of the data flow.

Here we will used Generic events to copy all documents inside an postgres database when a new insert happen on The Kuzzle server, and we will do the same action when Kuzzle erase/delete data from the datastorage.


3 scripts have been created, and they allow you to test this plugin.

* import-data.js load open data into kuzzle.
* count-data.js count data inside the kuzzle ES datastore and the postgres Database.
* delete-data.js search all data inside the kuzzle datastore and delete them.


## Usage

In order to use this how to, you will need docker and docker-compose to be installed.

1. Build the postgres docker image `cd /project/docker/postgres-sql && docker build -t kuzzle-postgres-test:1.0.0 .`
1. Run the script `run-features.sh` to test the full how-to


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