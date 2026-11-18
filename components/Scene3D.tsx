"use client";

import { useEffect, useRef, useState, type ElementRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, Html, MeshReflectorMaterial, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { LayerId, Zone, ZoneId } from "@/lib/data";

export type Theme = "dark" | "light";

const PALETTE = {
  dark: { bg: "#0a0806", floor: "#0c0907", slab: "#3a332a", wall: "#9a8d79", wallSide: "#665c4d", window: "#1b1611", mullion: "#6b6052", tile: "#6b5d4a", tileTop: "#2b261f", deck: "#3a342b", metal: "#a99d8c", dark: "#2a251e", grid1: "#1c1610", grid2: "#2a2118", amber: "#ffb020" },
  light: { bg: "#ebe7de", floor: "#e0dacd", slab: "#cfc8b9", wall: "#d4ccbc", wallSide: "#b9b0a0", window: "#8f8777", mullion: "#c4bba9", tile: "#b3a891", tileTop: "#9a907c", deck: "#b8af9d", metal: "#c9c1b1", dark: "#8f8777", grid1: "#d6cfc1", grid2: "#c4bca9", amber: "#e08a00" },
};

const ZW = 2.25; // zone width
const ZX = (i: number) => -3.375 + i * ZW;
const NC = 4, NR = 6;

const heat = (t: number) => {
  const k = Math.min(1, Math.max(0, (t - 16) / 12));
  const stops = [new THREE.Color("#4f7a8a"), new THREE.Color("#d99a28"), new THREE.Color("#ef4444")];
  return (k < 0.5 ? stops[0].clone().lerp(stops[1], k * 2) : stops[1].clone().lerp(stops[2], (k - 0.5) * 2)).getStyle();
};

type PalT = (typeof PALETTE)["dark"];

function Box({ p, s, color, emissive, ei = 0, rough = 0.85, cast = true }: { p: [number, number, number]; s: [number, number, number]; color: string; emissive?: string; ei?: number; rough?: number; cast?: boolean }) {
  return (
    <mesh position={p} castShadow={cast} receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={color} roughness={rough} metalness={0.05} emissive={emissive ?? "#000000"} emissiveIntensity={ei} />
    </mesh>
  );
}

function RoofTiles({ i, zone, selected, hovered, layer, pal }: { i: number; zone: Zone; selected: boolean; hovered: boolean; layer: LayerId; pal: PalT }) {
  const cx = ZX(i);
  const therm = heat(zone.temp);
  const tiles = [];
  for (let r = 0; r < NR; r++) {
    for (let c = 0; c < NC; c++) {
      const x = cx + (c - 1.5) * 0.52;
      const z = (r - 2.5) * 0.62;
      const lit = layer === "zones" ? selected : layer === "thermal";
      const color = layer === "thermal" ? therm : lit ? pal.amber : pal.tile;
      const ei = layer === "thermal" ? 0.4 : lit ? 0.25 + (zone.load / 100) * 0.9 : hovered ? 0.25 : 0;
      const emissive = layer === "thermal" ? therm : lit || hovered ? pal.amber : "#000000";
      tiles.push(
        <group key={`${r}-${c}`} position={[x, 2.04, z]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[0.46, 0.07, 0.46]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={ei} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.07, 0]} castShadow>
            <boxGeometry args={[0.26, 0.08, 0.26]} />
            <meshStandardMaterial color={pal.tileTop} roughness={0.8} />
          </mesh>
        </group>,
      );
    }
  }
  return <>{tiles}</>;
}

function Agv({ lane, offset, speed, active, pal }: { lane: number; offset: number; speed: number; active: boolean; pal: PalT }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = ((clock.elapsedTime * speed + offset) % 1 + 1) % 1;
    ref.current.position.x = -4.2 + t * 8.4;
  });
  return (
    <group ref={ref} position={[0, 0.95, lane]}>
      <Box p={[0, 0, 0]} s={[0.34, 0.18, 0.2]} color={pal.metal} />
      <Box p={[0, 0.12, 0]} s={[0.22, 0.06, 0.14]} color={pal.amber} emissive={pal.amber} ei={active ? 2.2 : 1} />
    </group>
  );
}

