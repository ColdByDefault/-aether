import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const document = await prisma.document.findUnique({
    where: { id },
    select: { name: true, data: true },
  })

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return new NextResponse(Buffer.from(document.data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${document.name.replace(/"/g, "")}"`,
    },
  })
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const body = await req.json().catch(() => null)

  if (!body || (typeof body.starred !== "boolean" && typeof body.hidden !== "boolean")) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const document = await prisma.document
    .update({
      where: { id },
      data: {
        ...(typeof body.starred === "boolean" ? { starred: body.starred } : {}),
        ...(typeof body.hidden === "boolean" ? { hidden: body.hidden } : {}),
      },
      select: {
        id: true,
        name: true,
        size: true,
        starred: true,
        hidden: true,
        uploadedAt: true,
      },
    })
    .catch(() => null)

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ document })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  await prisma.document.delete({ where: { id } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
