export type ZoneId = "inbound" | "storage" | "pick" | "dispatch";
export type LayerId = "zones" | "agv" | "utilities" | "power" | "thermal";
export type AssetState = "run" | "idle" | "down";
export type Severity = "crit" | "warn" | "info" | "ok";

export type Zone = {
  id: ZoneId;
  name: string;
  short: string;
  level: string;
  load: number; // %
  wip: number; // pallets in progress
  accuracy: number; // %
  uptime: number; // %
  temp: number; // °C
};

export type Asset = {
  id: string;
  zone: ZoneId;
  name: string;
  state: AssetState;
  detail: string; // sub-label, e.g. "AISLE B"
};

export type Alert = {
  id: string;
  time: string;
  title: string;
  detail: string;
  sev: Severity;
};

export const LAYERS: { id: LayerId; label: string; badge: string }[] = [
  { id: "zones", label: "ZONES", badge: "4" },
  { id: "agv", label: "AGV", badge: "8" },
  { id: "utilities", label: "UTILITIES", badge: "6" },
  { id: "power", label: "POWER", badge: "42kW" },
  { id: "thermal", label: "THERMAL", badge: "21°C" },
];

export const ZONES: Zone[] = [
  { id: "inbound", name: "Inbound", short: "INBD", level: "L1", load: 82, wip: 36, accuracy: 98.2, uptime: 95.1, temp: 19 },
  { id: "storage", name: "Storage", short: "STOR", level: "L2", load: 94, wip: 48, accuracy: 99.1, uptime: 93.6, temp: 24 },
  { id: "pick", name: "Pick & Pack", short: "PICK", level: "L3", load: 61, wip: 334, accuracy: 94.6, uptime: 96.5, temp: 21 },
  { id: "dispatch", name: "Dispatch", short: "DISP", level: "L1", load: 47, wip: 22, accuracy: 97.4, uptime: 97.2, temp: 18 },
];

const PREFIX: Record<ZoneId, [string, string]> = {
  inbound: ["I", "DOCK"],
  storage: ["S", "ASRS"],
  pick: ["P", "PICK"],
  dispatch: ["D", "LOAD"],
};

const OVERRIDES: Record<string, AssetState> = {
  S06: "down",
  S05: "idle",
  I02: "idle",
  P07: "idle",
};

export const ASSETS: Asset[] = (Object.keys(PREFIX) as ZoneId[]).flatMap((zone) =>
  Array.from({ length: 8 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    const id = `${PREFIX[zone][0]}${n}`;
    return {
      id,
      zone,
      name: `${PREFIX[zone][1]}-${n}`,
      state: OVERRIDES[id] ?? "run",
      detail: `AISLE ${"ABCD"[Math.floor(i / 2)]}`,
    } satisfies Asset;
  }),
);

/** The asset a zone shows first: down, then idle, then the first one. */
export function defaultAsset(zone: ZoneId): Asset {
  const list = ASSETS.filter((a) => a.zone === zone);
  return list.find((a) => a.state === "down") ?? list.find((a) => a.state === "idle") ?? list[0];
}

export const INITIAL_ALERTS: Alert[] = [
  { id: "a1", time: "14:12", title: "MOTOR TEMP +4%", detail: "ASRS-06 · AISLE C", sev: "crit" },
  { id: "a2", time: "14:05", title: "AGV STALL 42S", detail: "AGV-03 · LANE A", sev: "warn" },
  { id: "a3", time: "13:58", title: "PM DUE IN 6H", detail: "CONV-02", sev: "info" },
  { id: "a4", time: "13:41", title: "QUEUE +3 · STOR", detail: "PO-24811, PO-24815", sev: "info" },
  { id: "a5", time: "13:20", title: "AGV-01 RECOVERED", detail: "LANE B · 3 VEHICLES", sev: "ok" },
];

// 24h throughput (pallet moves / hr), one point per hour, last is "now"
export const INITIAL_THROUGHPUT = [
  312, 330, 305, 298, 340, 362, 355, 348, 372, 390, 384, 401, 396, 410, 388,
  375, 365, 380, 372, 360, 352, 366, 378, 392,
];

export const THROUGHPUT_TARGET = 400;

/** Small deterministic PRNG so server and client render the same traces. */
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

export type Detail = {
  trace: number[]; // motor temp, last 60 minutes
  base: number;
  trip: number;
  peak: number;
  queue: number[]; // pallets waiting per hour, last 24h
  waiting: number;
  done: number;
};

export function assetDetail(asset: Asset): Detail {
  const rnd = mulberry(seedOf(asset.id));
  const base = 30;
  const trip = 34;
  const n = 30;
  const trace = Array.from({ length: n }, (_, i) => {
    const drift = asset.state === "down" ? Math.pow(i / (n - 1), 4) * 4.4 : asset.state === "idle" ? 0.4 : 0.8;
    return +(base + drift + (rnd() - 0.5) * 0.35 + (i / n) * 0.4).toFixed(2);
  });
  const queue = Array.from({ length: 24 }, () => 3 + Math.round(rnd() * (asset.state === "down" ? 11 : 6)));
  return {
    trace,
    base,
    trip,
    peak: Math.max(...trace),
    queue,
    waiting: queue[queue.length - 1],
    done: asset.state === "down" ? 2 : 6 + Math.round(rnd() * 8),
  };
}
