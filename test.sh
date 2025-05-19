#!/bin/bash
set -e

# Health check
response=$(curl -s http://localhost:2137)
if [[ "$response" == "Hello World!" ]]; then
  echo "CORRECT: App is running"
else
  echo "ERROR: App health check failed"
  exit 1
fi

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
