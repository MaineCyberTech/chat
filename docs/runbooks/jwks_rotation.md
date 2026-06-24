# JWKS Rotation Runbook

## Overview

JSON Web Key Set (JWKS) rotation is the process of periodically rotating the signing keys used for JWT tokens to limit the blast radius of key compromise.

## Current State

- Supabase manages JWKS for auth tokens
- Keys are rotated automatically by Supabase
- Rotation interval: ~90 days (Supabase default)

## Manual Rotation Procedure

### Prerequisites

- Supabase CLI access
- Admin access to Supabase dashboard

### Procedure

1. Navigate to Supabase Dashboard > Authentication > Keys
2. Click "Rotate Keys" button
3. Wait for propagation (up to 5 minutes)
4. Verify new keys are being used:
   ```bash
   curl https://your-project.supabase.co/auth/v1/.well-known/jwks.json
   ```

### Emergency Rotation

If a key is compromised:

1. Immediately rotate keys via Supabase dashboard
2. Force logout all users:
   ```sql
   DELETE FROM auth.refresh_tokens;
   ```
3. Monitor for failed authentications

## Automation

Supabase handles rotation automatically. No cron job needed.

## Monitoring

- Watch for auth failures in logs
- Set up alert on auth error rate spike
