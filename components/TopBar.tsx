"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Alert } from "@/lib/data";
import type { Theme } from "./Scene3D";

type MenuId = "bell" | "gear" | "user" | null;

export type Prefs = {
  theme: Theme;
  reflections: boolean;
  focus: boolean;
};

function Switch({ on }: { on: boolean }) {
  return <span className="switch" data-on={on}><i /></span>;
}

function IconButton({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick} aria-label={label} aria-expanded={active}
      className="relative grid h-8 w-8 place-items-center rounded text-[var(--muted)] transition-colors hover:text-[var(--text)]"
      style={{ color: active ? "var(--amber)" : undefined }}
    >{children}</button>
  );
}

export default function TopBar({
  now, alerts, prefs, onPrefs, onReset,
}: {
  now: Date | null;
  alerts: Alert[];
  prefs: Prefs;
  onPrefs: (p: Partial<Prefs>) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState<MenuId>(null);
  const [seen, setSeen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const time = now ? now.toISOString().slice(11, 16) : "--:--";
  const unread = alerts.filter((a) => a.sev === "crit" || a.sev === "warn").length;

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(null);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const toggle = (m: Exclude<MenuId, null>) => setOpen((o) => (o === m ? null : m));
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
    setOpen(null);
  };

  return (
    <header ref={root} className="panel relative z-30 flex h-14 items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <span className="hidden gap-1.5 sm:flex">
          <i className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <i className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <i className="h-3 w-3 rounded-full bg-[#28c840]" />
        </span>
        <div className="leading-tight sm:ml-3">
          <div className="flex items-center gap-2 text-[15px] font-semibold tracking-wide text-[var(--text)]">
            WH-02 <span className="text-[10px] text-[var(--muted)]">⌄</span>
            <span className="flex items-center gap-1 text-[11px] font-normal text-[#22c55e]">
              <i className="live-dot h-1.5 w-1.5 rounded-full bg-[#22c55e]" /> LIVE
            </span>
          </div>
          <div className="label">North Campus · {time} UTC</div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 md:block">
        <svg width="34" height="34" viewBox="0 0 34 34" fill="var(--amber)">
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={16} y={4} width={2.4} height={i % 2 ? 9 : 12} rx={1} transform={`rotate(${i * 30} 17 17)`} />
          ))}
        </svg>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative">
          <IconButton active={open === "bell"} label="Notifications" onClick={() => toggle("bell")}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
            {!seen && unread > 0 && (
              <b className="absolute right-0 top-0 grid h-4 w-4 place-items-center rounded-full bg-[var(--amber)] text-[9px] text-black">{unread}</b>
            )}
          </IconButton>
          {open === "bell" && (
            <div className="menu right-0 top-10 w-72">
              <div className="label border-b border-[var(--line)] px-3 py-2">NOTIFICATIONS</div>
              {alerts.map((a) => (
                <div key={a.id} className="flex gap-2 border-b border-[var(--line)] px-3 py-2 last:border-0">
                  <span className="font-mono text-[10px] text-[var(--muted)]">{a.time}</span>
                  <div className="leading-tight">
                    <div className="text-[11px] text-[var(--text)]">{a.title}</div>
                    <div className="text-[10px] text-[var(--muted)]">{a.detail}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => { setSeen(true); setOpen(null); }} className="menu-item">MARK ALL AS READ</button>
            </div>
          )}
        </div>

        <div className="relative">
          <IconButton active={open === "gear"} label="Display settings" onClick={() => toggle("gear")}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></svg>
          </IconButton>
          {open === "gear" && (
            <div className="menu right-0 top-10 w-60">
              <div className="label border-b border-[var(--line)] px-3.5 py-2.5">DISPLAY</div>
              <div className="menu-item !cursor-default hover:!bg-transparent">
                THEME
                <span className="flex overflow-hidden rounded-sm border border-[var(--line2)] text-[10px]">
                  {(["dark", "light"] as const).map((t) => (
                    <button key={t} onClick={() => onPrefs({ theme: t })} className="px-2 py-1 uppercase"
                      style={{ background: prefs.theme === t ? "var(--line)" : "transparent", color: prefs.theme === t ? "var(--text)" : "var(--muted)" }}>{t}</button>
                  ))}
                </span>
              </div>
              <button className="menu-item" onClick={() => onPrefs({ reflections: !prefs.reflections })}>FLOOR REFLECTIONS <Switch on={prefs.reflections} /></button>
              <button className="menu-item" onClick={() => onPrefs({ focus: !prefs.focus })}>FOCUS MODE <Switch on={prefs.focus} /></button>
              <div className="border-t border-[var(--line)]" />
              <button className="menu-item" onClick={() => { onReset(); setOpen(null); }}>RESET VIEW</button>
              <button className="menu-item" onClick={fullscreen}>FULL SCREEN</button>
            </div>
          )}
        </div>

        <div className="hidden text-right leading-tight sm:block">
          <div className="text-[12px] font-semibold tracking-wider text-[var(--text)]">SHIFT B</div>
          <div className="label">HANDOVER 4H 29M</div>
        </div>
        <div className="hidden -space-x-2 sm:flex">
          {["#7a5c3a", "#4d6a7a", "#8a4d5a"].map((c, i) => (
            <i key={i} className="h-7 w-7 rounded-full border-2 border-[var(--panel)]" style={{ background: c }} />
          ))}
          <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[var(--panel)] bg-[var(--line)] text-[10px] text-[var(--muted)]">+3</span>
        </div>

        <div className="relative">
          <button onClick={() => toggle("user")} aria-label="Account menu" className="relative flex items-center gap-1 text-[var(--muted)]">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line2)] bg-[var(--line)] text-[11px] text-[var(--text)]">AM</span>
            <i className="absolute bottom-0 left-6 h-2 w-2 rounded-full border border-[var(--panel)] bg-[#22c55e]" />
            <span className="text-[10px]">⌄</span>
          </button>
          {open === "user" && (
            <div className="menu right-0 top-11 w-64">
              <div className="flex items-center gap-3 border-b border-[var(--line)] p-3">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line2)] bg-[var(--line)] text-[12px]">AM</span>
                <div className="leading-tight">
                  <div className="text-[13px] font-semibold tracking-wide text-[var(--text)]">ALEX MORGAN</div>
                  <div className="label">SHIFT LEAD · SHIFT B</div>
                  <div className="font-mono text-[9px] text-[var(--muted)]">WH2-04817</div>
                </div>
              </div>
              <button className="menu-item">PROFILE <span>›</span></button>
              <button className="menu-item">ACCOUNT &amp; SECURITY <span>›</span></button>
              <button className="menu-item">PREFERENCES <span>›</span></button>
              <div className="border-t border-[var(--line)]" />
              <button className="menu-item !text-[#ef4444]" onClick={() => setOpen(null)}>SIGN OUT</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
