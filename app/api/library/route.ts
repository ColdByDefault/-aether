import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { extractText } from "@/lib/library/extract-text"

const MAX_SIZE_MB = 50
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export async function GET() {
  const documents = await prisma.document.findMany({
    select: {
      id: true,
      name: true,
      size: true,
      starred: true,
      hidden: true,
      uploadedAt: true,
      folderId: true,
    },
    orderBy: { uploadedAt: "desc" },
  })
  return NextResponse.json({ documents })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null)
  const file = formData?.get("file")

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const fileNameLower = file.name.toLowerCase()
  if (!fileNameLower.endsWith(".pdf") && !fileNameLower.endsWith(".md")) {
    return NextResponse.json(
      { error: "Only PDF and Markdown (.md) files are accepted." },
      { status: 422 },
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File exceeds the ${MAX_SIZE_MB} MB limit.` },
      { status: 413 },
    )
  }

  const data = Buffer.from(await file.arrayBuffer())
  const folderId = formData?.get("folderId")
  const content = await extractText(data, file.name)

  const document = await prisma.document.create({
    data: {
      name: file.name,
      size: file.size,
      data,
      content: content || null,
      ...(typeof folderId === "string" && folderId ? { folderId } : {}),
    },
    select: {
      id: true,
      name: true,
      size: true,
      starred: true,
      hidden: true,
      uploadedAt: true,
      folderId: true,
    },
  })

  return NextResponse.json({ document })
}
