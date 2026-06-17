export interface LibraryDocument {
  id: string
  name: string
  size: number
  uploadedAt: string
  starred: boolean
  hidden: boolean
  folderId: string | null
}

export interface SearchResult extends LibraryDocument {
  contentHeadline: string | null
}

export interface LibraryFolder {
  id: string
  name: string
  createdAt: string
  documentCount: number
}
