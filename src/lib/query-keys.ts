export const queryKeys = {
  rankings: ["rankings"] as const,
  ranking: (id: string) => ["ranking", id] as const,
  candidates: (rankingId: string) => ["candidates", rankingId] as const,
  labels: ["labels"] as const,
  leaderboard: (rankingId: string) => ["leaderboard", rankingId] as const,
  myVotes: (rankingId: string) => ["my-votes", rankingId] as const,
}
