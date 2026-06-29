import React, { useState, useRef } from "react";
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
import { TrashBin, MapShape, BinTypeConfig, OverlayImage } from "../types";
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
const createIcon = (fillColor: string, borderColor: string, count?: number) => {
  const content =
    count && count > 1
      ? `<span style="color: ${borderColor === "white" ? "white" : borderColor}; font-size: 10px; font-weight: bold; text-shadow: 0 0 2px rgba(0,0,0,0.5);">${count}</span>`
      : "";
  return new L.DivIcon({
    className: "custom-icon",
    html: `<div style="background-color: ${fillColor}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid ${borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">${content}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const getBinStyle = (bin: TrashBin, binTypes: BinTypeConfig[]) => {
  const typeConfig = binTypes.find((t) => t.id === bin.type);
  const fillColor = typeConfig ? typeConfig.color : "#A08E78";

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
  mode: "map_pose" | "map_depose" | "map_exploitation" | "map_edition";
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
}

export default function BinMap({
  bins,
  binTypes,
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
}: BinMapProps) {
  // Filter bins based on mode to keep the map clear
  const placedBins = bins
    .filter((b) => b.lat !== null && b.lng !== null)
    .filter((b) => {
      if (mode === "map_pose") {
        return ["to_install", "installed", "overflowing"].includes(b.status);
      }
      if (mode === "map_depose") {
        return ["installed", "to_remove", "removed", "overflowing"].includes(
          b.status,
        );
      }
      if (mode === "map_exploitation") {
        return true; // toutes les poubelles apparaissent
      }
      return true;
    });

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

  const unplacedBins = bins.filter((b) => b.lat === null || b.lng === null);
  const overflowingBins = placedBins.filter((b) => b.status === "overflowing");
  const urgentPoseBins = bins.filter(
    (b) => b.urgentPlacement && b.status === "to_install",
  );
  const urgentDeposeBins = placedBins.filter(
    (b) => b.urgentRemoval && b.status === "to_remove",
  );

  const umapBaseUrl =
    "https://umap.vieillescharrues.bzh/fr/map/recap-container_20?scaleControl=false&miniMap=false&scrollWheelZoom=false&zoomControl=false&allowEdit=false&moreControl=true&searchControl=null&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=none&captionBar=false";
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const UmapSync = () => {
    const map = useMap();

    React.useEffect(() => {
      const fixedCenter = L.latLng(48.271993, -3.560402);
      const fixedZoom = 17;

      const onMove = () => {
        if (!iframeRef.current) return;

        const pt = map.latLngToContainerPoint(fixedCenter);
        const container = map.getContainer();
        const hw = container.clientWidth / 2;
        const hh = container.clientHeight / 2;

        const scale = Math.pow(2, map.getZoom() - fixedZoom);

        const tx = pt.x - hw + umapOffset.x * scale;
        const ty = pt.y - hh + umapOffset.y * scale;

        iframeRef.current.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        iframeRef.current.style.transformOrigin = "center center";
      };

      map.on("move zoom resize", onMove);
      onMove(); // initial update

      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
        onMove();
      });
      resizeObserver.observe(map.getContainer());

      return () => {
        map.off("move zoom resize", onMove);
        resizeObserver.disconnect();
      };
    }, [map, umapOffset]);
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
      <iframe
        ref={iframeRef}
        src={`${umapBaseUrl}#17/48.271993/-3.560402`}
        className="absolute z-0 pointer-events-none"
        style={{
          width: "400%",
          height: "400%",
          top: "-150%",
          left: "-150%",
          border: "none",
        }}
        title="Umap Background"
      />
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
          cursor:
            placingBinId || calibState === "step2_map" ? "crosshair" : "grab",
        }}
      >
        <UmapSync />
        <MapCenterer />

        <MapEvents onMapClick={handleMapClick} onZoomChange={setZoomLevel} />

        {placedBins.map((bin) => {
          const typeConfig = binTypes.find((t) => t.id === bin.type);
          const { fillColor, borderColor } = getBinStyle(bin, binTypes);
          return (
            <Marker
              key={bin.id}
              position={[bin.lat as number, bin.lng as number]}
              icon={createIcon(fillColor, borderColor, bin.count)}
              eventHandlers={{
                click: (e) => {
                  if (calibState === "step1_bin") {
                    setCalibBinPoint({
                      lat: bin.lat as number,
                      lng: bin.lng as number,
                    });
                    setCalibState("step2_map");
                    e.originalEvent.preventDefault();
                    e.originalEvent.stopPropagation();
                    return;
                  }
                },
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px] text-[#3C413A] font-sans">
                  <h3 className="font-bold text-sm mb-1 text-[#4B6345]">
                    {bin.name}
                  </h3>
                  <p className="text-xs text-[#7A8275] mb-1 font-medium">
                    Nombre: {bin.count || 1}
                  </p>
                  <p className="text-xs text-[#7A8275] mb-1 font-medium">
                    Zone: {bin.zone}
                  </p>
                  {typeConfig && (
                    <p
                      className="text-xs font-bold mb-3"
                      style={{ color: typeConfig.color }}
                    >
                      Type: {typeConfig.label}
                    </p>
                  )}

                  <div className="mb-3 space-y-2 border-t border-[#E5E0D5] pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bin.urgentPlacement || false}
                        onChange={(e) =>
                          onUpdateBin &&
                          onUpdateBin(bin.id, {
                            urgentPlacement: e.target.checked,
                          })
                        }
                        className="w-3.5 h-3.5 rounded border-[#D9D3C7] text-[#DC2626] focus:ring-[#DC2626]"
                      />
                      <span
                        className={`text-[10px] font-bold transition-colors ${bin.urgentPlacement ? "text-[#DC2626]" : "text-[#7A8275]"}`}
                      >
                        À poser en priorité
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bin.urgentRemoval || false}
                        onChange={(e) =>
                          onUpdateBin &&
                          onUpdateBin(bin.id, {
                            urgentRemoval: e.target.checked,
                          })
                        }
                        className="w-3.5 h-3.5 rounded border-[#D9D3C7] text-[#D4A373] focus:ring-[#D4A373]"
                      />
                      <span
                        className={`text-[10px] font-bold transition-colors ${bin.urgentRemoval ? "text-[#D4A373]" : "text-[#7A8275]"}`}
                      >
                        À déposer en priorité
                      </span>
                    </label>
                  </div>

                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase text-[#7A8275] mb-2">
                      Changer le statut
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {mode === "map_pose" && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(bin.id, "to_install")}
                            className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${bin.status === "to_install" ? "bg-[#A08E78] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}`}
                          >
                            À poser
                          </button>
                          <button
                            onClick={() => onUpdateStatus(bin.id, "installed")}
                            className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${bin.status === "installed" ? "bg-[#6B8E63] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}`}
                          >
                            Posée
                          </button>
                          <button
                            onClick={() =>
                              onUpdateStatus(bin.id, "overflowing")
                            }
                            className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors col-span-2 ${bin.status === "overflowing" ? "bg-[#DC2626] text-white" : "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]"}`}
                          >
                            🚨 Archi pleine
                          </button>
                        </>
                      )}
                      {mode === "map_depose" && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(bin.id, "to_remove")}
                            className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${bin.status === "to_remove" ? "bg-[#D4A373] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}`}
                          >
                            À retirer
                          </button>
                          <button
                            onClick={() => onUpdateStatus(bin.id, "removed")}
                            className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${bin.status === "removed" ? "bg-[#D9D3C7] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}`}
                          >
                            Retirée
                          </button>
                          <button
                            onClick={() =>
                              onUpdateStatus(bin.id, "overflowing")
                            }
                            className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors col-span-2 ${bin.status === "overflowing" ? "bg-[#DC2626] text-white" : "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]"}`}
                          >
                            🚨 Archi pleine
                          </button>
                        </>
                      )}
                      {mode === "map_exploitation" && (
                        <>
                          <button
                            onClick={() => onUpdateStatus(bin.id, "missing")}
                            className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${bin.status === "missing" ? "bg-[#9333EA] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}`}
                          >
                            Manquante
                          </button>
                          <button
                            onClick={() => onUpdateStatus(bin.id, "installed")}
                            className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${bin.status === "installed" ? "bg-[#6B8E63] text-white" : "bg-[#EBE7DF] text-[#7A8275] hover:bg-[#D9D3C7]"}`}
                          >
                            OK avec la vie
                          </button>
                          <button
                            onClick={() =>
                              onUpdateStatus(bin.id, "overflowing")
                            }
                            className={`px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors col-span-2 ${bin.status === "overflowing" ? "bg-[#DC2626] text-white" : "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]"}`}
                          >
                            🚨 Archi pleine
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-[#A08E78] pt-2 pb-2 border-t border-[#E5E0D5]">
                    Dernière collecte:{" "}
                    {new Date(bin.lastEmptied).toLocaleTimeString()}
                  </div>
                  {mode !== "map_exploitation" && (
                    <button
                      onClick={() => onDeleteBin(bin.id)}
                      className="w-full px-2 py-1.5 text-[10px] font-bold uppercase rounded transition-colors bg-[#F4F1EA] text-[#916738] border border-[#D9D3C7] hover:bg-[#D9D3C7]"
                    >
                      Supprimer du plan
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {overflowingBins.length > 0 && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-xl shadow-lg border border-[#DC2626] p-3 max-w-sm max-h-64 flex flex-col pointer-events-auto">
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

      {mode === "map_pose" && urgentPoseBins.length > 0 && (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-xl shadow-lg border border-[#DC2626] p-3 max-w-sm max-h-64 flex flex-col pointer-events-auto">
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

      {mode === "map_depose" && urgentDeposeBins.length > 0 && (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-xl shadow-lg border border-[#D4A373] p-3 max-w-sm max-h-64 flex flex-col pointer-events-auto">
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

            {onUpdateUmapOffset && (
              <div className="mb-4 p-3 bg-[#F4F1EA] rounded-lg border border-[#D9D3C7]">
                <h4 className="text-[10px] font-bold text-[#7A8275] uppercase mb-2 text-center">
                  Déplacer le fond Umap
                </h4>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() =>
                      onUpdateUmapOffset({ ...umapOffset, y: umapOffset.y - 5 })
                    }
                    className="p-1 bg-white hover:bg-[#EBE7DF] rounded shadow-sm border border-[#D9D3C7]"
                    title="Monter"
                  >
                    <ArrowUp size={16} className="text-[#3C413A]" />
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        onUpdateUmapOffset({
                          ...umapOffset,
                          x: umapOffset.x - 5,
                        })
                      }
                      className="p-1 bg-white hover:bg-[#EBE7DF] rounded shadow-sm border border-[#D9D3C7]"
                      title="Gauche"
                    >
                      <ArrowLeft size={16} className="text-[#3C413A]" />
                    </button>
                    <button
                      onClick={() =>
                        onUpdateUmapOffset({
                          ...umapOffset,
                          y: umapOffset.y + 5,
                        })
                      }
                      className="p-1 bg-white hover:bg-[#EBE7DF] rounded shadow-sm border border-[#D9D3C7]"
                      title="Descendre"
                    >
                      <ArrowDown size={16} className="text-[#3C413A]" />
                    </button>
                    <button
                      onClick={() =>
                        onUpdateUmapOffset({
                          ...umapOffset,
                          x: umapOffset.x + 5,
                        })
                      }
                      className="p-1 bg-white hover:bg-[#EBE7DF] rounded shadow-sm border border-[#D9D3C7]"
                      title="Droite"
                    >
                      <ArrowRight size={16} className="text-[#3C413A]" />
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                    style={{ backgroundColor: type.color }}
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
