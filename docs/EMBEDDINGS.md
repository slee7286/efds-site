# Search mode boundary

The website continues to use the permission-filtered Supabase retrieval RPC
and never receives an embedding API key. Backend semantic/hybrid retrieval is
implemented in the schema-owner repository. A future deployed backend
retrieval endpoint can provide hybrid results to `/dashboard/search` and
`/admin/search`; until that boundary is configured, website search remains the
safe lexical path rather than moving provider credentials into Next.js.
