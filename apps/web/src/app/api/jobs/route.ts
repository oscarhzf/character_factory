import { createSuccessResponse, jobCreateInputSchema } from "@character-factory/core";
import { createJob, generateExploreCandidates } from "@character-factory/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createRouteErrorResponse } from "@/lib/route-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = jobCreateInputSchema.parse(await request.json());
    const createdJob = await createJob(payload);
    const job =
      createdJob.mode === "explore"
        ? await generateExploreCandidates(createdJob.id)
        : createdJob;
    return NextResponse.json(createSuccessResponse(job), { status: 201 });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
