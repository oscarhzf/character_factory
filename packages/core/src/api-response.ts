export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<TData> {
  success: boolean;
  data: TData | null;
  error: ApiErrorPayload | null;
}

export function createSuccessResponse<TData>(data: TData): ApiResponse<TData> {
  return {
    success: true,
    data,
    error: null
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      details
    }
  };
}

