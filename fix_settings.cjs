const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsView.tsx', 'utf-8');

code = code.replace(
`        id: \\\`type-\\\${\\Date.now()}\\\`,`,
`        id: \`type-\${Date.now()}\`,`
);

code = code.replace(
`        id: \\\`cat-\\\${\\Date.now()}\\\`,`,
`        id: \`cat-\${Date.now()}\`,`
);

code = code.replace(/\\`/g, '`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync('src/components/SettingsView.tsx', code);
