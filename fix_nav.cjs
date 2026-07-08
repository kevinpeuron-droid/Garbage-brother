const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  'import {\n  Trash2',
  'import {\n  Trash2,\n  ChevronUp,\n  ChevronDown'
);

code = code.replace(
  'const [isSidebarOpen, setIsSidebarOpen] = useState(false);',
  'const [isSidebarOpen, setIsSidebarOpen] = useState(false);\n  const [isNavOpen, setIsNavOpen] = useState(false);'
);

// we have to update the nav rendering
const navStart = code.indexOf('<nav className="bg-white');
const navEnd = code.indexOf('</nav>') + '</nav>'.length;
const oldNav = code.substring(navStart, navEnd);

const newNav = `
      <div className={\`fixed bottom-0 left-0 w-full z-50 transition-transform duration-300 \${isNavOpen ? "translate-y-0" : "translate-y-full"} md:translate-y-0 md:relative\`}>
        <button
          onClick={() => setIsNavOpen(!isNavOpen)}
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white border border-[#D9D3C7] border-b-0 rounded-t-lg p-1.5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:hidden text-[#7A8275] focus:outline-none"
        >
          {isNavOpen ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
        </button>
        <nav className="bg-white border-t border-[#D9D3C7] flex items-center justify-around md:justify-center p-2 shrink-0 gap-1 md:gap-2 overflow-x-auto print:hidden shadow-lg md:shadow-none pb-safe">
          <button
            onClick={() => { setViewMode("map"); setIsNavOpen(false); }}
            className={\`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors \${viewMode === "map" ? "bg-[#6B8E63] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}\`}
          >
            <Map size={18} /> <span className="whitespace-nowrap">Carte</span>
          </button>
          <button
            onClick={() => { setViewMode("map_deutz"); setIsNavOpen(false); }}
            className={\`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors \${viewMode === "map_deutz" ? "bg-[#D4A373] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}\`}
          >
            <Map size={18} /> <span className="whitespace-nowrap">Deutz</span>
          </button>
          {!isExternal && (
            <>
              <button
                onClick={() => { setViewMode("map_edition"); setIsNavOpen(false); }}
                className={\`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors \${viewMode === "map_edition" ? "bg-[#3B82F6] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}\`}
              >
                <Map size={18} /> <span className="whitespace-nowrap">Édition</span>
              </button>
              <button
                onClick={() => { setViewMode("list"); setIsNavOpen(false); }}
                className={\`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors \${viewMode === "list" ? "bg-[#4B6345] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}\`}
              >
                <List size={18} /> <span className="whitespace-nowrap">Liste</span>
              </button>
              <button
                onClick={() => { setViewMode("settings"); setIsNavOpen(false); }}
                className={\`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors \${viewMode === "settings" ? "bg-[#7A8275] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}\`}
              >
                <Settings size={18} /> <span className="whitespace-nowrap hidden md:inline">Param.</span>
              </button>
              <button
                onClick={() => { setViewMode("heures"); setIsNavOpen(false); }}
                className={\`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition-colors \${viewMode === "heures" ? "bg-[#D4A373] text-white" : "text-[#7A8275] hover:bg-[#F4F1EA]"}\`}
              >
                <Clock size={18} /> <span className="whitespace-nowrap hidden md:inline">Heures</span>
              </button>
            </>
          )}
        </nav>
      </div>`;

code = code.replace(oldNav, newNav);

fs.writeFileSync('src/App.tsx', code);
