import { createSuccessResponse } from "@character-factory/core";
import { getApplicationHealth } from "@character-factory/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getApplicationHealth();

  return NextResponse.json(createSuccessResponse(health));
}

