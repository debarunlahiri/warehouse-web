"use client";

import { useEffect, useState } from "react";
import { INITIAL_THROUGHPUT, ZONES, type Zone } from "./data";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Simulated live telemetry: loads and throughput drift a little every 2 seconds. */
export function useLive() {
  const [zones, setZones] = useState<Zone[]>(ZONES);
  const [throughput, setThroughput] = useState<number[]>(INITIAL_THROUGHPUT);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const first = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => {
      setNow(new Date());
      setZones((zs) =>
        zs.map((z) => ({
          ...z,
          load: clamp(z.load + Math.round((Math.random() - 0.5) * 4), 20, 99),
          temp: clamp(+(z.temp + (Math.random() - 0.5) * 0.4).toFixed(1), 15, 30),
        })),
      );
      setThroughput((t) => {
        const last = t[t.length - 1];
        const next = clamp(last + Math.round((Math.random() - 0.5) * 14), 280, 440);
        return [...t.slice(0, -1), next];
      });
    }, 2000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return { zones, throughput, now };
}
