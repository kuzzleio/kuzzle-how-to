#!/bin/sh

echo "Pushing to docker hub"
docker push kuzzleio/howto-syncdata-kuzzle
docker push kuzzleio/howto-syncdata-cassandra
