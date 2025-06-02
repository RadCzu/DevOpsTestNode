#!/bin/bash
set -e

# Health check
echo "Waiting for app to start on port 2137..."
for i in {1..10}; do
  if curl -s http://localhost:2137 > /dev/null; then
    echo "App is up!"
    break
  fi
  echo "App not yet reachable... retrying in 2s"
  sleep 2
done

# Initial /storage check
response=$(curl -s http://localhost:2137/storage)
value=$(echo "$response" | jq -r '.value')

if [[ "$value" == "default" ]]; then
  echo "CORRECT: /storage returned expected value"
else
  echo "ERROR: /storage returned unexpected value: $value"
  exit 1
fi

# Update /storage with PUT
new_value="updated-by-test"
put_response=$(curl -s -X PUT http://localhost:2137/storage \
  -H "Content-Type: application/json" \
  -d "{\"value\":\"$new_value\"}")

echo "INFO: PUT response: $put_response"

# Recheck /storage
response=$(curl -s http://localhost:2137/storage)
value=$(echo "$response" | jq -r '.value')

if [[ "$value" == "$new_value" ]]; then
  echo "CORRECT: /storage successfully updated to: $value"
else
  echo "ERROR: /storage update failed. Current value: $value"
  exit 1
fi
