import { redirect } from "next/navigation"
import { serverApi } from "@/lib/server-api"
import { ProfileContent } from "./ProfileContent"

export default async function ProfilePage() {
  const data = await serverApi.getProfile()

  if (!data) redirect("/login")

  return (
    <ProfileContent
      user={data.user}
      stats={data.stats}
    />
  )
}
