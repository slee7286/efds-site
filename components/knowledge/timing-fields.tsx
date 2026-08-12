"use client";

import { useState } from "react";

type Option = { id: string; label: string };

export function TimingFields({ raw, topicId, topics }: { raw: Record<string, unknown>; topicId: string | null; topics: Option[] }) {
  const [type, setType] = useState(String(raw.deadline_type ?? "other"));
  const value = (key: string) => raw[key] === null || raw[key] === undefined ? "" : String(raw[key]);
  return <>
    <label className="form-label">Normalized description<textarea className="textarea" name="description" defaultValue={value("description")} rows={3} required /></label>
    <label className="form-label">Rule type<select className="select" name="deadline_type" value={type} onChange={(event) => setType(event.target.value)}><option value="absolute">Absolute date</option><option value="relative_notice">Relative notice</option><option value="duration">Duration</option><option value="recurring_window">Recurring window</option><option value="seasonal">Seasonal</option><option value="other">Other</option></select></label>
    {type === "absolute" && <label className="form-label">Absolute date<input className="input" name="absolute_date" type="date" defaultValue={value("absolute_date").slice(0, 10)} /></label>}
    {(type === "relative_notice" || type === "duration") && <><div className="ops-inline"><label className="form-label">Value<input className="input" name="notice_period_value" type="number" defaultValue={value("notice_period_value")} /></label><label className="form-label">Unit<input className="input" name="notice_period_unit" defaultValue={value("notice_period_unit")} /></label></div><label className="form-label">Working days<select className="select" name="working_days" defaultValue={raw.working_days === null || raw.working_days === undefined ? "" : raw.working_days ? "true" : "false"}><option value="">Unspecified</option><option value="true">Working days</option><option value="false">Calendar days</option></select></label></>}
    {(type === "relative_notice" || type === "recurring_window" || type === "seasonal") && <label className="form-label">Relative anchor<input className="input" name="relative_to_event_type" defaultValue={value("relative_to_event_type")} /></label>}
    {(type === "recurring_window" || type === "seasonal" || type === "other") && <label className="form-label">Recurrence/window description<input className="input" name="recurrence_rule" defaultValue={value("recurrence_rule")} /></label>}
    <label className="form-label">Topic<select className="select" name="topic_id" defaultValue={topicId ?? ""}><option value="">Not assigned</option>{topics.map((topic) => <option value={topic.id} key={topic.id}>{topic.label}</option>)}</select></label>
  </>;
}
