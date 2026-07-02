# WebRTC Audio/Video Infrastructure Evaluation

## Current Infrastructure Constraints

| Constraint          | Value                                 |
| ------------------- | ------------------------------------- |
| Compute             | Single DO droplet (s-2vcpu-2gb)       |
| Deployment          | Docker Compose                        |
| Reverse proxy       | Caddy 2                               |
| Real-time messaging | Socket.io (existing)                  |
| State/queue         | Redis (available for signaling)       |
| Budget              | Small team, no dedicated media budget |

## Option 1: LiveKit (Recommended)

### Architecture

```
Client → LiveKit WebSocket (signaling) → LiveKit SFU → Other Clients
  ↕                                     ↕
  Caddy (/v1/livekit/*)              Docker container
```

### Pros

- **Self-hosted** Docker image (`livekit/livekit-server`) — runs on existing droplet for <50 concurrent participants
- **Built-in TURN** via coturn integration for NAT traversal
- **Node.js Server SDK** (`@livekit/agents`) for generating access tokens
- **React SDK** (`@livekit/components-react`) for frontend — pre-built UI components
- **SFU architecture** — scales to 50+ participants on a single node
- **Egress recording** — can record sessions to S3-compatible storage
- **Horizontal scaling** — add more LiveKit nodes behind Redis for larger deployments
- **Active community** — maintained by LiveKit Inc., MIT license

### Cons

- Additional 200-300MB RAM for LiveKit server
- WebRTC requires UDP ports (need to open 7882-7892 on firewall)
- CPU usage scales with active participant video streams
- On s-2vcpu-2gb, limit to ~20 simultaneous video participants

### Integration Points

| Component    | Change Required                                                               |
| ------------ | ----------------------------------------------------------------------------- |
| **Caddy**    | Add reverse proxy for LiveKit signaling (`/v1/livekit/*` → `livekit:7880`)    |
| **API**      | New `livekit/service.ts` for generating access tokens with LiveKit Server SDK |
| **Frontend** | New `components/media/` with LiveKit React components                         |
| **Docker**   | Add `livekit` service to compose files                                        |
| **Infra**    | Open UDP ports 7882-7892 in DO firewall                                       |

### Cost

- **Self-hosted**: Free (MIT license). ~$10/mo extra DO bandwidth for media streams
- **LiveKit Cloud**: ~$50/mo for 500 connect-minutes (DX only)
- **Additional TURN**: Up to $5/mo for a small coturn droplet if needed

## Option 2: Daily.co (Simplest)

### Architecture

```
Client → Daily.co REST API → Daily.co Infrastructure
  ↕
  Our API (token generation)
```

### Pros

- **Zero infrastructure** — no new containers, ports, or compute
- **Pre-built UI** — iframe or React components, works immediately
- **No UDP port management** — handled by Daily.co
- **Built-in recording** and streaming
- **Simple REST API** for room management

### Cons

- **Cost**: $250/mo for Pro plan (10k meeting minutes)
- **Vendor lock-in** — no self-hosted alternative
- **Latency**: Media routed through Daily.co servers
- **Data sovereignty**: Media passes through Daily.co infrastructure
- **No custom media processing**: Cannot add custom video filters or processing

### Integration Points

| Component    | Change Required                                                            |
| ------------ | -------------------------------------------------------------------------- |
| **API**      | New `daily/service.ts` calling Daily.co REST API for room/token management |
| **Frontend** | Integrate `@daily-co/react-native-daily-js` or iframe embed                |
| **Secrets**  | Add `DAILY_API_KEY` secret                                                 |

### Cost

- **Pro plan**: $250/mo (10k meeting minutes)
- **Business plan**: $1,000/mo (unlimited)

## Option 3: Peer-to-Peer (Minimal)

### Architecture

```
Client A ←→ STUN/TURN ←→ Client B (direct P2P)
```

### Pros

- **No server-side media processing** — uses existing signaling (Socket.io)
- **Zero additional infrastructure** if STUN only
- **Free** — no services to pay for
- **Simple to implement** — just signaling + RTCPeerConnection

### Cons

- **Limited to ~4-6 participants** — each client uploads N-1 streams
- **CPU heavy on clients** — encoding multiple video streams
- **NAT traversal issues** — TURN required for many networks
- **No recording** or media processing capability
- **No fallback** — if a client can't establish P2P, call fails

### Integration Points

| Component       | Change Required                                                     |
| --------------- | ------------------------------------------------------------------- |
| **API**         | New signaling handlers in Socket.io (offer/answer/ICE candidates)   |
| **TURN server** | Deploy coturn container (`instrumentisto/coturn`) for NAT traversal |
| **Frontend**    | New `components/media/` with RTCPeerConnection management           |
| **Infra**       | Open TURN UDP port 3478                                             |

### Cost

- **Free** — just coturn container on existing droplet

## Option 4: Mediasoup (Advanced)

### Architecture

```
Client → Mediasoup Worker → Mediasoup Router → Other Clients
         (C++ worker process)
```

### Pros

- **Full control** over media pipeline (simulcast, SVC, custom processing)
- **Best CPU efficiency** for multi-participant scenarios
- **Proven at scale** — used by several large platforms
- **No vendor lock-in** — MIT license

### Cons

- **Complex setup** — requires understanding of WebRTC internals and mediasoup architecture
- **No pre-built UI** — must build from scratch
- **Higher CPU on server** than LiveKit for the same participant count
- **Dedicated worker port ranges** — complex port management through firewalls
- **Limited horizontal scaling** compared to LiveKit

### Integration Points

| Component    | Change Required                                  |
| ------------ | ------------------------------------------------ |
| **Caddy**    | Reverse proxy for mediasoup signaling            |
| **API**      | Custom signaling protocol via Socket.io          |
| **Frontend** | Full custom media component implementation       |
| **Infra**    | Multiple UDP port ranges (typically 40000-49999) |

## Recommendation

### Short-term (0-3 months): LiveKit Self-Hosted

Best balance of features, cost, and integration effort:

**Why LiveKit wins:**

1. Docker container fits on existing droplet for <50 concurrent users
2. Built-in TURN via coturn — no separate deployment
3. React SDK provides pre-built components (video grid, controls, screen share)
4. Scales horizontally when we need it — just add more LiveKit nodes
5. Integration effort is moderate — about 3-5 days of implementation
6. Cost is near-zero compared to Daily.co ($3k+/year)

**Required infra additions:**

- `livekit/livekit-server` Docker container (~200MB RAM)
- UDP ports 7882-7892 open in firewall
- 1 additional Caddy route for signaling
- `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` secrets

**Implementation estimate:**

- Backend token generation: 0.5 day
- Frontend media components: 2-3 days
- Infra setup (Docker + ports + Caddy): 0.5 day
- Testing + polish: 1 day
- **Total: ~4-5 days**

### Medium-term (3-12 months): Evaluate LiveKit Cloud

If usage exceeds 50 concurrent participants, migrate to LiveKit Cloud for managed infrastructure while keeping the same SDK integration.

### Alternative if budget allows

If the team has budget and wants zero-infrastructure: **Daily.co Pro** ($250/mo). Integration is 2-3 days total, but ongoing cost is significant.
