#!/bin/sh

echo "Install cucumber"
gem install cucumber

echo "Start test"
cucumber

echo "Run eslint"
npm --prefix scripts/ run lint
