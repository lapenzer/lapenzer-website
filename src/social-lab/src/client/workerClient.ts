import { useEffect, useRef } from "react";
export function useEngine(onEvents?: (events: any[]) => void) {
  const worker = useRef<Worker | null>(null),
    next = useRef(0),
    pending = useRef(
      new Map<
        number,
        {
          resolve: (v: any) => void;
          reject: (e: Error) => void;
          progress?: (data: any) => void;
        }
      >(),
    ),
    events = useRef(onEvents);
  events.current = onEvents;
  useEffect(() => {
    const w = new Worker(new URL("../engine/worker.ts", import.meta.url), {
      type: "module",
    });
    worker.current = w;
    w.onmessage = ({ data: m }) => {
      if (m.type === "eventBatch") {
        events.current?.(m.data);
        return;
      }
      const p = pending.current.get(m.id);
      if (!p) return;
      if (m.type === "progress") {
        p.progress?.(m.data);
        return;
      }
      pending.current.delete(m.id);
      if (m.type === "error") p.reject(new Error(m.data));
      else p.resolve(m.data);
    };
    w.onerror = () => {
      for (const p of pending.current.values())
        p.reject(
          new Error(
            "The computation worker failed. Restore a saved checkpoint or reduce the population.",
          ),
        );
      pending.current.clear();
    };
    return () => {
      w.terminate();
      worker.current = null;
    };
  }, []);
  return {
    request: (type: string, payload?: any, progress?: (data: any) => void) =>
      new Promise<any>((resolve, reject) => {
        if (!worker.current) {
          reject(new Error("Simulation worker is not ready."));
          return;
        }
        const id = ++next.current;
        pending.current.set(id, { resolve, reject, progress });
        worker.current.postMessage({ id, type, payload });
      }),
    cancel: () => worker.current?.postMessage({ id: 0, type: "cancel" }),
  };
}
