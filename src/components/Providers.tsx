"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type { Session } from "next-auth"

const NON_RETRYABLE_CODES = ["NOT_FOUND", "UNAUTHORIZED", "FORBIDDEN", "BAD_REQUEST", "CONFLICT", "VALIDATION_ERROR"]

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode
  session?: Session | null
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          const err = error as { code?: string }
          if (err.code && NON_RETRYABLE_CODES.includes(err.code)) return false
          return failureCount < 3
        },
      },
      mutations: {
        retry: (failureCount, error) => {
          const err = error as { code?: string }
          if (err.code && NON_RETRYABLE_CODES.includes(err.code)) return false
          return failureCount < 3
        },
      },
    },
  }))

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
