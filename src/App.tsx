import React, { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import BinMap from "./components/BinMap";
import ListView from "./components/ListView";
import {
  TrashBin,
  MapShape,
  BinTypeConfig,
  defaultBinTypes,
} from "./types";
import {
  Trash2,
  Map,
  List,
  Share2,
  Check,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type ViewMode = "map" | "map_edition" | "map_deutz" | "list";

export default function App() {
  const [bins, _setBins] = useState<TrashBin[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  useEffect(() => {
    const docRef = doc(db, "maps", "clean_v1");
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.bins) _setBins(data.bins);
        } else {
          // Initialize if empty
          setDoc(docRef, { bins: [] }).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1");
          });
        }
        setIsDbLoaded(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "maps/clean_v1");
      },
    );
    return () => unsubscribe();
  }, []);

  const setBins = (
    newBins: TrashBin[] | ((prev: TrashBin[]) => TrashBin[]),
  ) => {
    _setBins((prev) => {
      const updated = typeof newBins === "function" ? newBins(prev) : newBins;
      if (isDbLoaded)
        setDoc(
          doc(db, "maps", "clean_v1"),
          { bins: updated },
          { merge: true },
        ).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1"),
        );
      return updated;
    });
  };

  const [binTypes, setBinTypes] = useState<BinTypeConfig[]>(() => {
    const saved = localStorage.getItem("vcp-types");
    return saved ? JSON.parse(saved) : defaultBinTypes;
  });

  const [umapOffset, setUmapOffset] = useState<{ x: number; y: number }>(() => {
    const saved = localStorage.getItem("vcp-umap-offset");
    return saved ? JSON.parse(saved) : { x: 0, y: -23 };
  });

  useEffect(() => {
    localStorage.setItem("vcp-umap-offset", JSON.stringify(umapOffset));
  }, [umapOffset]);

  const [viewMode, setViewMode] = useState<ViewMode>("map");
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
    localStorage.setItem("vcp-types", JSON.stringify(binTypes));
  }, [binTypes]);

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

  const updateBin = (id: string, updates: Partial<TrashBin>) => {
    setBins((prev) =>
      prev.map((bin) => (bin.id === id ? { ...bin, ...updates } : bin)),
    );
  };

  const handleUpdateAllBins = (updater: (bins: TrashBin[]) => TrashBin[]) => {
    setBins((prev) => updater(prev));
  };

  const handleImportBins = (
    importedBins: Omit<TrashBin, "id" | "lastEmptied">[],
    groupStrategy: "group" | "individual",
  ) => {
    const newBins: TrashBin[] = [];

    importedBins.forEach((binData, index) => {
      if (groupStrategy === "group" || binData.count === 1) {
        newBins.push({
          ...binData,
          status: binData.status || "to_install",
          id: `imported-${Date.now()}-${index}`,
          lat: binData.lat !== undefined ? binData.lat : null,
          lng: binData.lng !== undefined ? binData.lng : null,
          lastEmptied: new Date().toISOString(),
        });
      } else {
        // Individual placement
        const count = binData.count || 1;
        for (let i = 0; i < count; i++) {
          newBins.push({
            ...binData,
            status: binData.status || "to_install",
            id: `imported-${Date.now()}-${index}-${i}`,
            name: `${binData.name} #${i + 1}`,
            count: 1,
            lat: binData.lat !== undefined ? binData.lat : null,
            lng: binData.lng !== undefined ? binData.lng : null,
            lastEmptied: new Date().toISOString(),
          });
        }
      }
    });

    setBins((prev) => [...prev, ...newBins]);
  };

  const handleAddBin = (newBin: Omit<TrashBin, "id">) => {
    const bin: TrashBin = {
      ...newBin,
      id: crypto.randomUUID(),
    };
    setBins((prev) => [...prev, bin]);
  };

  const handleDeleteAllBins = () => {
    setBins([]);
    setSelectedBinId(null);
    setPlacingBinId(null);
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

  const handleAddAndPlaceBin = (typeId: string) => {
    const newBinId = crypto.randomUUID();
    const bin: TrashBin = {
      id: newBinId,
      name: `Nouvelle poubelle`,
      lat: null,
      lng: null,
      status: "to_install",
      type: typeId,
      lastEmptied: new Date().toISOString(),
      zone: "Non définie",
      count: 1,
    };
    setBins((prev) => [...prev, bin]);
    setPlacingBinId(newBinId);
    // On force le mode edition pour que la sidebar reste visible
    setViewMode("map_edition");
  };

  const handleStartPlacing = (id: string) => {
    setPlacingBinId(id);
    setViewMode("map");
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
      <div className="min-h-[100dvh] bg-[#F4F1EA] flex items-center justify-center p-4">
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
            Big Garbage{" "}
            <span className="text-sm italic font-normal text-[#7A8275]">
              is cleaning you
            </span>
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
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-[#F4F1EA] text-[#3C413A] font-sans">
      <header className="h-14 md:h-16 bg-[#F4F1EA] border-b border-[#D9D3C7] flex items-center justify-between px-4 md:px-6 z-20 relative print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#6B8E63] rounded-lg flex items-center justify-center text-white">
            <Trash2 size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight flex items-baseline gap-2">
            Big Garbage{" "}
            <span className="text-sm italic font-normal text-[#7A8275] hidden md:inline">
              is cleaning you
            </span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {!isExternal && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-white text-[#4B6345] border border-[#D9D3C7] px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#F4F1EA] transition-colors"
            >
              {copied ? (
                <Check size={16} className="text-[#6B8E63]" />
              ) : (
                <Share2 size={16} />
              )}
              <span className="hidden md:inline">{copied ? "Lien copié !" : "Partager"}</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {(viewMode === "map" || viewMode === "map_edition" || viewMode === "map_deutz") && (
          <div className="flex-1 relative z-0">
            <BinMap
              bins={bins}
              binTypes={binTypes}
              mode={viewMode}
              onUpdateStatus={updateBinStatus}
              onUpdateBin={updateBin}
              onUpdateAllBins={handleUpdateAllBins}
              umapOffset={umapOffset}
              onUpdateUmapOffset={setUmapOffset}
              selectedBinId={selectedBinId}
              onSelectBin={setSelectedBinId}
              placingBinId={placingBinId}
              onPlaceBin={handlePlaceBin}
              onDeleteBin={handleDeleteBin}
              onStartPlacing={handleStartPlacing}
              onAddAndPlaceBin={handleAddAndPlaceBin}
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
            onDeleteAllBins={handleDeleteAllBins}
            onAddBin={handleAddBin}
            onUpdateBinTypes={setBinTypes}
            onUpdateBin={updateBin}
          />
        )}
      </main>

      <nav className="bg-white border-t border-[#D9D3C7] flex items-center justify-around md:justify-center p-2 z-20 shrink-0 gap-1 md:gap-2 overflow-x-auto print:hidden">
        <button
          onClick={() => setViewMode("map")}
          className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors ${viewMode === "map" ? "bg-[#6B8E63] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}`}
        >
          <Map size={18} /> <span className="whitespace-nowrap">Carte</span>
        </button>
        <button
          onClick={() => setViewMode("map_deutz")}
          className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors ${viewMode === "map_deutz" ? "bg-[#D4A373] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}`}
        >
          <Map size={18} /> <span className="whitespace-nowrap">Deutz</span>
        </button>
        {!isExternal && (
          <>
            <button
              onClick={() => setViewMode("map_edition")}
              className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors ${viewMode === "map_edition" ? "bg-[#3B82F6] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}`}
            >
              <Map size={18} /> <span className="whitespace-nowrap">Édition</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors ${viewMode === "list" ? "bg-[#4B6345] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}`}
            >
              <List size={18} /> <span className="whitespace-nowrap">Liste</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
