import Link from "next/link";
import { KnowledgeAdminNav, formatDate, StatusBadge } from "@/components/knowledge/operations";
import { listAdminArticles } from "@/lib/db/knowledge-ops";

type Params = Record<string, string | string[] | undefined>;
function one(params: Params, key: string) { const value = params[key]; return Array.isArray(value) ? value[0] : value; }

export default async function AdminArticlesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const articles = await listAdminArticles(one(params, "q"));
  return <div className="app-content"><div className="eyebrow">Admin · ICU source</div><h1>Inspect the<br />source corpus.</h1><p className="app-subtitle">The source article remains authoritative. Derived records can be reviewed, but source content is never replaced by an edited interpretation.</p><KnowledgeAdminNav /><form className="ops-inline" method="get" style={{ marginBottom: 16 }}><input className="auth-input" name="q" defaultValue={one(params, "q")} placeholder="Search article title, category or external ID" style={{ maxWidth: 420 }} /><button className="button button-dark" type="submit">Search</button></form><section className="surface list-card">{articles.map((article) => <Link className="list-card-item" href={`/admin/knowledge/articles/${article.id}`} key={article.id}><div><span className="list-card-meta">{article.category ?? "ICU"} · {article.folder ?? ""}</span><h3>{article.title}</h3><p>{article.externalId ?? "No external ID"} · checked {formatDate(article.lastCheckedAt)} · changed {formatDate(article.lastChangedAt)}</p></div><div className="ops-inline"><StatusBadge status={article.reviewStatus} stale={article.isStale} /></div></Link>)}{!articles.length && <div className="empty-state"><h2>No source articles found.</h2></div>}</section></div>;
}
