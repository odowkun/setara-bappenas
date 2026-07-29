"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  LayoutGrid,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  User,
  Rows,
  Move,
  Save,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Network,
} from "lucide-react";

export interface OrgNode {
  id: string;
  name: string;
  position: string;
  nip: string;
  avatar?: string;
  pos_x?: number | null;
  pos_y?: number | null;
  children?: OrgNode[];
}

export const defaultBappedaTree: OrgNode = {
  id: "node-kepala",
  name: "Dr. Jan W. N. Papilaya, M.Si",
  position: "KEPALA BADAN",
  nip: "197204121998031004",
  avatar: "/images/bappeda/pejabat-1.jpg",
  children: [
    {
      id: "node-sekretaris",
      name: "Siti Rahmawati, S.STP",
      position: "SEKRETARIS",
      nip: "198509152009022003",
      avatar: "/images/bappeda/pejabat-2.jpg",
      children: [
        {
          id: "subag-1",
          name: "Maria S. Lesnussa, S.Kom",
          position: "SUBAG PERENCANAAN & EVALUASI",
          nip: "199208202018022001",
        },
        {
          id: "subag-2",
          name: "Fahri Abdullah, S.E.",
          position: "SUBAG KEUANGAN",
          nip: "199003122015031002",
        },
        {
          id: "subag-3",
          name: "Agus Supriyanto, S.Sos",
          position: "SUBAG UMUM DAN KEPEGAWAIAN",
          nip: "198704152011011004",
        },
      ],
    },
    {
      id: "bidang-sosbud",
      name: "Dr. Samuel Tani, M.Pd",
      position: "BIDANG PEMBANGUNAN MANUSIA DAN MASYARAKAT",
      nip: "198305142008011005",
      children: [
        {
          id: "subid-sos-1",
          name: "Yohanes L., S.Pd",
          position: "SUBID PEMBANGUNAN SUMBERDAYA MANUSIA",
          nip: "199102142016021001",
        },
        {
          id: "subid-sos-2",
          name: "Rina Kartika, S.Sos",
          position: "SUBID PEMBANGUNAN KETAHANAN MASYARAKAT",
          nip: "199307182019032002",
        },
        {
          id: "subid-sos-3",
          name: "Benny W., S.IP",
          position: "SUBID PEMBANGUNAN SUMBERDAYA APARATUR PERANGKAT DAERAH",
          nip: "198912052014021003",
        },
      ],
    },
    {
      id: "bidang-ekonomi",
      name: "Nurfadilah, S.E.",
      position: "BIDANG EKONOMI DAN SUMBERDAYA ALAM",
      nip: "198811052012012001",
      children: [
        {
          id: "subid-eko-1",
          name: "Hendra Wijaya, S.E.",
          position: "SUBID EKONOMI",
          nip: "199201102017011002",
        },
        {
          id: "subid-eko-2",
          name: "Dewi Lestari, S.A.P",
          position: "SUBID KEUANGAN DAERAH",
          nip: "199404122018012003",
        },
        {
          id: "subid-eko-3",
          name: "Faisal, S.Hut",
          position: "SUBID SUMBERDAYA ALAM",
          nip: "199009082015021001",
        },
      ],
    },
    {
      id: "bidang-infrastruktur",
      name: "Ir. Ronald R., S.T., M.T.",
      position: "BIDANG INFRASTRUKTUR DAN PENGEMBANGAN WILAYAH",
      nip: "198203202007011004",
      children: [
        {
          id: "subid-infra-1",
          name: "Joko Susilo, S.T.",
          position: "SUBID INFRAS DAN PENGEMBANGAN WILAYAH",
          nip: "199308192019021002",
        },
        {
          id: "subid-infra-2",
          name: "Titin N., S.T.",
          position: "SUBID PERMUKIMAN DAN PENATAAN RUANG",
          nip: "199501052020012001",
        },
        {
          id: "subid-infra-3",
          name: "Andi Saputra, S.T.",
          position: "SUBID KECAMATAN & DESA",
          nip: "199106252016011002",
        },
      ],
    },
    {
      id: "bidang-renval",
      name: "Viktorianus P., S.T.",
      position: "BIDANG PENGENDALIAN, EVALUASI DAN PELAPORAN",
      nip: "198607102010041003",
      children: [
        {
          id: "subid-renval-1",
          name: "Sri Mulyani, S.Stat",
          position: "SUBID MONEV & PELAPORAN BID PEMBANGUNAN MANUSIA & MASY.",
          nip: "199203152017022001",
        },
        {
          id: "subid-renval-2",
          name: "Lukman Hakim, S.E.",
          position: "SUBID MONEV & PELAPORAN BID EKONOMI & SDA",
          nip: "199011202015031004",
        },
        {
          id: "subid-renval-3",
          name: "Diana Putri, S.T.",
          position: "SUBID MONEV & PELAPORAN BID INFRASTRUKTUR & PENGEMBANGAN WILAYAH",
          nip: "199408042019022003",
        },
      ],
    },
  ],
};

