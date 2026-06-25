export const queryKeys = {
  lists: ["lists"] as const,
  publicLists: ["public-lists"] as const,
  list: (id: string) => ["list", id] as const,
  options: (listId: string) => ["options", listId] as const,
  participants: (listId: string) => ["participants", listId] as const,
  myVotes: (listId: string) => ["my-votes", listId] as const,
  results: (listId: string) => ["results", listId] as const,
  invites: (listId: string) => ["invites", listId] as const,
  myInvites: ["my-invites"] as const,
}
