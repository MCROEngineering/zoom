#! /bin/bash

sh scripts/testrpc.sh
./node_modules/.bin/truffle test --network rpc
