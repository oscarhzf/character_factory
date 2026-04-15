export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}

export function createNotFoundError(entityName: string): ServiceError {
  return new ServiceError(
    "NOT_FOUND",
    404,
    `${entityName} was not found.`
  );
}

export function createDependencyError(message: string): ServiceError {
  return new ServiceError("DEPENDENCY_CONFLICT", 409, message);
}

export function mapDatabaseError(error: unknown): ServiceError {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    if (error.code === "23505") {
      return new ServiceError(
        "UNIQUE_CONSTRAINT_VIOLATION",
        409,
        "A record with the same unique value already exists."
      );
    }

    if (error.code === "23503") {
      return new ServiceError(
        "FOREIGN_KEY_VIOLATION",
        409,
        "A related record is missing or protected by a foreign key."
      );
    }
  }

  return new ServiceError("INTERNAL_ERROR", 500, "Unexpected server error.");
}

