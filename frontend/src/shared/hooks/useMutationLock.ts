import { useRef, useState } from "react";
/** Ref prevents double clicks before React has rendered the pending state. */
export function useMutationLock() {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    try {
      return await action();
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  return { pending, run };
}
