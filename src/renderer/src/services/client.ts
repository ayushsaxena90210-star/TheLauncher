const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8765/api/v1";

type ApiErrorPayload = {
  detail?: { code?: string; message?: string } | string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: ApiErrorPayload | undefined;
  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    // Keep a useful generic error when a local process returns a non-JSON response.
  }

  const detail = payload?.detail;
  const message =
    typeof detail === "object" && detail?.message
      ? detail.message
      : typeof detail === "string"
        ? detail
        : `Request failed with status ${response.status}.`;
  const code = typeof detail === "object" ? detail?.code : undefined;
  return new ApiError(message, response.status, code);
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new ApiError("The local service could not be reached.", 0, "service_unavailable");
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
