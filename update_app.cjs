const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace imports
code = code.replace("import BinMap from \"./components/BinMap\";", "import UmapView from \"./components/UmapView\";");

// Remove map/mode logic
code = code.replace(/const \[viewMode, setViewMode\] = useState<ViewMode>\("map"\);/g, "const [viewMode, setViewMode] = useState<\"umap\" | \"list\">(\"list\");");
code = code.replace(/type ViewMode = .*/g, "type ViewMode = \"umap\" | \"list\";");

// Update list props handling
code = code.replace(/const handleDeleteBin = \(id: string\) => {[\s\S]*?};/g, `
  const handleDeleteBin = (id: string) => {
    setBins((prev) => prev.filter((bin) => bin.id !== id));
  };

  const handleDeleteLocation = (name: string) => {
    setBins((prev) => prev.filter((bin) => bin.name !== name));
  };
`);

fs.writeFileSync('src/App.tsx', code);
