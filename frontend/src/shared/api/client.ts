export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
const baseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);
export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Не удалось выполнить операцию";
}
export function notifyError(message: string) {
  window.dispatchEvent(new CustomEvent("api:error", { detail: message }));
}
/** Only CRM calls use this client; native fetch and third-party requests remain untouched. */
export type RequestOptions = RequestInit & { silent?: boolean };
export async function apiFetch(
  path: string,
  init: RequestOptions = {},
): Promise<Response> {
  const { silent, ...options } = init;
  try {
    const response = await fetch(`${baseUrl}/${path.replace(/^\//, "")}`, {
      ...options,
      credentials: "include",
      signal: init.signal ?? AbortSignal.timeout(30000),
    });
    if (response.status === 401 && !["/signin", "/signup"].includes(path)) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    if (!response.ok) {
      const body = await response
        .clone()
        .json()
        .catch(() => null);
      const message =
        response.status === 403
          ? "Недостаточно прав для этого действия"
          : response.status === 401
            ? "Сессия истекла или неверные данные входа"
            : body?.message ||
              body?.error ||
              `Ошибка сервера (${response.status})`;
      if (!silent) notifyError(String(message));
      throw new ApiError(String(message), response.status);
    }
    return response;
  } catch (error) {
    if (
      error instanceof ApiError ||
      (error instanceof DOMException && error.name === "AbortError")
    )
      throw error;
    const message =
      "Не удалось связаться с сервером. Проверьте соединение и повторите попытку.";
    if (!silent) notifyError(message);
    throw new ApiError(message);
  }
}
export async function request<T>(
  path: string,
  init?: RequestOptions,
): Promise<T> {
  const response = await apiFetch(path, init);
  const data = await response.json();
  if (data?.success === false)
    throw new ApiError(
      data.message || data.error || "Операция отклонена сервером",
      response.status,
    );
  return data as T;
}
export const jsonBody = (
  value: unknown,
): Pick<RequestInit, "headers" | "body"> => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(value),
});
