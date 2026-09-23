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
Supabase Auth (email or optional Google)
          │ verified email
          ▼
normalize → domain policy → exception policy → application profile
                                                │
                       identity ─ membership ─ committee position ─ authorization
                                                │
                       viewer < member < committee < admin
```

Migration `0004_auth_profiles_and_rls` adds the application profile and external exception tables to the backend owner. Migration `0021_profile_photos` adds the optional avatar path and private Storage bucket. The website consumes both through Supabase/RLS and does not create a second migration system.

Backend-owned records:

- `profiles`: `auth_user_id`, normalized email, editable display name, private avatar path, access role, member type, officer reference, active state, timestamps and metadata.
- `auth_access_exceptions`: normalized unique email, access role, optional member type, reason, active state, expiry, creator, timestamps and metadata.

RLS should use active profile/role checks. An authenticated Supabase session alone is not private-site authorization.
Profile photos are cropped in the browser to a 512-pixel WebP square and stored under the member's Auth user ID in `efds-profile-photos`. Storage RLS restricts reads, uploads and deletes to the owner, while a database constraint prevents a profile from referencing another owner's path. `/api/profile/photo` serves only the current account's image after the server-side EFDS access check.

## Data access matrix

`—` means no direct browser access. `Own` means a user may read only their own profile. `Read` is role-gated by RLS. `Manage` is admin-only. `Backend` means the direct PostgreSQL ingestion/maintenance connection remains the writer and bypasses API roles as an intentionally trusted backend connection.

| Dataset | Public | Member | Committee | Admin | Backend |
| --- | --- | --- | --- | --- | --- |
| `profiles` | — | Own | Own | Read/manage | Read/write |
| `efds-profile-photos` | — | Own | Own | Own | Administrative access |
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
/login                    Microsoft-first login + approved email/password or OTP entry
/auth/callback            server callback and access decision
/auth/recovery            recovery-code exchange and exception check
/auth/set-password        authenticated password setup/recovery
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
- External email/password and magic-link authentication are exception-allowlist-based, not open signup.
- Microsoft is the domain-based authentication path; email-authenticated Imperial identities still require an explicit active exception.
- Password hashes and recovery tokens belong only to Supabase Auth.
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

## External exception password authentication

The external authentication boundary is:

```text
auth_access_exceptions
        ↓ active + unexpired eligibility RPC
Supabase recovery email / password or magic link
        ↓ authenticated Supabase identity
/api/auth/external/authorize
        ↓
EFDS exception + active profile + role authorization
```

There is no public `signUp` flow. First-time password setup and forgotten
password use Supabase's `resetPasswordForEmail`, then the authenticated
recovery code is exchanged by `/auth/recovery`. `/auth/set-password` calls
Supabase `updateUser({ password })`; it never writes a password to EFDS
PostgreSQL. Password login uses `signInWithPassword` in the browser and then
the server authorization endpoint. Unauthorized or revoked sessions are
signed out by the endpoint.

Microsoft identities from the approved Imperial domains remain authorized by
the domain policy. Email-authenticated identities, including an Imperial
address using the temporary alternate path, require a matching active,
unexpired exception. Existing profile roles are never downgraded during
automatic provisioning; higher exception roles may promote a lower existing
role. Explicit profile deactivation and exception revocation still deny
private access on every server-side authorization check.

## Knowledge Operations V1

The website treats ICU source rows as authoritative and derived EFDS
knowledge as reviewable interpretations. The admin route family
`/admin/knowledge` is an operations console over the backend-owned tables:
overview counts, unified review queue/detail, stale source-change queue,
article/source inspection, requirements, timing, processes, resources,
contacts and role-specific views.

The query boundary is `lib/db/knowledge-ops.ts`; review mutations are isolated
in `lib/actions/knowledge-review.ts`. Both perform server-side authentication
and role checks. The action calls the backend-owned
`review_knowledge_transaction` RPC, which performs the authorization
re-check, row lock, `review_version` conflict check, allowlisted interpretation
update, and append-only event insert in one PostgreSQL transaction. Rejected
and stale rows are never deleted.

Visibility is separate from review: `internal` is the default, and an admin
must explicitly select `committee`, `member`, or `public`. The member view is
limited to approved/current `member` or `public` rows. `/resources` reads only
the backend's public publication view, so unauthenticated users cannot read
internal ICU content. No service-role key is used by the website.

## Slack Institutional Memory V1

The website is a read-only admin browser for the backend-owned Slack source
archive. It does not call Slack Web API and does not read `SLACK_BOT_TOKEN`.
The admin-only route family is `/admin/slack`, with dashboard, channel list,
channel conversation, message provenance/change history, and PostgreSQL-backed
text search. Supabase queries remain centralized in `lib/db/slack.ts` and use
the normal authenticated client plus the existing admin role/RLS boundary; no
service-role client is used.

The backend explicitly allowlists channels before archiving. The website shows
the discovered channel metadata and whether each channel is enabled, but
channel enablement and sync remain backend CLI operations. Public and member
routes have no Slack archive surface.

## OneDrive Filesystem Institutional Memory V1

The admin-only `/admin/documents` route family browses the backend-owned local
OneDrive source archive. It provides live counts, area/status/extraction/
duplicate filters, relative-path search, current extracted text, immutable
version history, source change history, and exact duplicate links. Queries are
centralized in `lib/db/documents.ts` and use the authenticated Supabase client;
the website never reads the local filesystem and never receives an absolute
source root or filesystem credential.

The backend keeps `source_root + normalized_relative_path` as logical source
identity and `document_id + content_hash` as version identity. Missing,
unavailable, unsupported, and stale source states are displayed rather than
silently hidden. Public/member routes have no raw filesystem archive surface.

## Meetily Meeting Ingestion V1

The admin-only `/admin/meetings` route family browses backend-ingested Meetily
records. The website does not read the local Meetily SQLite database, access
audio, or call an AI provider. `lib/db/meetings.ts` is the server-only query
boundary and uses authenticated Supabase reads protected by backend RLS.

Meetings have stable logical IDs; transcript and summary artifacts are immutable
versions. The detail page renders timestamped transcript segments and keeps the
Meetily summary visibly separate as “AI-generated Meetily summary — not
committee-approved minutes”. Meeting retrieval links return to the admin
meeting detail route. Public/member scopes receive no raw meeting records.

## Known V1 gaps

Migrations `0005_knowledge_review_publication` and
`0006_transactional_knowledge_review` require controlled backend application;
the website does not create or run migrations. The demo provider remains local,
and no full RAG,
realtime, Slack extraction, Microsoft Graph, filesystem cloud sync, job scraping or
sponsorship operations are included.
The RPC/editing boundary is deliberately source-safe: requirement taxonomy,
timing semantics, process metadata/steps, and existing process-resource links
can be edited, while ICU article text, evidence, source hashes, extraction
metadata, and crawler data remain immutable. A stale browser tab is sent to a
reload/cancel conflict state rather than silently overwriting a newer review.

## Operational truth V1

`/admin/operations` is the human review console for decisions, action items,
commitments, open questions and status updates. Records are created as
proposed interpretations and can link to permission-scoped retrieval units as
evidence. The backend `mutate_operational_record` RPC performs authorization,
optimistic concurrency, the mutation and its audit event atomically. Source
messages, transcripts, documents and ICU records are never edited through the
operations UI. Only approved/current records are eligible for explicit
committee/member/public publication.
