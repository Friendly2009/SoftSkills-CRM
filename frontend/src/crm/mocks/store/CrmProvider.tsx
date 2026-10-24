import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MockDatabase } from '../../interfaces/common';
import type { CrmCommand, Snapshot } from '../../data/commands';
import { createMockSource, loadMockState } from '../../data/mock';
import { ApiError, createApiSource } from '../../data/api';
interface Store {
  db: MockDatabase;
  isMock: boolean;
  pending: boolean;
  mutate: (command: CrmCommand, message?: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  toast: string;
  notify: (message: string) => void;
}
const Context = createContext<Store | null>(null);
export function CrmProvider({ children, isMock = true, apiBaseUrl = '/api' }: { children: ReactNode; isMock?: boolean; apiBaseUrl?: string }) {
  // Changing either setting destroys the old store, forms and in-flight requests.
  return <StoreSession key={`${isMock}:${apiBaseUrl}`} isMock={isMock} apiBaseUrl={apiBaseUrl}>{children}</StoreSession>;
}
function StoreSession({ children, isMock, apiBaseUrl }: { children: ReactNode; isMock: boolean; apiBaseUrl: string }) {
  const navigate = useNavigate();
  const [initial] = useState<Snapshot | null>(() => isMock ? { data: loadMockState(), revision: '0' } : null);
  const [source] = useState(() => isMock ? createMockSource(initial!.data) : createApiSource(apiBaseUrl));
  const [snapshot, setSnapshot] = useState(initial);
  const current = useRef(initial);
  const [error, setError] = useState('');
  const [attempt, retry] = useState(0);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const retryRequest = useRef<{ signature: string; id: string } | null>(null);
  const [toast, setToast] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const alive = useRef(true);
  const requests = useRef(new Set<AbortController>());
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; clearTimeout(timer.current); requests.current.forEach(c => c.abort()); requests.current.clear(); };
  }, []);
  function notify(message: string) {
    if (!alive.current) return;
    setToast(message); clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 6000);
  }
  function handleError(e: unknown) {
    if (!alive.current) return;
    if (e instanceof ApiError && e.status === 401) {
      current.current = null; setSnapshot(null);
      navigate('/authorization', { replace: true });
    }
    return e instanceof Error ? e.message : 'Не удалось выполнить операцию.';
  }
  useEffect(() => {
    if (isMock) return;
    const controller = new AbortController(); requests.current.add(controller);
    setError('');
    source.load(controller.signal).then(next => {
      if (!controller.signal.aborted && alive.current) { current.current = next; setSnapshot(next); }
    }).catch(e => {
      if (!controller.signal.aborted && alive.current) setError(handleError(e) || 'Ошибка загрузки.');
    }).finally(() => requests.current.delete(controller));
    return () => controller.abort();
  }, [source, isMock, attempt]);
  async function mutate(command: CrmCommand, message = 'Изменения сохранены'): Promise<boolean> {
    if (busy.current || !current.current) return false;
    busy.current = true; setPending(true);
    const controller = new AbortController(); requests.current.add(controller);
    try {
      const signature = JSON.stringify({ command, revision: current.current.revision });
      if (retryRequest.current?.signature !== signature) retryRequest.current = { signature, id: crypto.randomUUID() };
      const next = await source.execute(command, current.current.revision, retryRequest.current.id, controller.signal);
      if (!alive.current || controller.signal.aborted) return false;
      retryRequest.current = null;
      current.current = next; setSnapshot(next); notify(message);
      return true;
    } catch (e) {
      if (alive.current && !controller.signal.aborted) notify(handleError(e) || 'Ошибка сохранения.');
      return false;
    } finally {
      requests.current.delete(controller); busy.current = false;
      if (alive.current) setPending(false);
    }
  }
  async function logout() {
    if (busy.current) return false;
    busy.current = true; setPending(true);
    const controller = new AbortController(); requests.current.add(controller);
    try {
      await source.logout(controller.signal);
      if (!alive.current || controller.signal.aborted) return false;
      navigate('/', { replace: true }); return true;
    } catch (e) { notify(handleError(e) || 'Не удалось выйти.'); return false; }
    finally { requests.current.delete(controller); busy.current = false; if (alive.current) setPending(false); }
  }
  if (!snapshot) return <div className="crm-root" style={{ padding: 32 }}>
    {error ? <div role="alert"><p>{error}</p><button onClick={() => retry(n => n + 1)}>Повторить загрузку</button></div> : <p role="status">Загрузка данных CRM…</p>}
  </div>;
  return <Context.Provider value={{ db: snapshot.data, isMock, pending, mutate, logout, toast, notify }}>
    <fieldset disabled={pending} aria-busy={pending} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>{children}</fieldset>
    {pending && <div className="crm-toast" role="status">Сохранение…</div>}
  </Context.Provider>;
}
export function useCrm() {
  const value = useContext(Context);
  if (!value) throw new Error('CrmProvider required');
  return value;
}
