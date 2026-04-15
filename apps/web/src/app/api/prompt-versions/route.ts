import {
  createSuccessResponse,
  promptVersionListQuerySchema
} from "@character-factory/core";
import { listPromptVersions } from "@character-factory/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createRouteErrorResponse } from "@/lib/route-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = promptVersionListQuerySchema.parse({
      characterId: request.nextUrl.searchParams.get("characterId"),
      limit: request.nextUrl.searchParams.get("limit") ?? undefined
    });

    const versions = await listPromptVersions(query.characterId, query.limit);
    return NextResponse.json(createSuccessResponse(versions));
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
