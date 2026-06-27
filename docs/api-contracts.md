# API Contract Documentation

## REST Endpoints

All REST endpoints are served via Express under the `/v1/` path prefix, reverse-proxied by Caddy on the same domain.

### Authentication

| Method | Path                  | Description                          | Auth         |
| ------ | --------------------- | ------------------------------------ | ------------ |
| POST   | `/v1/auth/magic-link` | Send magic link email                | None         |
| POST   | `/v1/auth/callback`   | Exchange magic link code for session | None         |
| GET    | `/v1/auth/me`         | Get current user profile             | Bearer token |
| PATCH  | `/v1/auth/profile`    | Update display name / avatar         | Bearer token |
| GET    | `/v1/auth/users?q=`   | Search users by email/name           | Bearer token |
| GET    | `/v1/auth/profiles`   | Bulk fetch user profiles             | Bearer token |

### Workspaces

| Method | Path                                 | Description            | Auth                      |
| ------ | ------------------------------------ | ---------------------- | ------------------------- |
| GET    | `/v1/workspaces`                     | List user's workspaces | Bearer token              |
| GET    | `/v1/workspaces/:id`                 | Get workspace details  | Bearer token + membership |
| POST   | `/v1/workspaces`                     | Create workspace       | Bearer token              |
| PATCH  | `/v1/workspaces/:id`                 | Update workspace       | Bearer token + admin      |
| DELETE | `/v1/workspaces/:id`                 | Delete workspace       | Bearer token + owner      |
| GET    | `/v1/workspaces/:id/members`         | List workspace members | Bearer token + membership |
| POST   | `/v1/workspaces/:id/members`         | Add member             | Bearer token + admin      |
| DELETE | `/v1/workspaces/:id/members/:userId` | Remove member          | Bearer token + admin      |
| PATCH  | `/v1/workspaces/:id/members/:userId` | Update member role     | Bearer token + admin      |

### Channels

| Method | Path                          | Description                | Auth                      |
| ------ | ----------------------------- | -------------------------- | ------------------------- |
| GET    | `/v1/workspaces/:id/channels` | List channels in workspace | Bearer token + membership |
| GET    | `/v1/channels/:id`            | Get channel details        | Bearer token + membership |
| POST   | `/v1/workspaces/:id/channels` | Create channel             | Bearer token + membership |
| PATCH  | `/v1/channels/:id`            | Update channel             | Bearer token + admin      |
| DELETE | `/v1/channels/:id`            | Delete channel             | Bearer token + admin      |

### Messages

| Method | Path                                  | Description                       | Auth                      |
| ------ | ------------------------------------- | --------------------------------- | ------------------------- |
| GET    | `/v1/channels/:id/messages`           | List messages (cursor pagination) | Bearer token + membership |
| GET    | `/v1/messages/:id`                    | Get message details               | Bearer token + membership |
| POST   | `/v1/channels/:id/messages`           | Send message                      | Bearer token + membership |
| PATCH  | `/v1/messages/:id`                    | Edit message                      | Bearer token + author     |
| DELETE | `/v1/messages/:id`                    | Delete message                    | Bearer token + author     |
| GET    | `/v1/channels/:id/messages/search?q=` | Search messages                   | Bearer token + membership |

### Reactions

| Method | Path                         | Description               | Auth                      |
| ------ | ---------------------------- | ------------------------- | ------------------------- |
| GET    | `/v1/messages/:id/reactions` | List reactions on message | Bearer token + membership |
| POST   | `/v1/messages/:id/reactions` | Add reaction (emoji)      | Bearer token              |
| DELETE | `/v1/messages/:id/reactions` | Remove reaction           | Bearer token              |

### Notifications

| Method | Path                         | Description             | Auth         |
| ------ | ---------------------------- | ----------------------- | ------------ |
| GET    | `/v1/notifications`          | List user notifications | Bearer token |
| GET    | `/v1/notifications/unread`   | Get unread count        | Bearer token |
| PATCH  | `/v1/notifications/:id/read` | Mark as read            | Bearer token |
| POST   | `/v1/notifications/read-all` | Mark all as read        | Bearer token |

