# Load Tests (k6)

## Prerequisites

- [k6](https://k6.io/docs/get-started/installation/) installed locally
- API server running (e.g., `pnpm dev`)

## Running Tests

```bash
# Smoke test (1 VU, 30s)
k6 run tests/k6/smoke-test.js

# Load test (ramp to 50 VU)
k6 run tests/k6/load-test.js
```

## Test Descriptions

- **smoke-test.js**: Single user, quick health check validation
- **load-test.js**: Ramped load test simulating concurrent users

## CI Integration

These tests require a running API instance and are not yet integrated into CI.
