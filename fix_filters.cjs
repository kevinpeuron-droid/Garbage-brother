const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
`  const [calibState, setCalibState] = useState<
    "idle" | "step1_bin" | "step2_map"
  >("idle");`,
`  const [calibState, setCalibState] = useState<
    "idle" | "step1_bin" | "step2_map"
  >("idle");
  const [showUmapData, setShowUmapData] = useState(false);`
);

code = code.replace(
`  const umapBaseUrl =
    "https://umap.vieillescharrues.bzh/fr/map/recap-container_20?scaleControl=false&miniMap=false&scrollWheelZoom=false&zoomControl=false&allowEdit=false&moreControl=true&searchControl=null&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=none&captionBar=false";`,
`  const umapBaseUrl =
    \`https://umap.vieillescharrues.bzh/fr/map/recap-container_20?scaleControl=false&miniMap=false&scrollWheelZoom=false&zoomControl=false&allowEdit=false&moreControl=true&searchControl=null&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=none&captionBar=false\${showUmapData ? "" : "&datalayers="}\`;`
);

code = code.replace(
`          </div>
        )}

    </div>
  );`,
`          </div>
        )}

      <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto flex gap-2">
        <button
          onClick={() => setShowUmapData(!showUmapData)}
          className={\`px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-colors border \${!showUmapData ? 'bg-[#3B82F6] text-white border-[#2563EB]' : 'bg-white text-[#7A8275] border-[#E5E0D5] hover:bg-[#F4F1EA]'}\`}
        >
          {showUmapData ? "Cacher les filtres Umap" : "Afficher les filtres Umap"}
        </button>
      </div>

    </div>
  );`
);

fs.writeFileSync('src/components/BinMap.tsx', code);
