#!/bin/bash

npm --prefix /var/app/plugins/enabled/kuzzle-plugin-sync-cassandra install /var/app/plugins/enabled/kuzzle-plugin-sync-cassandra
npm --prefix /scripts install /scripts

# Allow user to remove node_modules
chmod 777 /var/app/plugins/enabled/kuzzle-plugin-sync-cassandra/node_modules
chmod 777 /scripts/node_modules

# Garbage
rmdir /var/app/plugins/enabled/kuzzle-plugin-sync-cassandra/etc
rmdir /scripts/etc

kuzzle start  --mappings /yellow_taxi/yellow_taxi_mapping.json
