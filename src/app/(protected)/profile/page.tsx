import { redirect } from "next/navigation"
import { api } from "@/lib/api-client"
import { ProfileContent } from "./ProfileContent"

export default async function ProfilePage() {
  const data = await api.getProfile()

  if (!data) redirect("/login")

  return (
    <ProfileContent
      user={data.user}
      stats={data.stats}
    />
  )
}
