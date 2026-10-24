import { createContext, useContext, useLayoutEffect, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { configureDataMode } from './runtime';
const Context = createContext<{ isMock: boolean; setIsMock: Dispatch<SetStateAction<boolean>> } | null>(null);
export function DataModeProvider({ isMock, setIsMock, children }: { isMock: boolean; setIsMock: Dispatch<SetStateAction<boolean>>; children: ReactNode }) {
  return <ModeSession key={String(isMock)} isMock={isMock} setIsMock={setIsMock}>{children}</ModeSession>;
}
function ModeSession({ isMock, setIsMock, children }: { isMock: boolean; setIsMock: Dispatch<SetStateAction<boolean>>; children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => { configureDataMode(isMock); setReady(true); return () => configureDataMode(true); }, [isMock]);
  return <Context.Provider value={{ isMock, setIsMock }}>{ready ? children : null}</Context.Provider>;
}
export function useDataMode() {
  const context = useContext(Context);
  if (!context) throw new Error('DataModeProvider required');
  return context;
}
