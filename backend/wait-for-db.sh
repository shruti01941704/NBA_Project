#!/bin/sh

HOST="mongodb"
PORT="27017"

echo "Waiting for MongoDB at $HOST:$PORT..."

while ! nc -z $HOST $PORT; do
  printf "."
  sleep 1
done

echo "MongoDB is up - executing command"
exec npm start

