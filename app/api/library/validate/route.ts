import { NextRequest, NextResponse } from "next/server"

const MAX_SIZE_MB = 50
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body || typeof body.name !== "string" || typeof body.size !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  if (!body.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Only PDF files are accepted." },
      { status: 422 },
    )
  }

  if (body.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File exceeds the ${MAX_SIZE_MB} MB limit.` },
      { status: 413 },
    )
  }

  return NextResponse.json({ ok: true })
}
