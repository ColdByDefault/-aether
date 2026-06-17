import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100_000, 32, "sha256")
}

export async function GET() {
  const secrets = await prisma.secret.findMany({
    select: {
      id: true,
      title: true,
      key: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ secrets })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const { title, key, value, notes, password } = body ?? {}

  if (!title || !key || !value || !password) {
    return NextResponse.json(
      { error: "title, key, value, and password are required" },
      { status: 400 }
    )
  }

  if (notes && notes.length > 150) {
    return NextResponse.json(
      { error: "Notes must be 150 characters or fewer" },
      { status: 400 }
    )
  }

  const salt = crypto.randomBytes(16)
  const derivedKey = deriveKey(password, salt)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", derivedKey, iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  const secret = await prisma.secret.create({
    data: {
      title,
      key,
      encryptedValue: encrypted.toString("hex"),
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
      salt: salt.toString("hex"),
      notes: notes || null,
    },
    select: {
      id: true,
      title: true,
      key: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ secret }, { status: 201 })
}
