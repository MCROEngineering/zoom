#!/bin/bash

if [[ "$1" == "local" ]]; then
  sh scripts/rpcs/start_all.sh $2
fi
echo ""
echo "--------------------------------------------------------------------"

#./node_modules/.bin/mocha --require source-map-support/register \
#  --full-trace \
#  --colors \
#  --paths -p ./ ./test/run_tests.js 

node test/run_tests.js --network $1

echo "--------------------------------------------------------------------"
echo ""
if [[ "$1" == "local" ]]; then
  sh scripts/rpcs/stop_all.sh $2
fi
echo ""

