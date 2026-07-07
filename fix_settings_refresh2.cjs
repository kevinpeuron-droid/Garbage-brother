const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsView.tsx', 'utf-8');

code = code.replace(
`            <button
              onClick={() => onUpdateUmapOffset({ ...umapOffset, y: umapOffset.y + 10 })}
              className="p-3 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
            >
              <ArrowDown size={24} className="text-[#3C413A]" />
            </button>
          </div>
        </div>`,
`            <button
              onClick={() => onUpdateUmapOffset({ ...umapOffset, y: umapOffset.y + 10 })}
              className="p-3 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
            >
              <ArrowDown size={24} className="text-[#3C413A]" />
            </button>
          </div>
          
          <button
            onClick={onRefreshUmap}
            className="mt-4 w-full p-3 bg-[#3B82F6] text-white font-bold rounded-lg hover:bg-[#2563EB] transition-colors shadow-sm"
          >
            Rafraîchir le fond de carte (Umap)
          </button>
        </div>`
);

fs.writeFileSync('src/components/SettingsView.tsx', code);
