#!/bin/sh

echo "Kuzzle: Move Yellow Taxi data"
mv ../../samples/yellow_taxi/yellow_taxi_data.csv.gz kuzzle/yellow_taxi/.

echo "Kuzzle: Unziping Yellow Taxi data"
gunzip kuzzle/yellow_taxi/yellow_taxi_data.csv.gz

echo "Kuzzle: Install NPM modules"
npm --prefix kuzzle/yellow_taxi install kuzzle/yellow_taxi

echo "Kuzzle: Build docker image"
docker build -t kuzzleio/howto-syncdata-kuzzle kuzzle/.

echo "Kuzzle: Delete NPM lodules"
rm -rf kuzzle/yellow_taxi/node_modules
rmdir kuzzle/yellow_taxi/etc

echo "Kuzzle: Ziping Yellow Taxi data"
gzip -9 kuzzle/yellow_taxi/yellow_taxi_data.csv

echo "Kuzzle: Move Yellow Taxi data"
mv kuzzle/yellow_taxi/yellow_taxi_data.csv.gz ../../samples/yellow_taxi/.


echo "Cassandra: Build docker image"
docker build -t kuzzleio/howto-syncdata-cassandra cassandra/.
