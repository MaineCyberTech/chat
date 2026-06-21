# Decision Log

| Decision ID | Topic                       | Decision                                        | Reason                                          | Evidence                | Owner | Status   |
| ----------- | --------------------------- | ----------------------------------------------- | ----------------------------------------------- | ----------------------- | ----- | -------- |
| D-001       | API structure alignment     | **Keep current** — modules/ pattern             | Current is superior to reference's flat routes/ | Compare audit Phase 2-3 | Audit | Approved |
| D-002       | Real-time library alignment | **Keep current** — Socket.io                    | Far more capable than reference's raw ws        | Compare audit Phase 3   | Audit | Approved |
| D-003       | Caddy routing model         | **Keep current** — same-domain path-based       | Simpler than reference's subdomain split        | Compare audit Phase 3   | Audit | Approved |
| D-004       | Test framework alignment    | **Keep current** — Vitest                       | Faster, ESM-native vs reference's Jest          | Compare audit Phase 3   | Audit | Approved |
| D-005       | CI/CD consolidation         | **Keep current** — workflow_call pattern        | Less duplication than reference's 8 workflows   | Compare audit Phase 3   | Audit | Approved |
| D-006       | Supabase seed data          | **Adapt** from reference                        | Add seeds/ for reproducible local dev           | Compare audit Phase 1/6 | Audit | Proposed |
| D-007       | RLS policy files            | **Adapt** from reference                        | Extract policies from migrations                | Compare audit Phase 1/6 | Audit | Proposed |
| D-008       | Shared config package       | **Adapt** from reference                        | Centralize ESLint/TSConfig                      | Compare audit Phase 1/6 | Audit | Proposed |
| D-009       | E2E test expansion          | **Adapt** — add workspace/channel/message tests | Regression protection                           | Compare audit Phase 6-7 | Audit | Proposed |
| D-010       | lucide-react icons          | **Adapt** — replace Unicode characters          | a11y + visual consistency                       | UI/UX audit Phase 3/5   | Audit | Proposed |
| D-011       | Dialog focus trap           | **Adapt** (new) — add focus trap hook           | Keyboard accessibility                          | UI/UX audit Phase 4/7   | Audit | Proposed |
| D-012       | Toast notifications         | **Adapt** (new) — add sonner or react-hot-toast | User feedback for create/send actions           | UI/UX audit Phase 5/7   | Audit | Proposed |
| D-013       | Error boundaries            | **Adapt** (new) — add ErrorBoundary wrapper     | Prevent full-page crashes                       | UI/UX audit Phase 5/7   | Audit | Proposed |
| D-014       | Worker app                  | **Defer** — needs droplet upgrade first         | Premature on 512MB droplet                      | Compare audit Phase 3/5 | Audit | Deferred |
| D-015       | Cyber aesthetic             | **Skip** — not appropriate for chat             | Current design language is appropriate          | UI/UX audit Phase 5     | Audit | Rejected |
| D-016       | Server components           | **Skip** — would break real-time + auth         | Too risky for current architecture              | UI/UX audit Phase 5     | Audit | Rejected |
