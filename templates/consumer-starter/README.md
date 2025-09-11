# RequestWeaver Consumer Starter

## Quick start
```bash
cp .env.example .env
mkdir -p extensions/common-schemas extensions/flows
docker compose up --build
# Dashboard: http://localhost:${PORT:-8000}/dashboard/html
```

## With proxy sidecar (mitmproxy)
```
docker compose --profile mitm up --build
```
Set your device HTTP proxy to your host IP, port ${MITM_PORT:-8080}. Install & trust the mitmproxy CA.

## Add a new flow
```
node scripts/scaffold-flow.js checkout
```
