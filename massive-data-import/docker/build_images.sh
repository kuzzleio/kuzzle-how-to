#!/bin/sh

echo "Kuzzle: Move Yellow Taxi data"
mv ../../samples/yellow_taxi/yellow_taxi_data.csv.gz kuzzle/yellow_taxi/.

echo "Kuzzle: Unziping Yellow Taxi data"
gunzip kuzzle/yellow_taxi/yellow_taxi_data.csv.gz

echo "Kuzzle: Build docker image"
docker build -t kuzzleio/howto-massiveimport-kuzzle kuzzle/.

echo "Kuzzle: Ziping Yellow Taxi data"
gzip -9 kuzzle/yellow_taxi/yellow_taxi_data.csv

echo "Kuzzle: Move Yellow Taxi data"
mv kuzzle/yellow_taxi/yellow_taxi_data.csv.gz ../../samples/yellow_taxi/.
