# EFDS website

The EFDS public website and application layer over the existing EFDS knowledge-base, not a second owner of the PostgreSQL schema. The website is the browser-facing interface for the read-only EFDS agent.

The September 2026 redesign, screenshot gallery, local preview instructions and verification boundaries are documented in [docs/redesign.md](docs/redesign.md).

## What is here

- Next.js App Router + TypeScript + Tailwind CSS foundation
- Public editorial website: home, about, privacy, terms, contact, security, events, careers, research, competitions, resources, partners and public chat
- Private member workspace: dashboard, ICU knowledge reads, requirements, careers, job tracker, events, profile and private chat shell
- Separate admin shell for knowledge review, committee, actions and integrations
- Admin-only Meetily meeting archive with timestamped transcripts and explicitly labelled AI-generated summaries
- Microsoft-first Supabase Auth callback architecture
- Imperial domain policy for `@ic.ac.uk` and `@imperial.ac.uk`
- First-class external-user exception contract backed by `auth_access_exceptions`
- Server-side role helpers and agent scopes
- Typed knowledge data-access modules consuming the backend-owned `knowledge_articles` and `knowledge_requirements` tables
- Unit tests for domain access, exceptions, roles and agent scopes
- Vercel-ready environment configuration

The local app has a deliberately obvious preview mode when Supabase variables are absent. It uses demo data for the UI only and is denied in production. No demo mode should be enabled in a deployed environment.

## Related repositories and backend assessment

The owner repository is:

`C:\Users\slee7\OneDrive - Imperial College London\Imperial EFDS Society 26-27\12_Technology\efds-knowledge-base`

The ICU crawler remains the owner of Freshdesk discovery and its local archive. The knowledge-base owns SQLAlchemy models and Alembic migrations. Relevant existing tables are:

- `officers`, `documents`, `meetings`, `decisions`, `action_items`
- `knowledge_articles`, `knowledge_article_changes`, `ingestion_runs`
- `knowledge_topics`, `knowledge_roles` and article mappings
- `knowledge_extraction_runs`
- `knowledge_requirements`, `knowledge_timing_rules`, `knowledge_processes`, `knowledge_process_steps`, `knowledge_resources`, `knowledge_contacts`

ICU articles are current source rows. Derived records retain source article IDs, content hashes, evidence, extraction metadata, review state and stale state. The website reads this model; it does not copy the corpus into a new schema.

The backend now owns the `profiles` and `auth_access_exceptions` models plus migration `0004_auth_profiles_and_rls`. Apply it locally or through the backend deployment process only after reviewing the SQL; this website still does not contain a migration system.

## Run locally

Requires Node.js 20.9 or newer.

```powershell
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev
```

Visit `http://localhost:4587`. Without Supabase variables, public pages and preview shells render with safe demo data. If `.env.local` already exists, set `NEXT_PUBLIC_SITE_URL=http://localhost:4587` there as well so local authentication callbacks use the correct port. Run checks with:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

