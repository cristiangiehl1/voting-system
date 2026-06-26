"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
          <h1 className="text-3xl font-bold">Erro no servidor</h1>
          <p className="text-muted-foreground text-center max-w-md">
            {error.message || "Ocorreu um erro interno. Tente novamente mais tarde."}
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
