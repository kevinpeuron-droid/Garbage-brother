const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
`  const [zoomLevel, setZoomLevel] = useState(15);
  const [isUmapInteractive, setIsUmapInteractive] = useState(false);
  const [calibState, setCalibState] = useState<`,
`  const [zoomLevel, setZoomLevel] = useState(15);
  const [calibState, setCalibState] = useState<`
);

code = code.replace(
`          zIndex: 1,
          backgroundColor: "transparent",
          pointerEvents: isUmapInteractive ? "none" : "auto",
          cursor:`,
`          zIndex: 1,
          backgroundColor: "transparent",
          pointerEvents: "auto",
          cursor:`
);

code = code.replace(
`      {/* Umap Interaction Toggle */}
      <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto">
        <button
          onClick={() => setIsUmapInteractive(!isUmapInteractive)}
          className={\`px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-colors border \${isUmapInteractive ? 'bg-[#3B82F6] text-white border-[#2563EB]' : 'bg-white text-[#7A8275] border-[#E5E0D5] hover:bg-[#F4F1EA]'}\`}
        >
          {isUmapInteractive ? "Verrouiller le fond de carte" : "Interagir avec le fond de carte"}
        </button>
      </div>`,
``
);

fs.writeFileSync('src/components/BinMap.tsx', code);
