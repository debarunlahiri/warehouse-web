"use client";

import { useMemo, useState } from "react";
import { ASSETS, ZONES, type Asset, type ZoneId } from "@/lib/data";

export default function Search({ onPick }: { onPick: (zone: ZoneId, asset?: Asset) => void }) {
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const term = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!term) return [];
    const zs = ZONES.filter((z) => z.name.toLowerCase().includes(term) || z.short.toLowerCase().includes(term)).map((z) => ({ key: z.id, label: z.name.toUpperCase(), sub: "ZONE", zone: z.id, asset: undefined as Asset | undefined }));
    const as = ASSETS.filter((a) => a.name.toLowerCase().includes(term) || a.id.toLowerCase().includes(term)).map((a) => ({ key: a.id, label: a.name, sub: `${a.state.toUpperCase()} · ${a.zone.toUpperCase()}`, zone: a.zone, asset: a as Asset | undefined }));
    return [...zs, ...as].slice(0, 7);
  }, [term]);

  return (
    <div className="relative w-64 sm:w-72">
      <div className="glass flex items-center gap-2 rounded-md px-3 py-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <input
          value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 120)}
          placeholder="SEARCH WH-02…" aria-label="Search the warehouse"
          className="w-full bg-transparent text-[11px] tracking-wider text-[var(--text)] placeholder-[var(--muted)] outline-none"
        />
        <span className="grid h-4 w-4 place-items-center rounded-full border border-[var(--line2)] text-[9px] text-[var(--muted)]">?</span>
      </div>
      {focus && term && (
        <ul className="menu left-0 right-0 top-11 max-h-64 overflow-auto">
          {results.length === 0 && <li className="px-3 py-3 text-[11px] text-[var(--muted)]">NO MATCHES</li>}
          {results.map((r) => (
            <li key={r.key}>
              <button className="menu-item" onMouseDown={() => { onPick(r.zone, r.asset); setQ(""); }}>
                <span>{r.label}</span><span className="text-[10px] text-[var(--muted)]">{r.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