### Preferences

| Method | Path                   | Description             | Auth         |
| ------ | ---------------------- | ----------------------- | ------------ |
| GET    | `/v1/auth/preferences` | Get user preferences    | Bearer token |
| PUT    | `/v1/auth/preferences` | Upsert user preferences | Bearer token |

### Webhooks

| Method | Path                          | Description             | Auth                      |
| ------ | ----------------------------- | ----------------------- | ------------------------- |
| GET    | `/v1/workspaces/:id/webhooks` | List webhooks           | Bearer token + membership |
| POST   | `/v1/workspaces/:id/webhooks` | Create webhook endpoint | Bearer token + admin      |
| GET    | `/v1/webhooks/:id`            | Get webhook details     | Bearer token + membership |
| PATCH  | `/v1/webhooks/:id`            | Update webhook          | Bearer token + admin      |
| DELETE | `/v1/webhooks/:id`            | Delete webhook          | Bearer token + admin      |
| POST   | `/v1/webhooks/:id/test`       | Test webhook delivery   | Bearer token + admin      |

### Feature Flags

| Method | Path                     | Description         | Auth                 |
| ------ | ------------------------ | ------------------- | -------------------- |
| GET    | `/v1/feature-flags`      | List feature flags  | Bearer token + admin |
| PUT    | `/v1/feature-flags/:key` | Update feature flag | Bearer token + admin |

### Health

| Method | Path       | Description                 | Auth     |
| ------ | ---------- | --------------------------- | -------- |
| GET    | `/health`  | Readiness check (DB, Redis) | None     |
| GET    | `/`        | API root status             | None     |
| GET    | `/metrics` | Prometheus metrics          | Internal |

---

## WebSocket Events (Socket.io)

Connection: `wss://[host]/socket.io` with `Authorization: Bearer <token>` header in handshake.

### Client → Server Events

| Event           | Payload             | Description          |
| --------------- | ------------------- | -------------------- |
| `channel:join`  | `channelId: string` | Join a channel room  |
| `channel:leave` | `channelId: string` | Leave a channel room |
| `typing:start`  | `channelId: string` | User started typing  |
| `typing:stop`   | `channelId: string` | User stopped typing  |

### Server → Client Events

| Event              | Payload                                                       | Description                             |
| ------------------ | ------------------------------------------------------------- | --------------------------------------- |
| `message:received` | `{ id, channel_id, user_id, content, parent_id, created_at }` | New message in channel                  |
| `message:edited`   | `{ id, channel_id, content, edited_at }`                      | Message edited                          |
| `message:deleted`  | `{ id, channel_id }`                                          | Message deleted                         |
| `typing:start`     | `{ userId, channelId }`                                       | User started typing (broadcast to room) |
| `typing:stop`      | `{ userId, channelId }`                                       | User stopped typing (broadcast to room) |
| `user:presence`    | `{ userId, status: 'online' \| 'offline' }`                   | User presence change                    |

### Connection Lifecycle

1. Client opens WebSocket with Bearer token
2. Server validates token via Supabase Auth
3. On success, server sets `socket.userId` and allows events
4. Client joins relevant channel rooms via `channel:join`
5. Server broadcasts presence events on connect/disconnect
6. On disconnect (clean or timeout), presence updates are broadcast

---

## Authentication

All API requests (except `/health` and `/`) require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <supabase-jwt-token>
```

The token is obtained via Supabase magic link authentication (POST `/v1/auth/magic-link` → email → POST `/v1/auth/callback`).

### Authorization Model

| Role     | Scope                                                     |
| -------- | --------------------------------------------------------- |
| `owner`  | Full workspace access, manage members, delete workspace   |
| `admin`  | Manage channels, webhooks, feature flags, view audit logs |
| `member` | Send messages, create channels, view workspace content    |

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

### HTTP Status Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 201  | Created                              |
| 400  | Bad request (validation error)       |
| 401  | Unauthorized (missing/invalid token) |
| 403  | Forbidden (insufficient permissions) |
| 404  | Resource not found                   |
| 429  | Rate limited                         |
| 500  | Internal server error                |
