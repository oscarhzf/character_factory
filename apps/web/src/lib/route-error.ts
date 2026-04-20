import { createErrorResponse } from "@character-factory/core";
import { isServiceError } from "@character-factory/db";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function createRouteErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      createErrorResponse("VALIDATION_ERROR", "Request validation failed.", {
        issues: error.issues
      }),
      { status: 400 }
    );
  }

  if (isServiceError(error)) {
    return NextResponse.json(
      createErrorResponse(error.code, error.message, error.details),
      {
        status: error.statusCode
      }
    );
  }

  return NextResponse.json(
    createErrorResponse("INTERNAL_ERROR", "Unexpected server error."),
    {
      status: 500
    }
  );
}

