#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://localhost:8000}"

echo "→ Start session"
curl -s -X POST "$BASE/sessions" | jq .

echo "→ Start flow 'checkout'"
curl -s -X POST "$BASE/flows" -H 'Content-Type: application/json' -d '{"flowId":"checkout","name":"Checkout"}' | jq .

echo "→ Send order"
curl -s -X POST "$BASE/" -H 'Content-Type: application/json' -d '{"type":"order","orderId":"o-123","channel":"ios"}' | jq .

echo "→ Send payment"
curl -s -X POST "$BASE/" -H 'Content-Type: application/json' -d '{"type":"payment","paymentId":"p-456","orderId":"o-123"}' | jq .

echo "→ Get state"
curl -s "$BASE/state" | jq '.count, (.records? // "n/a")'
