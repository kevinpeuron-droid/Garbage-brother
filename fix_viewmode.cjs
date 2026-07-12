const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  'const [viewMode, setViewMode] = useState<"umap" | "list">("list");',
  'const [viewMode, setViewMode] = useState<"umap" | "list" | "heures">("list");'
);

// Also I should remove the "Ordi" button as requested: "tu peux supprime aussi le lien ordinateur, seul un lien suffi désormais"
const pcButtonRegex = /<button[\s\S]*?onClick=\{\(\) => handleShare\("pc"\)\}[\s\S]*?<\/button>/;
code = code.replace(pcButtonRegex, "");

// And change the text of the "Mobile" button to "Partager"
code = code.replace(
  '{copiedMobile ? "Copié !" : "Mobile"}',
  '{copiedMobile ? "Copié !" : "Partager"}'
);
code = code.replace(
  'title="Lien Smartphone"',
  'title="Partager le lien"'
);

fs.writeFileSync('src/App.tsx', code);
