import React, { useState, useRef } from "react";
import useSupercluster from 'use-supercluster';
import {
  MapContainer,
  Marker,
  Popup,
  Polygon,
  Rectangle,
  Tooltip,
  CircleMarker,
  useMap,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";
import * as pdfjsLib from "pdfjs-dist";
import { TrashBin, MapShape, BinTypeConfig, OverlayImage, BinCategoryConfig } from "../types";
import MapDrawing from "./MapDrawing";
import MapEvents from "./MapEvents";
import {
  Trash2,
  Plus,
  Image as ImageIcon,
  Crosshair,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Minus,
  Maximize2,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Fix for default Leaflet markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons based on status

const iconCache: Record<string, L.DivIcon> = {};

const getCachedIcon = (fillColor: string, borderColor: string, count: number | undefined, zoomLevel: number, isOverflowing: boolean = false) => {
  const key = `${fillColor}-${borderColor}-${count}-${zoomLevel}-${isOverflowing}`;
  if (!iconCache[key]) {
    iconCache[key] = createIcon(fillColor, borderColor, count, zoomLevel, isOverflowing);
  }
  return iconCache[key];
};

const clusterIconCache: Record<string, L.DivIcon> = {};

const getCachedClusterIcon = (colors: string[], count: number, zoomLevel: number) => {
  const key = `${colors.sort().join(',')}-${count}-${zoomLevel}`;
  if (!clusterIconCache[key]) {
    clusterIconCache[key] = createClusterIcon(colors, count, zoomLevel);
  }
  return clusterIconCache[key];
};

const createIcon = (fillColor: string, borderColor: string, count: number | undefined, zoomLevel: number, isOverflowing: boolean = false) => {
  const baseZoom = 18;
  const baseSize = 24;
  const size = Math.min(36, Math.max(10, baseSize * Math.pow(1.5, zoomLevel - baseZoom))); // Min size 10px, max 36px

  const textColor = isOverflowing ? "white" : (borderColor === "white" ? "white" : borderColor);
  
  const content =
    count && count > 1
      ? `<span style="color: ${textColor}; font-size: ${Math.max(8, size/2.5)}px; font-weight: bold; text-shadow: 0 0 2px rgba(0,0,0,0.5);">${count}</span>`
      : "";

  if (isOverflowing) {
    const html = `
      <div style="
        width: 0;
        height: 0;
        border-left: ${size/1.2}px solid transparent;
        border-right: ${size/1.2}px solid transparent;
        border-bottom: ${size * 1.5}px solid #DC2626;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        position: relative;
        display: flex;
        justify-content: center;
      ">
        <div style="position: absolute; top: ${size * 0.7}px;">
          ${content}
        </div>
      </div>
    `;
    return new L.DivIcon({
      className: "custom-icon-triangle",
      html,
      iconSize: [size * 2, size * 1.5],
      iconAnchor: [size, size * 0.75],
    });
  }

  return new L.DivIcon({
    className: "custom-icon",
    html: `<div style="background-color: ${fillColor}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${Math.max(1, size/8)}px solid ${borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">${content}</div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

const getBinStyle = (bin: TrashBin, binTypes: BinTypeConfig[], binCategories: BinCategoryConfig[]) => {
  const typeConfig = binTypes.find((t) => t.id === bin.type);
  const categoryConfig = typeConfig ? binCategories.find(c => c.id === typeConfig.categoryId) : undefined;
  const fillColor = categoryConfig ? categoryConfig.color : (typeConfig?.color || "#A08E78");

  let borderColor = "white";

  switch (bin.status) {
    case "to_install":
      borderColor = "#DC2626"; // Rouge
      break;
    case "installed":
      borderColor = "white"; // Blanc
      break;
    case "overflowing":
      borderColor = "#DC2626"; // Rouge pour archi pleine (on pourrait utiliser le fond rouge, mais l'utilisateur veut garder la couleur de remplissage)
      break;
    case "missing":
      borderColor = "#9333EA"; // Violet
      break;
    case "to_remove":
      borderColor = "#D4A373"; // Orange
      break;
    case "removed":
      borderColor = "#D9D3C7"; // Gris clair
      break;
  }

  // Si on veut vraiment démarquer missing/overflowing, on pourrait surcharger fillColor ici,
  // mais la consigne dit "garder le code couleur de la poubelle en remplissage en lien avec la caractéristique"

  return { fillColor, borderColor };
};

interface BinMapProps {
  bins: TrashBin[];
  binTypes: BinTypeConfig[];
  binCategories: BinCategoryConfig[];
  mode: "map" | "map_edition" | "map_deutz";
  onUpdateStatus: (id: string, status: TrashBin["status"]) => void;
  selectedBinId: string | null;
  onSelectBin?: (id: string | null) => void;
  placingBinId: string | null;
  onPlaceBin: (lat: number, lng: number) => void;
  onDeleteBin: (id: string) => void;
  onStartPlacing?: (id: string) => void;
  onAddAndPlaceBin?: (typeId: string) => void;
  onUpdateBin?: (id: string, updates: Partial<TrashBin>) => void;
  onUpdateAllBins?: (updater: (bins: TrashBin[]) => TrashBin[]) => void;
  umapOffset?: { x: number; y: number };
  onUpdateUmapOffset?: (offset: { x: number; y: number }) => void;
  umapRefreshKey?: number;
  showUmapData?: boolean;
  onUpdateShowUmapData?: (val: boolean) => void;
}


const BinPopupContent = ({ bin, binTypes, binCategories, mode, deutzSubMode, onUpdateBin, onUpdateStatus, onDeleteBin }: any) => {
  const typeConfig = binTypes.find((t: any) => t.id === bin.type);
  const categoryConfig = typeConfig ? binCategories.find((c: any) => c.id === typeConfig.categoryId) : undefined;

  return (
    <div className="flex flex-col gap-3 min-w-[220px] max-w-[280px] text-[#3C413A] font-sans" onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-base text-[#4B6345] leading-tight">
          {bin.name}
        </h3>
        <div className="flex items-center gap-2 text-xs text-[#7A8275] font-medium">
          <span className="bg-[#F4F1EA] px-1.5 py-0.5 rounded">Qté: {bin.count || 1}</span>
          <span className="bg-[#F4F1EA] px-1.5 py-0.5 rounded truncate max-w-[120px]">{bin.zone}</span>
        </div>
        {typeConfig && (
          <div className="mt-1">
             <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: typeConfig.color }}>
               {typeConfig.label}
             </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-[#E5E0D5] pt-3">
        <label className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#F9F8F6] border border-[#EBE7DF] active:bg-[#E5E0D5] transition-colors cursor-pointer">
          <span className={`text-xs font-bold ${bin.urgentPlacement ? "text-[#DC2626]" : "text-[#7A8275]"}`}>
            À poser urgence
          </span>
          <input
            type="checkbox"
            checked={bin.urgentPlacement || false}
            onChange={(e) => onUpdateBin && onUpdateBin(bin.id, { urgentPlacement: e.target.checked })}
            className="w-4 h-4 rounded border-[#D9D3C7] text-[#DC2626] focus:ring-[#DC2626]"
          />
        </label>
        
        <label className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#F9F8F6] border border-[#EBE7DF] active:bg-[#E5E0D5] transition-colors cursor-pointer">
          <span className={`text-xs font-bold ${bin.urgentRemoval ? "text-[#D4A373]" : "text-[#7A8275]"}`}>
            À déposer urgence
          </span>
          <input
            type="checkbox"
            checked={bin.urgentRemoval || false}
            onChange={(e) => onUpdateBin && onUpdateBin(bin.id, { urgentRemoval: e.target.checked })}
            className="w-4 h-4 rounded border-[#D9D3C7] text-[#D4A373] focus:ring-[#D4A373]"
          />
        </label>

        <label className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#F9F8F6] border border-[#EBE7DF] active:bg-[#E5E0D5] transition-colors cursor-pointer">
          <span className={`text-xs font-bold ${bin.maintenanceRequired ? "text-[#9333EA]" : "text-[#7A8275]"}`}>
            Maintenance
          </span>
          <input
            type="checkbox"
            checked={bin.maintenanceRequired || false}
            onChange={(e) => onUpdateBin && onUpdateBin(bin.id, { maintenanceRequired: e.target.checked })}
            className="w-4 h-4 rounded border-[#D9D3C7] text-[#9333EA] focus:ring-[#9333EA]"
          />
        </label>
      </div>

      <div className="border-t border-[#E5E0D5] pt-3">
        <p className="text-[10px] font-bold uppercase text-[#A08E78] mb-2 tracking-wider">
          Statut
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {mode === "map_deutz" && deutzSubMode === "pose" && (
            <>
              <button
                onClick={() => onUpdateStatus(bin.id, "to_install")}
                className={`p-2 text-xs font-bold rounded-lg transition-colors ${bin.status === "to_install" ? "bg-[#A08E78] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}`}
              >
                À poser
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "installed")}
                className={`p-2 text-xs font-bold rounded-lg transition-colors ${bin.status === "installed" ? "bg-[#6B8E63] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}`}
              >
                Posée
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "overflowing")}
                className={`p-2 text-xs font-bold rounded-lg transition-colors col-span-2 flex items-center justify-center gap-1 ${bin.status === "overflowing" ? "bg-[#DC2626] text-white shadow-inner" : "bg-[#FEE2E2] text-[#DC2626] active:bg-[#FECACA]"}`}
              >
                <span>🚨</span> Archi pleine
              </button>
            </>
          )}
          {mode === "map_deutz" && deutzSubMode === "depose" && (
            <>
              <button
                onClick={() => onUpdateStatus(bin.id, "to_remove")}
                className={`p-2 text-xs font-bold rounded-lg transition-colors ${bin.status === "to_remove" ? "bg-[#D4A373] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}`}
              >
                À retirer
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "removed")}
                className={`p-2 text-xs font-bold rounded-lg transition-colors ${bin.status === "removed" ? "bg-[#D9D3C7] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}`}
              >
                Retirée
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "overflowing")}
                className={`p-2 text-xs font-bold rounded-lg transition-colors col-span-2 flex items-center justify-center gap-1 ${bin.status === "overflowing" ? "bg-[#DC2626] text-white shadow-inner" : "bg-[#FEE2E2] text-[#DC2626] active:bg-[#FECACA]"}`}
              >
                <span>🚨</span> Archi pleine
              </button>
            </>
          )}
          {mode !== "map_deutz" && (
            <>
              <button
                onClick={() => onUpdateStatus(bin.id, "to_install")}
                className={`p-2 text-xs font-bold rounded-lg transition-colors ${bin.status === "to_install" ? "bg-[#A08E78] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}`}
              >
                À poser
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "installed")}
                className={`p-2 text-xs font-bold rounded-lg transition-colors ${bin.status === "installed" ? "bg-[#6B8E63] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}`}
              >
                Posée
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "to_remove")}
                className={`p-2 text-xs font-bold rounded-lg transition-colors ${bin.status === "to_remove" ? "bg-[#D4A373] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}`}
              >
                À retirer
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "removed")}
                className={`p-2 text-xs font-bold rounded-lg transition-colors ${bin.status === "removed" ? "bg-[#D9D3C7] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}`}
              >
                Retirée
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "missing")}
                className={`p-2 text-xs font-bold rounded-lg transition-colors ${bin.status === "missing" ? "bg-[#9333EA] text-white shadow-inner" : "bg-[#F4F1EA] text-[#7A8275] active:bg-[#EBE7DF]"}`}
              >
                Manquante
              </button>
              <button
                onClick={() => onUpdateStatus(bin.id, "overflowing")}
                className={`p-2 text-xs font-bold rounded-lg transition-colors ${bin.status === "overflowing" ? "bg-[#DC2626] text-white shadow-inner" : "bg-[#FEE2E2] text-[#DC2626] active:bg-[#FECACA]"}`}
              >
                🚨 Pleine
              </button>
            </>
          )}
        </div>
      </div>

      <div className="text-[10px] text-[#A08E78] text-center pt-2">
        Mise à jour: {new Date(bin.lastEmptied).toLocaleTimeString()}
      </div>

      {mode === "map_edition" && (
        <button
          onClick={() => onDeleteBin(bin.id)}
          className="w-full mt-1 p-2 text-xs font-bold rounded-lg transition-colors bg-[#F4F1EA] text-[#916738] border border-[#D9D3C7] active:bg-[#EBE7DF]"
        >
          Supprimer
        </button>
      )}
    </div>
  );
};