export const StrukturOrganisasiChart: React.FC<{
  data?: OrgNode | null;
  title?: string;
  showSaveButton?: boolean;
}> = ({ data: rawData = defaultBappedaTree, title = "Struktur Organisasi BAPPEDA Halmahera Utara", showSaveButton = true }) => {
  const data = rawData || defaultBappedaTree;
  // Default by demand: Vertical (Bagan Memanjang)
  const [viewMode, setViewMode] = useState<"vertical" | "horizontal">("vertical");
  const [zoomLevel, setZoomLevel] = useState(85);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 140));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 40));
  const handleResetZoom = () => setZoomLevel(85);

  const handlePrint = () => {
    window.print();
  };

  // Close Fullscreen on Escape key & Lock body scroll when Fullscreen is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const canvasComponent = (
    <InteractiveCanvasOrgChart
      data={data}
      zoomLevel={zoomLevel}
      handleZoomIn={handleZoomIn}
      handleZoomOut={handleZoomOut}
      handleResetZoom={handleResetZoom}
      showSaveButton={showSaveButton}
      isFullscreen={isFullscreen}
      onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
    />
  );

  return (
    <div className="space-y-6 font-sans w-full max-w-full overflow-hidden">
      {/* Clean Single-Row Top Control Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Struktur Kelembagaan Resmi Badan Perencanaan Pembangunan Daerah Kabupaten Halmahera Utara
          </p>
        </div>

        {/* Action Icon Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("vertical")}
              title="Bagan Memanjang"
              className={`p-2 rounded-xl transition ${
                viewMode === "vertical"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Rows className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setViewMode("horizontal")}
              title="Bagan Lebar (Interactive Canvas)"
              className={`p-2 rounded-xl transition ${
                viewMode === "horizontal"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Cetak Bagan Icon Button */}
          <button
            type="button"
            onClick={handlePrint}
            title="Cetak Bagan"
            className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode 1: Vertical Stacked Tree Layout (Bagan Memanjang - Default) */}
      {viewMode === "vertical" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-6">
          <RenderVerticalNode node={data} isRoot />
        </div>
      )}

      {/* Mode 2: Interactive Drag & Drop SVG Canvas Layout (Bagan Lebar) */}
      {viewMode === "horizontal" && (
        <>
          {/* Render inside React Portal on document.body when in Fullscreen mode */}
          {isFullscreen && mounted ? (
            createPortal(
              <div className="fixed inset-0 z-[99999] bg-slate-100 p-4 sm:p-6 flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-150 font-sans">
                {canvasComponent}
              </div>,
              document.body
            )
          ) : (
            canvasComponent
          )}
        </>
      )}
    </div>
  );
};

// Interface for Canvas Node with X, Y coordinates
interface CanvasNode {
  id: string;
  parentId: string | null;
  name: string;
  position: string;
  nip: string;
  avatar?: string;
  x: number;
  y: number;
  type: "root" | "sekretaris" | "subag" | "bidang" | "subid";
}

