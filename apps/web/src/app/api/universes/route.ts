import {
  createSuccessResponse,
  universeCreateInputSchema
} from "@character-factory/core";
import { createUniverse, listUniverses } from "@character-factory/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createRouteErrorResponse } from "@/lib/route-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const universes = await listUniverses();
    return NextResponse.json(createSuccessResponse(universes));
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = universeCreateInputSchema.parse(await request.json());
    const universe = await createUniverse(payload);
    return NextResponse.json(createSuccessResponse(universe), { status: 201 });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
