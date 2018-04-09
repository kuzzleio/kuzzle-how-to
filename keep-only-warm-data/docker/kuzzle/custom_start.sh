#!/bin/bash

npm --prefix /scripts install /scripts

# Allow user to remove node_modules without sudo
chmod -R 777 /scripts/node_modules
rmdir /scripts/etc

kuzzle start --mappings /yellow_taxi/yellow_taxi_mapping.json
