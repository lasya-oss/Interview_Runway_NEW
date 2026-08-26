export type PracticeReplay = {
  slug: string;
  title: string;
  filename: string;
  category: "Coding" | "System Design" | "Behavioural" | "Recruiter" | "Manager";
  collection: string;
  description: string;
  objective: string;
  kind: "Mock interview replay";
  accessTier: "The Second Seat";
  sourceFileId: string;
  sourceBytes: number;
  storage: "google-drive-preview";
  playbackPath: string;
  transcript: "Not supplied";
  roadmapTaskId?: string;
};

export const PRACTICE_REPLAYS: readonly PracticeReplay[] = [
  {
    slug: "coding-dynamic-programming-05",
    title: "Dynamic programming mock interview",
    filename: "mock_coding_dynamic-programming_05.mp4",
    category: "Coding",
    collection: "Coding mock interview replays",
    description: "A supplied coding mock replay for studying interview execution around a dynamic-programming prompt.",
    objective: "Watch the exchange once for structure, then replay it to note how the prompt, state, transitions, and complexity discussion are handled.",
    kind: "Mock interview replay",
    accessTier: "The Second Seat",
    sourceFileId: "1cuV_ejln62nazWnyteKqe2koReazYmin",
    sourceBytes: 57128544,
    storage: "google-drive-preview",
    playbackPath: "/api/practice/replays/coding-dynamic-programming-05/playback",
    transcript: "Not supplied",
    roadmapTaskId: "4w-1-patterns",
  },
];

export function findPracticeReplay(slug: string): PracticeReplay | null {
  return PRACTICE_REPLAYS.find((replay) => replay.slug === slug) ?? null;
}

export function formatMegabytes(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
