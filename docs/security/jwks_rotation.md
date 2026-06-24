# JWKS Rotation Procedure

## Overview

JSON Web Key Set (JWKS) rotation for JWT signing keys. Supabase manages keys automatically, but we document the process for custom implementations or verification.

## Supabase-Managed Rotation (Current)

- Supabase automatically rotates JWT signing keys
- JWKS endpoint: `https://<project>.supabase.co/auth/v1/keys`
- Rotation interval: ~90 days (managed by Supabase)
- No manual action required

## Manual Verification

```bash
# Fetch current JWKS
curl https://<project>.supabase.co/auth/v1/keys | jq '.keys[] | {kid, kty, use, alg}'

# Verify token signature
curl -s "https://<project>.supabase.co/auth/v1/keys" | \
  jq -r '.keys[] | select(.kid=="<kid-from-token>") | @base64' | \
  base64 -d
```

## Custom JWKS Rotation (If Self-Managed)

### Key Generation

```bash
# Generate new RSA key pair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Generate JWK
cat public.pem | openssl rsa -pubin -outform DER | base64 -w 0 | tr -d '=' | tr '/+' '_-'
```

### JWKS Document Structure

```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "key-2024-01",
      "use": "sig",
      "alg": "RS256",
      "n": "<base64url-modulus>",
      "e": "AQAB"
    }
  ]
}
```

### Rotation Procedure

1. Generate new key pair
2. Add new key to JWKS (keep old key for transition)
3. Update signing to use new key
4. Wait for token expiration (max 1 hour)
5. Remove old key from JWKS
6. Update JWKS endpoint

### Rotation Schedule

- Rotate every 90 days
- Overlap period: 24 hours
- Emergency rotation: < 1 hour

## Monitoring

- Alert on JWKS fetch failures
- Alert on key age > 100 days
- Log all rotation events
- Verify token validation success rate > 99.9%
