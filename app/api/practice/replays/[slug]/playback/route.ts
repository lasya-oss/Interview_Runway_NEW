import { NextResponse } from "next/server";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { findPracticeReplay } from "@/app/lib/practice-replays";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const replay = findPracticeReplay(slug);
  if (!replay) return NextResponse.json({ ok: false, message: "Replay not found." }, { status: 404 });

  const profile = await requireDemoProfile(`/learn/practice/replays/${slug}`);
  if (!profile.access.practice) {
    return NextResponse.json({ ok: false, message: "The Second Seat is required." }, { status: 403 });
  }

  const previewUrl = `https://drive.google.com/file/d/${replay.sourceFileId}/preview`;
  return NextResponse.redirect(previewUrl, {
    status: 307,
    headers: { "cache-control": "private, no-store" },
  });
}
