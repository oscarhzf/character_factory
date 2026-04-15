import type { ApiResponse } from "@character-factory/core";

export async function requestApi<TData>(
  input: RequestInfo,
  init?: RequestInit
): Promise<TData> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const payload = (await response.json()) as ApiResponse<TData>;

  if (!response.ok || !payload.success || payload.data === null) {
    throw new Error(payload.error?.message ?? "Request failed.");
  }

  return payload.data;
}

