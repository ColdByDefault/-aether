import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const folders = await prisma.folder.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { documents: true } },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({
    folders: folders.map((f) => ({
      id: f.id,
      name: f.name,
      createdAt: f.createdAt,
      documentCount: f._count.documents,
    })),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name.trim() : ""

  if (!name) {
    return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
  }

  const folder = await prisma.folder.create({
    data: { name },
    select: { id: true, name: true, createdAt: true },
  })

  return NextResponse.json({ folder: { ...folder, documentCount: 0 } })
}
