const fs = require('fs');

// Update App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf-8');

appCode = appCode.replace(
  'const [umapRefreshKey, setUmapRefreshKey] = useState(0);',
  'const [umapRefreshKey, setUmapRefreshKey] = useState(0);\n  const [showUmapData, _setShowUmapData] = useState(false);'
);

appCode = appCode.replace(
  '          if (data.umapOffsetMobile) _setUmapOffsetMobile(data.umapOffsetMobile);',
  '          if (data.umapOffsetMobile) _setUmapOffsetMobile(data.umapOffsetMobile);\n          if (data.showUmapData !== undefined) _setShowUmapData(data.showUmapData);'
);

appCode = appCode.replace(
  'umapOffsetMobile: { x: 0, y: -23 }',
  'umapOffsetMobile: { x: 0, y: -23 },\n            showUmapData: false'
);

const setUmapOffsetMobileStr = `  const setUmapOffsetMobile = (newOffset: {x: number, y: number} | ((prev: {x: number, y: number}) => {x: number, y: number})) => {
    _setUmapOffsetMobile((prev) => {
      const updated = typeof newOffset === "function" ? newOffset(prev) : newOffset;
      if (isDbLoaded)
        setDoc(doc(db, "maps", "clean_v1"), { umapOffsetMobile: updated }, { merge: true })
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1"));
      return updated;
    });
  };`;

appCode = appCode.replace(
  setUmapOffsetMobileStr,
  setUmapOffsetMobileStr + `\n\n  const setShowUmapData = (val: boolean) => {
    _setShowUmapData(val);
    if (isDbLoaded)
      setDoc(doc(db, "maps", "clean_v1"), { showUmapData: val }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1"));
  };`
);

appCode = appCode.replace(
  /umapRefreshKey=\{umapRefreshKey\}/,
  'umapRefreshKey={umapRefreshKey}\n              showUmapData={showUmapData}\n              onUpdateShowUmapData={!isExternal ? setShowUmapData : undefined}'
);

fs.writeFileSync('src/App.tsx', appCode);

// Update BinMap.tsx
let binMapCode = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

binMapCode = binMapCode.replace(
  '  umapRefreshKey: number;',
  '  umapRefreshKey: number;\n  showUmapData: boolean;\n  onUpdateShowUmapData?: (val: boolean) => void;'
);

binMapCode = binMapCode.replace(
  '  umapRefreshKey,\n}: BinMapProps) {',
  '  umapRefreshKey,\n  showUmapData,\n  onUpdateShowUmapData,\n}: BinMapProps) {'
);

binMapCode = binMapCode.replace(
  /const \[showUmapData, setShowUmapData\] = useState\(false\);\n/,
  ''
);

binMapCode = binMapCode.replace(
  `      {/* Umap Interaction Toggle */}
      <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto">
        <button
          onClick={() => setShowUmapData(!showUmapData)}
          className={\`px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-colors border \${!showUmapData ? 'bg-[#3B82F6] text-white border-[#2563EB]' : 'bg-white text-[#7A8275] border-[#E5E0D5] hover:bg-[#F4F1EA]'}\`}
        >
          {showUmapData ? "Cacher les filtres Umap" : "Afficher les filtres Umap"}
        </button>
      </div>`,
  `      {/* Umap Interaction Toggle */}
      {onUpdateShowUmapData && (
        <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto">
          <button
            onClick={() => onUpdateShowUmapData(!showUmapData)}
            className={\`px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-colors border \${!showUmapData ? 'bg-[#3B82F6] text-white border-[#2563EB]' : 'bg-white text-[#7A8275] border-[#E5E0D5] hover:bg-[#F4F1EA]'}\`}
          >
            {showUmapData ? "Cacher les filtres Umap" : "Afficher les filtres Umap"}
          </button>
        </div>
      )}`
);

fs.writeFileSync('src/components/BinMap.tsx', binMapCode);

