import { NewOperationalRecordForm, OperationsNav } from "@/components/operations/archive";
import type { OperationalRecordType } from "@/types/domain";

export default async function NewOperationalRecordPage({ searchParams }: { searchParams?: Promise<{ type?: string; evidence?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const allowed: OperationalRecordType[] = ["decision", "action_item", "commitment", "open_question", "status_update"];
  const defaultType = allowed.includes(params.type as OperationalRecordType) ? params.type as OperationalRecordType : "decision";
  return <div className="app-content"><div className="eyebrow">Admin · new candidate</div><h1>Capture an interpretation<br />without losing its source.</h1><p className="app-subtitle">New records begin as proposed. Attach source evidence after creation, then review before publication.</p><OperationsNav /><NewOperationalRecordForm defaultType={defaultType} evidenceId={params.evidence} /></div>;
}
