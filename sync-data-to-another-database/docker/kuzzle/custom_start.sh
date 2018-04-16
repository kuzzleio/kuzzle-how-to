#!/bin/bash

npm --prefix /var/app/plugins/enabled/kuzzle-plugin-sync-cassandra install /var/app/plugins/enabled/kuzzle-plugin-sync-cassandra
npm --prefix /scripts install /scripts

chmod 777 /var/app/plugins/enabled/kuzzle-plugin-sync-cassandra/node_modules
# Garbage
rmdir /var/app/plugins/enabled/kuzzle-plugin-sync-cassandra/etc

kuzzle start  --mappings /yellow_taxi/yellow_taxi_mapping.json
