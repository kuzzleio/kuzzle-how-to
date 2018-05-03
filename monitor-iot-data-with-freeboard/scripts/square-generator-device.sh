#!/bin/bash

if [ -n "$1" ]; then
DEVICE_ID=$1
else
DEVICE_ID=SQUARE_GENERATOR
fi
a=0

echo "Generating square function as \"device_id\" : $DEVICE_ID"

while true; do
v=`echo "if ($a%10 <5) print 0 else print 1" | bc`
a=`expr $a + 1`

#echo $a ":" $v
wget --header="Content-Type: application/json"  --post-data="{ \"device_id\" : \"$DEVICE_ID\", \"value\" : $v }" http://localhost:7512/fb-howto-index/fb-howto-collection/_create -q -O - > /dev/null
sleep 1
done

