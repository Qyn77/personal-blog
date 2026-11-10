import { useEffect, useRef, useState } from "react";

/** A local recovery copy is separate from an explicitly saved server draft. */
export function useLocalDraft<T>({
  storageKey,
  value,
  ready,
  validate,
  restore,
}: {
  storageKey: string;
  value: T;
  ready: boolean;
  validate: (value: unknown) => T | null;
  restore: (value: T) => void;
}) {
  const serialized = JSON.stringify(value);
  const baseline = useRef<string | null>(null);
  const cleared = useRef(false);
  const [initialized, setInitialized] = useState(false);
  const [recovery, setRecovery] = useState<T | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [storageError, setStorageError] = useState(false);
  const dirty =
    initialized && baseline.current !== serialized && !cleared.current;

  useEffect(() => {
    if (!ready || initialized) return;
    baseline.current = serialized;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const data = parsed.version === 1 ? validate(parsed.value) : null;
        if (data && JSON.stringify(data) !== serialized) setRecovery(data);
      }
    } catch {
      setStorageError(true);
    }
    setInitialized(true);
  }, [ready, initialized, serialized, storageKey, validate]);

  useEffect(() => {
    if (!initialized || recovery || cleared.current) return;
    try {
      if (dirty) {
        const now = Date.now();
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            version: 1,
            savedAt: now,
            value: JSON.parse(serialized),
          })
        );
        setSavedAt(now);
      } else {
        localStorage.removeItem(storageKey);
        setSavedAt(null);
      }
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [initialized, recovery, dirty, serialized, storageKey]);

  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      if (cleared.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const leave = (event: MouseEvent) => {
      if (
        cleared.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element)?.closest?.(
        "a[href]"
      ) as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const next = new URL(link.href);
      if (
        next.origin === location.origin &&
        next.pathname === location.pathname &&
        next.search === location.search
      )
        return;
      if (!window.confirm("修改尚未保存到服务器，确定离开编辑器？")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", leave, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", leave, true);
    };
  }, [dirty]);

  return {
    dirty,
    recovery,
    savedAt,
    storageError,
    recover() {
      if (recovery) restore(recovery);
      setRecovery(null);
    },
    discard() {
      try {
        localStorage.removeItem(storageKey);
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
      setRecovery(null);
    },
    clear() {
      cleared.current = true;
      baseline.current = serialized;
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* Navigation remains safe after server save. */
      }
    },
  };
}
