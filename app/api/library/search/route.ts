import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface SearchRow {
  id: string
  name: string
  size: number
  starred: boolean
  hidden: boolean
  uploadedAt: Date
  folderId: string | null
  content_headline: string | null
  rank: number
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""

  if (!q) {
    return NextResponse.json({ results: [] })
  }

  // FTS for content relevance + ILIKE on name for partial/CamelCase filename matches
  const rows = await prisma.$queryRaw<SearchRow[]>`
    SELECT
      id,
      name,
      size,
      starred,
      hidden,
      "uploadedAt",
      "folderId",
      CASE
        WHEN search_vector @@ websearch_to_tsquery('english', ${q})
        THEN ts_headline(
          'english', coalesce(content, ''),
          websearch_to_tsquery('english', ${q}),
          'MaxWords=30, MinWords=15, MaxFragments=2, FragmentDelimiter=\" … \", StartSel=<mark>, StopSel=</mark>'
        )
        ELSE NULL
      END AS content_headline,
      CASE
        WHEN search_vector @@ websearch_to_tsquery('english', ${q})
        THEN ts_rank(search_vector, websearch_to_tsquery('english', ${q}))
        ELSE 0.001
      END AS rank
    FROM "Document"
    WHERE
      hidden = false
      AND (
        search_vector @@ websearch_to_tsquery('english', ${q})
        OR name ILIKE ${"%" + q + "%"}
      )
    ORDER BY rank DESC
    LIMIT 50
  `

  const results = rows.map((r) => ({
    id: r.id,
    name: r.name,
    size: Number(r.size),
    starred: r.starred,
    hidden: r.hidden,
    uploadedAt: r.uploadedAt,
    folderId: r.folderId,
    contentHeadline: r.content_headline || null,
  }))

  return NextResponse.json({ results })
}