const createClusterIcon = (colors: string[], count: number, zoomLevel: number) => {
  const baseZoom = 18;
  const baseSize = 32;
  const size = Math.min(48, Math.max(16, baseSize * Math.pow(1.5, zoomLevel - baseZoom)));

  let gradientStr = "";
  if (colors.length === 0) {
    gradientStr = "white";
  } else if (colors.length === 1) {
    gradientStr = colors[0];
  } else {
    const step = 100 / colors.length;
    gradientStr = `conic-gradient(${colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(", ")})`;
  }

  const content = `<span style="color: white; font-size: ${Math.max(10, size/2.5)}px; font-weight: bold; text-shadow: 0 0 3px rgba(0,0,0,0.8);">${count}</span>`;
  
  return new L.DivIcon({
    className: "custom-cluster-icon",
    html: `<div style="background: ${gradientStr}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${Math.max(2, size/8)}px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">${content}</div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

const MapMarkers = ({ bins, binTypes, binCategories, mode, deutzSubMode, calibState, setCalibState, setCalibBinPoint, onUpdateBin, onUpdateStatus, onDeleteBin }: any) => {
  const map = useMap();
  const [bounds, setBounds] = React.useState<number[] | null>(null);
  const [zoom, setZoom] = React.useState(map.getZoom());

  React.useEffect(() => {
    const updateBounds = () => {
      const b = map.getBounds();
      setBounds([
        b.getWest(),
        b.getSouth(),
        b.getEast(),
        b.getNorth()
      ]);
      setZoom(map.getZoom());
    };
    updateBounds();
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);
    return () => {
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, [map]);

  const points = React.useMemo(() => bins.map((bin: any) => ({
    type: "Feature",
    properties: { cluster: false, binId: bin.id, bin },
    geometry: { type: "Point", coordinates: [bin.lng, bin.lat] }
  })), [bins]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: zoom,
    options: { radius: 30, maxZoom: 22 }
  });

  return (
    <>
      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties;

        if (isCluster) {
          const leaves = supercluster.getLeaves(cluster.id as number, Infinity);
          const binLeaves = leaves.map((l: any) => l.properties.bin);
          const colors = binLeaves.map((bin: any) => getBinStyle(bin, binTypes, binCategories).fillColor);
          
          return (
            <Marker key={`cluster-${cluster.id}`} position={[lat, lng]} icon={getCachedClusterIcon(colors, pointCount, zoom)}>
              <Popup className="cluster-popup" maxWidth={800} autoPanPadding={[20, 20]}>
                <div className="flex gap-4 overflow-x-auto p-2" style={{ maxWidth: '80vw' }}>
                  {binLeaves.map((bin: any) => (
                    <div key={bin.id} className="flex-shrink-0 w-[240px] border border-[#E5E0D5] p-2 rounded-lg bg-white shadow-sm">
                      <BinPopupContent 
                         bin={bin} 
                         binTypes={binTypes} 
                         binCategories={binCategories} 
                         mode={mode} 
                         deutzSubMode={deutzSubMode} 
                         onUpdateBin={onUpdateBin} 
                         onUpdateStatus={onUpdateStatus} 
                         onDeleteBin={onDeleteBin} 
                      />
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          );
        }

        const bin = cluster.properties.bin;
        const { fillColor, borderColor } = getBinStyle(bin, binTypes, binCategories);
        return (
          <Marker 
            key={bin.id} 
            position={[lat, lng]} 
            icon={getCachedIcon(fillColor, borderColor, bin.count, zoom, bin.status === "overflowing")}
            eventHandlers={{
              click: (e) => {
                if (calibState === "step1_bin") {
                  setCalibBinPoint({ lat: bin.lat as number, lng: bin.lng as number });
                  setCalibState("step2_map");
                  e.originalEvent.preventDefault();
                  e.originalEvent.stopPropagation();
                  return;
                }
              }
            }}
          >
            <Popup autoPanPadding={[20, 20]}>
               <BinPopupContent 
                 bin={bin} 
                 binTypes={binTypes} 
                 binCategories={binCategories} 
                 mode={mode} 
                 deutzSubMode={deutzSubMode} 
                 onUpdateBin={onUpdateBin} 
                 onUpdateStatus={onUpdateStatus} 
                 onDeleteBin={onDeleteBin} 
               />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default function BinMap({
  bins,
  binTypes,
  binCategories,
  mode,
  onUpdateStatus,
  selectedBinId,
  onSelectBin,
  placingBinId,
  onPlaceBin,
  onDeleteBin,
  onStartPlacing,
  onAddAndPlaceBin,
  onUpdateBin,
  onUpdateAllBins,
  umapOffset = { x: 0, y: -23 },
  onUpdateUmapOffset,
  umapRefreshKey = 0,
  showUmapData = false,
  onUpdateShowUmapData,
}: BinMapProps) {
  const [deutzSubMode, setDeutzSubMode] = useState<"pose" | "depose">("pose");

  // Filter bins: show all placed bins
  const placedBins = React.useMemo(() => bins
    .filter((b) => b.lat !== null && b.lng !== null)
    .filter((b) => {
      if (mode === "map_deutz") {
        if (deutzSubMode === "pose") {
          return ["to_install", "installed", "overflowing"].includes(b.status);
        } else {
          return ["installed", "to_remove", "removed", "overflowing"].includes(
            b.status,
          );
        }
      }
      return true;
    }), [bins, mode, deutzSubMode]);

  const [zoomLevel, setZoomLevel] = useState(15);
  const [calibState, setCalibState] = useState<
    "idle" | "step1_bin" | "step2_map"
  >("idle");
    const [calibBinPoint, setCalibBinPoint] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
    if (calibState === "step2_map" && calibBinPoint) {
      // Calculate difference and shift all bins
      const deltaLat = lat - calibBinPoint.lat;
      const deltaLng = lng - calibBinPoint.lng;
      if (
        onUpdateAllBins &&
        window.confirm(
          "Voulez-vous déplacer TOUTES les poubelles selon ce vecteur ?",
        )
      ) {
        onUpdateAllBins((prev) =>
          prev.map((b) => {
            if (b.lat !== null && b.lng !== null) {
              return { ...b, lat: b.lat + deltaLat, lng: b.lng + deltaLng };
            }
            return b;
          }),
        );
      }
      setCalibState("idle");
      setCalibBinPoint(null);
      return;
    }
    if (calibState !== "idle") return;

    if (onSelectBin) onSelectBin(null);
    onPlaceBin(lat, lng);
  };

  const unplacedBins = React.useMemo(() => bins.filter((b) => b.lat === null || b.lng === null), [bins]);
  const overflowingBins = React.useMemo(() => placedBins.filter((b) => b.status === "overflowing"), [placedBins]);
  const maintenanceBins = React.useMemo(() => placedBins.filter((b) => b.maintenanceRequired), [placedBins]);
  const urgentPoseBins = React.useMemo(() => bins.filter(
    (b) => b.urgentPlacement && b.status === "to_install",
  ), [bins]);
  const urgentDeposeBins = React.useMemo(() => placedBins.filter(
    (b) => b.urgentRemoval && b.status === "to_remove",
  ), [placedBins]);

  const umapBaseUrl =
    `https://umap.vieillescharrues.bzh/fr/map/recap-container_20?scaleControl=false&miniMap=false&scrollWheelZoom=false&zoomControl=false&allowEdit=false&moreControl=true&searchControl=null&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=none&captionBar=false${showUmapData ? "" : "&datalayers=none"}`;
  const iframeRef = useRef<HTMLIFrameElement>(null);

      const UmapSync = () => {
    const map = useMap();
    const [iframeRefState, setIframeRefState] = React.useState<{
      center: L.LatLng;
      zoom: number;
    } | null>(null);

    React.useEffect(() => {
      if (!iframeRef.current) return;
      
      const center = map.getCenter();
      const zoom = map.getZoom();
      
      const baseUrl = umapBaseUrl.split('#')[0];
      const newSrc = `${baseUrl}#${zoom}/${center.lat}/${center.lng}`;
      iframeRef.current.src = newSrc;
      
      setIframeRefState({ center, zoom });
    }, [map, umapRefreshKey, umapBaseUrl]);

    React.useEffect(() => {
      if (!iframeRefState) return;

      const onMove = () => {
        if (!iframeRef.current) return;
        
        const currentZoom = map.getZoom();
        const scale = map.getZoomScale(currentZoom, iframeRefState.zoom);
        
        const targetScreenPt = map.latLngToContainerPoint(iframeRefState.center);
        const centerScreenPt = map.latLngToContainerPoint(map.getCenter());
        
        let dx = targetScreenPt.x - centerScreenPt.x;
        let dy = targetScreenPt.y - centerScreenPt.y;
        
        dx += umapOffset.x;
        dy += umapOffset.y;

        iframeRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
        iframeRef.current.style.transformOrigin = 'center center';
      };

      let ticking = false;
      const onMoveRAF = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            onMove();
            ticking = false;
          });
          ticking = true;
        }
      };

      map.on("move zoom resize", onMoveRAF);
      onMove();

      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
        onMoveRAF();
      });
      resizeObserver.observe(map.getContainer());

      return () => {
        map.off("move zoom resize", onMoveRAF);
        resizeObserver.disconnect();
      };
    }, [map, iframeRefState, umapOffset]);

    return null;
  };

  const MapCenterer = () => {
    const map = useMap();
    React.useEffect(() => {
      if (selectedBinId) {
        const bin = placedBins.find((b) => b.id === selectedBinId);
        if (bin && bin.lat !== null && bin.lng !== null) {
          map.flyTo([bin.lat, bin.lng], 19, { animate: true, duration: 0.5 });
        }
      }
    }, [selectedBinId, map]);

    React.useEffect(() => {
      const handleDragStart = () => {
        if (selectedBinId && onSelectBin) {
          onSelectBin(null);
        }
      };
      map.on("dragstart", handleDragStart);
      map.on("zoomstart", handleDragStart);
      return () => {
        map.off("dragstart", handleDragStart);
        map.off("zoomstart", handleDragStart);
      };
    }, [map, selectedBinId, onSelectBin]);

    return null;
  };

  const mapContent = (
    <div className="relative w-full h-full bg-[#E5E0D5] overflow-hidden">
      {mode === "map_deutz" && (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-xl shadow-lg border border-[#E5E0D5] p-1 flex overflow-hidden">
          <button
            onClick={() => setDeutzSubMode("pose")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${deutzSubMode === "pose" ? "bg-[#6B8E63] text-white" : "bg-transparent text-[#7A8275] hover:bg-[#F4F1EA]"}`}
          >
            Pose
          </button>
          <button
            onClick={() => setDeutzSubMode("depose")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${deutzSubMode === "depose" ? "bg-[#D4A373] text-white" : "bg-transparent text-[#7A8275] hover:bg-[#F4F1EA]"}`}
          >
            Dépose
          </button>
        </div>
      )}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <iframe
          ref={iframeRef}
          src={`${umapBaseUrl}#17/48.271993/-3.560402`}
          className="absolute z-0 pointer-events-none"
          style={{
            border: "none",
            width: "200%",
            height: "200%",
            left: "-50%",
            top: "-50%",
          }}
          title="Umap Background"
        />
      </div>
      <MapContainer
        center={[48.271993, -3.560402]}
        zoom={17}
        minZoom={15}
        maxZoom={19}
        style={{
          height: "100%",
          width: "100%",
          zIndex: 1,
          backgroundColor: "transparent",
          pointerEvents: "auto",
          cursor:
            placingBinId || calibState === "step2_map" ? "crosshair" : "grab",
        }}
      >
        <UmapSync />
        <MapCenterer />

        <MapEvents onMapClick={handleMapClick} onZoomChange={setZoomLevel} />

        
        <MapMarkers 
          bins={placedBins}
          binTypes={binTypes}
          binCategories={binCategories}
          mode={mode}
          deutzSubMode={deutzSubMode}
          calibState={calibState}
          setCalibState={setCalibState}
          setCalibBinPoint={setCalibBinPoint}
          onUpdateBin={onUpdateBin}
          onUpdateStatus={onUpdateStatus}
          onDeleteBin={onDeleteBin}
        />
      </MapContainer>

      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
      {maintenanceBins.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-[#9333EA] p-3 max-w-sm max-h-64 flex flex-col pointer-events-auto">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#F3E8FF]">
            <AlertTriangle size={18} className="text-[#9333EA]" />
            <h3 className="font-bold text-sm text-[#9333EA]">
              Maintenance nécessaire ({maintenanceBins.length})
            </h3>
          </div>
          <div className="overflow-y-auto pr-2 space-y-2">
            {maintenanceBins.map((bin) => {
              const typeConfig = binTypes.find((t) => t.id === bin.type);
              return (
                <div
                  key={bin.id}
                  onClick={() => onSelectBin && onSelectBin(bin.id)}
                  className={`p-2 rounded border border-[#F3E8FF] bg-[#FAF5FF] cursor-pointer hover:bg-[#E9D5FF] transition-colors ${selectedBinId === bin.id ? "ring-2 ring-[#9333EA]" : ""}`}
                >
                  <div className="font-bold text-xs text-[#6B21A8]">
                    {bin.name}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-[#9333EA]">
                      {bin.zone}
                    </span>
                    {typeConfig && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-[#9333EA] text-[#9333EA] bg-white">
                        {typeConfig.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {overflowingBins.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-[#DC2626] p-3 max-w-sm max-h-64 flex flex-col pointer-events-auto">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#FEE2E2]">
            <AlertTriangle size={18} className="text-[#DC2626]" />
            <h3 className="font-bold text-sm text-[#DC2626]">
              Poubelles archi pleines ({overflowingBins.length})
            </h3>
          </div>
          <div className="overflow-y-auto pr-2 space-y-2">
            {overflowingBins.map((bin) => {
              const typeConfig = binTypes.find((t) => t.id === bin.type);
              return (
                <div
                  key={bin.id}
                  onClick={() => onSelectBin && onSelectBin(bin.id)}
                  className={`p-2 rounded border border-[#FEE2E2] bg-[#FEF2F2] cursor-pointer hover:bg-[#FCA5A5] transition-colors ${selectedBinId === bin.id ? "ring-2 ring-[#DC2626]" : ""}`}
                >
                  <div className="font-bold text-xs text-[#991B1B]">
                    {bin.name}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-[#DC2626]">
                      {bin.zone}
                    </span>
                    {typeConfig && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-[#DC2626] text-[#DC2626] bg-white">
                        {typeConfig.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>

      {mode === "map_deutz" &&
        deutzSubMode === "pose" &&
        urgentPoseBins.length > 0 && (
          <div className="absolute top-16 right-4 z-[1000] bg-white rounded-xl shadow-lg border border-[#DC2626] p-3 max-w-sm max-h-64 flex flex-col pointer-events-auto">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#FEE2E2]">
              <AlertTriangle size={18} className="text-[#DC2626]" />
              <h3 className="font-bold text-sm text-[#DC2626]">
                À poser en priorité ({urgentPoseBins.length})
              </h3>
            </div>
            <div className="overflow-y-auto pr-2 space-y-2">
              {urgentPoseBins.map((bin) => {
                const typeConfig = binTypes.find((t) => t.id === bin.type);
                return (
                  <div
                    key={bin.id}
                    onClick={() =>
                      bin.lat && bin.lng && onSelectBin && onSelectBin(bin.id)
                    }
                    className={`p-2 rounded border border-[#FEE2E2] bg-[#FEF2F2] cursor-pointer hover:bg-[#FCA5A5] transition-colors ${selectedBinId === bin.id ? "ring-2 ring-[#DC2626]" : ""}`}
                  >
                    <div className="font-bold text-xs text-[#991B1B]">
                      {bin.name}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-[#DC2626]">
                        {bin.zone}
                      </span>
                      {typeConfig && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-[#DC2626] text-[#DC2626] bg-white">
                          {typeConfig.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {mode === "map_deutz" &&
        deutzSubMode === "depose" &&
        urgentDeposeBins.length > 0 && (
          <div className="absolute top-16 right-4 z-[1000] bg-white rounded-xl shadow-lg border border-[#D4A373] p-3 max-w-sm max-h-64 flex flex-col pointer-events-auto">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#FCECD8]">
              <AlertTriangle size={18} className="text-[#D4A373]" />
              <h3 className="font-bold text-sm text-[#D4A373]">
                À déposer en priorité ({urgentDeposeBins.length})
              </h3>
            </div>
            <div className="overflow-y-auto pr-2 space-y-2">
              {urgentDeposeBins.map((bin) => {
                const typeConfig = binTypes.find((t) => t.id === bin.type);
                return (
                  <div
                    key={bin.id}
                    onClick={() =>
                      bin.lat && bin.lng && onSelectBin && onSelectBin(bin.id)
                    }
                    className={`p-2 rounded border border-[#FCECD8] bg-[#FDF8F3] cursor-pointer hover:bg-[#FCD3A8] transition-colors ${selectedBinId === bin.id ? "ring-2 ring-[#D4A373]" : ""}`}
                  >
                    <div className="font-bold text-xs text-[#9C6D3C]">
                      {bin.name}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-[#D4A373]">
                        {bin.zone}
                      </span>
                      {typeConfig && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-[#D4A373] text-[#D4A373] bg-white">
                          {typeConfig.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Umap Interaction Toggle */}
      {onUpdateShowUmapData && (
        <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto">
          <button
            onClick={() => onUpdateShowUmapData(!showUmapData)}
            className={`px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-colors border ${!showUmapData ? 'bg-[#3B82F6] text-white border-[#2563EB]' : 'bg-white text-[#7A8275] border-[#E5E0D5] hover:bg-[#F4F1EA]'}`}
          >
            {showUmapData ? "Cacher les filtres Umap" : "Afficher les filtres Umap"}
          </button>
        </div>
      )}

    </div>
  );

  return (
    <div className="flex w-full h-full relative">
      <div className="flex-1 relative">{mapContent}</div>
      {mode === "map_edition" && (
        <div className="w-80 bg-white border-l border-[#E5E0D5] flex flex-col h-full z-[1000] shadow-xl overflow-y-auto">
          <div className="p-4 border-b border-[#E5E0D5] bg-[#F9F8F6]">
            <h2 className="font-bold text-[#4B6345] flex items-center gap-2">
              <Crosshair size={18} /> Mode Édition
            </h2>
            <p className="text-xs text-[#7A8275] mt-1">
              Gérez le plan et les images de référence.
            </p>
          </div>

          <div className="p-4 border-b border-[#E5E0D5]">
            <h3 className="font-bold text-sm text-[#3C413A] mb-3 flex items-center gap-2">
              <Crosshair size={16} /> Outils
            </h3>

            <div className="mb-4">
              <button
                onClick={() =>
                  setCalibState(calibState === "idle" ? "step1_bin" : "idle")
                }
                className={`w-full py-2 px-3 text-xs font-bold uppercase rounded transition-colors flex items-center justify-center gap-2 ${calibState !== "idle" ? "bg-[#6B8E63] text-white" : "bg-[#EBE7DF] text-[#4B6345] hover:bg-[#D9D3C7]"}`}
              >
                <Crosshair size={14} />
                {calibState === "idle"
                  ? "Recalibrer les poubelles"
                  : "Annuler recalibrage"}
              </button>
              {calibState === "step1_bin" && (
                <p className="text-[10px] text-[#D4A373] mt-2">
                  Étape 1 : Cliquez sur une poubelle mal placée.
                </p>
              )}
              {calibState === "step2_map" && (
                <p className="text-[10px] text-[#6B8E63] mt-2">
                  Étape 2 : Cliquez sur sa position correcte sur le plan Umap.
                </p>
              )}
            </div>

            

            <p className="text-xs text-[#7A8275] mb-2">
              L'arrière-plan du plan utilise la carte UMap:{" "}
              <a
                href="https://umap.vieillescharrues.bzh/fr/map/recap-container_20"
                target="_blank"
                rel="noreferrer"
                className="text-[#6B8E63] underline"
              >
                recap-container_20
              </a>
            </p>
          </div>

          <div className="p-4 border-b border-[#E5E0D5]">
            <h3 className="font-bold text-sm text-[#3C413A] mb-3 flex items-center gap-2">
              <Plus size={16} /> Ajouter une poubelle
            </h3>
            <p className="text-xs text-[#7A8275] mb-3">
              Cliquez sur un type pour le placer sur la carte.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {binTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => onAddAndPlaceBin?.(type.id)}
                  className="flex flex-col items-center gap-2 p-2 bg-white border border-[#D9D3C7] rounded-lg hover:bg-[#F4F1EA] transition-colors"
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: binCategories.find(c => c.id === type.categoryId)?.color || type.color || "#ccc" }}
                  />
                  <span className="text-[10px] font-bold text-[#4B6345] text-center leading-tight">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-bold text-sm text-[#3C413A] mb-3 flex items-center gap-2">
              Poubelles à poser ({unplacedBins.length})
            </h3>
            <div className="space-y-2">
              {unplacedBins.map((bin) => {
                const typeConfig = binTypes.find((t) => t.id === bin.type);
                return (
                  <div
                    key={bin.id}
                    className="p-3 bg-white border border-[#D9D3C7] rounded-lg shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-[#4B6345] text-xs">
                        {bin.name}{" "}
                        {bin.count && bin.count > 1 ? `(x${bin.count})` : ""}
                      </h4>
                      <p className="text-[10px] text-[#7A8275]">{bin.zone}</p>
                    </div>
                    <button
                      onClick={() => onStartPlacing?.(bin.id)}
                      className={`p-1.5 rounded transition-colors ${placingBinId === bin.id ? "bg-[#6B8E63] text-white" : "bg-[#EBE7DF] text-[#4B6345] hover:bg-[#D9D3C7]"}`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
