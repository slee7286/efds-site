import { notFound } from "next/navigation";
import { MeetingArtifacts, MeetingChanges, MeetingFacts, MeetingNav, MeetingSummary, MeetingTranscript } from "@/components/meetings/archive";
import { getMeeting } from "@/lib/db/meetings";

export default async function AdminMeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getMeeting(id);
  if (!result) notFound();
  const currentTranscript = result.artifacts.find((artifact) => artifact.artifactType === "transcript" && artifact.isCurrent);
  const currentSummary = result.artifacts.find((artifact) => artifact.artifactType === "summary" && artifact.isCurrent);
  return <div className="app-content"><div className="eyebrow">Admin · Meetily provenance</div><h1>{result.meeting.title}</h1><p className="app-subtitle">The transcript is the primary captured source. The Meetily summary is displayed separately as an AI-generated, unreviewed interpretation.</p><MeetingNav /><section className="surface info-card"><div className="panel-heading"><h2>Meeting</h2><span className="badge badge-coral">admin only</span></div><MeetingFacts item={result.meeting} metadata={result.metadata} /></section><MeetingSummary artifact={currentSummary} /><MeetingTranscript segments={result.segments} artifact={currentTranscript} /><MeetingArtifacts artifacts={result.artifacts} /><MeetingChanges changes={result.changes} /></div>;
}
