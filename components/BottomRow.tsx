import { LineChart } from "./Charts";
import { ASSETS, THROUGHPUT_TARGET, type Alert, type Asset, type Severity, type Zone, type ZoneId } from "@/lib/data";

const SEV: Record<Severity, { tag: string; color: string; bars: number }> = {
  crit: { tag: "CRIT", color: "#ef4444", bars: 10 },
  warn: { tag: "WARN", color: "var(--amber)", bars: 7 },
  info: { tag: "INFO", color: "var(--muted)", bars: 3 },
  ok: { tag: "OK", color: "#22c55e", bars: 2 },
};

function Ticks({ value, color }: { value: number; color: string }) {
  const n = 44;
  return (
    <div className="mt-1 flex gap-[2px]">
      {Array.from({ length: n }).map((_, i) => (
        <i key={i} className="h-2.5 flex-1" style={{ background: i < (value / 100) * n ? color : "var(--off)" }} />
      ))}
    </div>
  );
}

export function BayLoad({ zones, selected, onSelect }: { zones: Zone[]; selected: ZoneId; onSelect: (z: ZoneId) => void }) {
  const hot = zones.filter((z) => z.load >= 90);
  return (
    <section className="panel p-4">
      <div className="flex justify-between"><h3 className="label">BAY LOAD</h3><span className="text-[10px] text-[var(--amber)]">● LIVE · 2S</span></div>
      <div className="mt-3 space-y-3">
        {zones.map((z) => (
          <button key={z.id} onClick={() => onSelect(z.id)} className="block w-full text-left">
            <div className="flex justify-between text-[12px]" style={{ color: z.id === selected ? "var(--text)" : "var(--soft)" }}>
              <span>{z.id === selected ? "▸ " : ""}{z.name.toUpperCase()}</span>
              <b className="font-mono" style={{ color: z.load >= 90 ? "var(--amber)" : "var(--text)" }}>{z.load}%</b>
            </div>
            <Ticks value={z.load} color={z.load >= 90 ? "var(--amber)" : "var(--bar)"} />
          </button>
        ))}
      </div>
      <div className="mt-3 text-[10px] text-[var(--amber)]">
        {hot.length ? `▲ ${hot.map((z) => z.name.toUpperCase()).join(", ")} ABOVE 90% · QUEUE +3` : "● ALL BAYS BELOW 90%"}
      </div>
    </section>
  );
}

export function ZoneStats({ zone, selectedAsset, onAsset }: { zone: Zone; selectedAsset: string; onAsset: (a: Asset) => void }) {
  const hot = zone.load >= 90;
  const stats = [
    ["LOAD", `${zone.load}`, "%", hot],
    ["WIP", `${zone.wip}`, "PALLETS", false],
    ["ACCURACY", `${zone.accuracy}`, "%", false],
    ["UPTIME · 30D", `${zone.uptime}`, "%", false],
    ["MOVES", "92", "/HR", false],
    ["CYCLE TIME", "58", "SEC", false],
  ] as const;
  const units = ASSETS.filter((a) => a.zone === zone.id);
  const run = units.filter((a) => a.state === "run").length;
  const idle = units.filter((a) => a.state === "idle").length;
  const down = units.filter((a) => a.state === "down").length;
  return (
    <section className="panel p-4">
      <div className="flex items-center justify-between">
        <h3 className="label">{zone.name.toUpperCase()} <span className="ml-1 rounded-sm border border-[var(--line2)] px-1">{zone.level}</span></h3>
        <span className="text-[10px] text-[var(--amber)]">● {hot ? "RUNNING HOT" : "NOMINAL"}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-y-3">
        {stats.map(([k, v, u, h]) => (
          <div key={k}>
            <div className="label">{k}</div>
            <div className="font-mono text-2xl" style={{ color: h ? "var(--amber)" : "var(--text)" }}>
              {v}<span className="ml-1 text-[10px] text-[var(--muted)]">{u}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="label">UNITS · {units.length}</span>
        <span className="text-[10px] text-[var(--muted)]">{run} RUN · {idle} IDLE · {down} DOWN</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {units.map((a) => (
          <button
            key={a.id}
            onClick={() => onAsset(a)}
            className="rounded-sm border px-2 py-1 font-mono text-[10px] transition-colors"
            style={{
              borderColor: a.state === "down" ? "#ef4444" : a.id === selectedAsset || a.state === "idle" ? "var(--amber)" : "var(--line2)",
              color: a.state === "down" ? "#ef4444" : a.id === selectedAsset ? "var(--amber)" : "var(--muted)",
              background: a.id === selectedAsset ? "var(--line)" : "transparent",
            }}
          >{a.id}</button>
        ))}
      </div>
    </section>
  );
}

export function Throughput({ data }: { data: number[] }) {
  const cur = data[data.length - 1];
  const delta = Math.abs(((cur - THROUGHPUT_TARGET) / THROUGHPUT_TARGET) * 100).toFixed(1);
  const labels = data.map((_, i) => `${String(i % 24).padStart(2, "0")}:00`);
  const above = cur >= THROUGHPUT_TARGET;
  return (
    <section className="panel flex flex-col p-4">
      <div className="flex justify-between"><h3 className="label">THROUGHPUT · 24H</h3><span className="label">TGT {THROUGHPUT_TARGET}/HR</span></div>
      <div className="mt-2 flex items-baseline gap-2">
        <b className="font-mono text-4xl text-[var(--text)]">{cur}</b>
        <span className="text-[10px] text-[var(--muted)]">PALLETS/HR</span>
        <span className="text-[10px]" style={{ color: above ? "#22c55e" : "var(--amber)" }}>
          {above ? "▲" : "▼"} {delta}% {above ? "ABOVE" : "BELOW"} TGT
        </span>
      </div>
      <div className="mt-1 min-h-0 flex-1"><LineChart data={data} target={THROUGHPUT_TARGET} labels={labels} /></div>
    </section>
  );
}

export function Alerts({ alerts }: { alerts: Alert[] }) {
  const crit = alerts.filter((a) => a.sev === "crit").length;
  const active = alerts.filter((a) => a.sev !== "ok").length;
  return (
    <section className="panel p-4">
      <div className="flex justify-between"><h3 className="label">ALERTS</h3><span className="text-[10px] text-[var(--muted)]">{active} ACTIVE · <span className="text-[#ef4444]">{crit} CRIT</span></span></div>
      <ul className="mt-2 divide-y divide-[var(--line)]">
        {alerts.map((a) => {
          const s = SEV[a.sev];
          return (
            <li key={a.id} className="flex items-center gap-3 py-2">
              <i className="h-8 w-1 shrink-0" style={{ background: s.color, opacity: a.sev === "info" ? 0.4 : 1 }} />
              <span className="font-mono text-[10px] text-[var(--muted)]">{a.time}</span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12px] font-semibold text-[var(--text)]">{a.title}</div>
                <div className="truncate text-[10px] text-[var(--muted)]">{a.detail}</div>
              </div>
              <span className="flex gap-[2px]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <i key={i} className="h-3 w-[3px]" style={{ background: i < s.bars ? s.color : "var(--off)" }} />
                ))}
              </span>
              <span className="w-10 rounded-sm border px-1 text-center text-[9px]" style={{ color: s.color, borderColor: s.color }}>{s.tag}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
