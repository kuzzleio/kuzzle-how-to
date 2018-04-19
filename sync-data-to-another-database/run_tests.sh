#!/bin/sh

echo "Install cucumber"
gem install cucumber

echo "Pull latests images from Docker Hub"
docker-compose pull

echo "Start test"
cucumber

echo "Run eslint"
npm --prefix scripts/ run lint
npm --prefix plugin/ run lint
