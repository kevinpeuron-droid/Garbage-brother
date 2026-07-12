const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  '              )}\n            </div>\n            \n            <button\n              type="submit"',
  '              )}\n            </div>\n          </div>\n            \n            <button\n              type="submit"'
);

fs.writeFileSync('src/App.tsx', code);
