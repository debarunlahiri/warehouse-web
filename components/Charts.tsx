"use client";

import { useRef, useState } from "react";

/** Throughput line with a hover crosshair, like the reference's 24H chart. */
export function LineChart({ data, target, labels }: { data: number[]; target: number; labels: string[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const [hi, setHi] = useState<number | null>(null);
  const W = 420, H = 130, PAD = 6;
  const lo = 280, hiV = 440;
  const x = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - lo) / (hiV - lo)) * (H - PAD * 2);
  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${H} L${x(0)},${H} Z`;
  const idx = hi ?? data.length - 1;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full"
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * W;
        setHi(Math.max(0, Math.min(data.length - 1, Math.round(((px - PAD) / (W - PAD * 2)) * (data.length - 1)))));
      }}
      onMouseLeave={() => setHi(null)}
    >
      <defs>
        <linearGradient id="tp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--amber)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--amber)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={0} x2={W} y1={y(target)} y2={y(target)} stroke="var(--amber-dim)" strokeDasharray="3 4" />
      <path d={area} fill="url(#tp)" />
      <path d={line} fill="none" stroke="var(--amber)" strokeWidth={1.6} strokeLinejoin="round" />
      <line x1={x(idx)} x2={x(idx)} y1={0} y2={H} stroke="#6b5d4a" strokeDasharray="2 3" />
      <circle cx={x(idx)} cy={y(data[idx])} r={4} fill="#ffb020" stroke="var(--panel)" strokeWidth={2} />
      <g transform={`translate(${Math.min(x(idx) + 8, W - 82)},${Math.max(y(data[idx]) - 26, 4)})`}>
        <rect width={76} height={20} rx={3} fill="var(--menu)" stroke="var(--line2)" />
        <text x={8} y={14} fontSize={11} fill="var(--text)" className="font-mono">
          {data[idx]} <tspan fill="var(--muted)">{labels[idx]}</tspan>
        </text>
      </g>
    </svg>
  );
}

/** Temperature trace with a trip line (detail panel). */
export function TraceChart({ data, trip, base, hot = true }: { data: number[]; trip: number; base: number; hot?: boolean }) {
  const W = 300, H = 78;
  const lo = base - 1, hi = Math.max(trip, ...data) + 1;
  const x = (i: number) => (i / (data.length - 1)) * W;
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const d = data.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H + 14}`} className="w-full">
      <line x1={0} x2={W} y1={y(trip)} y2={y(trip)} stroke="#ef4444" strokeDasharray="3 3" opacity={0.7} />
      <text x={2} y={y(trip) - 3} fontSize={8} fill="#ef4444" className="font-mono">TRIP {trip.toFixed(1)}°C</text>
      <line x1={0} x2={W} y1={y(base)} y2={y(base)} stroke="var(--line2)" />
      <path d={d} fill="none" stroke={hot ? "#ef4444" : "var(--amber)"} strokeWidth={1.5} />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r={3} fill={hot ? "#ef4444" : "var(--amber)"} />
      <text x={0} y={H + 11} fontSize={8} fill="var(--muted)" className="font-mono">-60M</text>
      <text x={W} y={H + 11} fontSize={8} fill="var(--muted)" textAnchor="end" className="font-mono">NOW</text>
    </svg>
  );
}

export function Bars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-12 items-end gap-[3px]">
      {data.map((v, i) => (
        <i
          key={i}
          className="flex-1 rounded-[1px]"
          style={{
            height: `${(v / max) * 100}%`,
            background: i === data.length - 1 ? "var(--amber)" : "var(--bar)",
          }}
        />
      ))}
    </div>
  );
}
