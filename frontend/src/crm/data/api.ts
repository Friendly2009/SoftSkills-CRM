import type { CrmDataSource } from './commands';
import { parseSnapshot } from './validation';
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export function createApiSource(baseUrl: string): CrmDataSource {
  const base = baseUrl.replace(/\/$/, '');
  async function request(path: string, signal: AbortSignal, body?: unknown) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal.aborted) abort();
    signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 30000);
    try {
      const response = await fetch(base + path, {
        method: body === undefined ? 'GET' : 'POST', credentials: 'include',
        headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal,
      });
      if (response.status === 204 && response.ok) return null;
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false) {
        const message = response.status === 401 ? 'Сессия истекла. Войдите в систему.' :
          response.status === 403 ? 'Недостаточно прав для этого действия.' :
          response.status === 404 ? 'API нового интерфейса CRM не найден. Проверьте адрес и маршруты сервера.' :
          response.status === 409 ? 'Данные изменились на сервере. Обновите страницу перед повторной операцией.' :
          typeof data?.message === 'string' ? data.message : `Ошибка API (${response.status}).`;
        throw new ApiError(message, response.status);
      }
      return data;
    } catch (error) {
      if (signal.aborted || error instanceof ApiError) throw error;
      throw new Error('Не удалось получить ответ сервера. Проверьте соединение. Если выполнялась запись, обновите данные перед повтором.');
    } finally {
      clearTimeout(timeout); signal.removeEventListener('abort', abort);
    }
  }
  return {
    load: async signal => parseSnapshot(await request('/crm/bootstrap', signal)),
    execute: async (command, expectedRevision, requestId, signal) => parseSnapshot(await request('/crm/commands', signal, { command, expectedRevision, requestId })),
    logout: async signal => { await request('/logout', signal); },
  };
}
