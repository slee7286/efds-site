# EFDS website architecture

## Backend assessment

The existing `efds-knowledge-base` repository is a Python/SQLAlchemy/Alembic owner for PostgreSQL. It ingests generic documents and synchronises ICU Freshdesk articles through `icu-crawler`; it deliberately does not own a website or authentication layer.

The ICU model is source-led:

```text
ICU Freshdesk → icu-crawler/data → knowledge-base sync → knowledge_articles
                                                        ├─ changes / hashes
                                                        ├─ topics / roles
                                                        ├─ requirements
                                                        ├─ timing rules
                                                        ├─ processes / steps
                                                        ├─ resources
                                                        └─ contacts
```

The corpus assessment records 78 current articles and a deterministic extraction layer with source-linked evidence and stale/version state. This is enough for V1 read views, but not a license to expose the full raw corpus publicly.

## Website boundary

```text
                              INTERNET
                                  │
                ┌─────────────────┴─────────────────┐
                │                                   │
          PUBLIC EFDS SITE                    AUTHENTICATION
       published pages + public chat          Microsoft / OTP
                │                                   │
                └───────────────┬───────────────────┘
                                │
                       Next.js App Router
                                │
                    server authorization boundary
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
           MEMBER WORKSPACE             COMMITTEE / ADMIN
                 │                             │
                 └──────────────┬──────────────┘
                                │
                       Supabase Auth + RLS
                                │
                         EFDS PostgreSQL
                                │
                   knowledge-base owned schema
                                │
                ICU / EFDS data / future sources
```

`lib/db/*` is the application data boundary. Components do not scatter Supabase queries. `lib/auth/*` is the authorization boundary. A future integration service should sit between route handlers/server actions and external APIs.

## Identity and access

```text
Supabase/Microsoft identity
          │ verified email
          ▼
normalize → domain policy → exception policy → application profile
                                                │
                       identity ─ membership ─ committee position ─ authorization
                                                │
                       viewer < member < committee < admin
```

The current backend has no application profile or access-exception tables. The website includes the typed contract and safe query placeholders but does not create a second migration system. Add these models to the EFDS knowledge-base SQLAlchemy/Alembic owner before production auth.

Suggested backend-owned additions:

- `profiles`: `auth_user_id`, normalized email, name, access role, member type, officer reference, active state, timestamps and metadata.
- `auth_access_exceptions`: normalized unique email, access role, reason, active state, expiry, creator, timestamps and metadata.

RLS should use active profile/role checks. An authenticated Supabase session alone is not private-site authorization.

## Route map

```text
/                         public home
/about /events /careers   public content
/research /resources     public content
/chat                     public agent, public scope only
/login                    Microsoft-first login + approved OTP entry
/auth/callback            server callback and access decision
/access-denied            safe denial state

/dashboard                member shell
/dashboard/knowledge      ICU current article read views
/dashboard/knowledge/...  source-linked article detail
/dashboard/knowledge/requirements  typed derived reads
/dashboard/careers        private career extension point
/dashboard/jobs           job tracker skeleton
/dashboard/chat           private agent shell
/dashboard/events         member event state
/dashboard/profile        identity/access explanation

/admin                    separately protected admin shell
/admin/knowledge          proposed knowledge review queue
/admin/committee          committee extension point
/admin/actions            action item extension point
/admin/integrations       integration health extension point
```

## Agent scopes

```text
public    → explicitly published public content
member    → authorised member data
committee → authorised committee data
admin     → privileged operational data
```

Scope is resolved before retrieval and before model-provider selection. The provider cannot elevate scope. The public assistant must never call private ICU, committee, meeting, finance or sponsor queries.

## Security assumptions

- Verified Supabase identity is checked server-side.
- Imperial domains are case-insensitive and normalized.
- External magic-link authentication is allowlist-based, not open signup.
- Roles from URL, local storage, client state or request body are not trusted.
- Service-role access is not needed for normal page reads.
- Public visibility is an explicit publication decision.
- Raw source paths and private source documents are not sent to public pages.
- Mutations require Zod validation, authorization and later audit semantics.

## Known V1 gaps

The production backend additions for `profiles` and `auth_access_exceptions` are not created here because the knowledge-base repository remains the schema owner. The demo provider is local and does not implement RAG. Jobs are UI/types only. Public publication, realtime, Slack, Microsoft Graph, meeting ingestion, job scraping and sponsorship operations remain future modules.
