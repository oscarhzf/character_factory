import {
  createSuccessResponse,
  generationJobCreateInputSchema,
  generationJobListQuerySchema
} from "@character-factory/core";
import { createGenerationJob, listGenerationJobs } from "@character-factory/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createRouteErrorResponse } from "@/lib/route-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = generationJobListQuerySchema.parse({
      characterId: request.nextUrl.searchParams.get("characterId") ?? undefined,
      mode: request.nextUrl.searchParams.get("mode") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined
    });

    const jobs = await listGenerationJobs(query);
    return NextResponse.json(createSuccessResponse(jobs));
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = generationJobCreateInputSchema.parse(await request.json());
    const job = await createGenerationJob(payload);
    return NextResponse.json(createSuccessResponse(job), { status: 201 });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
