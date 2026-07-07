const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
`  const [isSidebarOpen, setIsSidebarOpen] = useState(false);`,
`  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [umapRefreshKey, setUmapRefreshKey] = useState(0);`
);

code = code.replace(
`              onAddAndPlaceBin={handleAddAndPlaceBin}
            />`,
`              onAddAndPlaceBin={handleAddAndPlaceBin}
              umapRefreshKey={umapRefreshKey}
            />`
);

code = code.replace(
`            onUpdateUmapOffsetMobile={setUmapOffsetMobile}
          />
        )}`,
`            onUpdateUmapOffsetMobile={setUmapOffsetMobile}
            onRefreshUmap={() => setUmapRefreshKey(k => k + 1)}
          />
        )}`
);

fs.writeFileSync('src/App.tsx', code);
