"""Generate LiveKit API key and secret pair for self-hosted deployment."""
import secrets
import string

api_key = "LKAPI_" + "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(24))
api_secret = secrets.token_hex(32)

print("LiveKit API Key:   ", api_key)
print("LiveKit API Secret:", api_secret)
print()
print("For GitHub Secrets:")
print(f"  LIVEKIT_API_KEY={api_key}")
print(f"  LIVEKIT_API_SECRET={api_secret}")
print()
print("For .env files:")
print(f"  LIVEKIT_API_KEY={api_key}")
print(f"  LIVEKIT_API_SECRET={api_secret}")
print(f"  LIVEKIT_HOST=http://localhost:7880")
