#!/bin/bash

if [ -n "$1" ]; then
    DEVICE_ID=$1
else
    DEVICE_ID="SIN_GENERATOR"
fi

PI=3.14159265359
a=0

echo "Generating sinus function as \"device_id\" : $DEVICE_ID"

while true; do
v=`echo "s($a)" | bc -l | sed -e 's/^-\./-0./' -e 's/^\./0./'`
#echo "sin($a) = $v"
a=`echo "$a+$PI/10" | bc -l`

wget --header="Content-Type: application/json"  --post-data="{ \"device_id\" : \"$DEVICE_ID\", \"value\" : $v }" http://localhost:7512/fb-howto-index/fb-howto-collection/_create?pretty -q -O - > /dev/null
sleep .025
done

