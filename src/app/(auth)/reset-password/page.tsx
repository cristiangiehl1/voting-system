import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ResetPasswordForm } from "./ResetPasswordForm"

export default async function ResetPasswordPage() {
  const session = await auth()
  if (session?.user) redirect("/")
  return <ResetPasswordForm />
}
