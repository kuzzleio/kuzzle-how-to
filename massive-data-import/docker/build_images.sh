#!/bin/sh

echo "Kuzzle: Unziping Yellow Taxi data"
gunzip -k ../../samples/yellow_taxi/yellow_taxi_data.csv.gz

echo "Kuzzle: Move Yellow Taxi data"
mv ../../samples/yellow_taxi/yellow_taxi_data.csv kuzzle/yellow_taxi/.

echo "Kuzzle: Build docker image"
docker build -t kuzzleio/howto-massiveimport-kuzzle kuzzle/.
