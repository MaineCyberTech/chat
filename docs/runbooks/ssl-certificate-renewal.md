# SSL Certificate Renewal (Caddy TLS)

Caddy handles TLS certificate issuance and renewal automatically via Let's Encrypt. Certificates are stored in the `caddy-data` Docker volume.

## Verify Certificate Status

```bash
echo | openssl s_client -servername chat.mainecybertech.com -connect chat.mainecybertech.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Caddy Fails to Obtain Certificate

### Cloudflare Proxy Blocks ACME Challenge

If Cloudflare proxies DNS (orange cloud), Let's Encrypt HTTP-01 challenge cannot reach Caddy. Solutions:

**Option A: Use DNS-01 challenge with Cloudflare plugin**

Add to `Caddyfile.prod`:
```
tls {
  dns cloudflare {env.CF_API_TOKEN}
}
```

**Option B: Temporarily disable Cloudflare proxy**

Set DNS record to DNS-only (grey cloud) during initial cert issuance, then re-enable proxy. Caddy will renew via TLS-ALPN-01 which works through Cloudflare.

### Ports Not Reachable

Caddy needs ports 80 and 443 accessible from the internet:

```bash
ufw status | grep -E "80|443"
```

If blocked, allow them:
```bash
ufw allow 80/tcp
ufw allow 443/tcp
```

### Rate Limited by Let's Encrypt

If you hit the 5-certificates-per-domain-per-week limit:
- Wait for the rate limit to reset (7 days)
- Check `caddy-data` volume for existing certs: `docker run --rm -v chat-prod_caddy-data:/data alpine ls /data/caddy/certificates/`
- Use staging environment to test: set `CA=https://acme-staging-v02.api.letsencrypt.org/directory` in Caddyfile

## Manual Certificate Renewal Check

```bash
docker exec chat-caddy-prod caddy renew --config /etc/caddy/Caddyfile
```

Caddy automatically renews certificates 30 days before expiry. Check renewal logs:

```bash
docker logs chat-caddy-prod | grep -i "certificate\|acme\|tls"
```

## Certificate File Locations

Inside the `caddy-data` volume:
```
/data/caddy/certificates/
  acme-v02.api.letsencrypt.org-directory/
    chat.mainecybertech.com/
      chat.mainecybertech.com.crt
      chat.mainecybertech.com.key
```

## Emergency Manual Certificate

If Let's Encrypt is unavailable, use Cloudflare Origin Certificate:

1. Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate
2. Save cert and key to `infra/docker/certs/`
3. Mount in compose:
```yaml
volumes:
  - ./certs/origin.pem:/etc/caddy/certs/fullchain.pem:ro
  - ./certs/origin-key.pem:/etc/caddy/certs/privkey.pem:ro
```
4. Reference in Caddyfile: `tls /etc/caddy/certs/fullchain.pem /etc/caddy/certs/privkey.pem`
