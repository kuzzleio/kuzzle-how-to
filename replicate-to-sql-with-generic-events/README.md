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

## Usage

In order to use this how to, you will need docker and docker-compose to be installed.

1. Build the postgres docker image `cd /project/docker/postgres-sql && docker build -t kuzzle-postgres-test:1.0.0 .`
1. start the stack `cd /project/ && docker-compose -f docker-compose.yml up`

The stack is now deployed.

Next steps:

1. `node import-data.js` This script will trigger data to import inside the kuzzle datastore and trigger generic events associated.
1. `node delete-data.js` This script will trigger data to delete inside the kuzzle datastore and trigger generic events associated.


For those who are not familiar with the postgres sql here is a short cheatsheet.

* Connect to the postgres docker `docker exec -ti <docker postgre id> bash`
* Once you are inside the docker launch `psql` to connect to the postgres shell
* List all db `\l`
* Connect to a db `\c <dbname>`
* List all tables `\d`
* List data inside a table`SELECT * FROM yellow_taxi`