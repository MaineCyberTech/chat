# Password Policy

> **Note**: This application currently uses magic-link authentication (passwordless).
> This document defines the recommended password policy for when password-based
> authentication is added in the future.

## Requirements

When implementing password auth, enforce the following:

| Requirement    | Value                   |
| -------------- | ----------------------- |
| Min length     | 8 characters            |
| Max length     | 128 characters          |
| Complexity     | At least 3 of 4:        |
|                | - Uppercase (A-Z)       |
|                | - Lowercase (a-z)       |
|                | - Digit (0-9)           |
|                | - Special character     |
| Max attempts   | 5 before temporary lock |
| Lockout period | 15 minutes              |
| Password reuse | No reuse of last 5      |
| Expiry         | 90 days (optional)      |

## Implementation Notes

- Hash passwords using bcrypt (cost factor >= 12).
- Validate on both client (UX) and server (security).
- Rate-limit login attempts per IP and per user.
- Use Supabase Auth's built-in password policy if available, or implement
  validation in a registration endpoint.
- Store password hashes only — never plaintext or encrypted.
- Provide a "forgot password" flow with time-limited reset tokens.
