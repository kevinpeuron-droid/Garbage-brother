const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  '          </form>\n        </div>\n      </div>',
  '          </form>\n      </div>'
);

fs.writeFileSync('src/App.tsx', code);
