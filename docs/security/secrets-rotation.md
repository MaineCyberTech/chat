# Secrets Rotation Guide

This document describes how to rotate each secret used by the platform.
All new secrets must be stored in GitHub Actions secrets before deployment.

## Pre-Rotation Checklist

1. Notify the team in the operations channel.
2. Verify the current deployment is healthy (`docker compose ps` on the droplet).
3. Ensure you have SSH access to the droplet.

---

## Supabase Keys

### SUPABASE_ANON_KEY

Rotated in the Supabase dashboard under Project Settings > API. No downtime.

1. Generate a new anon key in Supabase dashboard.
2. Update `SUPABASE_ANON_KEY` in GitHub Actions secrets.
3. Redeploy: trigger `deploy-development.yml` or `deploy-production.yml`.
4. Verify: open the app and confirm unauthenticated API calls still work.

### SUPABASE_SERVICE_ROLE_KEY

Rotated in the Supabase dashboard. **Brief downtime for worker and server-side operations.**

1. Generate a new service role key in Supabase dashboard.
2. The old key remains valid for up to 1 hour. Deploy the new key immediately.
3. Update `SUPABASE_SERVICE_ROLE_KEY` in GitHub Actions secrets.
4. Redeploy.
5. Verify: SSH into the droplet and check container logs for auth errors.

### SUPABASE_ACCESS_TOKEN / SUPABASE_DB_PASSWORD

Rotated in Supabase dashboard under Project Settings > Database.

1. Generate new credentials in Supabase dashboard.
2. Update `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` in GitHub Actions secrets.
3. Verify: run the `supabase-migrations.yml` workflow to confirm DB push works.

---

## VAPID Keys (Push Notifications)

VAPID keys are a public/private key pair. Rotating invalidates existing push subscriptions.

1. Generate a new key pair:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Update `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in GitHub Actions secrets.
3. Redeploy.
4. Verify: send a test notification and confirm it is delivered.
5. **Note**: Existing push subscriptions will need to be re-registered by clients.

---

## LiveKit Keys (WebRTC)

1. Generate new keys in the LiveKit dashboard or via:
   ```bash
   python scripts/generate-livekit-keys.py
   ```
2. Update `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` in GitHub Actions secrets.
3. Redeploy.
4. Verify: start a voice/video call in the app and confirm connectivity.

---

## DigitalOcean (DO) Tokens

### DO_API_TOKEN

1. Create a new personal access token in DO dashboard under API > Tokens.
2. Assign the same scopes as the existing token (Read/Write).
3. Update `DO_API_TOKEN` in GitHub Actions secrets.
4. Revoke the old token in DO dashboard.
5. Verify: trigger `infra-development.yml` and confirm Terraform can authenticate.

### DO_SSH_PRIVATE_KEY / DO_SSH_PASSPHRASE

1. Generate a new SSH key pair:
   ```bash
   ssh-keygen -t ed25519 -C "deploy-bot@chat" -f deploy_key
   ```
2. Add the public key to the droplet via DO dashboard or Terraform.
3. Update `CI_SSH_PRIVATE_KEY` / `DO_SSH_PRIVATE_KEY` and `DO_SSH_PASSPHRASE` in GitHub Actions secrets.
4. Update `CI_SSH_PUBLIC_KEY` with the new public key.
5. Verify: SSH into the droplet using the new key:
   ```bash
   ssh -i deploy_key root@<droplet-ip>
   ```
6. Remove the old public key from the droplet's `~/.ssh/authorized_keys`.

---

## Cloudflare Tokens

### CF_API_TOKEN

1. Create a new API token in Cloudflare dashboard under My Profile > API Tokens.
2. Assign the same permissions (Zone:DNS:Edit, Zone:Zone:Read).
3. Update `CF_API_TOKEN` in GitHub Actions secrets.
4. Revoke the old token in Cloudflare dashboard.
5. Verify: trigger `infra-development.yml` and confirm DNS operations work.

### CF_ORIGIN_CERT / CF_ORIGIN_KEY

1. Generate a new origin certificate in Cloudflare dashboard under SSL/TLS > Origin Server.
2. Use a 15-year validity and RSA key format.
3. Save the certificate as `CF_ORIGIN_CERT` and the private key as `CF_ORIGIN_KEY` in GitHub Actions secrets.
4. Redeploy — Caddy will pick up the new certificate on restart.
5. Verify: `curl -vI https://chat.mainecybertech.com` and confirm the TLS handshake succeeds.

---

## AWS Keys

### AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY

1. Create a new IAM access key in the AWS console (IAM > Users > Security credentials).
2. Update `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in GitHub Actions secrets.
3. Deactivate and delete the old key in the AWS console.
4. Verify: trigger any workflow that uses AWS resources and confirm authentication.

---

## CI/CD Secrets

### CI_SSH_PRIVATE_KEY / CI_SSH_PUBLIC_KEY

Used by CI to SSH into the droplet for deployment.

1. Generate a new key pair as described in the DO section above.
2. Update `CI_SSH_PRIVATE_KEY`, `CI_SSH_PUBLIC_KEY`, and `CI_SSH_FINGERPRINT` in GitHub Actions secrets.
3. Add the new public key to `SSH_ALLOWED_IPS` configuration.
4. Verify: trigger a deployment workflow and confirm SSH succeeds.

### GITHUB_TOKEN

Automatically provided by GitHub — no rotation needed.

---

## Verification After Rotation

Run this checklist after rotating any secret:

1. `docker compose ps` — all containers healthy (no restart loops).
2. `docker compose logs api | tail -20` — no auth or connection errors.
3. `docker compose logs worker | tail -20` — no Redis or Supabase connection errors.
4. Open the app and log in — confirm all features work.
5. Send a test message — confirm real-time delivery.
6. Trigger the CI workflow for the rotated secret — confirm no failures.
