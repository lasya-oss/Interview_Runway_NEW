import { createTextPdf } from "@/app/lib/text-pdf";
import type { VoiceSession } from "@/app/lib/voice-session-store";

export function createVoiceReportPdf(session: VoiceSession) {
  if (!session.score) throw new Error("Voice report score is unavailable");
  const interviewerNotes = savedInterviewerNotes(session);
  const source = [
    "# Session summary",
    `Interview type: ${session.interviewType === "behavioral" ? "Behavioral / STAR" : "Role-specific Q&A"}`,
    `Interviewer: ${session.persona === "hiring_manager" ? "Hiring manager" : "Peer engineer"}`,
    `Started: ${session.startedAt ?? session.createdAt}`,
    `Verdict: ${session.score.sessionVerdict}`,
    "",
    "# Strengths",
    ...session.score.strengths.map((item) => `- ${item}`),
    "",
    "# Priority gaps",
    ...session.score.gaps.map((item) => `- ${item}`),
    "",
    ...(interviewerNotes.length ? ["# Interviewer observations", ...interviewerNotes.map((item) => `- ${item}`), ""] : []),
    "# Answer diagnosis",
    ...session.score.perAnswer.flatMap((answer, index) => [
      `## Answer ${index + 1}`,
      `Question: ${answer.question}`,
      `Answer: ${answer.answer}`,
      `Scores: STAR ${answer.structure}/5 · Specificity ${answer.specificity}/5 · Relevance ${answer.relevance}/5 · Communication ${answer.communication}/5`,
      `Coach note: ${answer.feedback}`,
      "",
    ]),
    "# Recommended drills",
    ...session.score.recommendedDrills.map((drill) => `- ${drill.title}: ${drill.reason}`),
    "",
    `Rubric: ${session.score.rubricVersion}`,
  ].join("\n");
  return createTextPdf(
    "Voice Mock Interview Report",
    `voice-interview-${session.id}.pdf`,
    source,
    {
      headerLabel: "VOICE MOCK / ASSESSMENT",
      subtitle: "Private learner report · fixed 1–5 rubric",
      sourceLabel: null,
      footerLabel: "INTERVIEWRUNWAY / PRIVATE",
    },
  );
}

export function savedInterviewerNotes(session: VoiceSession) {
  return (session.turns ?? []).flatMap((turn) => turn.toolCalls)
    .filter((call) => call.name === "saveInterviewerNote" && typeof call.result.note === "string")
    .map((call) => String(call.result.note).trim().slice(0, 1_000))
    .filter(Boolean)
    .slice(0, 20);
}
