import { createRequire } from "module"

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const lower = filename.toLowerCase()

  if (lower.endsWith(".md")) {
    return buffer
      .toString("utf-8")
      .replace(/^#{1,6}\s+/gm, " ")
      .replace(/[*_`~]/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
      .replace(/^\s*[-*+]\s+/gm, " ")
      .replace(/^\s*\d+\.\s+/gm, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  if (lower.endsWith(".pdf")) {
    try {
      // Lazy-load to avoid module-level DOM globals crash
      const require = createRequire(import.meta.url)
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>
      const result = await pdfParse(buffer)
      return result.text.replace(/\s+/g, " ").trim()
    } catch {
      return ""
    }
  }

  return ""
}
