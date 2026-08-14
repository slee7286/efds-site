# Operational truth UI

The admin operations console is the human review layer for decisions, actions, commitments, open questions, and status updates. Raw Slack, meeting, document, and ICU records remain source evidence.

New records start as proposed. Admins can attach permission-scoped retrieval results, edit the EFDS interpretation, approve, defer, reject with a reason, publish explicitly, update action execution state, resolve questions, and supersede decisions. The database RPC performs the state change and audit event atomically and rejects stale `review_version` values.

Member/public retrieval does not expose operational records unless they are approved, current, and explicitly published at the corresponding visibility.
