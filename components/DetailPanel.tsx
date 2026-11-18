import { Bars, TraceChart } from "./Charts";
import { assetDetail, type Asset, type Zone } from "@/lib/data";

const STATE = {
  down: { tag: "DOWN", color: "#ef4444" },
  idle: { tag: "IDLE", color: "var(--amber)" },
  run: { tag: "RUN", color: "#22c55e" },
} as const;

export default function DetailPanel({ asset, zone, onClose }: { asset: Asset; zone: Zone; onClose: () => void }) {
  const d = assetDetail(asset);
  const st = STATE[asset.state];
  const sub =
    asset.state === "down" ? "MOTOR TEMP +4% · TRIP 14:12" : asset.state === "idle" ? "WAITING FOR TASK · LAST RUN 6 MIN AGO" : "NOMINAL · LAST PM 12D AGO";
  return (
    <aside className="panel w-full overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold tracking-wide text-[var(--text)]">{asset.name}</h2>
          <span className="rounded-sm border px-1.5 py-px text-[10px] tracking-wider" style={{ color: st.color, borderColor: st.color }}>{st.tag}</span>
        </div>
        <button onClick={onClose} aria-label="Close panel" className="text-[var(--muted)] hover:text-[var(--text)]">✕</button>
      </div>
      <div className="mt-2 text-[11px] tracking-wider" style={{ color: st.color }}>{asset.detail} · {zone.name.toUpperCase()}</div>
      <div className="label">{sub}</div>

      <svg viewBox="0 0 200 110" className="mx-auto my-2 h-24">
        <g stroke="var(--bg)" strokeWidth={0.8}>
          <polygon points="40,85 100,105 160,85 100,65" fill="var(--bar)" />
          <polygon points="40,85 100,105 100,112 40,92" fill="var(--line2)" />
          <polygon points="160,85 100,105 100,112 160,92" fill="var(--line)" />
          <polygon points="92,20 108,20 108,90 92,90" fill="var(--muted)" />
          <polygon points="108,20 118,26 118,96 108,90" fill="var(--bar)" />
          <polygon points="70,48 130,48 130,60 70,60" fill="var(--soft)" />
          <polygon points="130,48 140,54 140,66 130,60" fill="var(--muted)" />
          <polygon points="100,12 116,20 100,28 84,20" fill="var(--soft)" />
          {asset.state === "down" && <circle cx={100} cy={54} r={4} fill="#ef4444" className="live-dot" />}
        </g>
      </svg>

      <div className="label mb-1 flex justify-between">
        <span>{asset.detail} · MOTOR TEMP · 60 MIN</span>
        <span className="text-[var(--amber)]">PEAK {d.peak.toFixed(1)}°C</span>
      </div>
      <TraceChart data={d.trace} trip={d.trip} base={d.base} hot={asset.state === "down"} />

      <div className="mt-3 flex items-center justify-between">
        <span className="label">{asset.name} · PALLETS</span>
        <span className="text-[11px] text-[var(--amber)]">{d.waiting} WAITING · {d.done} DONE</span>
      </div>
      <div className="mt-2"><Bars data={d.queue} /></div>
      <div className="label mt-1 flex justify-between"><span>-24H</span><span>-12H</span><span>NOW</span></div>
    </aside>
  );
}
