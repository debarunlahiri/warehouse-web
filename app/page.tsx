"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import TopBar, { type Prefs } from "@/components/TopBar";
import LayerTabs from "@/components/LayerTabs";
import Search from "@/components/Search";
import SceneBoundary from "@/components/SceneBoundary";
import DetailPanel from "@/components/DetailPanel";
import { Alerts, BayLoad, Throughput, ZoneStats } from "@/components/BottomRow";
import { ASSETS, INITIAL_ALERTS, defaultAsset, type Asset, type LayerId, type ZoneId } from "@/lib/data";
import { useLive } from "@/lib/useLive";

const Scene3D = dynamic(() => import("@/components/Scene3D"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-[11px] tracking-widest text-[var(--muted)]">LOADING SCENE…</div>,
});

export default function Home() {
  const { zones, throughput, now } = useLive();
  const [zoneId, setZoneId] = useState<ZoneId>("storage");
  const [assetId, setAssetId] = useState<string>(defaultAsset("storage").id);
  const [layer, setLayer] = useState<LayerId>("zones");
  const [detailOpen, setDetailOpen] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [prefs, setPrefs] = useState<Prefs>({ theme: "dark", reflections: true, focus: false });

  useEffect(() => {
    document.documentElement.dataset.theme = prefs.theme;
  }, [prefs.theme]);

  const zone = zones.find((z) => z.id === zoneId)!;
  const asset = ASSETS.find((a) => a.id === assetId)!;

  const pickZone = (id: ZoneId) => {
    setZoneId(id);
    setAssetId(defaultAsset(id).id);
    setDetailOpen(true);
  };
  const pickAsset = (a: Asset) => {
    setZoneId(a.zone);
    setAssetId(a.id);
    setDetailOpen(true);
  };

  const showDetail = detailOpen && !prefs.focus;

  return (
    <main className="mx-auto flex min-h-screen max-w-[1560px] flex-col gap-3 p-3 lg:h-screen">
      <TopBar
        now={now}
        alerts={INITIAL_ALERTS}
        prefs={prefs}
        onPrefs={(p) => setPrefs((s) => ({ ...s, ...p }))}
        onReset={() => setResetKey((k) => k + 1)}
      />

      <div className={`grid min-h-0 flex-1 gap-3 ${showDetail ? "lg:grid-cols-[1fr_340px]" : ""}`}>
        <section className="panel relative min-h-[420px] overflow-hidden lg:min-h-0">
          <div className="absolute left-3 top-3 z-20"><LayerTabs layer={layer} onLayer={setLayer} /></div>
          <div className="absolute right-3 top-3 z-20">
            <Search onPick={(z, a) => (a ? pickAsset(a) : pickZone(z))} />
          </div>

          <div className="absolute inset-0">
            <SceneBoundary>
            <Scene3D
              zones={zones}
              selected={zoneId}
              onSelect={pickZone}
              layer={layer}
              reflections={prefs.reflections}
              theme={prefs.theme}
              resetKey={resetKey}
            />
            </SceneBoundary>
          </div>

          <div className="pointer-events-none absolute bottom-3 left-3 z-10 label">
            DRAG TO ORBIT · SCROLL TO ZOOM · CLICK A BAY
          </div>
          {prefs.focus && (
            <button
              onClick={() => setPrefs((s) => ({ ...s, focus: false }))}
              className="glass absolute right-3 top-16 z-20 rounded px-2 py-1 text-[10px] tracking-widest text-[var(--muted)] hover:text-[var(--text)]"
            >EXIT FOCUS ✕</button>
          )}
        </section>

        {showDetail && <DetailPanel asset={asset} zone={zone} onClose={() => setDetailOpen(false)} />}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1.2fr_1.3fr_1.3fr]">
        <BayLoad zones={zones} selected={zoneId} onSelect={pickZone} />
        <ZoneStats zone={zone} selectedAsset={assetId} onAsset={pickAsset} />
        <Throughput data={throughput} />
        <Alerts alerts={INITIAL_ALERTS} />
      </div>
    </main>
  );
}
