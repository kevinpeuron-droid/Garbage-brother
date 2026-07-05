const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

code = code.replace(
`  count?: number;
  urgentPlacement?: boolean;
  urgentRemoval?: boolean;
}`,
`  count?: number;
  urgentPlacement?: boolean;
  urgentRemoval?: boolean;
  maintenanceRequired?: boolean;
}`
);

fs.writeFileSync('src/types.ts', code);
