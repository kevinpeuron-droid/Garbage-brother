const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
`                  <div
                    className="w-4 h-4 rounded-full border border-black/20"
                    style={{ backgroundColor: type.color }}
                  />`,
`                  <div
                    className="w-4 h-4 rounded-full border border-black/20"
                    style={{ backgroundColor: binCategories.find(c => c.id === type.categoryId)?.color || type.color || "#ccc" }}
                  />`
);

fs.writeFileSync('src/App.tsx', code);
