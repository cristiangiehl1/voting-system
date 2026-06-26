"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Scale, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { PageTransition } from "@/components/PageTransition"
import { forgotPasswordSchema, type ForgotPasswordData } from "@/lib/schemas"
import { api } from "@/lib/api-client"

export function ForgotPasswordForm() {
  const router = useRouter()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(_data: ForgotPasswordData) {
    try {
      const res = await api.forgotPassword(_data.email)
      console.log("[forgot-password] Resposta da API:", JSON.stringify(res))
      toast.success("Se o email existir, você receberá um link de recuperação.")
      router.push("/")
      router.refresh()
    } catch (error: any) {
      console.error("[forgot-password] Erro na requisição:", error)
      toast.error(error?.message || "Erro ao enviar solicitação. Tente novamente.")
    }
  }

  return (
    <PageTransition>
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent ring-1 ring-primary/30">
              <Scale className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Esqueceu a senha?</CardTitle>
            <CardDescription>
              Digite seu email e enviaremos um link para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="bg-card"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <Link href="/login" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