// Interactive SVG Canvas Component with Bulletproof Save Positions Handler
const InteractiveCanvasOrgChart: React.FC<{
  data: OrgNode;
  zoomLevel: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetZoom: () => void;
  showSaveButton?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}> = ({
  data,
  zoomLevel,
  handleZoomIn,
  handleZoomOut,
  handleResetZoom,
  showSaveButton = true,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Generate initial coordinates recursively for ALL tree nodes at any depth
  const initialNodes = useMemo<CanvasNode[]>(() => {
    if (!data) return [];

    const nodes: CanvasNode[] = [];

    // Helper function to recursively flatten tree nodes into canvas items with smart default XY positions
    const traverse = (
      node: OrgNode,
      parentId: string | null = null,
      depth = 0,
      indexInParent = 0,
      parentX = 700,
      parentY = 40
    ) => {
      if (!node) return;
      let defaultX = parentX;
      let defaultY = parentY;

      if (depth === 0) {
        defaultX = 700;
        defaultY = 40;
      } else if (depth === 1) {
        // Level 1 (Sekretaris & Bidang): spread horizontally
        const isSekretaris = node.position.toUpperCase().includes("SEKRETARIS");
        if (isSekretaris) {
          defaultX = 1050;
          defaultY = 180;
        } else {
          defaultX = 150 + indexInParent * 310;
          defaultY = 520;
        }
      } else if (depth === 2) {
        // Level 2 (Subag / Subid): offset relative to parent
        defaultX = parentX;
        defaultY = parentY + 140 + indexInParent * 130;
      } else {
        // Level 3+: stack vertically under parent
        defaultX = parentX + 20;
        defaultY = parentY + 140 + indexInParent * 130;
      }

      const x = node.pos_x != null ? node.pos_x : defaultX;
      const y = node.pos_y != null ? node.pos_y : defaultY;

      let type: "root" | "sekretaris" | "subag" | "bidang" | "subid" = "subid";
      if (depth === 0) type = "root";
      else if (node.position.toUpperCase().includes("SEKRETARIS")) type = "sekretaris";
      else if (node.position.toUpperCase().includes("BIDANG")) type = "bidang";
      else if (node.position.toUpperCase().includes("SUBAG")) type = "subag";

      nodes.push({
        id: node.id,
        parentId,
        name: node.name,
        position: node.position,
        nip: node.nip,
        avatar: node.avatar,
        x,
        y,
        type,
      });

      if (node.children && node.children.length > 0) {
        node.children.forEach((child, childIdx) => {
          traverse(child, node.id, depth + 1, childIdx, x, y);
        });
      }
    };

    traverse(data);

    return nodes;
  }, [data]);

  const [nodes, setNodes] = useState<CanvasNode[]>(initialNodes);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  // Save updated node XY coordinates to Laravel REST API Database
  const handleSavePositionsToDB = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const positionsToSave = nodes.map((n) => ({
        node_id: n.id,
        x: Math.round(n.x),
        y: Math.round(n.y),
      }));

      const res = await fetch("http://localhost:8000/api/v1/pejabat/save-positions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ positions: positionsToSave }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Gagal menyimpan posisi tata letak bagan:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPositions = () => {
    setNodes(initialNodes);
  };

  // Handle mouse wheel & trackpad scrolling directly on the canvas container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Direct trackpad/mousewheel 2D scrolling into container scrollTop & scrollLeft
      if (e.shiftKey) {
        el.scrollLeft += e.deltaY;
      } else {
        el.scrollTop += e.deltaY;
        el.scrollLeft += e.deltaX;
      }
      e.preventDefault();
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent, id: string, nodeX: number, nodeY: number) => {
    e.preventDefault();
    setDraggingId(id);
    dragOffset.current = {
      x: e.clientX - nodeX * (zoomLevel / 100),
      y: e.clientY - nodeY * (zoomLevel / 100),
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;

    const scale = zoomLevel / 100;
    const newX = (e.clientX - dragOffset.current.x) / scale;
    const newY = (e.clientY - dragOffset.current.y) / scale;

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingId ? { ...n, x: Math.max(10, newX), y: Math.max(10, newY) } : n))
    );
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // SVG Connection Lines Map
  const CARD_W = 280;
  const CARD_H = 115;

  const svgConnections = useMemo(() => {
    const nodeMap = new Map<string, CanvasNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const connections: { id: string; d: string }[] = [];

    nodes.forEach((child) => {
      if (!child.parentId) return;
      const parent = nodeMap.get(child.parentId);
      if (!parent) return;

      let startX: number;
      let startY: number;
      let endX: number;
      let endY: number;
      let d: string;

      const isRightSide = child.x >= parent.x + CARD_W - 40;
      const isLeftSide = child.x <= parent.x - CARD_W + 40;

      if (isRightSide) {
        // Child is placed to the RIGHT of Parent -> Connect Parent Right Edge to Child Left Edge
        startX = parent.x + CARD_W;
        startY = parent.y + CARD_H / 2;

        endX = child.x;
        endY = child.y + CARD_H / 2;

        const midX = (startX + endX) / 2;
        d = `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`;
      } else if (isLeftSide) {
        // Child is placed to the LEFT of Parent -> Connect Parent Left Edge to Child Right Edge
        startX = parent.x;
        startY = parent.y + CARD_H / 2;

        endX = child.x + CARD_W;
        endY = child.y + CARD_H / 2;

        const midX = (startX + endX) / 2;
        d = `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`;
      } else {
        // Child is placed BELOW Parent -> Connect Parent Bottom Edge to Child Top Edge
        startX = parent.x + CARD_W / 2;
        startY = parent.y + CARD_H;

        endX = child.x + CARD_W / 2;
        endY = child.y;

        const midY = (startY + endY) / 2;
        d = `M ${startX} ${startY} V ${midY} H ${endX} V ${endY}`;
      }

      connections.push({ id: `${parent.id}-${child.id}`, d });
    });

    return connections;
  }, [nodes]);

  // Dynamically calculate canvas size based on node positions so no lines or cards are ever cut off!
  const canvasBounds = useMemo(() => {
    let maxX = 2800; // generous minimum canvas width
    let maxY = 1800; // generous minimum canvas height

    nodes.forEach((n) => {
      if (n.x + CARD_W + 400 > maxX) {
        maxX = n.x + CARD_W + 400;
      }
      if (n.y + CARD_H + 400 > maxY) {
        maxY = n.y + CARD_H + 400;
      }
    });

    return { width: `${maxX}px`, height: `${maxY}px` };
  }, [nodes]);

  return (
    <div className="space-y-3 font-sans w-full max-w-full overflow-hidden flex flex-col h-full">
      {/* Dedicated Toolbar ABOVE Canvas Box */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl text-xs font-bold shadow-sm w-full max-w-full overflow-x-auto bg-white border border-slate-200 text-slate-900 shrink-0">
        {showSaveButton ? (
          <div className="flex items-center gap-2 font-extrabold shrink-0 text-blue-900">
            <Move className="w-4 h-4 text-blue-600 shrink-0" />
            <span>💡 Tips: Klik & geser (drag) kartu pejabat untuk menata posisi bagan secara bebas!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 font-extrabold shrink-0 text-blue-900">
            <Network className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Bagan Hirarki Kelembagaan Resmi Kabupaten Halmahera Utara</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Zoom & Reset Controls */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition"
              title="Perkecil Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-1.5 font-mono text-[11px] font-extrabold text-slate-800">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition"
              title="Perbesar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset Positions Button (Admin Dashboard Only) */}
          {showSaveButton && (
            <button
              type="button"
              onClick={handleResetPositions}
              title="Reset Posisi Default"
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Save Positions to DB Button (Admin Dashboard Only) */}
          {showSaveButton && (
            <button
              type="button"
              onClick={handleSavePositionsToDB}
              disabled={saving}
              title="Simpan Posisi Bagan ke DB"
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
            </button>
          )}

          {/* Single Fullscreen Toggle Button in Canvas Toolbar */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Keluar Layar Penuh (Esc)" : "Layar Penuh (Fullscreen)"}
              className={`p-2 rounded-xl border transition ${
                isFullscreen
                  ? "bg-amber-500 text-white border-amber-600 shadow-md"
                  : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm"
              }`}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        {savedSuccess && (
          <div className="w-full mt-1 p-2.5 rounded-xl bg-blue-100 border border-blue-300 text-blue-950 text-xs font-extrabold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Tata Letak Posisi Bagan Berhasil Disimpan & Tersinkronisasi ke Database Publik!</span>
          </div>
        )}
      </div>

      {/* Clean Interactive Canvas Container Box */}
      <div
        ref={containerRef}
        onMouseMove={showSaveButton ? handleMouseMove : undefined}
        onMouseUp={showSaveButton ? handleMouseUp : undefined}
        onMouseLeave={showSaveButton ? handleMouseUp : undefined}
        className={
          isFullscreen
            ? `relative flex-1 w-full max-w-full overflow-auto border border-slate-200 rounded-3xl p-6 select-none bg-slate-50 shadow-2xl ${
                showSaveButton ? "cursor-grab active:cursor-grabbing" : "cursor-default"
              }`
            : `relative w-full max-w-full overflow-auto max-h-[75vh] min-h-[600px] border border-slate-200 rounded-3xl p-6 select-none bg-slate-50 shadow-inner ${
                showSaveButton ? "cursor-grab active:cursor-grabbing" : "cursor-default"
              }`
        }
      >
        {/* Zoomable & Auto-Expanding Canvas Area */}
        <div
          className="relative transition-transform duration-75 origin-top-left"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            width: canvasBounds.width,
            height: canvasBounds.height,
          }}
        >
          {/* SVG overlay for Blue Orthogonal Vector Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {svgConnections.map((c) => (
              <path
                key={c.id}
                d={c.d}
                stroke="#2563eb"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>

          {/* Render Interactive Drag Cards Matched to Blue Bidang Theme */}
          {nodes.map((node) => {
            const isDragging = draggingId === node.id;

            return (
              <div
                key={node.id}
                onMouseDown={showSaveButton ? (e) => handleMouseDown(e, node.id, node.x, node.y) : undefined}
                style={{
                  position: "absolute",
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${CARD_W}px`,
                  height: `${CARD_H}px`,
                }}
                className={`rounded-2xl p-3 border transition-shadow z-10 flex flex-col justify-between shadow-sm ${
                  showSaveButton ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                } ${
                  isDragging ? "shadow-2xl scale-105 border-blue-600 z-50 ring-2 ring-blue-500/50" : ""
                } ${
                  node.type === "root"
                    ? "bg-blue-950 text-white border-blue-900 shadow-blue-950/30"
                    : node.type === "sekretaris" || node.type === "bidang"
                    ? "bg-white border-blue-500 text-slate-900"
                    : "bg-blue-50/90 border-blue-300 text-slate-900"
                }`}
              >
                {/* Position Badge — MATCHED BLUE STYLING (NO YELLOW) */}
                <div
                  className={`py-1 px-2.5 rounded-lg font-black text-[9.5px] uppercase leading-tight tracking-tight whitespace-normal break-words ${
                    node.type === "root"
                      ? "bg-blue-800 text-sky-200 border border-blue-700"
                      : "bg-blue-100 text-blue-950 border border-blue-200"
                  }`}
                >
                  {node.position}
                </div>

                {/* Main Content: Avatar Image / Initial Badge + Name + NIP */}
                <div className="flex items-center gap-2.5 mt-1 min-w-0">
                  {/* Photo Avatar or Initials Circle */}
                  {node.avatar ? (
                    <img
                      src={node.avatar.startsWith("http") ? node.avatar : `http://localhost:8000${node.avatar}`}
                      alt={node.name}
                      className="w-10 h-10 rounded-xl object-cover border border-blue-300 shadow-sm shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border shadow-sm ${
                        node.type === "root"
                          ? "bg-blue-800 text-sky-200 border-blue-700"
                          : "bg-blue-200 text-blue-950 border-blue-300"
                      }`}
                    >
                      {node.name && node.name !== "(Belum Ditentukan)" ? (
                        node.name
                          .replace(/^(Dr\.|Drs\.|Ir\.|H\.|Hj\.)\s+/gi, "")
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                  )}

                  {/* Official Name & NIP — NO TRUNCATE */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[11px] font-black leading-tight break-words text-slate-900">
                      {node.name}
                    </p>
                    {node.nip && (
                      <p
                        className={`text-[9px] font-mono leading-none ${
                          node.type === "root" ? "text-blue-200" : "text-slate-500"
                        }`}
                      >
                        NIP: {node.nip}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Recursive Component for Vertical Stacked View (Unified Blue Branding)
const RenderVerticalNode: React.FC<{
  node?: OrgNode | null;
  isRoot?: boolean;
}> = ({ node, isRoot = false }) => {
  if (!node) return null;

  const validChildren = Array.isArray(node.children) ? node.children.filter((c): c is OrgNode => Boolean(c)) : [];
  const hasChildren = validChildren.length > 0;

  return (
    <div className="space-y-4">
      {/* Node Card */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border transition shadow-sm ${
          isRoot
            ? "bg-blue-950 text-white border-blue-900 shadow-blue-900/20"
            : "bg-white border-slate-200 hover:border-blue-500"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Avatar / Initial Circle */}
          {node.avatar ? (
            <img
              src={node.avatar.startsWith("http") ? node.avatar : `http://localhost:8000${node.avatar}`}
              alt={node.name}
              className="w-12 h-12 rounded-2xl object-cover border border-blue-300 shadow-sm shrink-0"
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 border ${
                isRoot
                  ? "bg-blue-800 text-sky-200 border-blue-700"
                  : "bg-blue-100 text-blue-800 border-blue-200"
              }`}
            >
              {node.name && node.name !== "(Belum Ditentukan)" ? (
                node.name
                  .replace(/^(Dr\.|Drs\.|Ir\.|H\.|Hj\.)\s+/gi, "")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
          )}

          <div className="min-w-0 space-y-0.5">
            <h3
              className={`text-xs sm:text-sm font-black uppercase tracking-tight ${
                isRoot ? "text-sky-200" : "text-blue-950"
              }`}
            >
              {node.position}
            </h3>
            <p
              className={`text-xs font-bold ${
                isRoot ? "text-white" : "text-slate-900"
              }`}
            >
              {node.name}
            </p>
            {node.nip && (
              <p
                className={`text-[10px] font-mono ${
                  isRoot ? "text-blue-200" : "text-slate-500"
                }`}
              >
                NIP: {node.nip}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Render Children Vertically Stacked with Per-Child Gap & Termination Math */}
      {hasChildren && (
        <div className="pl-6 sm:pl-8 ml-6 sm:ml-8 space-y-4">
          {validChildren.map((child, idx) => {
            const isLast = idx === validChildren.length - 1;

            return (
              <div key={child.id || idx} className="relative">
                {/* Vertical stem line segment: extends -bottom-4 (16px gap) for siblings, terminates at h-[29px] for last child */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-0 w-0.5 bg-blue-400 z-0 ${
                    isLast ? "h-[29px]" : "-bottom-4"
                  }`}
                />

                {/* Horizontal branch line connecting stem to card */}
                <div className="absolute -left-6 sm:-left-8 top-[28px] h-0.5 w-6 sm:w-8 bg-blue-400 z-0" />

                <RenderVerticalNode node={child} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
