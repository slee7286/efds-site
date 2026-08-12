# EFDS website

The V1 web application for the Economics, Finance & Data Science Society at Imperial College London. It is the public website and application layer over the existing EFDS knowledge-base, not a second owner of the PostgreSQL schema.

## What is here

- Next.js App Router + TypeScript + Tailwind CSS foundation
- Public editorial website: home, about, privacy, terms, contact, security, events, careers, research, competitions, resources, partners and public chat
- Private member workspace: dashboard, ICU knowledge reads, requirements, careers, job tracker, events, profile and private chat shell
- Separate admin shell for knowledge review, committee, actions and integrations
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

Visit `http://localhost:3000`. Without Supabase variables, public pages and preview shells render with safe demo data. Run checks with:

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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ALLOWED_AUTH_EMAIL_DOMAINS=ic.ac.uk,imperial.ac.uk
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER=mock
AI_API_KEY=
```

The service-role key is intentionally unused by ordinary page reads. If a future server-only operation needs it, isolate it in a server-only module and document the specific bypass reason. Never prefix it with `NEXT_PUBLIC_`.

## Authentication and authorization

The primary login action is `Continue with Microsoft`, implemented with Supabase Azure OAuth and minimal identity scopes: `openid profile email`. The callback exchanges the code server-side, requires a usable verified email, normalizes it, checks the exact Imperial domain policy or current external exception, provisions/updates the profile without downgrading an existing role, updates `last_login_at`, then redirects to `/dashboard` or `/access-denied`.

External users use the secondary Supabase magic-link flow. Before sending an OTP, the website calls the narrow `is_external_email_eligible` RPC; the response is generic and never returns exception rows. The callback repeats the authorization decision. An external exception with `admin` does not self-provision an admin profile; bootstrap it through the backend CLI.

Identity, membership, committee position and authorization are represented as separate concepts. The browser never supplies a trusted role. Private layouts and future mutations resolve access server-side, and database RLS must enforce the same policy for direct Supabase reads.

## Public, private and admin boundary

- Public: published site pages, public events, published resources and `/chat` with `public` scope only.
- Member: authorised Imperial users and approved external users with member access. ICU reads should be narrowed further with explicit policy before exposing all source content.
- Committee: officer or explicitly authorised committee access to operational views.
- Admin: trusted operators only. Admin pages are separately wrapped and never unlocked by client state.

Public publication should be an explicit transition from internal data. The application should eventually use safe public views or published-content models instead of treating internal rows as public.

## ICU knowledge integration

`lib/db/knowledge.ts` is the domain query boundary. It contains `listKnowledgeArticles`, `getKnowledgeArticle`, `getKnowledgeSummary` and `listRequirements`. The module selects only fields needed by the page and maps snake_case backend rows into typed application objects. More domain modules should follow the same pattern for officers, events, meetings and actions.

The detail page preserves provenance language and does not expose raw source paths. Approve/reject mutations are intentionally not implemented until the backend review semantics and committee authorization are connected.

## Agent architecture

`AgentScope` is one of `public`, `member`, `committee` or `admin`. The scope is resolved above the model provider. `lib/agents/types.ts` defines the provider interface and `lib/agents/mock.ts` provides a local responder. `/api/chat` validates input with Zod and passes an explicit scope to the provider. A production retrieval layer must enforce the same scope before it calls any model, and the public agent must only query published/public data.

Streaming UI is supported as the provider boundary evolves; V1 returns a mock response to keep the app credential-free.

## Careers and job tracker

`/careers` is public and structured around finance, quant, economics/policy, data/AI, consulting and software. `/dashboard/careers` is the private extension point. `/dashboard/jobs` provides a typed empty-to-demo skeleton around company, role, career area, location, deadline, status and next action. No production job table or scraper is added here; if persistence is needed, add it through the backend owner and Alembic.

## Supabase and Microsoft setup

1. Create or select the Supabase project that owns the EFDS database.
2. Set the project URL and publishable/anon key in Vercel and local `.env.local`.
3. Enable Azure/Microsoft as an Auth provider in Supabase.
4. Configure the Microsoft application with the required redirect URL shown by Supabase, plus the production callback URL `${NEXT_PUBLIC_SITE_URL}/auth/callback`.
5. Request only identity scopes; do not add Microsoft Graph permissions for mail, calendar, OneDrive or SharePoint in V1.
6. Apply the reviewed backend migration with `alembic upgrade head`, enable RLS, and provision the first admin out-of-band.
7. Configure Supabase Auth Site URL and allowed redirect URLs for localhost and production.
8. Test: Imperial Microsoft account allowed; non-Imperial account denied unless an active exception exists; expired/inactive exceptions denied.

Microsoft authenticates identity. EFDS decides authorization regardless of the Azure tenant configuration.

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
