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
  sourceFileId?: string;
  videoPath?: string;
  sourceBytes: number;
  storage: "google-drive-api" | "static-public" | "static-public-chunked";
  durationSeconds?: number;
  transcript: "Not supplied";
  roadmapTaskId?: string;
  videoParts?: readonly string[];
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
    storage: "google-drive-api",
    transcript: "Not supplied",
    roadmapTaskId: "4w-1-patterns",
  },
  {
    slug: "behavioural-prioritizing-under-product-ambiguity-03",
    title: "Prioritizing under product ambiguity",
    filename: "mock_behavioral_ambiguity_03.mp4",
    category: "Behavioural",
    collection: "Behavioural mock interview replays",
    description: "A supplied behavioural replay focused on prioritising work when product requirements are ambiguous and outcomes still need to be owned.",
    objective: "Study how the candidate frames an unclear product situation, explains the prioritisation decision, and connects execution choices to the outcome.",
    kind: "Mock interview replay",
    accessTier: "The Second Seat",
    videoPath: "/video/replays/mock_behavioral_ambiguity_03.mp4",
    sourceBytes: 42503540,
    storage: "static-public-chunked",
    durationSeconds: 1090,
    transcript: "Not supplied",
    roadmapTaskId: "4w-2-scope",
    videoParts: [
      "/video/replays/mock_behavioral_ambiguity_03.mp4.part-00",
      "/video/replays/mock_behavioral_ambiguity_03.mp4.part-01",
      "/video/replays/mock_behavioral_ambiguity_03.mp4.part-02",
    ],
  },
  {
    slug: "coding-bfs-debugging-06",
    title: "BFS debugging mock interview",
    filename: "mock_coding_bfs-debugging_06.mp4",
    category: "Coding",
    collection: "Coding mock interview replays",
    description: "A supplied coding mock replay focused on diagnosing breadth-first-search reasoning and debugging under interview pressure.",
    objective: "Study how the candidate traces BFS state, isolates a bug, validates the correction, and explains the resulting complexity.",
    kind: "Mock interview replay",
    accessTier: "The Second Seat",
    sourceFileId: "1bDrlUTIBVYz9vYTcGZdHIXj4rxZJc0h0",
    sourceBytes: 49884677,
    storage: "static-public-chunked",
    durationSeconds: 1297.948,
    transcript: "Not supplied",
    roadmapTaskId: "12w-3-graph",
    videoParts: [
      "/video/replays/mock_coding_bfs-debugging_06.mp4.part-00",
      "/video/replays/mock_coding_bfs-debugging_06.mp4.part-01",
      "/video/replays/mock_coding_bfs-debugging_06.mp4.part-02",
      "/video/replays/mock_coding_bfs-debugging_06.mp4.part-03",
    ],
  },
];

export function findPracticeReplay(slug: string): PracticeReplay | null {
  return PRACTICE_REPLAYS.find((replay) => replay.slug === slug) ?? null;
}

export function getPracticeReplayNumber(slug: string): string {
  const index = PRACTICE_REPLAYS.findIndex((replay) => replay.slug === slug);
  return index >= 0 ? String(index + 1).padStart(2, "0") : "00";
}

export function formatMegabytes(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
