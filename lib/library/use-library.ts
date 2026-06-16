"use client"

import { useCallback, useEffect, useState } from "react"
import type { LibraryDocument, LibraryFolder } from "./types"

export function useLibrary() {
  const [documents, setDocuments] = useState<LibraryDocument[]>([])
  const [folders, setFolders] = useState<LibraryFolder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/library").then((res) => res.json()),
      fetch("/api/library/folders").then((res) => res.json()),
    ])
      .then(([docData, folderData]) => {
        setDocuments(docData.documents ?? [])
        setFolders(folderData.folders ?? [])
      })
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

  const moveDocuments = useCallback(async (ids: string[], folderId: string | null) => {
    const results = await Promise.all(
      ids.map((id) =>
        fetch(`/api/library/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId }),
        }).then((res) => res.json()),
      ),
    )
    const updated = new Map<string, LibraryDocument>(
      results
        .map((r) => r.document as LibraryDocument | undefined)
        .filter((doc): doc is LibraryDocument => Boolean(doc))
        .map((doc) => [doc.id, doc]),
    )
    setDocuments((prev) => prev.map((d) => updated.get(d.id) ?? d))
  }, [])

  const addFolder = useCallback(async (name: string): Promise<LibraryFolder> => {
    const res = await fetch("/api/library/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error ?? "Failed to create folder")
    }
    const folder = data.folder as LibraryFolder
    setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)))
    return folder
  }, [])

  const removeFolder = useCallback(async (id: string) => {
    await fetch(`/api/library/folders/${id}`, { method: "DELETE" })
    setFolders((prev) => prev.filter((f) => f.id !== id))
    setDocuments((prev) => prev.map((d) => (d.folderId === id ? { ...d, folderId: null } : d)))
  }, [])

  return {
    documents,
    folders,
    isLoading,
    addDocument,
    removeDocument,
    removeDocuments,
    toggleStar,
    toggleHidden,
    moveDocuments,
    addFolder,
    removeFolder,
  }
}
