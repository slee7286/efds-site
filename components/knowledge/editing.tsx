import { reviewKnowledgeAction } from "@/lib/actions/knowledge-review";
import type { KnowledgeReviewItem, KnowledgeType } from "@/types/domain";
import { TimingFields } from "@/components/knowledge/timing-fields";

type Option = { id: string; label: string };

function hidden(item: KnowledgeReviewItem) {
  return <><input type="hidden" name="action" value="edit_approve" /><input type="hidden" name="knowledgeType" value={item.knowledgeType} /><input type="hidden" name="recordId" value={item.id} /><input type="hidden" name="expectedVersion" value={item.reviewVersion} /></>;
}

function SelectOptions({ options, selected }: { options: Option[]; selected: string | null }) {
  return <><option value="">Not assigned</option>{options.map((option) => <option value={option.id} key={option.id} selected={option.id === selected}>{option.label}</option>)}</>;
}

function RoleChoices({ item, roles }: { item: KnowledgeReviewItem; roles: Option[] }) {
  return <div><span className="form-label">Relevant roles</span><div className="tag-list">{roles.map((role) => <label className="tag" key={role.id}><input type="checkbox" name="roleId" value={role.id} defaultChecked={item.roleIds.includes(role.id)} /> {role.label}</label>)}</div></div>;
}

function Field({ label, name, defaultValue, type = "text", required = false }: { label: string; name: string; defaultValue?: string | number | null; type?: string; required?: boolean }) {
  return <label className="form-label">{label}<input className="input" name={name} type={type} defaultValue={defaultValue ?? ""} required={required} /></label>;
}

export function RichKnowledgeEditForm({ item, topics = [], roles = [] }: { item: KnowledgeReviewItem; topics?: Option[]; roles?: Option[] }) {
  const raw = item.raw;
  const topicId = raw.topic_id ? String(raw.topic_id) : null;
  return <form action={reviewKnowledgeAction} className="surface info-card" style={{ marginTop: 18 }}><div className="panel-heading"><h2>Edit EFDS interpretation</h2><span className="muted">Source fields are locked</span></div><p className="muted">This edits only the normalized EFDS interpretation. ICU article text, evidence, source hash, extraction method and original extraction remain immutable.</p><div style={{ display: "grid", gap: 12 }}>
    {item.knowledgeType === "requirement" && <><label className="form-label">Requirement text<textarea className="textarea" name="requirement_text" defaultValue={String(raw.requirement_text ?? "")} rows={4} required /></label><Field label="Classification" name="requirement_type" defaultValue={String(raw.requirement_type ?? "mandatory")} required /><Field label="Applies to" name="applies_to" defaultValue={raw.applies_to ? String(raw.applies_to) : ""} /><label className="form-label">Mandatory / guidance<select className="select" name="mandatory" defaultValue={raw.mandatory === null || raw.mandatory === undefined ? "" : raw.mandatory ? "true" : "false"}><option value="">Unspecified</option><option value="true">Mandatory</option><option value="false">Guidance</option></select></label><label className="form-label">Topic<select className="select" name="topic_id" defaultValue={topicId ?? ""}><SelectOptions options={topics} selected={topicId} /></select></label><RoleChoices item={item} roles={roles} /></>}
    {item.knowledgeType === "timing_rule" && <TimingFields raw={raw} topicId={topicId} topics={topics} />}
    {item.knowledgeType === "process" && <><Field label="Process name" name="name" defaultValue={String(raw.name ?? item.normalizedText)} required /><label className="form-label">Normalized description<textarea className="textarea" name="description" defaultValue={raw.description ? String(raw.description) : ""} rows={4} /></label><label className="form-label">Topic<select className="select" name="topic_id" defaultValue={topicId ?? ""}><SelectOptions options={topics} selected={topicId} /></select></label><RoleChoices item={item} roles={roles} /></>}
    {item.knowledgeType === "process_step" && <><Field label="Step title" name="title" defaultValue={raw.title ? String(raw.title) : ""} /><label className="form-label">Instruction<textarea className="textarea" name="instruction" defaultValue={String(raw.instruction ?? item.normalizedText)} rows={4} required /></label><Field label="Condition" name="condition" defaultValue={raw.condition ? String(raw.condition) : ""} /><Field label="Step number" name="step_number" type="number" defaultValue={raw.step_number ? Number(raw.step_number) : 1} required /></>}
    {item.knowledgeType === "resource" && <><Field label="Resource name" name="name" defaultValue={String(raw.name ?? item.normalizedText)} required /><Field label="Resource type" name="resource_type" defaultValue={String(raw.resource_type ?? "webpage")} required /><Field label="URL" name="url" defaultValue={raw.url ? String(raw.url) : ""} /><label className="form-label">Description<textarea className="textarea" name="description" defaultValue={raw.description ? String(raw.description) : ""} rows={3} /></label><label className="form-label">Topic<select className="select" name="topic_id" defaultValue={topicId ?? ""}><SelectOptions options={topics} selected={topicId} /></select></label></>}
    {item.knowledgeType === "contact" && <><Field label="Name" name="name" defaultValue={raw.name ? String(raw.name) : ""} /><Field label="Organisation" name="organisation" defaultValue={raw.organisation ? String(raw.organisation) : ""} /><Field label="Email" name="email" defaultValue={raw.email ? String(raw.email) : ""} type="email" /><Field label="URL" name="url" defaultValue={raw.url ? String(raw.url) : ""} /><label className="form-label">Description<textarea className="textarea" name="description" defaultValue={raw.description ? String(raw.description) : ""} rows={3} /></label></>}
    <button className="button button-dark" type="submit">Save interpretation and approve</button>
  </div></form>;
}

export function ProcessStepEditForm({ item }: { item: KnowledgeReviewItem }) {
  return <RichKnowledgeEditForm item={item} />;
}

export function ProcessResourceLinkForm({ item, resources, action = "link_resource" }: { item: KnowledgeReviewItem; resources: KnowledgeReviewItem[]; action?: "link_resource" | "unlink_resource" }) {
  return <form action={reviewKnowledgeAction} className="ops-inline"><input type="hidden" name="action" value={action} /><input type="hidden" name="knowledgeType" value="process" /><input type="hidden" name="recordId" value={item.id} /><input type="hidden" name="expectedVersion" value={item.reviewVersion} /><select className="select" name="resource_id" required defaultValue=""><option value="">Choose a resource</option>{resources.map((resource) => <option value={resource.id} key={resource.id}>{resource.normalizedText}</option>)}</select><button className="button button-quiet" type="submit">{action === "link_resource" ? "Link resource" : "Unlink resource"}</button></form>;
}

export type { KnowledgeType };
