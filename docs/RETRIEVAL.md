# Unified retrieval

The website search pages use the backend's derived `retrieval_units` index and
never query Slack or OneDrive APIs directly. `/dashboard/search` is limited by
the member publication boundary. `/admin/search` uses the same server-side
Supabase RPC but requires an admin profile and may retrieve current admin-only
source records.

Search result snippets and provenance are produced by PostgreSQL. Raw Slack and
OneDrive content is never available to public/member routes. The backend owns
the rebuild, ranking, FTS indexes, and future embedding attachment point.

Meetily integration adds admin-only `meeting_transcript`, `meeting_summary`,
and `meeting_notes` units. Transcript units are deterministic groups of
timestamped segments and retain meeting/artifact IDs plus start/end metadata.
Summary units are marked AI-generated and receive lower authority than approved
operational knowledge. The database retrieval boundary excludes all meeting
sources from member, committee, and public scopes in V1.

Operational records are indexed as `operational_decision`,
`operational_action`, `operational_commitment`, `operational_question`, and
`operational_status`. The admin search result includes a source-scoped action
to create a proposed operational record from the selected retrieval unit.
Operational records remain hidden from member/public search until an admin
approves and explicitly publishes them.

Semantic retrieval is backend-owned. The Python schema-owner repository stores
versioned pgvector embeddings and fuses them with FTS; this website continues
to call the permission-filtered Supabase lexical RPC until a backend HTTP
retrieval boundary is deployed. No embedding provider key is present in the
website runtime.
