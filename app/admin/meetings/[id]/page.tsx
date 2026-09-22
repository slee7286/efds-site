import { readPageData } from "@/lib/local-preview";
import { notFound } from "next/navigation";
import { MeetingArtifacts, MeetingChanges, MeetingFacts, MeetingNav, MeetingNotes, MeetingSummary, MeetingTranscript } from "@/components/meetings/archive";
import { getMeeting } from "@/lib/db/meetings";

export default async function AdminMeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await readPageData(() => getMeeting(id), null);
  if (!result) notFound();
  const currentTranscript = result.artifacts.find((artifact) => artifact.artifactType === "transcript" && artifact.isCurrent);
  const currentSummary = result.artifacts.find((artifact) => artifact.artifactType === "summary" && artifact.isCurrent);
  const currentNotes = result.artifacts.find((artifact) => artifact.artifactType === "notes" && artifact.isCurrent);
  return <div className="app-content"><div className="eyebrow">Admin · meeting provenance</div><h1>{result.meeting.title}</h1><p className="app-subtitle">Original meeting logs and their source references. Imported notes are evidence, not automatically approved minutes.</p><MeetingNav /><section className="surface info-card"><div className="panel-heading"><h2>Meeting</h2><span className="badge badge-coral">admin only</span></div><MeetingFacts item={result.meeting} metadata={result.metadata} /></section><MeetingNotes artifact={currentNotes} />{currentSummary && <MeetingSummary artifact={currentSummary} />}{currentTranscript && <MeetingTranscript segments={result.segments} artifact={currentTranscript} />}<MeetingArtifacts artifacts={result.artifacts} /><MeetingChanges changes={result.changes} /></div>;
}
