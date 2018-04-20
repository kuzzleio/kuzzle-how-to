#!/bin/bash
echo Creating fb-howto-index
wget --method=POST http://localhost:7512/fb-howto-index/_create?pretty -O - -q; echo

echo Creating fb-howto-collection
wget --method=PUT http://localhost:7512/fb-howto-index/fb-howto-collection?pretty -O - -q; echo
