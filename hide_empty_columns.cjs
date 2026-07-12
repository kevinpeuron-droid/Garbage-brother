const fs = require('fs');

let code = fs.readFileSync('src/components/ListView.tsx', 'utf-8');

// Inside ListView component, find locations definition and add activeBinTypes
const findLocations = `  const locations = Array.from(locationsMap.entries()).map(([name, types]) => ({
    name,
    types
  }));`;

const replaceLocations = `  const locations = Array.from(locationsMap.entries()).map(([name, types]) => ({
    name,
    types
  }));

  const activeBinTypes = binTypes.filter(t => bins.some(b => b.type === t.id));`;

code = code.replace(findLocations, replaceLocations);

// Now replace binTypes.map in the table
code = code.replace(
  '{binTypes.map(t => (',
  '{activeBinTypes.map(t => ('
);

code = code.replace(
  '{binTypes.map(t => {',
  '{activeBinTypes.map(t => {'
);

// We need to also change the colSpan for empty state
code = code.replace(
  '<td colSpan={binTypes.length + 2} className="px-4 py-8 text-center text-[#A08E78]">',
  '<td colSpan={activeBinTypes.length + 1} className="px-4 py-8 text-center text-[#A08E78]">' // + 1 because we removed actions column
);

fs.writeFileSync('src/components/ListView.tsx', code);
