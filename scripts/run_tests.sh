#!/bin/bash
sh scripts/rpcs/start_all.sh $2
echo ""
echo "--------------------------------------------------------------------"

if [[ "$1" = "all" ]]; then
  echo " Running all tests in \"test\" folder:"
else
  echo " Running tests in path \"$3\""
fi

echo "--------------------------------------------------------------------"

if [[ "$1" = "all" ]]; then
  ./node_modules/.bin/ts-mocha --require source-map-support/register \
    --full-trace \
    --colors \
    --paths -p ./ test/*/*.ts test/*.ts

else
  ./node_modules/.bin/ts-mocha --require source-map-support/register \
    --full-trace \
    --colors \
    --paths -p ./ $3
fi

echo "--------------------------------------------------------------------"
echo ""
sh scripts/rpcs/stop_all.sh $2
echo ""
