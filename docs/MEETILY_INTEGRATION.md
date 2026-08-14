# Meetily meeting archive

Meetily remains the local recorder, transcription and summarization tool. The
website only browses admin-authorized records ingested by the backend; it never
reads Meetily's local database and never calls a transcription or AI provider.

The backend currently reads `%APPDATA%\com.meetily.ai\meeting_minutes.sqlite`
read-only. It also supports a conservative staged export directory for future
Meetily versions. A meeting has stable identity independent of its transcript
or summary hash. Each transcript, summary, and note is an immutable artifact
version, and timestamped transcript segments are retained separately.

Meetily summaries are always labelled “AI-generated Meetily summary — not
committee-approved minutes”. A transcript is captured source evidence, not an
automatically approved decision or action. No member or public route can read
raw meeting data in V1.

Backend first-run commands:

```powershell
$env:MEETILY_DB_PATH="$env:APPDATA\com.meetily.ai\meeting_minutes.sqlite"
python scripts/sync_meetily.py --check
python scripts/sync_meetily.py --list
python scripts/sync_meetily.py --dry-run
python scripts/sync_meetily.py --meeting MEETILY_ID
python scripts/sync_meetily.py --full
```

After import, rebuild meeting retrieval units with
`python scripts/rebuild_retrieval_index.py --source meeting_transcript --full`
or rebuild all source families. The archive is versioned and idempotent;
unchanged hashes are skipped and missing meetings are retained rather than
deleted.
