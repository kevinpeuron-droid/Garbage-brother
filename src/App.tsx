import React, { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import BinMap from "./components/BinMap";
import ListView from "./components/ListView";
import SettingsView from "./components/SettingsView";
import HeuresView from "./components/HeuresView";
import {
  TrashBin,
  MapShape,
  BinTypeConfig,
  defaultBinTypes,
  BinCategoryConfig,
  defaultBinCategories,
  EquipmentConfig,
  defaultEquipmentConfigs,
  WorkSession,
} from "./types";
import {
  Trash2,
  Map,
  List,
  Settings,
  Share2,
  Check,
  Clock,
  Menu,
  X,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
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

type ViewMode = "map" | "map_edition" | "map_deutz" | "list" | "settings" | "heures";

export default function App() {
  const [bins, _setBins] = useState<TrashBin[]>([]);
  const [equipments, _setEquipments] = useState<EquipmentConfig[]>(defaultEquipmentConfigs);
  const [sessions, _setSessions] = useState<WorkSession[]>([]);
  const [binTypes, _setBinTypes] = useState<BinTypeConfig[]>(defaultBinTypes);
  const [binCategories, _setBinCategories] = useState<BinCategoryConfig[]>(defaultBinCategories);
  const [umapOffsetPC, _setUmapOffsetPC] = useState<{ x: number; y: number }>({ x: 0, y: -23 });
  const [umapOffsetMobile, _setUmapOffsetMobile] = useState<{ x: number; y: number }>({ x: 0, y: -23 });
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [umapRefreshKey, setUmapRefreshKey] = useState(0);
  const [showUmapData, _setShowUmapData] = useState(false);

  useEffect(() => {
    const docRef = doc(db, "maps", "clean_v1");
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.bins) _setBins(data.bins);
          if (data.equipments) _setEquipments(data.equipments);
          if (data.sessions) _setSessions(data.sessions);
          if (data.binTypes) _setBinTypes(data.binTypes);
          if (data.binCategories) _setBinCategories(data.binCategories);
          if (data.umapOffsetPC) _setUmapOffsetPC(data.umapOffsetPC);
          if (data.umapOffsetMobile) _setUmapOffsetMobile(data.umapOffsetMobile);
          if (data.showUmapData !== undefined) _setShowUmapData(data.showUmapData);
        } else {
          // Initialize if empty
          setDoc(docRef, { 
            bins: [], 
            equipments: defaultEquipmentConfigs, 
            sessions: [], 
            binTypes: defaultBinTypes,
            binCategories: defaultBinCategories,
            umapOffsetPC: { x: 0, y: -23 },
            umapOffsetMobile: { x: 0, y: -23 },
            showUmapData: false
          }).catch((err) => {
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

  const setEquipments = (
    newEquipments: EquipmentConfig[] | ((prev: EquipmentConfig[]) => EquipmentConfig[]),
  ) => {
    _setEquipments((prev) => {
      const updated = typeof newEquipments === "function" ? newEquipments(prev) : newEquipments;
      if (isDbLoaded)
        setDoc(
          doc(db, "maps", "clean_v1"),
          { equipments: updated },
          { merge: true },
        ).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1"),
        );
      return updated;
    });
  };

  const setSessions = (
    newSessions: WorkSession[] | ((prev: WorkSession[]) => WorkSession[]),
  ) => {
    _setSessions((prev) => {
      const updated = typeof newSessions === "function" ? newSessions(prev) : newSessions;
      if (isDbLoaded)
        setDoc(
          doc(db, "maps", "clean_v1"),
          { sessions: updated },
          { merge: true },
        ).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1"),
        );
      return updated;
    });
  };

  const setBinTypes = (newTypes: BinTypeConfig[] | ((prev: BinTypeConfig[]) => BinTypeConfig[])) => {
    _setBinTypes((prev) => {
      const updated = typeof newTypes === "function" ? newTypes(prev) : newTypes;
      if (isDbLoaded)
        setDoc(doc(db, "maps", "clean_v1"), { binTypes: updated }, { merge: true })
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1"));
      return updated;
    });
  };

  const setBinCategories = (newCategories: BinCategoryConfig[] | ((prev: BinCategoryConfig[]) => BinCategoryConfig[])) => {
    _setBinCategories((prev) => {
      const updated = typeof newCategories === "function" ? newCategories(prev) : newCategories;
      if (isDbLoaded)
        setDoc(doc(db, "maps", "clean_v1"), { binCategories: updated }, { merge: true })
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1"));
      return updated;
    });
  };

  const setUmapOffsetPC = (newOffset: {x: number, y: number} | ((prev: {x: number, y: number}) => {x: number, y: number})) => {
    _setUmapOffsetPC((prev) => {
      const updated = typeof newOffset === "function" ? newOffset(prev) : newOffset;
      if (isDbLoaded)
        setDoc(doc(db, "maps", "clean_v1"), { umapOffsetPC: updated }, { merge: true })
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1"));
      return updated;
    });
  };

  const setUmapOffsetMobile = (newOffset: {x: number, y: number} | ((prev: {x: number, y: number}) => {x: number, y: number})) => {
    _setUmapOffsetMobile((prev) => {
      const updated = typeof newOffset === "function" ? newOffset(prev) : newOffset;
      if (isDbLoaded)
        setDoc(doc(db, "maps", "clean_v1"), { umapOffsetMobile: updated }, { merge: true })
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1"));
      return updated;
    });
  };

  const setShowUmapData = (val: boolean) => {
    _setShowUmapData(val);
    if (isDbLoaded)
      setDoc(doc(db, "maps", "clean_v1"), { showUmapData: val }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1"));
  };

  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [placingBinId, setPlacingBinId] = useState<string | null>(null);

  const [showCalibration, setShowCalibration] = useState(false);
  const [isExternal] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.has("ext");
    }
    return false;
  });

  const [deviceType] = useState<"pc" | "mobile">(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has("device")) {
        return searchParams.get("device") as "pc" | "mobile";
      }
    }
    return typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "pc";
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => !isExternal);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [copiedPC, setCopiedPC] = useState(false);
  const [copiedMobile, setCopiedMobile] = useState(false);

  const handleShare = (device: "pc" | "mobile") => {
    const url = new URL(window.location.href);
    url.searchParams.set("ext", "true");
    url.searchParams.set("device", device);
    navigator.clipboard.writeText(url.toString());
    if (device === "pc") {
      setCopiedPC(true);
      setTimeout(() => setCopiedPC(false), 2000);
    } else {
      setCopiedMobile(true);
      setTimeout(() => setCopiedMobile(false), 2000);
    }
  };



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
    importedBins: (Omit<TrashBin, "id" | "lastEmptied"> & { id?: string })[],
    groupStrategy: "group" | "individual",
  ) => {
    const newBins: TrashBin[] = [];

    importedBins.forEach((binData, index) => {
      if (groupStrategy === "group" || binData.count === 1) {
        newBins.push({
          ...binData,
          status: binData.status || "to_install",
          id: binData.id ? `${binData.id}-${Date.now()}-${index}` : `imported-${Date.now()}-${index}`,
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
            id: binData.id ? `${binData.id}-${Date.now()}-${index}-${i}` : `imported-${Date.now()}-${index}-${i}`,
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

  const binsToInstallCount = React.useMemo(() => {
    return (binTypes || []).map(type => {
      const count = (bins || []).filter(b => b.type === type?.id && b?.status === "to_install").length;
      return { ...type, count };
    });
  }, [bins, binTypes]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[#F4F1EA] flex items-center justify-center p-4">
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
    <div className="flex flex-col h-screen h-[100dvh] overflow-hidden bg-[#F4F1EA] text-[#3C413A] font-sans">
      <header className="h-14 md:h-16 bg-[#F4F1EA] border-b border-[#D9D3C7] flex items-center justify-between px-4 md:px-6 z-20 relative print:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden w-8 h-8 flex items-center justify-center text-[#3C413A] hover:bg-[#E5E0D5] rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="w-8 h-8 bg-[#6B8E63] rounded-lg flex items-center justify-center text-white hidden md:flex">
            <Trash2 size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight flex items-baseline gap-2">
            Big Garbage{" "}
            <span className="text-sm italic font-normal text-[#7A8275] hidden md:inline">
              is cleaning you
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {!isExternal && (
            <>
              <button
                onClick={() => handleShare("pc")}
                className="flex items-center gap-1 bg-white text-[#4B6345] border border-[#D9D3C7] px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm font-bold shadow-sm hover:bg-[#F4F1EA] transition-colors"
                title="Lien Ordi"
              >
                {copiedPC ? <Check size={16} className="text-[#6B8E63]" /> : <Share2 size={16} />}
                <span className="hidden md:inline">{copiedPC ? "Copié !" : "Ordi"}</span>
              </button>
              <button
                onClick={() => handleShare("mobile")}
                className="flex items-center gap-1 bg-white text-[#4B6345] border border-[#D9D3C7] px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm font-bold shadow-sm hover:bg-[#F4F1EA] transition-colors"
                title="Lien Smartphone"
              >
                {copiedMobile ? <Check size={16} className="text-[#6B8E63]" /> : <Share2 size={16} />}
                <span className="hidden md:inline">{copiedMobile ? "Copié !" : "Mobile"}</span>
              </button>
            </>
          )}
          {isExternal && (
            <button
              onClick={() => setShowCalibration(!showCalibration)}
              className="w-8 h-8 flex items-center justify-center text-[#7A8275] opacity-20 hover:opacity-100 transition-opacity"
              title="Calibrage"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Mobile Tab Handle (visible when sidebar is closed) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden absolute top-4 left-0 z-30 bg-white border-y border-r border-[#D9D3C7] rounded-r-xl shadow-md py-3 px-2 flex items-center justify-center text-[#4B6345]"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            <span className="font-bold text-xs uppercase tracking-widest">À Poser</span>
          </button>
        )}

        {/* Sidebar Overlay (Mobile) */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/30 z-40 md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar (Drawer on mobile, hidden on desktop unless we want it visible) */}
        <aside className={`fixed top-0 left-0 h-full w-72 bg-[#F4F1EA] border-r border-[#D9D3C7] z-50 transform transition-transform duration-300 flex flex-col shadow-xl md:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-4 border-b border-[#D9D3C7] flex justify-between items-center">
            <h2 className="font-bold text-[#3C413A]">À poser</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="text-[#7A8275] hover:bg-[#E5E0D5] p-2 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {binsToInstallCount.map(type => (
              <div key={type.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#D9D3C7]">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border border-black/20"
                    style={{ backgroundColor: binCategories.find(c => c.id === type.categoryId)?.color || type.color || "#ccc" }}
                  />
                  <span className="font-bold text-sm text-[#3C413A]">{type.label}</span>
                </div>
                <span className="font-mono font-bold text-[#D4A373] text-lg bg-[#F9F8F6] px-2 py-1 rounded">
                  {type.count}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {(viewMode === "map" || viewMode === "map_edition" || viewMode === "map_deutz") && (
          <div className="flex-1 relative z-0">
            <BinMap
              bins={bins}
              binTypes={binTypes}
              binCategories={binCategories}
              mode={viewMode}
              onUpdateStatus={updateBinStatus}
              onUpdateBin={updateBin}
              onUpdateAllBins={handleUpdateAllBins}
              umapOffset={deviceType === "mobile" ? { x: umapOffsetPC.x + umapOffsetMobile.x, y: umapOffsetPC.y + umapOffsetMobile.y } : umapOffsetPC}
              onUpdateUmapOffset={setUmapOffsetPC}
              selectedBinId={selectedBinId}
              onSelectBin={setSelectedBinId}
              placingBinId={placingBinId}
              onPlaceBin={handlePlaceBin}
              onDeleteBin={handleDeleteBin}
              onStartPlacing={handleStartPlacing}
              onAddAndPlaceBin={handleAddAndPlaceBin}
              umapRefreshKey={umapRefreshKey}
              showUmapData={showUmapData}
              onUpdateShowUmapData={!isExternal ? setShowUmapData : undefined}
            />
            {isExternal && showCalibration && (
              <div className="absolute bottom-20 left-4 z-[400] bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-[#D9D3C7]">
                <h3 className="text-xs font-bold text-[#3C413A] mb-2 text-center">Calibrage</h3>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setUmapOffsetPC({ ...umapOffsetPC, y: umapOffsetPC.y - 10 })}
                    className="p-2 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
                  >
                    <ArrowUp size={20} className="text-[#3C413A]" />
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setUmapOffsetPC({ ...umapOffsetPC, x: umapOffsetPC.x - 10 })}
                      className="p-2 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
                    >
                      <ArrowLeft size={20} className="text-[#3C413A]" />
                    </button>
                    <div className="w-12 flex flex-col items-center justify-center font-mono text-[10px] text-[#7A8275]">
                      <div>X: {umapOffsetPC.x}</div>
                      <div>Y: {umapOffsetPC.y}</div>
                    </div>
                    <button
                      onClick={() => setUmapOffsetPC({ ...umapOffsetPC, x: umapOffsetPC.x + 10 })}
                      className="p-2 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
                    >
                      <ArrowRight size={20} className="text-[#3C413A]" />
                    </button>
                  </div>
                  <button
                    onClick={() => setUmapOffsetPC({ ...umapOffsetPC, y: umapOffsetPC.y + 10 })}
                    className="p-2 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
                  >
                    <ArrowDown size={20} className="text-[#3C413A]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === "list" && (
          <ListView
            bins={bins}
            binTypes={binTypes}
            binCategories={binCategories}
            onImportBins={handleImportBins}
            onStartPlacing={handleStartPlacing}
            onDeleteBin={handleDeleteBin}
            onDeleteAllBins={handleDeleteAllBins}
            onAddBin={handleAddBin}
            onUpdateBinTypes={setBinTypes}
            onUpdateBin={updateBin}
          />
        )}

        {viewMode === "settings" && (
          <SettingsView
            binTypes={binTypes}
            onUpdateBinTypes={setBinTypes}
            binCategories={binCategories}
            onUpdateBinCategories={setBinCategories}
            umapOffsetPC={umapOffsetPC}
            onUpdateUmapOffsetPC={setUmapOffsetPC}
            umapOffsetMobile={umapOffsetMobile}
            onUpdateUmapOffsetMobile={setUmapOffsetMobile}
            onRefreshUmap={() => setUmapRefreshKey(k => k + 1)}
          />
        )}

        {viewMode === "heures" && (
          <HeuresView
            equipments={equipments}
            onUpdateEquipments={setEquipments}
            sessions={sessions}
            onUpdateSessions={setSessions}
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
            <button
              onClick={() => setViewMode("settings")}
              className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors ${viewMode === "settings" ? "bg-[#7A8275] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}`}
            >
              <Settings size={18} /> <span className="whitespace-nowrap hidden md:inline">Param.</span>
            </button>
            <button
              onClick={() => setViewMode("heures")}
              className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors ${viewMode === "heures" ? "bg-[#D4A373] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}`}
            >
              <Clock size={18} /> <span className="whitespace-nowrap hidden md:inline">Heures</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
