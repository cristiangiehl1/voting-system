"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skull } from "lucide-react"
import { toast } from "sonner"
import { registerUser } from "@/app/actions/auth"
import { registerSchema, type RegisterData } from "@/lib/schemas"

export default function RegisterPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterData) {
    const result = await registerUser(data.name, data.email, data.password)
    if (result.error) {
      toast.error(result.error, {
        style: { border: "1px solid #ff00aa", color: "#ff00aa" },
      })
      return
    }

    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (signInResult?.error) {
      toast.error("Erro ao fazer login após registro")
      return
    }

    toast.success("Conta criada! Bem-vindo ao caos.", {
      style: { border: "1px solid #00f0ff", color: "#00f0ff" },
    })
    router.push("/")
    router.refresh()
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md border-neon-cyan/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-magenta/10 ring-2 ring-neon-cyan/30">
            <Skull className="h-8 w-8 text-neon-magenta" />
          </div>
          <CardTitle className="text-2xl font-black tracking-wider uppercase">
            <span className="gradient-text">Criar Conta</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Registre-se no caos do TI Chatômetro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-neon-cyan">Nome</Label>
              <Input
                id="name"
                placeholder="Seu nome"
                className="border-neon-cyan/30 bg-background/50 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-neon-magenta">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neon-cyan">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@empresa.com"
                className="border-neon-cyan/30 bg-background/50 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-neon-magenta">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neon-magenta">Senha do Time</Label>
              <Input
                id="password"
                type="password"
                placeholder="Senha compartilhada da TI"
                className="border-neon-magenta/30 bg-background/50 focus:border-neon-magenta focus:ring-1 focus:ring-neon-magenta/50"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-neon-magenta">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Use a senha compartilhada do time de TI
              </p>
            </div>
            <Button
              type="submit"
              className="w-full border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta hover:bg-neon-magenta/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registrando..." : "Criar Conta"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="font-medium text-neon-cyan hover:text-neon-cyan/80 hover:underline"
            >
              Entre aqui
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
