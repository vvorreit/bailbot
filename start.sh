#!/bin/bash
cd "$(dirname "$0")"
set -a
while IFS='=' read -r key value; do
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  # Supprime les guillemets entourant la valeur
  value="${value%\"}"
  value="${value#\"}"
  export "$key=$value"
done < .env.local
set +a
exec node node_modules/.bin/next dev -p 3012
