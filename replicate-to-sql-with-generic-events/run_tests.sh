#!/bin/bash

docker-compose down
docker-compose up -d

./node_modules/cucumber/bin/cucumber-js

docker-compose down
