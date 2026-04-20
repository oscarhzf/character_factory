import {
  entityIdParamsSchema,
  characterUpdateInputSchema,
  createSuccessResponse
} from "@character-factory/core";
import {
  deleteCharacter,
  getCharacter,
  updateCharacter
} from "@character-factory/db";
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
    const character = await getCharacter(id);
    return NextResponse.json(createSuccessResponse(character));
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = entityIdParamsSchema.parse(await context.params);
    const payload = characterUpdateInputSchema.parse(await request.json());
    await updateCharacter(id, payload);
    const character = await getCharacter(id);
    return NextResponse.json(createSuccessResponse(character));
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = entityIdParamsSchema.parse(await context.params);
    await deleteCharacter(id);
    return NextResponse.json(createSuccessResponse({ id }));
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
