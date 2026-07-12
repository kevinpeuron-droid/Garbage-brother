const fs = require('fs');

let code = fs.readFileSync('src/components/ListView.tsx', 'utf-8');

code = code.replace(
  'if (window.confirm(\\`Supprimer l\\'emplacement "\\${loc.name}" ?\\`))',
  'if (window.confirm(`Supprimer l\\'emplacement "${loc.name}" ?`))'
);

fs.writeFileSync('src/components/ListView.tsx', code);
