#!/bin/bash

npm --prefix /var/app/plugins/enabled/kuzzle-plugin-export-cassandra install /var/app/plugins/enabled/kuzzle-plugin-export-cassandra

kuzzle start  --mappings /yellow_taxi/yellow_taxi_mapping.json
