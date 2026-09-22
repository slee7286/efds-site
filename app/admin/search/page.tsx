import { readPageData } from "@/lib/local-preview";
import { UnifiedSearch } from "@/components/search/unified-search";
import { getEmbeddingHealth, searchRetrieval } from "@/lib/db/retrieval";
import type { RetrievalSourceType } from "@/types/domain";

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string; source?: string; area?: string; channel?: string; author?: string; from?: string; to?: string; history?: string }> }) {
  const params = await searchParams;
  const query = params.q ?? "";
  const source = params.source ?? "";
  const history = params.history === "1";
  const [results, embeddingHealth] = await Promise.all([
    readPageData(() => searchRetrieval({ query, scope: "admin", sourceTypes: source ? [source as RetrievalSourceType] : undefined, sourceArea: params.area, channel: params.channel, author: params.author, from: params.from, to: params.to, includeHistory: history }), []),
    getEmbeddingHealth(),
  ]);
  return <div className="app-content"><div className="eyebrow">Admin · unified retrieval</div><h1>Search the<br />institutional memory.</h1><p className="app-subtitle">Find source documents, conversations and reviewed knowledge. Results reflect your account’s access.</p>{embeddingHealth && <section className="surface info-card"><div className="panel-heading"><h2>Embedding index health</h2><span className="badge badge-neutral">backend only</span></div><div className="ops-inline"><span>{embeddingHealth.embeddings}/{embeddingHealth.retrievalUnits} units embedded</span><span>{embeddingHealth.missing} missing</span>{embeddingHealth.latest && <span>{String(embeddingHealth.latest.provider)} · {String(embeddingHealth.latest.model)}</span>}</div></section>}<UnifiedSearch results={results} query={query} source={source} area={params.area} channel={params.channel} author={params.author} from={params.from} to={params.to} history={history} admin /></div>;
}
