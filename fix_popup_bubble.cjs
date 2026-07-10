const fs = require('fs');

let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
  '<div className="flex flex-col gap-3 min-w-[220px] max-w-[280px] text-[#3C413A] font-sans">',
  '<div className="flex flex-col gap-3 min-w-[220px] max-w-[280px] text-[#3C413A] font-sans" onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>'
);

fs.writeFileSync('src/components/BinMap.tsx', code);
