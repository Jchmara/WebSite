#!/bin/sh
# Usage: ./wait-for.sh host:port command [args...]

hostport="$1"
shift

until nc -z $(echo $hostport | cut -d: -f1) $(echo $hostport | cut -d: -f2); do
  echo "En attente de la base de données à $hostport..."
  sleep 2
done

exec "$@"
