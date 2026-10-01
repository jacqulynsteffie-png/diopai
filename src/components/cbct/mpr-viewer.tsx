"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Crosshair, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface MprViewerProps {
  // synthetic volume dims
  width?: number;
  height?: number;
  depth?: number;
  aiOverlay: boolean;
}

type Plane = "axial" | "coronal" | "sagittal";

// A synthetic slice renderer: draws an anatomical-looking cross-section
// (jaw ellipse + tooth sockets + cortical outline) so the viewer feels real
// without pretending to display actual patient anatomy.
function SliceCanvas({
  plane,
  index,
  total,
  zoom,
  aiOverlay,
}: {
  plane: Plane;
  index: number;
  total: number;
  zoom: number;
  aiOverlay: boolean;
}) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const W = cv.width;
    const H = cv.height;
    // dark imaging background
    ctx.fillStyle = "#0a0f1a";
    ctx.fillRect(0, 0, W, H);

    // anatomical-ish structures (synthetic)
    const t = index / Math.max(1, total - 1); // 0..1 slice position
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);

    // bone ring (cortical)
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (plane === "axial") {
      // jaw arc
      ctx.ellipse(0, 10, W * 0.32, H * 0.22, 0, 0, Math.PI * 2);
    } else if (plane === "coronal") {
      ctx.ellipse(0, 0, W * 0.28, H * 0.34, 0, 0, Math.PI * 2);
    } else {
      ctx.ellipse(0, 0, W * 0.22, H * 0.36, 0, 0, Math.PI * 2);
    }
    ctx.stroke();

    // trabecular bone fill (subtle)
    ctx.fillStyle = "rgba(148,163,184,0.08)";
    ctx.fill();

    // tooth sockets / roots
    ctx.fillStyle = "rgba(148,163,184,0.25)";
    const nTeeth = 7;
    for (let i = 0; i < nTeeth; i++) {
      const px = (i - (nTeeth - 1) / 2) * (W * 0.07);
      const py = plane === "axial" ? -10 : Math.sin(t * Math.PI) * 20;
      ctx.beginPath();
      ctx.ellipse(px, py, 5, plane === "sagittal" ? 14 : 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // implant site marker (small bright dot at center)
    ctx.fillStyle = "#22d3ee";
    ctx.beginPath();
    ctx.arc(0, plane === "axial" ? 10 : 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // AI overlay (translucent ROI) — only when explicitly enabled and a model exists
    if (aiOverlay) {
      ctx.fillStyle = "rgba(34,211,238,0.18)";
      ctx.beginPath();
      ctx.ellipse(0, plane === "axial" ? 10 : 0, 26, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(34,211,238,0.6)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // slice position text
    ctx.fillStyle = "#64748b";
    ctx.font = "10px monospace";
    ctx.fillText(`${plane.toUpperCase()} ${index + 1}/${total}`, 8, 16);
  }, [plane, index, total, zoom, aiOverlay]);

  return <canvas ref={ref} width={300} height={220} className="h-full w-full rounded-lg" />;
}

export function MprViewer({ width = 512, height = 512, depth = 240, aiOverlay }: MprViewerProps) {
  const [axial, setAxial] = React.useState(Math.floor(depth / 2));
  const [coronal, setCoronal] = React.useState(Math.floor(height / 2));
  const [sagittal, setSagittal] = React.useState(Math.floor(width / 2));
  const [zoom, setZoom] = React.useState(1);
  const [activePlane, setActivePlane] = React.useState<Plane | null>(null);

  // Synchronized crosshair: clicking/dragging in a plane updates the others.
  function handlePlaneInteract(plane: Plane, x: number, y: number, rect: DOMRect) {
    const px = (x - rect.left) / rect.width;
    const py = (y - rect.top) / rect.height;
    if (plane === "axial") {
      setSagittal(Math.round(px * width));
      setCoronal(Math.round(py * height));
    } else if (plane === "coronal") {
      setSagittal(Math.round(px * width));
      setAxial(Math.round(py * depth));
    } else {
      setCoronal(Math.round(px * width));
      setAxial(Math.round(py * depth));
    }
  }

  const planes: { id: Plane; index: number; total: number; setIndex: (n: number) => void }[] = [
    { id: "axial", index: axial, total: depth, setIndex: setAxial },
    { id: "coronal", index: coronal, total: height, setIndex: setCoronal },
    { id: "sagittal", index: sagittal, total: width, setIndex: setSagittal },
  ];

  return (
    <div className="space-y-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1.5">
        <span className="px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">MPR Views</span>
        <div className="mx-1 h-4 w-px bg-border" />
        <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Zoom out"><ZoomOut className="h-3.5 w-3.5" /></button>
        <span className="px-1 text-[11px] tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(2.4, z + 0.2))} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Zoom in"><ZoomIn className="h-3.5 w-3.5" /></button>
        <button onClick={() => setZoom(1)} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Reset"><RotateCcw className="h-3.5 w-3.5" /></button>
        <button onClick={() => {}} className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Fullscreen"><Maximize2 className="h-3.5 w-3.5" /></button>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          <Crosshair className="h-3 w-3" /> Synchronized crosshair
        </span>
      </div>

      {/* 3 planes */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {planes.map((p) => (
          <div
            key={p.id}
            className={cn(
              "group relative overflow-hidden rounded-xl border bg-[#0a0f1a] p-1",
              activePlane === p.id ? "border-cyan-400/60 ring-1 ring-cyan-400/30" : "border-border"
            )}
          >
            <div
              className="relative aspect-[3/2.2] cursor-crosshair"
              onPointerDown={(e) => { setActivePlane(p.id); (e.target as HTMLElement).setPointerCapture(e.pointerId); handlePlaneInteract(p.id, e.clientX, e.clientY, e.currentTarget.getBoundingClientRect()); }}
              onPointerMove={(e) => { if (e.buttons === 1) handlePlaneInteract(p.id, e.clientX, e.clientY, e.currentTarget.getBoundingClientRect()); }}
            >
              <SliceCanvas plane={p.id} index={p.index} total={p.total} zoom={zoom} aiOverlay={aiOverlay} />
              {/* crosshair lines */}
              <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-cyan-400/50" />
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-cyan-400/50" />
              {activePlane === p.id && (
                <motion.div layoutId="active-plane" className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-cyan-400/40" />
              )}
            </div>
            {/* slice slider */}
            <div className="flex items-center gap-2 px-1.5 py-1.5">
              <Layers className="h-3 w-3 text-muted-foreground" />
              <input
                type="range"
                min={0}
                max={p.total - 1}
                value={p.index}
                onChange={(e) => { p.setIndex(Number(e.target.value)); setActivePlane(p.id); }}
                className="h-1 flex-1 cursor-pointer accent-cyan-500"
              />
              <span className="w-12 text-right font-mono text-[10px] text-muted-foreground">{p.index + 1}/{p.total}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
