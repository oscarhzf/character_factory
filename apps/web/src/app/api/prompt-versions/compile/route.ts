import {
  createSuccessResponse,
  promptCompileInputSchema
} from "@character-factory/core";
import { compilePromptVersions } from "@character-factory/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createRouteErrorResponse } from "@/lib/route-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = promptCompileInputSchema.parse(await request.json());
    const result = await compilePromptVersions(payload);
    return NextResponse.json(createSuccessResponse(result), { status: 201 });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
