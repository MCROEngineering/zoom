#!/bin/bash

# Exit script as soon as a command fails.
set -o errexit

moduleName="ethereum"
softwareName="ganache-cli"
testrpc_port=8545
SeedFile="scripts/rpcs/_seed_words"
seedWords=$(<"$SeedFile")

testrpc_running() {
  nc -z localhost "$testrpc_port"
}

start_testrpc() {
  ganache-cli -a 10 -d -n -i 15 -p $testrpc_port -m "$seedWords" > scripts/TestRPCData/$moduleName.output.log &
  testrpc_pid=$!
  echo $testrpc_pid > scripts/TestRPCData/$moduleName.process.pid
}

if testrpc_running; then
  if [[ "$1" != "use-existing" ]]; then
    echo "Killing existing $softwareName instance at port $testrpc_port"
    kill -9 $( lsof -i -P | grep $testrpc_port | awk '{print $2}' ) > /dev/null
    echo "Starting new $softwareName instance at port $testrpc_port"
    start_testrpc
  else
    echo "Using $softwareName instance at port $testrpc_port"
  fi
else
  echo "Starting new $softwareName instance at port $testrpc_port"
  start_testrpc
fi

if testrpc_running; then
  echo "$softwareName initialised."
else
  echo "$softwareName did not initialize yet. Sleeping for 2 seconds.."
  sleep 2
fi