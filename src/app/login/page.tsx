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
import { loginSchema, type LoginData } from "@/lib/schemas"

export default function LoginPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginData) {
    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (signInResult?.error) {
      toast.error("Email não encontrado ou senha inválida", {
        style: { border: "1px solid #ff00aa", color: "#ff00aa" },
      })
      return
    }

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
            <span className="gradient-text">Entrar</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Use seu email corporativo e a senha do time de TI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neon-cyan">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@empresa.com"
                className="border-neon-cyan/30 bg-background/50 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/50"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-neon-magenta">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neon-magenta">Senha do Time</Label>
              <Input
                id="password"
                type="password"
                placeholder="Senha compartilhada"
                className="border-neon-magenta/30 bg-background/50 focus:border-neon-magenta focus:ring-1 focus:ring-neon-magenta/50"
                {...register("password")}
              />
              {errors.password && <p className="text-xs text-neon-magenta">{errors.password.message}</p>}
            </div>
            <Button
              type="submit"
              className="w-full border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/register" className="font-medium text-neon-magenta hover:text-neon-magenta/80 hover:underline">
              Registre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
