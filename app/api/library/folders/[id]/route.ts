import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type RouteParams = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  // Documents in this folder fall back to unfiled (folderId: null) via onDelete: SetNull.
  await prisma.folder.delete({ where: { id } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
