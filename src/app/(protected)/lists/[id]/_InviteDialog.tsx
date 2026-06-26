"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Users, UserCheck, Check, X, Plus, Mail } from "lucide-react"
import { useFriends } from "@/hooks/queries/useFriends"
import { useAddParticipant } from "@/hooks/mutations/useAddParticipant"

type FriendUser = {
  id: string
  name: string | null
  email: string | null
  imageUrl: string | null
}

type Props = {
  listId: string
}

export function InviteDialog({ listId }: Props) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [manualEmail, setManualEmail] = useState("")

  const { data: friendships } = useFriends(!!session?.user?.id && open)

  const friends: FriendUser[] = [
    ...(friendships?.sent ?? []).filter((f) => f.status === "ACCEPTED").map((f) => f.addressee),
    ...(friendships?.received ?? []).filter((f) => f.status === "ACCEPTED").map((f) => f.requester),
  ]

  const addParticipantMutation = useAddParticipant(listId,
    (result) => {
      setSelectedEmails([])
      setManualEmail("")
      const parts: string[] = []
      if (result.invited > 0) {
        parts.push(`${result.invited} convite${result.invited > 1 ? "s" : ""} enviado${result.invited > 1 ? "s" : ""}`)
      }
      if (result.errors.length > 0) {
        parts.push(`${result.errors.length} erro${result.errors.length > 1 ? "s" : ""}`)
      }
      toast.success(parts.join(", "))
      setOpen(false)
    },
    (error) => toast.error(error instanceof Error ? error.message : "Erro ao convidar"),
  )

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o)
      if (!o) {
        setSelectedEmails([])
        setManualEmail("")
      }
    }}>
      <DialogTrigger
        className="inline-flex"
        render={
          <Button>
            <Users className="mr-2 h-4 w-4" />
            Participante
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar participantes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Adicionar por email</Label>
            <div className="flex gap-2">
              <Input
                className="min-w-0 flex-1"
                placeholder="email@convidado.com"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manualEmail.includes("@")) {
                    e.preventDefault()
                    if (!selectedEmails.includes(manualEmail)) {
                      setSelectedEmails((prev) => [...prev, manualEmail])
                    }
                    setManualEmail("")
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => {
                  if (manualEmail.includes("@") && !selectedEmails.includes(manualEmail)) {
                    setSelectedEmails((prev) => [...prev, manualEmail])
                    setManualEmail("")
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {friends.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                Amigos
              </Label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-1">
                {friends.map((friend) => {
                  const isSelected = selectedEmails.includes(friend.email ?? "")
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => {
                        if (!friend.email) return
                        setSelectedEmails((prev) =>
                          isSelected
                            ? prev.filter((e) => e !== friend.email)
                            : [...prev, friend.email!],
                        )
                      }}
                      className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-secondary/50"
                      }`}
                    >
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}>
                        {(friend.name?.[0] ?? friend.email?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{friend.name || "Usuário"}</p>
                        <p className="truncate text-xs text-muted-foreground">{friend.email}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {selectedEmails.length > 0 && (
            <div className="space-y-2">
              <Label>Selecionados ({selectedEmails.length})</Label>
              <div className="flex flex-wrap gap-1.5">
                {selectedEmails.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => setSelectedEmails((prev) => prev.filter((e) => e !== email))}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-secondary-foreground/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full gap-1.5"
            onClick={() => addParticipantMutation.mutate(selectedEmails)}
            disabled={addParticipantMutation.isPending || selectedEmails.length === 0}
          >
            {addParticipantMutation.isPending ? (
              "Convidando..."
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Convidar {selectedEmails.length > 0 && `(${selectedEmails.length})`}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