function Fan({ p, pal, glow }: { p: [number, number, number]; pal: PalT; glow: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += d * 2.5; });
  return (
    <group position={p}>
      <Box p={[0, 0.2, 0]} s={[0.9, 0.4, 0.9]} color={pal.metal} emissive={pal.amber} ei={glow ? 0.35 : 0} />
      <mesh ref={ref} position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.04, 24]} />
        <meshStandardMaterial color={pal.dark} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Building({ zones, selected, hover, layer, onSelect, setHover, pal }: {
  zones: Zone[]; selected: ZoneId; hover: ZoneId | null; layer: LayerId;
  onSelect: (z: ZoneId) => void; setHover: (z: ZoneId | null) => void; pal: PalT;
}) {
  const pulse = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (pulse.current) pulse.current.emissiveIntensity = 1.2 + Math.sin(clock.elapsedTime * 4) * 0.9;
  });
  const util = layer === "utilities";
  const power = layer === "power";
  const agv = layer === "agv";

  return (
    <group>
      {/* ground slab */}
      <Box p={[0.8, 0.07, 0.6]} s={[18, 0.14, 11]} color={pal.slab} cast={false} />

      {/* main hall */}
      <Box p={[0, 1, 0]} s={[9, 2, 4]} color={pal.wall} />
      <Box p={[0, 2.01, 0]} s={[9.1, 0.04, 4.1]} color={pal.deck} />
      {/* window band + mullions (front, +z) */}
      <Box p={[0, 1.15, 2.01]} s={[8.7, 0.8, 0.02]} color={pal.window} cast={false} />
      {Array.from({ length: 30 }, (_, k) => (
        <Box key={k} p={[-4.35 + k * 0.3, 1.15, 2.03]} s={[0.03, 0.8, 0.02]} color={pal.mullion} cast={false} />
      ))}
      {/* louvers (front, upper) */}
      {Array.from({ length: 6 }, (_, k) => (
        <Box key={k} p={[-3.6 + k * 1.45, 1.72, 2.015]} s={[1.1, 0.16, 0.02]} color={pal.wallSide} cast={false} />
      ))}

      {/* per-zone: roof tiles, floor glow strip, hit volume */}
      {zones.map((z, i) => {
        const sel = z.id === selected;
        const hov = hover === z.id;
        return (
          <group key={z.id}>
            <RoofTiles i={i} zone={z} selected={sel} hovered={hov} layer={layer} pal={pal} />
            <Box
              p={[ZX(i), 0.42, 2.04]} s={[ZW - 0.3, 0.05, 0.02]} color={pal.amber} emissive={pal.amber}
              ei={sel || hov ? 2.4 : layer === "zones" ? 0.5 : 0.25} cast={false}
            />
            <mesh
              position={[ZX(i), 1.2, 0]}
              onPointerOver={(e) => { e.stopPropagation(); setHover(z.id); document.body.style.cursor = "pointer"; }}
              onPointerOut={() => { setHover(null); document.body.style.cursor = ""; }}
              onClick={(e) => { e.stopPropagation(); onSelect(z.id); }}
            >
              <boxGeometry args={[ZW, 2.4, 4.1]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        );
      })}

      {/* faulted tile in storage */}
      <mesh position={[ZX(1) + 0.52 * 0.5, 2.12, 0.62 * 0.5]}>
        <boxGeometry args={[0.3, 0.1, 0.3]} />
        <meshStandardMaterial ref={pulse} color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
      </mesh>

      {/* chimneys */}
      {[-1.3, -0.5, 0.3, 1.1].map((x, k) => (
        <mesh key={k} position={[x + 0.2, 2.5, -1.7]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.9, 16]} />
          <meshStandardMaterial color={pal.dark} emissive={pal.amber} emissiveIntensity={power ? 1.4 : 0} />
        </mesh>
      ))}

      {/* office block */}
      <Box p={[-6.1, 0.8, -0.2]} s={[2.4, 1.6, 2.8]} color={pal.wall} />
      <Box p={[-6.1, 1.62, -0.2]} s={[2.5, 0.05, 2.9]} color={pal.deck} />
      <Box p={[-6.1, 1.95, -0.4]} s={[1.1, 0.6, 1.0]} color={pal.metal} emissive={pal.amber} ei={util ? 0.4 : 0} />
      {Array.from({ length: 6 }, (_, k) => (
        <Box key={k} p={[-7.3 + 0.01, 0.9, -1.35 + k * 0.42]} s={[0.02, 0.5, 0.25]} color={pal.window} cast={false} />
      ))}
      {/* rooftop plant on hall (back-left) */}
      {[0, 1, 2].map((k) => (
        <Box key={k} p={[-4 + k * 0.55, 2.35, -2.5]} s={[0.4, 0.5, 0.4]} color={pal.metal} emissive={pal.amber} ei={power ? 1 : 0} />
      ))}

      {/* silo + pipe */}
      <mesh position={[6.4, 1.7, -0.8]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 3.3, 28]} />
        <meshStandardMaterial color={pal.metal} roughness={0.5} metalness={0.3} emissive={pal.amber} emissiveIntensity={power ? 0.5 : 0} />
      </mesh>
      <mesh position={[6.4, 3.45, -0.8]}>
        <cylinderGeometry args={[0.3, 0.6, 0.25, 28]} />
        <meshStandardMaterial color={pal.dark} />
      </mesh>
      <mesh position={[6.4, 3.9, -0.8]}>
        <cylinderGeometry args={[0.07, 0.07, 0.8, 12]} />
        <meshStandardMaterial color={pal.metal} />
      </mesh>
      <mesh position={[5.5, 2.5, -0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 2, 14]} />
        <meshStandardMaterial color={pal.metal} emissive={pal.amber} emissiveIntensity={util ? 1.4 : 0} />
      </mesh>
      {[0, 1, 2].map((k) => (
        <Box key={k} p={[5.2 + k * 0.4, 1.25, -1.9 + k * 0.55]} s={[0.16, 2.2, 0.16]} color={pal.metal} />
      ))}

      {/* HVAC pad */}
      <Box p={[5.6, 0.16, 3.5]} s={[3.4, 0.05, 2]} color={pal.deck} cast={false} />
      {[0, 1, 2].map((k) => (
        <Fan key={k} p={[4.6 + k * 1.05, 0.18, 3.5 - (k % 2) * 0.1]} pal={pal} glow={util} />
      ))}

      {/* rail + posts + AGVs at the front */}
      {Array.from({ length: 9 }, (_, k) => (
        <Box key={k} p={[-4.2 + k * 1.05, 0.55, 3.05]} s={[0.07, 1.0, 0.07]} color={pal.metal} />
      ))}
      <Box p={[0, 0.85, 3.05]} s={[8.6, 0.05, 0.06]} color={pal.amber} emissive={pal.amber} ei={agv ? 2 : 0.6} cast={false} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
        <Agv key={k} lane={k % 2 ? 3.0 : 3.12} offset={k / 8} speed={k % 2 ? 0.03 : 0.045} active={agv} pal={pal} />
      ))}
    </group>
  );
}