## Environment variables

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:4587
EFDS_AGENT_URL=http://localhost:8000
EFDS_AGENT_SHARED_SECRET=
ALLOWED_AUTH_EMAIL_DOMAINS=ic.ac.uk,imperial.ac.uk
SUPABASE_SERVICE_ROLE_KEY=
```

The service-role key is intentionally unused by ordinary page reads. If a future server-only operation needs it, isolate it in a server-only module and document the specific bypass reason. Never prefix it with `NEXT_PUBLIC_`.

## Authentication and authorization

The primary login action is `Continue with Microsoft`, implemented with Supabase Azure OAuth and minimal identity scopes: `openid profile email`. The callback exchanges the code server-side, requires a usable verified email, normalizes it, checks the exact Imperial domain policy or current external exception, provisions/updates the profile without downgrading an existing role, updates `last_login_at`, then redirects to `/dashboard` or `/access-denied`.

Approved external users use a secondary Supabase email-authentication flow. The login page supports password sign-in, password setup/recovery, and the existing magic-link fallback. First-time setup uses the allowlisted magic-link flow to create the Supabase Auth identity only after email ownership is proven; it does not use public `signUp`. Before sending any setup, reset, or magic-link email, the website calls the narrow `is_external_email_eligible` RPC; the response is generic and never returns exception rows. Password sessions are then checked server-side against the authenticated email, active exception, expiry, active profile, and role. An external exception with `admin` does not self-provision an admin profile; bootstrap it through the backend CLI.

Supabase Auth owns password hashing and recovery state. EFDS never stores a password or reset token in PostgreSQL. Microsoft remains the normal path for `@ic.ac.uk` and `@imperial.ac.uk`; an Imperial-domain email using password or magic-link authentication must have an explicit active exception. Revoking or expiring that exception denies EFDS access even if the Supabase password remains valid.

Identity, membership, committee position and authorization are represented as separate concepts. The browser never supplies a trusted role. Private layouts and future mutations resolve access server-side, and database RLS must enforce the same policy for direct Supabase reads.

## Public, private and admin boundary

- Public: published site pages, public events, published resources and `/chat` with `public` scope only.
- Member: authorised Imperial users and approved external users with member access. ICU reads should be narrowed further with explicit policy before exposing all source content.
- Committee: officer or explicitly authorised committee access to operational views.
- Admin: trusted operators only. Admin pages are separately wrapped and never unlocked by client state.

Public publication should be an explicit transition from internal data. The application should eventually use safe public views or published-content models instead of treating internal rows as public.

## ICU knowledge integration

`lib/db/knowledge.ts` is the domain query boundary. It contains `listKnowledgeArticles`, `getKnowledgeArticle`, `getKnowledgeSummary` and `listRequirements`. The module selects only fields needed by the page and maps snake_case backend rows into typed application objects. The Slack archive follows the same server-only pattern in `lib/db/slack.ts` and never calls Slack directly.

The private `/admin/documents` archive follows the same boundary in
`lib/db/documents.ts`. It reads only backend-owned OneDrive source/version
records through authenticated admin queries; it never reads the local
filesystem or exposes absolute source paths.

The detail page preserves provenance language and does not expose raw source paths. Approve/reject mutations are intentionally not implemented until the backend review semantics and committee authorization are connected.

## Agent architecture

`AgentScope` is one of `public`, `member`, `committee` or `admin`. `/api/chat` validates input, resolves the current Supabase user server-side, checks the requested scope against the stored profile, forwards the short-lived access token to `efds-agent`, and proxies SSE. `EFDS_AGENT_SHARED_SECRET` is optional server-to-server authenticity protection; it never grants data access. The agent and database RLS remain authoritative.

When `EFDS_AGENT_URL` is unset, the website returns a configuration error rather than answering from a local model or mock. The browser never receives OpenAI credentials, database credentials, access tokens, or refresh tokens.

The website proxies the agent's SSE stream and renders validated citations. All model logic remains server-side in `efds-agent`.

## Careers and job tracker

`/careers` is public and structured around finance, quant, economics/policy, data/AI, consulting and software. `/dashboard/careers` is the private extension point. `/dashboard/jobs` provides a typed empty-to-demo skeleton around company, role, career area, location, deadline, status and next action. No production job table or scraper is added here; if persistence is needed, add it through the backend owner and Alembic.

## Supabase and Microsoft setup

1. Create or select the Supabase project that owns the EFDS database.
2. Set the project URL and publishable/anon key in Vercel and local `.env.local`.
3. Enable Azure/Microsoft as an Auth provider in Supabase.
4. Configure the Microsoft application with the required redirect URL shown by Supabase, plus the production callback URL `https://imperial-efds.com/auth/callback`.
5. Request only identity scopes; do not add Microsoft Graph permissions for mail, calendar, OneDrive or SharePoint.
6. Apply the reviewed backend migration with `alembic upgrade head`, enable RLS, and provision the first admin out-of-band.
7. Configure Supabase Auth Site URL as `https://imperial-efds.com` and allow `/auth/callback` and `/auth/recovery` for production plus the localhost equivalents.
8. Enable Supabase email/password authentication and recovery email delivery; configure the password policy and rate limits in Supabase Dashboard.
9. Test: Imperial Microsoft account allowed; approved external password/magic-link account allowed; non-Imperial and Imperial email-auth accounts denied without an active exception; expired/inactive exceptions denied.

Microsoft authenticates identity. EFDS decides authorization regardless of the Azure tenant configuration.

External setup and recovery emails use an explicit canonical production
redirect. The browser never supplies the production origin. Setup and reset
use `/auth/recovery?flow=setup|reset`; ordinary email-link login uses
`/auth/callback`. Email requests have a 60-second per-email/per-intent browser
cooldown persisted for the session, while Supabase Auth remains responsible
for server-side rate limiting. Rate-limited responses are shown as a safe
wait message rather than raw Supabase errors.

