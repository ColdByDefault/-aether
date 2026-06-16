"use client"

import { useCallback, useEffect, useState } from "react"
import type { LibraryDocument } from "./types"

export function useLibrary() {
  const [documents, setDocuments] = useState<LibraryDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/library")
      .then((res) => res.json())
      .then((data) => setDocuments(data.documents ?? []))
      .finally(() => setIsLoading(false))
  }, [])

  const addDocument = useCallback(async (file: File): Promise<LibraryDocument> => {
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/library", { method: "POST", body: formData })
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error ?? "Upload failed")
    }

    const doc = data.document as LibraryDocument
    setDocuments((prev) => [doc, ...prev])
    return doc
  }, [])

  const removeDocument = useCallback(async (id: string) => {
    await fetch(`/api/library/${id}`, { method: "DELETE" })
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const removeDocuments = useCallback(async (ids: string[]) => {
    await Promise.all(ids.map((id) => fetch(`/api/library/${id}`, { method: "DELETE" })))
    const idSet = new Set(ids)
    setDocuments((prev) => prev.filter((d) => !idSet.has(d.id)))
  }, [])

  const toggleStar = useCallback(async (id: string) => {
    const current = documents.find((d) => d.id === id)
    if (!current) return
    const res = await fetch(`/api/library/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starred: !current.starred }),
    })
    const data = await res.json()
    if (!res.ok) return
    setDocuments((prev) => prev.map((d) => (d.id === id ? data.document : d)))
  }, [documents])

  const toggleHidden = useCallback(async (id: string) => {
    const current = documents.find((d) => d.id === id)
    if (!current) return
    const res = await fetch(`/api/library/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !current.hidden }),
    })
    const data = await res.json()
    if (!res.ok) return
    setDocuments((prev) => prev.map((d) => (d.id === id ? data.document : d)))
  }, [documents])

  return {
    documents,
    isLoading,
    addDocument,
    removeDocument,
    removeDocuments,
    toggleStar,
    toggleHidden,
  }
}
