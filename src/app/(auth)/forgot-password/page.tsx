import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ForgotPasswordForm } from "./ForgotPasswordForm"

export default async function ForgotPasswordPage() {
  const session = await auth()
  if (session?.user) redirect("/")
  return <ForgotPasswordForm />
}
