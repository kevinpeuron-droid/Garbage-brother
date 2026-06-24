import React, { useState, useEffect } from "react";
import BinMap from "./components/BinMap";
import ListView from "./components/ListView";
import SettingsView from "./components/SettingsView";
import HoursView from "./components/HoursView";
import {
  TrashBin,
  MapShape,
  BinTypeConfig,
  defaultBinTypes,
  WorkSession,
} from "./types";
import { mockBins } from "./data";
import {
  Trash2,
  Map,
  List,
  Settings,
  Share2,
  Check,
  Clock,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

type ViewMode =
  | "map_pose"
  | "map_depose"
  | "map_exploitation"
  | "list"
  | "settings"
  | "hours";

export default function App() {
  const [bins, setBins] = useState<TrashBin[]>(() => {
    const saved = localStorage.getItem("vcp-bins");
    return saved ? JSON.parse(saved) : mockBins;
  });

  const [shapes, setShapes] = useState<MapShape[]>(() => {
    const saved = localStorage.getItem("vcp-shapes");
    return saved ? JSON.parse(saved) : [];
  });

  const [binTypes, setBinTypes] = useState<BinTypeConfig[]>(() => {
    const saved = localStorage.getItem("vcp-types");
    return saved ? JSON.parse(saved) : defaultBinTypes;
  });

  const [sessions, setSessions] = useState<WorkSession[]>(() => {
    const saved = localStorage.getItem("vcp-sessions");
    return saved ? JSON.parse(saved) : [];
  });

  const [viewMode, setViewMode] = useState<ViewMode>("map_pose");
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [placingBinId, setPlacingBinId] = useState<string | null>(null);

  const [isExternal] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.has("ext");
    }
    return false;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => !isExternal);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("ext", "true");
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    localStorage.setItem("vcp-bins", JSON.stringify(bins));
  }, [bins]);

  useEffect(() => {
    localStorage.setItem("vcp-shapes", JSON.stringify(shapes));
  }, [shapes]);

  useEffect(() => {
    localStorage.setItem("vcp-types", JSON.stringify(binTypes));
  }, [binTypes]);

  useEffect(() => {
    localStorage.setItem("vcp-sessions", JSON.stringify(sessions));
  }, [sessions]);

  const updateBinStatus = (id: string, status: TrashBin["status"]) => {
    setBins((prev) =>
      prev.map((bin) => {
        if (bin.id === id) {
          return {
            ...bin,
            status,
            ...(status === "installed"
              ? { lastEmptied: new Date().toISOString() }
              : {}),
          };
        }
        return bin;
      }),
    );
  };

  const handleImportBins = (
    importedBins: Omit<TrashBin, "id" | "lat" | "lng" | "lastEmptied">[],
    groupStrategy: "group" | "individual",
  ) => {
    const newBins: TrashBin[] = [];

    importedBins.forEach((binData, index) => {
      if (groupStrategy === "group" || binData.count === 1) {
        newBins.push({
          ...binData,
          status: "to_install",
          id: `imported-${Date.now()}-${index}`,
          lat: null,
          lng: null,
          lastEmptied: new Date().toISOString(),
        });
      } else {
        // Individual placement
        const count = binData.count || 1;
        for (let i = 0; i < count; i++) {
          newBins.push({
            ...binData,
            status: "to_install",
            id: `imported-${Date.now()}-${index}-${i}`,
            name: `${binData.name} #${i + 1}`,
            count: 1,
            lat: null,
            lng: null,
            lastEmptied: new Date().toISOString(),
          });
        }
      }
    });

    setBins((prev) => [...prev, ...newBins]);
  };

  const handlePlaceBin = (lat: number, lng: number) => {
    if (placingBinId) {
      setBins((prev) =>
        prev.map((bin) =>
          bin.id === placingBinId ? { ...bin, lat, lng } : bin,
        ),
      );
      setPlacingBinId(null);
    }
  };

  const handleDeleteBin = (id: string) => {
    // Suppressed window.confirm to avoid iframe blocking
    setBins((prev) => prev.filter((bin) => bin.id !== id));
    if (selectedBinId === id) setSelectedBinId(null);
    if (placingBinId === id) setPlacingBinId(null);
  };

  const handleStartPlacing = (id: string) => {
    setPlacingBinId(id);
    setViewMode("map_pose");
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "VC26") {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-4">
        <form
          onSubmit={handleAuth}
          className="bg-white p-8 rounded-2xl shadow-sm border border-[#E5E0D5] max-w-md w-full"
        >
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-[#6B8E63] rounded-xl flex items-center justify-center text-white shadow-sm">
              <Trash2 size={24} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-[#3C413A] mb-2 flex items-baseline justify-center gap-2">
            Big Garbage <span className="text-sm italic font-normal text-[#7A8275]">is cleaning you</span>
          </h1>
          <p className="text-center text-[#7A8275] mb-8 font-medium">
            Accès Acteur Externe
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#4B6345] mb-2 uppercase tracking-wide">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#6B8E63] focus:border-transparent outline-none transition-all ${authError ? "border-red-500 bg-red-50" : "border-[#E5E0D5] bg-[#F9F8F6]"}`}
                placeholder="Entrez le mot de passe..."
              />
              {authError && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  Mot de passe incorrect
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#6B8E63] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#5a7a53] transition-colors shadow-sm"
            >
              Accéder au plan
            </button>
          </div>
        </form>
      </div>
    );
  }

  const handleAddSession = (session: WorkSession) => {
    setSessions((prev) => [...prev, session]);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateSession = (id: string, updates: Partial<WorkSession>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F1EA] text-[#3C413A] font-sans">
      <header className="h-16 bg-[#F4F1EA] border-b border-[#D9D3C7] flex items-center justify-between px-6 z-20 relative print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#6B8E63] rounded-lg flex items-center justify-center text-white">
            <Trash2 size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight hidden md:flex items-baseline gap-2">
            Big Garbage <span className="text-sm italic font-normal text-[#7A8275]">is cleaning you</span>
          </span>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-[#E5E0D5] overflow-x-auto">
          <button
            onClick={() => setViewMode("map_pose")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${viewMode === "map_pose" ? "bg-[#6B8E63] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}`}
          >
            <Map size={16} /> Mode Pose
          </button>
          <button
            onClick={() => setViewMode("map_depose")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${viewMode === "map_depose" ? "bg-[#D4A373] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}`}
          >
            <Map size={16} /> Mode Dépose
          </button>
          <button
            onClick={() => setViewMode("map_exploitation")}
            className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${viewMode === "map_exploitation" ? "bg-[#DC2626] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}`}
          >
            <Map size={16} /> Mode Exploitation
          </button>
          {!isExternal && (
            <>
              <button
                onClick={() => setViewMode("list")}
                className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${viewMode === "list" ? "bg-[#4B6345] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}`}
              >
                <List size={16} /> Liste / Import
              </button>
              <button
                onClick={() => setViewMode("hours")}
                className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${viewMode === "hours" ? "bg-[#916738] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}`}
              >
                <Clock size={16} /> Mes Heures
              </button>
              <button
                onClick={() => setViewMode("settings")}
                className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${viewMode === "settings" ? "bg-[#7A8275] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}`}
              >
                <Settings size={16} />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!isExternal && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-white text-[#4B6345] border border-[#D9D3C7] px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#F4F1EA] transition-colors"
            >
              {copied ? (
                <Check size={16} className="text-[#6B8E63]" />
              ) : (
                <Share2 size={16} />
              )}
              {copied ? "Lien copié !" : "Partager"}
            </button>
          )}
          <button className="bg-[#6B8E63] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-[#5a7a53] transition-colors hidden md:block">
            Nouvelle Alerte
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {(viewMode === "map_pose" ||
          viewMode === "map_depose" ||
          viewMode === "map_exploitation") && (
          <div className="flex-1 relative z-0">
            <BinMap
              bins={bins}
              shapes={shapes}
              binTypes={binTypes}
              mode={viewMode}
              onUpdateStatus={updateBinStatus}
              onShapesChange={setShapes}
              selectedBinId={selectedBinId}
              placingBinId={placingBinId}
              onPlaceBin={handlePlaceBin}
              onDeleteBin={handleDeleteBin}
            />
          </div>
        )}

        {viewMode === "list" && (
          <ListView
            bins={bins}
            binTypes={binTypes}
            onImportBins={handleImportBins}
            onStartPlacing={handleStartPlacing}
            onDeleteBin={handleDeleteBin}
          />
        )}

        {viewMode === "hours" && (
          <HoursView
            sessions={sessions}
            onAddSession={handleAddSession}
            onDeleteSession={handleDeleteSession}
            onUpdateSession={handleUpdateSession}
          />
        )}

        {viewMode === "settings" && (
          <SettingsView binTypes={binTypes} onUpdateBinTypes={setBinTypes} />
        )}
      </main>
    </div>
  );
}
