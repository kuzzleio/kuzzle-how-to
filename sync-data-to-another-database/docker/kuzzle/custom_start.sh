#!/bin/bash

npm --prefix /var/app/plugins/enabled/kuzzle-plugin-sync-cassandra install /var/app/plugins/enabled/kuzzle-plugin-sync-cassandra

kuzzle start  --mappings /yellow_taxi/yellow_taxi_mapping.json