## RLS and deployment

Migration `0004_auth_profiles_and_rls` enables RLS on the application and internal tables, adds role-hierarchy helper functions, restricts profiles to self/admin access, makes exceptions admin-only, and grants committee/admin reads only to internal knowledge and operational tables. A request must have an active profile and the required role; authenticated-but-unauthorised users must not receive private rows. Use public views or published rows for public reads. Do not make a service-role client part of rendering.

For Vercel:

1. Import the repository as a Next.js project.
2. Add the environment variables above to Preview and Production.
3. Deploy after the Supabase callback and Site URL are configured.
4. Add the purchased custom domain in Vercel.
5. At the domain registrar, add the DNS records Vercel displays; Vercel will issue HTTPS after verification.
6. Update `NEXT_PUBLIC_SITE_URL` and Microsoft/Supabase redirect URLs to the final HTTPS domain.

No DNS or deployment action is automated by this repository.

## Roadmap

1. Apply and verify the reviewed `0004_auth_profiles_and_rls` migration.
2. Run `python scripts/grant_access.py EMAIL --role admin` for the first already-provisioned profile.
3. Manage approved external identities with `python scripts/set_access_exception.py EMAIL --role viewer --reason "..." --expires-at 2027-09-01T00:00:00Z`.
4. Generate Supabase database types from the deployed schema.
5. Connect public publication views and the real officer/event reads.
6. Add committee review actions with auditability.
7. Add private retrieval with document-level scope enforcement.

## Knowledge Operations V1

The website is the human-operated review surface for the source-first
knowledge lifecycle:

```text
ICU source → crawler → knowledge_articles → extraction → proposed candidates
→ admin review → approved internal knowledge → explicit publication
```

`/admin/knowledge` provides live database counts and source/extraction health.
The review queue, stale queue, source article pages, requirements/timing/
process/resource registers, role views, evidence panels and review history are
backed by centralized server-side queries in `lib/db/knowledge-ops.ts`.
Review mutations are server actions in `lib/actions/knowledge-review.ts` and
require an active admin profile. They validate input, call the backend's
transactional `review_knowledge_transaction` RPC, preserve the original
extraction when editing, and revalidate affected pages. The RPC owns the
transaction, authorization re-check, optimistic `review_version` conflict
check, publication guard, and audit insert.

The backend migration owned by `efds-knowledge-base` supplies the
`knowledge_review_events` audit table and the `internal`, `committee`,
`member`, and `public` visibility boundary. Member reads include only approved,
current, explicitly published records. Public resources use the backend's
restricted publication view. ICU source Markdown and internal derived records
are not public by default.

Apply the backend migration locally from the schema-owner repository after
reviewing its offline SQL; this website does not create or run migrations.

Slack source browsing is now included through the admin-only `/admin/slack`
archive. Slack ingestion, credentials, allowlisting and migrations remain
backend-owned; Slack extraction, meeting ingestion, vector search, and full
RAG remain out of scope for this milestone.

Rich editing is limited to EFDS interpretation fields: requirement
classification and taxonomy, structured timing semantics, process metadata,
ordered steps, and links to existing resources. ICU article text, source URL,
source hash, evidence, extraction metadata, and crawler data are read-only.
Stale content is excluded from member/public queries, and publication remains
an explicit approved/current decision.

Unified search is available at `/dashboard/search` for member-visible knowledge
and `/admin/search` for administrators. Both call the backend's permission-
filtered PostgreSQL retrieval RPC; the website does not query Slack or OneDrive
APIs and never receives their credentials. See [docs/RETRIEVAL.md](docs/RETRIEVAL.md).

The admin `/admin/operations` console is the reviewed operational-truth layer.
It supports proposed decisions, actions, commitments, questions and status
updates; source-scoped evidence attachment; atomic review/publication actions;
and audit history. Raw source systems remain authoritative evidence and are
never edited from this UI. See [docs/OPERATIONAL_TRUTH.md](docs/OPERATIONAL_TRUTH.md).

Semantic/hybrid embedding generation remains backend-only. The website does
not receive provider credentials or send raw Slack, OneDrive, or Meetily text
to an embedding API; it continues to use the permission-filtered Supabase
retrieval boundary until a backend retrieval HTTP service is deployed. See
[docs/EMBEDDINGS.md](docs/EMBEDDINGS.md).
