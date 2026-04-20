import {
  characterCreateInputSchema,
  characterStatusSchema,
  createSuccessResponse
} from "@character-factory/core";
import { createCharacter, listCharacters } from "@character-factory/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createRouteErrorResponse } from "@/lib/route-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim();
    const statusValue = request.nextUrl.searchParams.get("status")?.trim();
    const status = statusValue
      ? characterStatusSchema.parse(statusValue)
      : undefined;

    const characters = await listCharacters({
      query: query && query.length > 0 ? query : undefined,
      status
    });
    return NextResponse.json(createSuccessResponse(characters));
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = characterCreateInputSchema.parse(await request.json());
    const character = await createCharacter(payload);
    return NextResponse.json(createSuccessResponse(character), { status: 201 });
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
