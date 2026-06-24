# Data Processing Addendum (DPA)

## Overview

This Data Processing Addendum forms part of the Terms of Service between the Controller (Customer) and Processor (Chat Platform).

## Parties

- **Controller**: The organization using Chat Platform
- **Processor**: Chat Platform (operator of the chat platform)

## Scope of Processing

- **Categories of Data Subjects**: Employees, contractors, customers of Controller
- **Categories of Personal Data**:
  - Identity data (name, email, avatar)
  - Communication data (messages, files, reactions)
  - Usage data (login times, IP addresses, device info)
  - Metadata (workspace membership, roles, preferences)
- **Special Categories**: None processed

## Purpose of Processing

- Provide real-time messaging platform
- User authentication and authorization
- Message delivery and storage
- Search and analytics
- Notifications and push messages

## Data Subject Rights

The Processor shall assist the Controller in fulfilling data subject requests:

- **Access**: Export all user data (via `/auth/export` endpoint)
- **Rectification**: Profile updates via `/auth/profile` endpoint
- **Erasure**: Account deletion via `/auth/account` DELETE endpoint
- **Restriction**: Not applicable (no automated decision-making)
- **Portability**: JSON export via `/auth/export`
- **Objection**: Not applicable

## Security Measures

- Encryption at rest (Supabase PostgreSQL)
- Encryption in transit (TLS 1.3)
- Row-level security (RLS) policies
- Audit logging of all mutations
- Regular penetration testing

## Sub-processors

| Sub-processor | Purpose                   | Location | Safeguards |
| ------------- | ------------------------- | -------- | ---------- |
| Supabase      | Database, Auth, Storage   | US/EU    | DPA, SCCs  |
| DigitalOcean  | Compute, Networking       | US/EU    | DPA, SCCs  |
| Cloudflare    | DNS, WAF, CDN             | Global   | DPA, SCCs  |
| GitHub        | CI/CD, Container Registry | US       | DPA, SCCs  |

## International Transfers

- Standard Contractual Clauses (SCCs) in place
- Adequacy decisions where applicable
- Supplementary measures for US transfers

## Data Retention

- Messages: 7 years (configurable)
- Audit logs: 90 days
- Push subscriptions: Until user deletion
- Backups: 30 days

## Breach Notification

- Processor notifies Controller within 72 hours
- Notification includes nature, categories, affected count, consequences, measures taken

## Audit Rights

Controller may audit Processor with 30 days notice, once per year.

## Termination

Upon termination, Processor will:

1. Delete all personal data within 30 days
2. Provide certification of deletion
3. Retain only data required by law

## Contact

Data Protection Officer: dpo@chat-platform.example
