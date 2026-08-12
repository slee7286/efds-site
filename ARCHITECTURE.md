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

Migration `0004_auth_profiles_and_rls` now adds the application profile and external exception tables to the backend owner. The website consumes them through Supabase/RLS and does not create a second migration system.

Suggested backend-owned additions:

- `profiles`: `auth_user_id`, normalized email, name, access role, member type, officer reference, active state, timestamps and metadata.
- `auth_access_exceptions`: normalized unique email, access role, optional member type, reason, active state, expiry, creator, timestamps and metadata.

RLS should use active profile/role checks. An authenticated Supabase session alone is not private-site authorization.

## Data access matrix

`—` means no direct browser access. `Own` means a user may read only their own profile. `Read` is role-gated by RLS. `Manage` is admin-only. `Backend` means the direct PostgreSQL ingestion/maintenance connection remains the writer and bypasses API roles as an intentionally trusted backend connection.

| Dataset | Public | Member | Committee | Admin | Backend |
| --- | --- | --- | --- | --- | --- |
| `profiles` | — | Own | Own | Read/manage | Read/write |
| `auth_access_exceptions` | narrow eligibility RPC only | — | — | Manage | Read/write |
| `officers` | — | — | Read | Read | Read/write |
| `knowledge_articles` | — | — | Read | Read | Read/write |
| `knowledge_article_changes` | — | — | — | Read | Read/write |
| `knowledge_requirements`, `knowledge_timing_rules` | — | — | Read | Read | Read/write |
| `knowledge_processes`, `knowledge_process_steps` | — | — | Read | Read | Read/write |
| `knowledge_resources`, `knowledge_contacts` | — | — | Read | Read | Read/write |
| topics, roles and article mappings | — | — | Read | Read | Read/write |
| extraction and ingestion runs | — | — | — | Read | Read/write |
| documents, meetings, decisions, actions | — | — | Read | Read | Read/write |
| Slack channels/messages | — | — | — | Read | Read/write |

The public site currently uses placeholder/public application data for events and committee content; no raw internal table is public. A future publication model or view must be added before internal records are made public.

## Route map

```text
/                         public home
/about /privacy /terms   public information and policy
/contact /security      public contact and security information
/events /careers        public content
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

## Bootstrap and production flow

After applying the migration locally or through the controlled backend release process:

```powershell
alembic upgrade head
python scripts/grant_access.py person@imperial.ac.uk --role admin
```

The grant command requires an existing profile, so the person must first complete Microsoft login successfully. It is idempotent and can optionally link an existing officer with `--officer-id UUID`.

## Known V1 gaps

The migration has not been executed against the live Supabase database. The demo provider is local and does not implement RAG. Jobs are UI/types only. Public publication, realtime, Slack, Microsoft Graph, meeting ingestion, job scraping and sponsorship operations remain future modules.
