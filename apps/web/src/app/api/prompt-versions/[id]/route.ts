import {
  createSuccessResponse,
  entityIdParamsSchema
} from "@character-factory/core";
import { getPromptVersion } from "@character-factory/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createRouteErrorResponse } from "@/lib/route-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = entityIdParamsSchema.parse(await context.params);
    const version = await getPromptVersion(id);
    return NextResponse.json(createSuccessResponse(version));
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
