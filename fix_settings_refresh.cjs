const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsView.tsx', 'utf-8');

code = code.replace(
`  umapOffsetMobile: { x: number; y: number };
  onUpdateUmapOffsetMobile: (offset: { x: number; y: number }) => void;
}`,
`  umapOffsetMobile: { x: number; y: number };
  onUpdateUmapOffsetMobile: (offset: { x: number; y: number }) => void;
  onRefreshUmap: () => void;
}`
);

code = code.replace(
`  umapOffsetMobile,
  onUpdateUmapOffsetMobile,
}: SettingsViewProps) {`,
`  umapOffsetMobile,
  onUpdateUmapOffsetMobile,
  onRefreshUmap,
}: SettingsViewProps) {`
);

code = code.replace(
`              </a>
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-sm text-[#3C413A] mb-3">
            Gérer les Catégories (Groupes)
          </h3>`,
`              </a>
            </p>
            <button
              onClick={onRefreshUmap}
              className="mt-4 w-full p-2 bg-[#6B8E63] text-white font-bold rounded-lg hover:bg-[#5A7A52] transition-colors"
            >
              Rafraîchir le Umap
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-sm text-[#3C413A] mb-3">
            Gérer les Catégories (Groupes)
          </h3>`
);

fs.writeFileSync('src/components/SettingsView.tsx', code);
