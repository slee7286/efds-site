export function WorkspaceLoading() {
  return <div className="workspace-loading" role="status" aria-label="Loading workspace">
    <p>Loading your workspace…</p>
    <div className="loading-line" aria-hidden="true" /><div className="loading-line" aria-hidden="true" />
  </div>;
}