function Floor({ reflect, pal }: { reflect: boolean; pal: PalT }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        {reflect ? (
          <MeshReflectorMaterial
            color={pal.floor} blur={[300, 90]} resolution={512} mixBlur={1} mixStrength={10}
            roughness={1} depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.4} metalness={0.4} mirror={0}
          />
        ) : (
          <meshStandardMaterial color={pal.floor} roughness={1} />
        )}
      </mesh>
      <Grid
        position={[0, 0.0, 0]} args={[60, 60]} cellSize={1} sectionSize={5} cellThickness={0.5} sectionThickness={0.9}
        cellColor={pal.grid1} sectionColor={pal.grid2} fadeDistance={34} fadeStrength={2} infiniteGrid
      />
    </group>
  );
}

function Tooltip({ zone, index }: { zone: Zone; index: number }) {
  return (
    <Html position={[ZX(index), 3.4, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div className="tip">
        <div className="tip-h">WH-02 · {zone.level} <span>{zone.name.toUpperCase()} BAY</span></div>
        <dl>
          <dt>LOAD</dt><dd>{zone.load} %</dd>
          <dt>WIP</dt><dd>{zone.wip} PALLETS</dd>
          <dt>ACCURACY</dt><dd>{zone.accuracy} %</dd>
          <dt>UPTIME</dt><dd>{zone.uptime} %</dd>
        </dl>
      </div>
    </Html>
  );
}

export default function Scene3D({ zones, selected, onSelect, layer, reflections, theme, resetKey }: {
  zones: Zone[]; selected: ZoneId; onSelect: (z: ZoneId) => void; layer: LayerId;
  reflections: boolean; theme: Theme; resetKey: number;
}) {
  const [hover, setHover] = useState<ZoneId | null>(null);
  const ctl = useRef<ElementRef<typeof OrbitControls>>(null);
  const pal = PALETTE[theme];
  const hoverIdx = zones.findIndex((z) => z.id === hover);

  useEffect(() => {
    ctl.current?.reset();
  }, [resetKey]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [10.6, 7.6, 11.8], fov: 32, near: 0.1, far: 120 }}
      gl={{ antialias: true }}
      onPointerMissed={() => setHover(null)}
    >
      <color attach="background" args={[pal.bg]} />
      <fog attach="fog" args={[pal.bg, 28, 55]} />
      <hemisphereLight args={["#fff1dc", "#2a1d0f", theme === "dark" ? 1.1 : 1.1]} />
      <directionalLight
        position={[7, 11, 8]} intensity={theme === "dark" ? 2.8 : 2.4} castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12}
        shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-0.0004}
      />
      <pointLight position={[ZX(zones.findIndex((z) => z.id === selected)), 3.2, 0]} color={pal.amber} intensity={theme === "dark" ? 6 : 0} distance={6} />

      <group position={[-0.6, 0, -0.4]}>
        <Building zones={zones} selected={selected} hover={hover} layer={layer} onSelect={onSelect} setHover={setHover} pal={pal} />
        {hoverIdx >= 0 && <Tooltip zone={zones[hoverIdx]} index={hoverIdx} />}
      </group>
      <Floor reflect={reflections} pal={pal} />

      <OrbitControls
        ref={ctl} makeDefault enablePan={false} enableDamping dampingFactor={0.08}
        minDistance={7} maxDistance={28} minPolarAngle={0.45} maxPolarAngle={1.42}
        target={[0, 1.2, 0.5]}
      />
    </Canvas>
  );
}
