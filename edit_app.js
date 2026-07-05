const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
`  const [bins, _setBins] = useState<TrashBin[]>([]);
  const [equipments, _setEquipments] = useState<EquipmentConfig[]>(defaultEquipmentConfigs);
  const [sessions, _setSessions] = useState<WorkSession[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);`,
`  const [bins, _setBins] = useState<TrashBin[]>([]);
  const [equipments, _setEquipments] = useState<EquipmentConfig[]>(defaultEquipmentConfigs);
  const [sessions, _setSessions] = useState<WorkSession[]>([]);
  const [binTypes, _setBinTypes] = useState<BinTypeConfig[]>(defaultBinTypes);
  const [umapOffsetPC, _setUmapOffsetPC] = useState<{ x: number; y: number }>({ x: 0, y: -23 });
  const [umapOffsetMobile, _setUmapOffsetMobile] = useState<{ x: number; y: number }>({ x: 0, y: -23 });
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);`
);

code = code.replace(
`        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.bins) _setBins(data.bins);
          if (data.equipments) _setEquipments(data.equipments);
          if (data.sessions) _setSessions(data.sessions);
        } else {
          // Initialize if empty
          setDoc(docRef, { bins: [], equipments: defaultEquipmentConfigs, sessions: [] }).catch((err) => {`,
`        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.bins) _setBins(data.bins);
          if (data.equipments) _setEquipments(data.equipments);
          if (data.sessions) _setSessions(data.sessions);
          if (data.binTypes) _setBinTypes(data.binTypes);
          if (data.umapOffsetPC) _setUmapOffsetPC(data.umapOffsetPC);
          if (data.umapOffsetMobile) _setUmapOffsetMobile(data.umapOffsetMobile);
        } else {
          // Initialize if empty
          setDoc(docRef, { 
            bins: [], 
            equipments: defaultEquipmentConfigs, 
            sessions: [], 
            binTypes: defaultBinTypes,
            umapOffsetPC: { x: 0, y: -23 },
            umapOffsetMobile: { x: 0, y: -23 }
          }).catch((err) => {`
);

code = code.replace(
`  const setSessions = (
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

  const [binTypes, setBinTypes] = useState<BinTypeConfig[]>(() => {
    try {
      const saved = localStorage.getItem("vcp-types");
      return saved ? JSON.parse(saved) : defaultBinTypes;
    } catch (e) {
      console.warn("localStorage error", e);
      return defaultBinTypes;
    }
  });

  const [umapOffset, setUmapOffset] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem("vcp-umap-offset");
      return saved ? JSON.parse(saved) : { x: 0, y: -23 };
    } catch (e) {
      return { x: 0, y: -23 };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("vcp-umap-offset", JSON.stringify(umapOffset));
    } catch (e) {}
  }, [umapOffset]);`,
`  const setSessions = (
    newSessions: WorkSession[] | ((prev: WorkSession[]) => WorkSession[]),
  ) => {
    _setSessions((prev) => {
      const updated = typeof newSessions === "function" ? newSessions(prev) : newSessions;
      if (isDbLoaded)
        setDoc(doc(db, "maps", "clean_v1"), { sessions: updated }, { merge: true })
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1"));
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
  };`
);

code = code.replace(
`  const [isExternal] = useState(() => {
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
    try {
      localStorage.setItem("vcp-types", JSON.stringify(binTypes));
    } catch (e) {}
  }, [binTypes]);`,
`  const [isExternal] = useState(() => {
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
  };`
);

code = code.replace(
`        <div className="flex items-center gap-4">
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
        </div>`,
`        <div className="flex items-center gap-2 md:gap-4">
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
        </div>`
);

code = code.replace(
`              umapOffset={umapOffset}
              onUpdateUmapOffset={setUmapOffset}`,
`              umapOffset={deviceType === "mobile" ? umapOffsetMobile : umapOffsetPC}
              onUpdateUmapOffset={deviceType === "mobile" ? setUmapOffsetMobile : setUmapOffsetPC}`
);

code = code.replace(
`            umapOffset={umapOffset}
            onUpdateUmapOffset={setUmapOffset}`,
`            umapOffsetPC={umapOffsetPC}
            onUpdateUmapOffsetPC={setUmapOffsetPC}
            umapOffsetMobile={umapOffsetMobile}
            onUpdateUmapOffsetMobile={setUmapOffsetMobile}`
);

fs.writeFileSync('src/App.tsx', code);
