import Link from "next/link";
import { KnowledgeAdminNav } from "@/components/knowledge/operations";
import { listKnowledgeRoles } from "@/lib/db/knowledge-ops";

export default async function KnowledgeRolesPage() { const roles = await listKnowledgeRoles(); return <div className="app-content"><div className="eyebrow">Admin · role knowledge</div><h1>Answer the<br />role question.</h1><p className="app-subtitle">Role mappings are existing structured associations, surfaced here without copying source guidance into a second system.</p><KnowledgeAdminNav /><div className="ops-link-grid">{roles.map((role) => <Link className="ops-link surface" href={`/admin/knowledge/roles/${role.slug}`} key={role.id}><strong>{role.label}</strong><span>Open role view <span>→</span></span></Link>)}</div></div>; }
