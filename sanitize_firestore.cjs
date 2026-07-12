const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

function addSanitize(codeStr, typeName) {
  const regex = new RegExp(`updateDoc\\(doc\\(db, "maps", "clean_v1"\\), \\{ ${typeName}: updated \\}\\)`);
  return codeStr.replace(
    regex,
    `updateDoc(doc(db, "maps", "clean_v1"), { ${typeName}: JSON.parse(JSON.stringify(updated)) })`
  );
}

code = addSanitize(code, 'bins');
code = addSanitize(code, 'equipments');
code = addSanitize(code, 'sessions');
code = addSanitize(code, 'binTypes');
code = addSanitize(code, 'binCategories');

fs.writeFileSync('src/App.tsx', code);
