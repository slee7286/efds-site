import { readPageData, documentPreview } from "@/lib/local-preview";
import { DocumentNav, DocumentSearchForm, DocumentTable } from "@/components/documents/archive";
import { getDocumentDashboard, listDocuments } from "@/lib/db/documents";

type Params = { q?: string; area?: string; status?: string; extraction?: string; extension?: string; from?: string; to?: string; duplicate?: string };

export default async function AdminDocumentFilesPage({ searchParams }: { searchParams?: Promise<Params> }) {
  const params = searchParams ? await searchParams : {};
  const [dashboard, items] = await Promise.all([readPageData(() => getDocumentDashboard(), documentPreview), readPageData(() => listDocuments({ query: params.q, area: params.area, status: params.status, extraction: params.extraction, extension: params.extension, from: params.from ? `${params.from}T00:00:00.000Z` : undefined, to: params.to ? `${params.to}T23:59:59.999Z` : undefined, duplicate: params.duplicate === "true" }), [])]);
  return <div className="app-content"><div className="eyebrow">Admin · document files</div><h1>Browse the file shelf.</h1><p className="app-subtitle">Search filenames, relative paths and extracted text across the private OneDrive source archive.</p><DocumentNav /><DocumentSearchForm query={params.q} area={params.area} status={params.status} extraction={params.extraction} extension={params.extension} from={params.from} to={params.to} duplicate={params.duplicate === "true"} areas={dashboard.areas} /><DocumentTable items={items} /><p className="muted" style={{ marginTop: 14, fontSize: 11 }}>Showing {items.length} result(s). Absolute local paths are never rendered.</p></div>;
}
