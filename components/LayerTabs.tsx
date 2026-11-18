import { LAYERS, type LayerId } from "@/lib/data";

const ICONS: Record<LayerId, string> = {
  zones: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
  agv: "M4 14h16v4H4zM7 14V9h7l3 5M8 20v1M16 20v1",
  utilities: "M12 3v6M12 15v6M3 12h6M15 12h6M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  power: "M13 2 4 14h7l-1 8 9-12h-7z",
  thermal: "M10 4a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0z",
};

export default function LayerTabs({ layer, onLayer }: { layer: LayerId; onLayer: (l: LayerId) => void }) {
  return (
    <div className="glass flex overflow-hidden rounded-md" role="tablist" aria-label="Map layers">
      {LAYERS.map((l) => {
        const on = l.id === layer;
        return (
          <button
            key={l.id} role="tab" aria-selected={on} onClick={() => onLayer(l.id)}
            className="flex items-center gap-2 border-b-2 px-3 py-2.5 text-[11px] tracking-wider transition-colors"
            style={{
              borderColor: on ? "var(--amber)" : "transparent",
              color: on ? "var(--text)" : "var(--muted)",
              background: on ? "var(--line)" : "transparent",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d={ICONS[l.id]} /></svg>
            <span className="hidden sm:inline">{l.label}</span>
            <span className="text-[10px] text-[var(--muted)]">{l.badge}</span>
          </button>
        );
      })}
    </div>
  );
}
