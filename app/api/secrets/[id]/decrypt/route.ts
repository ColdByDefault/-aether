import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100_000, 32, "sha256")
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  const { password } = body ?? {}

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 })
  }

  const secret = await prisma.secret.findUnique({ where: { id } })
  if (!secret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const derivedKey = deriveKey(password, Buffer.from(secret.salt, "hex"))
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      derivedKey,
      Buffer.from(secret.iv, "hex")
    )
    decipher.setAuthTag(Buffer.from(secret.authTag, "hex"))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(secret.encryptedValue, "hex")),
      decipher.final(),
    ])
    return NextResponse.json({ value: decrypted.toString("utf8") })
  } catch {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 })
  }
}
