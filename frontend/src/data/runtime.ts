export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
// Only the App-owned provider configures legacy public-page requests.
let isMock = true;
let generation = 0;
const active = new Set<AbortController>();
export function configureDataMode(next: boolean) {
  isMock = next; generation++;
  active.forEach(c => c.abort()); active.clear();
}
export async function legacyFetch(input: string, init?: RequestInit): Promise<Response> {
  // Calls in these components all belong to this CRM. Native fetch is never patched.
  const url = new URL(input, 'https://crm.local');
  const path = url.pathname.replace(/^\/api(?=\/)/, '') + url.search;
  if (isMock) {
    if (['/signin', '/signup', '/logout', '/checkconnect'].includes(path))
      return Response.json({ success: true });
    if (['/getfeedbacks', '/getmyfeedback'].includes(path))
      return Response.json([]);
    return Response.json({ success: false, message: 'Этот старый экран недоступен в демо. Откройте /dashboard.' }, { status: path === '/getsession' ? 401 : 404 });
  }
  const controller = new AbortController(); active.add(controller);
  const epoch = generation;
  const abort = () => controller.abort();
  if (init?.signal?.aborted) abort();
  init?.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 30000);
  try {
    const response = await fetch(API_BASE_URL + path, { ...init, credentials: 'include', signal: controller.signal });
    if (epoch !== generation) throw new DOMException('Mode changed', 'AbortError');
    return response;
  } finally { clearTimeout(timer); active.delete(controller); init?.signal?.removeEventListener('abort', abort); }
}
