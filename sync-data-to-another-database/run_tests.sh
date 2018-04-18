#!/bin/sh

# this fixes the input device is not a TTY .. see https://github.com/docker/compose/issues/5696
export COMPOSE_INTERACTIVE_NO_CLI=1

echo "Install cucumber"
gem install cucumber

echo "Start test"
cucumber

echo "Run eslint"
npm --prefix scripts/ run lint
npm --prefix plugin/ run lint
