#!/bin/bash
cd "$(dirname "$0")"
set -a
while IFS='=' read -r key value; do
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  export "$key=$value"
done < .env.local
set +a
exec node node_modules/.bin/next dev -p 3012
