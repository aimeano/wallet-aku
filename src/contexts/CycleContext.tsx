import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

const STORAGE_KEY = "pocket.resetDay";

interface CycleWindow {
  start: Date; // inclusive, 00:00 local
  end: Date;   // inclusive, 00:00 local (last day of cycle)
}

interface Ctx {
  resetDay: number;
  setResetDay: (d: number) => void;
  cycle: CycleWindow;
  isInCurrentCycle: (isoDate: string) => boolean;
  formatRange: () => string;
}

const CycleContext = createContext<Ctx | null>(null);

const clamp = (d: number) => Math.max(1, Math.min(28, Math.floor(d || 1)));

const computeCycle = (resetDay: number, ref = new Date()): CycleWindow => {
  const day = clamp(resetDay);
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const d = ref.getDate();
  let start: Date;
  if (d >= day) {
    start = new Date(y, m, day);
  } else {
    start = new Date(y, m - 1, day);
  }
  const end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return { start, end };
};

export const CycleProvider = ({ children }: { children: ReactNode }) => {
  const [resetDay, setResetDayState] = useState<number>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const n = stored ? parseInt(stored, 10) : 1;
    return clamp(isNaN(n) ? 1 : n);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(resetDay));
  }, [resetDay]);

  const cycle = useMemo(() => computeCycle(resetDay), [resetDay]);

  const isInCurrentCycle = (isoDate: string) => {
    const d = new Date(isoDate + "T00:00:00");
    d.setHours(0, 0, 0, 0);
    return d.getTime() >= cycle.start.getTime() && d.getTime() <= cycle.end.getTime();
  };

  const formatRange = () => {
    const fmt = (x: Date) =>
      x.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(cycle.start)} – ${fmt(cycle.end)}`;
  };

  return (
    <CycleContext.Provider
      value={{ resetDay, setResetDay: (d) => setResetDayState(clamp(d)), cycle, isInCurrentCycle, formatRange }}
    >
      {children}
    </CycleContext.Provider>
  );
};

export const useCycle = () => {
  const ctx = useContext(CycleContext);
  if (!ctx) throw new Error("useCycle must be used within CycleProvider");
  return ctx;
};
