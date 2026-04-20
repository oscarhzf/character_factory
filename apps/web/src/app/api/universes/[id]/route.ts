import {
  entityIdParamsSchema,
  createSuccessResponse,
  universeUpdateInputSchema
} from "@character-factory/core";
import {
  deleteUniverse,
  getUniverse,
  updateUniverse
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
    const universe = await getUniverse(id);
    return NextResponse.json(createSuccessResponse(universe));
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
    const payload = universeUpdateInputSchema.parse(await request.json());
    const universe = await updateUniverse(id, payload);
    return NextResponse.json(createSuccessResponse(universe));
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
    await deleteUniverse(id);
    return NextResponse.json(createSuccessResponse({ id }));
  } catch (error) {
    return createRouteErrorResponse(error);
  }
}
