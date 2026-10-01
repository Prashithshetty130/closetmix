import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (error) {
    dbStatus = "unreachable";
  }

  const isHealthy = dbStatus === "healthy";
  const status = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        storage: {
          status: "healthy",
        },
      },
    },
    { status }
  );
}
