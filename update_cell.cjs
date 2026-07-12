const fs = require('fs');
let code = fs.readFileSync('src/components/ListView.tsx', 'utf-8');

const regex = /className=\{\`flex flex-col items-center justify-center w-10 h-10 rounded-lg text-sm font-bold cursor-pointer transition-all shadow-sm hover:brightness-95 \$\{getStatusColor\(bin\.status\)\} \$\{bin\.urgentPlacement \|\| bin\.urgentRemoval \|\| bin\.maintenanceRequired \? 'ring-2 ring-offset-1 ring-red-400' : ''\}\`\}/;

const newProps = `className={\`flex flex-col items-center justify-center w-10 h-10 rounded-lg text-sm font-bold cursor-pointer transition-all shadow-sm hover:brightness-95 \${bin.status === "installed" ? "opacity-50" : ""} \${bin.urgentPlacement || bin.urgentRemoval || bin.maintenanceRequired ? 'ring-2 ring-offset-1 ring-red-400' : ''}\`}
                               style={{ 
                                  backgroundColor: bin.color || t.color || (bin.status === "installed" ? "#6B8E63" : "#F4F1EA"),
                                  color: (bin.color || t.color) ? '#FFFFFF' : (bin.status === "installed" ? "#FFFFFF" : "#3C413A"),
                                  textShadow: (bin.color || t.color) ? '0px 1px 2px rgba(0,0,0,0.5)' : 'none'
                               }}`;

code = code.replace(regex, newProps);
fs.writeFileSync('src/components/ListView.tsx', code);
