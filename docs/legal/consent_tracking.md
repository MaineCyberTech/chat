# Consent Tracking

## Overview

Consent tracking ensures we have valid legal basis for processing personal data and can demonstrate compliance.

## Consent Types

### 1. Analytics Consent

- **Purpose**: Product analytics, usage metrics
- **Legal Basis**: Consent (GDPR Art. 6(1)(a))
- **Granularity**: Per-workspace, per-user
- **Storage**: `user_preferences.notification_preferences.analytics`

### 2. Marketing Consent

- **Purpose**: Product updates, feature announcements
- **Legal Basis**: Consent (GDPR Art. 6(1)(a))
- **Granularity**: Per-user
- **Storage**: `user_preferences.notification_preferences.marketing`

### 3. Cookie Consent

- **Purpose**: Analytics cookies, session cookies
- **Legal Basis**: Consent (ePrivacy Directive)
- **Granularity**: Per-browser, per-workspace
- **Storage**: `cookie_consent` cookie + `user_preferences.cookie_consent`

## Consent Collection Flow

### First Visit

1. Show cookie banner with granular options
2. Default: Essential only (strictly necessary)
3. User can accept all or customize
4. Store consent in cookie + user preferences

### Settings Page

- `/settings/privacy` - Manage all consents
- Real-time updates via API
- Audit trail of consent changes

## API Endpoints

### Get Consent Tracking

```
GET /v1/consent
Returns current consent status for all categories
```

Record Consent

```
POST /v1/consent
{
  "analytics": true,
  "marketing": false,
  "cookies": {
    "analytics": true,
    "functional": true,
    "advertising": false
  }
}
```

Withdraw Consent

```
DELETE /v1/consent/analytics
```

## Data Model

```sql
CREATE TABLE consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  workspace_id UUID REFERENCES workspaces(id),
  consent_type TEXT NOT NULL, -- 'analytics', 'marketing', 'cookies'
  category TEXT NOT NULL, -- 'analytics', 'marketing', 'functional', 'advertising'
  granted BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Retention

- Consent logs: 3 years after withdrawal
- Current consent state: Until withdrawn

## Audit Trail

All consent changes logged with:

- Timestamp
- User ID
- Previous state
- New state
- IP address
- User agent

## Withdrawal Process

1. User clicks "Withdraw" in settings
2. API records withdrawal with timestamp
3. Immediate effect: stop processing
4. Anonymize related analytics data
5. Confirm to user
