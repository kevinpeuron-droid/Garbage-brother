const fs = require('fs');
let code = fs.readFileSync('src/components/ListView.tsx', 'utf-8');

code = code.replace(
  '<div className="w-full max-w-4xl mx-auto py-6 pb-32">',
  '<div className="flex-1 h-full overflow-y-auto w-full"><div className="w-full max-w-4xl mx-auto py-6 pb-32 px-4">'
);
code = code.replace(
  '           </div>\n        </div>\n      </div>\n    );\n  }',
  '           </div>\n        </div>\n      </div>\n      </div>\n    );\n  }'
);
fs.writeFileSync('src/components/ListView.tsx', code);
