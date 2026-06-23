import { auth } from "@/lib/auth"
import { HomeContent } from "./HomeContent"

export default async function HomePage() {
  const session = await auth()

  return (
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
  )
}
