# Principal Audit Report

- Prompt: **audio_video_media_ui**
- Domain: **features**
- Run ID: **audio_video_media_ui_20260703_055346**
- Generated: **2026-07-03T12:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **2**
- P2: **2**, P3: **0**
- Readiness: **53.00**

## Findings

### P1 — MediaRoom only shows generic 'Failed to connect to media server' on error with no distinction between permission-denied, network failure, or LiveKit unavailability
- **File:** `apps/web/components/media/media-room.tsx:27-28`
- **Category:** device_permissions
- **Impact:** When browser blocks camera/mic, users see a vague error with no guidance to check browser permissions.
- **Fix:** Catch getUserMedia errors specifically: check for NotAllowedError and show contextual message with link to browser permission settings.

### P1 — Dev remote compose omits LIVEKIT_HOST env var on API container, breaking LiveKit token generation in development
- **File:** `infra/docker/docker-compose.devremote.yml:85-87`
- **Category:** docker_integration
- **Impact:** Developers testing media features locally must manually add LIVEKIT_HOST to .env because devremote compose does not pass it.
- **Fix:** Add LIVEKIT_HOST: http://livekit:7880 to API environment in docker-compose.devremote.yml.

### P2 — MediaRoom uses ControlBar variation='minimal' which hides screen share and other advanced controls
- **File:** `apps/web/components/media/media-room.tsx:63-64`
- **Category:** screen_sharing
- **Impact:** Users cannot share their screen during calls unless the minimal variant exposes it.
- **Fix:** Add a dedicated screen-share toggle button outside ControlBar, or switch to variation='full'.

### P2 — No keyboard shortcut support for media controls — mute/unmute (M), video toggle (V), screen share (S), leave call (Esc)
- **File:** `apps/web/components/media/media-room.tsx`
- **Category:** keyboard_shortcuts
- **Impact:** Users cannot quickly mute/unmute or toggle video during calls via keyboard, which is standard in all major video conferencing tools.
- **Fix:** Add global keydown event listeners in MediaRoom for M (mute), V (toggle video), S (screen share), Esc (minimize/leave).
