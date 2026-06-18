"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }
  const el = document.createElement("textarea")
  el.value = text
  el.style.position = "fixed"
  el.style.opacity = "0"
  document.body.appendChild(el)
  el.select()
  document.execCommand("copy")
  document.body.removeChild(el)
  return Promise.resolve()
}
import {
  Eye, EyeOff, Copy, Trash2, Plus, KeyRound, Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Secret = {
  id: string
  title: string
  key: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

type RevealMode = "show" | "copy"

type DecryptDialogState =
  | { open: false }
  | { open: true; secretId: string; secretTitle: string; mode: RevealMode }

type RevealedValue = { id: string; value: string; expiresAt: number }

export function SecretManagerShell() {
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [loading, setLoading] = useState(true)

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({
    title: "", key: "", value: "", notes: "", password: "", confirmPassword: "",
  })
  const [addLoading, setAddLoading] = useState(false)

  // Decrypt dialog
  const [decryptDialog, setDecryptDialog] = useState<DecryptDialogState>({ open: false })
  const [decryptPassword, setDecryptPassword] = useState("")
  const [decryptLoading, setDecryptLoading] = useState(false)

  // Revealed values (cached for 60s)
  const [revealed, setRevealed] = useState<RevealedValue[]>([])
  const [showValues, setShowValues] = useState<Set<string>>(new Set())

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Secret | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)


  async function fetchSecrets() {
    setLoading(true)
    try {
      const res = await fetch("/api/secrets")
      const data = await res.json()
      setSecrets(data.secrets ?? [])
    } catch {
      toast.error("Failed to load secrets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSecrets()
  }, [])

  // Purge expired revealed values
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setRevealed((prev) => prev.filter((r) => r.expiresAt > now))
      setShowValues((prev) => {
        const next = new Set(prev)
        revealed.forEach((r) => {
          if (r.expiresAt <= now) next.delete(r.id)
        })
        return next
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [revealed])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (addForm.password !== addForm.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (addForm.notes.length > 150) {
      toast.error("Notes must be 150 characters or fewer")
      return
    }
    setAddLoading(true)
    try {
      const res = await fetch("/api/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: addForm.title,
          key: addForm.key,
          value: addForm.value,
          notes: addForm.notes || undefined,
          password: addForm.password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create secret")
        return
      }
      setSecrets((prev) => [data.secret, ...prev])
      setAddOpen(false)
      setAddForm({ title: "", key: "", value: "", notes: "", password: "", confirmPassword: "" })
      toast.success("Secret saved")
    } catch {
      toast.error("Failed to create secret")
    } finally {
      setAddLoading(false)
    }
  }

  function openDecrypt(secret: Secret, mode: RevealMode) {
    // Check if already revealed and not expired
    const cached = revealed.find((r) => r.id === secret.id && r.expiresAt > Date.now())
    if (cached) {
      if (mode === "copy") {
        copyToClipboard(cached.value)
        toast.success("Copied to clipboard")
      } else {
        setShowValues((prev) => new Set(prev).add(secret.id))
      }
      return
    }
    setDecryptPassword("")
    setDecryptDialog({ open: true, secretId: secret.id, secretTitle: secret.title, mode })
  }

  async function handleDecrypt(e: React.FormEvent) {
    e.preventDefault()
    if (!decryptDialog.open) return
    setDecryptLoading(true)
    try {
      const res = await fetch(`/api/secrets/${decryptDialog.secretId}/decrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: decryptPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Decryption failed")
        return
      }

      const entry: RevealedValue = {
        id: decryptDialog.secretId,
        value: data.value,
        expiresAt: Date.now() + 60_000,
      }
      setRevealed((prev) => [...prev.filter((r) => r.id !== entry.id), entry])

      const mode = decryptDialog.mode
      const secretId = decryptDialog.secretId
      setDecryptDialog({ open: false })
      setDecryptPassword("")

      if (mode === "copy") {
        copyToClipboard(data.value)
        toast.success("Copied to clipboard")
      } else {
        setShowValues((prev) => new Set(prev).add(secretId))
      }
    } catch {
      toast.error("Decryption failed")
    } finally {
      setDecryptLoading(false)
    }
  }

  function hideValue(id: string) {
    setShowValues((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/secrets/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Failed to delete secret")
        return
      }
      setSecrets((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      setRevealed((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      setShowValues((prev) => {
        const next = new Set(prev)
        next.delete(deleteTarget.id)
        return next
      })
      setDeleteTarget(null)
      toast.success("Secret deleted")
    } catch {
      toast.error("Failed to delete secret")
    } finally {
      setDeleteLoading(false)
    }
  }

  const revealedMap = new Map(revealed.map((r) => [r.id, r]))

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-xs text-muted-foreground">
          {loading ? "loading…" : `${secrets.length} secret${secrets.length !== 1 ? "s" : ""}`}
        </p>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Secret
        </Button>
      </div>

      {/* Secret list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-border bg-muted/30"
            />
          ))}
        </div>
      ) : secrets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <KeyRound className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="font-mono text-sm text-muted-foreground">no secrets yet</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground/60">
            click &quot;New Secret&quot; to add one
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {secrets.map((secret) => {
            const isShowing = showValues.has(secret.id)
            const cachedValue = revealedMap.get(secret.id)

            return (
              <div
                key={secret.id}
                className="rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="font-mono text-sm font-semibold text-foreground truncate">
                        {secret.title}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                      <span className="text-muted-foreground/60">key </span>
                      <span>{secret.key}</span>
                    </div>

                    {/* Value area */}
                    {isShowing && cachedValue && (
                      <div className="mt-2 rounded border border-border bg-muted/40 px-2 py-1.5">
                        <span className="break-all font-mono text-xs text-foreground">
                          {cachedValue.value}
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {secret.notes && (
                      <p className="mt-2 font-mono text-xs text-muted-foreground/70 leading-relaxed">
                        {secret.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title={isShowing ? "Hide value" : "Show value"}
                      onClick={() =>
                        isShowing ? hideValue(secret.id) : openDecrypt(secret, "show")
                      }
                    >
                      {isShowing ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Copy value"
                      onClick={() => openDecrypt(secret, "copy")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="Delete secret"
                      onClick={() => setDeleteTarget(secret)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-2 font-mono text-[10px] text-muted-foreground/40">
                  {new Date(secret.createdAt).toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Secret Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">new secret</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs">Title</Label>
              <Input
                className="font-mono text-xs"
                placeholder="e.g. GitHub Token"
                value={addForm.title}
                onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs">Key name</Label>
              <Input
                className="font-mono text-xs"
                placeholder="e.g. GITHUB_TOKEN"
                value={addForm.key}
                onChange={(e) => setAddForm((f) => ({ ...f, key: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs">Value</Label>
              <Input
                className="font-mono text-xs"
                placeholder="secret value"
                type="password"
                value={addForm.value}
                onChange={(e) => setAddForm((f) => ({ ...f, value: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs">
                Notes{" "}
                <span className="text-muted-foreground/60">
                  ({addForm.notes.length}/150)
                </span>
              </Label>
              <textarea
                className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
                placeholder="optional notes…"
                rows={3}
                maxLength={150}
                value={addForm.notes}
                onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs">Encryption password</Label>
              <Input
                className="font-mono text-xs"
                type="password"
                placeholder="password for this secret"
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs">Confirm password</Label>
              <Input
                className="font-mono text-xs"
                type="password"
                placeholder="confirm password"
                value={addForm.confirmPassword}
                onChange={(e) => setAddForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddOpen(false)}
                disabled={addLoading}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={addLoading}>
                {addLoading ? "Saving…" : "Save Secret"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Decrypt Dialog */}
      <Dialog
        open={decryptDialog.open}
        onOpenChange={(open) => {
          if (!open) setDecryptDialog({ open: false })
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              {decryptDialog.open
                ? decryptDialog.mode === "copy"
                  ? `copy · ${decryptDialog.secretTitle}`
                  : `reveal · ${decryptDialog.secretTitle}`
                : ""}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDecrypt} className="space-y-3">
            <p className="font-mono text-xs text-muted-foreground">
              enter the password to decrypt this secret
            </p>
            <div className="space-y-1.5">
              <Label className="font-mono text-xs">Password</Label>
              <Input
                className="font-mono text-xs"
                type="password"
                placeholder="encryption password"
                value={decryptPassword}
                onChange={(e) => setDecryptPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDecryptDialog({ open: false })}
                disabled={decryptLoading}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={decryptLoading}>
                {decryptLoading
                  ? "Decrypting…"
                  : decryptDialog.open && decryptDialog.mode === "copy"
                    ? "Copy"
                    : "Reveal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-sm">delete secret?</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs">
              &quot;{deleteTarget?.title}&quot; will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              {deleteLoading ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
