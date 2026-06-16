import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Only PDF files are accepted." },
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

  const document = await prisma.document.create({
    data: {
      name: file.name,
      size: file.size,
      data,
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
