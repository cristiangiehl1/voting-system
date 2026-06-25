import { auth } from "@/lib/auth"
import { HomeContent } from "./HomeContent"
import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { QueryClient } from "@tanstack/react-query"
import { getPublicLists } from "@/app/actions/lists"
import { queryKeys } from "@/lib/query-keys"

export default async function HomePage() {
  const queryClient = new QueryClient()
  const session = await auth()

  await queryClient.prefetchQuery({
    queryKey: queryKeys.publicLists,
    queryFn: () => getPublicLists(),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeContent
        session={
          session
            ? {
                user: {
                  id: session.user.id,
                  name: session.user.name ?? null,
                  email: session.user.email ?? null,
                },
              }
            : null
        }
      />
    </HydrationBoundary>
  )
}
