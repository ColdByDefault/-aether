import { prisma } from '@/lib/prisma';

interface RawBucket {
  bucket: Date;
  cpuPct: number | null;
  memPct: number | null;
  swapPct: number | null;
  tempC: number | null;
  powerW: number | null;
  batteryPct: number | null;
}

export async function GET(): Promise<Response> {
  try {
    const rows = await prisma.$queryRaw<RawBucket[]>`
      SELECT
        to_timestamp(floor(extract(epoch from "capturedAt") / 60) * 60)::timestamptz AS bucket,
        avg("cpuPct")::float     AS "cpuPct",
        avg("memPct")::float     AS "memPct",
        avg("swapPct")::float    AS "swapPct",
        avg("tempC")::float      AS "tempC",
        avg("powerW")::float     AS "powerW",
        avg("batteryPct")::float AS "batteryPct"
      FROM "SystemSnapshot"
      WHERE "capturedAt" > now() - interval '24 hours'
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return Response.json({
      buckets: rows.map((r) => ({
        ts:         r.bucket instanceof Date ? r.bucket.toISOString() : String(r.bucket),
        cpuPct:     r.cpuPct,
        memPct:     r.memPct,
        swapPct:    r.swapPct,
        tempC:      r.tempC,
        powerW:     r.powerW,
        batteryPct: r.batteryPct,
      })),
    });
  } catch (err) {
    console.error('History query error:', err);
    return Response.json({ error: 'Failed to load history' }, { status: 500 });
  }
}
