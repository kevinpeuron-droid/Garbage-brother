const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Re-import HeuresView if needed
if (!code.includes('import HeuresView')) {
  code = code.replace(
    'import UmapView from "./components/UmapView";',
    'import UmapView from "./components/UmapView";\nimport HeuresView from "./components/HeuresView";'
  );
}

// 2. Add "heures" to ViewMode
code = code.replace(
  'type ViewMode = "umap" | "list";',
  'type ViewMode = "umap" | "list" | "heures";'
);

// 3. Render HeuresView in main
const newMainContent = `
  {viewMode === "heures" && (
    <HeuresView 
      sessions={sessions} 
      onUpdateSessions={setSessions}
      workRecords={workRecords}
      onUpdateWorkRecords={setWorkRecords}
    />
  )}
</main>`;
code = code.replace('</main>', newMainContent);

// 4. Update the nav 
const navMatch = /<nav className="bg-white border-t border-\[#D9D3C7\] flex items-center justify-around md:justify-center p-2 shrink-0 gap-1 md:gap-2 overflow-x-auto print:hidden shadow-lg md:shadow-none pb-safe">[\s\S]*?<\/nav>/;

const newNav = `<nav className="bg-white border-t border-[#D9D3C7] flex items-center justify-around md:justify-center p-2 shrink-0 gap-1 md:gap-2 overflow-x-auto print:hidden shadow-lg md:shadow-none pb-safe">
  <button
    onClick={() => { setViewMode("umap"); setIsNavOpen(false); }}
    className={\`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors \${viewMode === "umap" ? "bg-[#6B8E63] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}\`}
  >
    <Map size={18} /> <span className="whitespace-nowrap">UMAP</span>
  </button>
  <button
    onClick={() => { setViewMode("list"); setIsNavOpen(false); }}
    className={\`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors \${viewMode === "list" ? "bg-[#4B6345] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}\`}
  >
    <List size={18} /> <span className="whitespace-nowrap">Listing</span>
  </button>
  {!isExternal && (
    <button
      onClick={() => { setViewMode("heures"); setIsNavOpen(false); }}
      className={\`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors \${viewMode === "heures" ? "bg-[#D4A373] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}\`}
    >
      <Clock size={18} /> <span className="whitespace-nowrap hidden md:inline">Heures</span>
    </button>
  )}
</nav>`;

code = code.replace(navMatch, newNav);

fs.writeFileSync('src/App.tsx', code);
