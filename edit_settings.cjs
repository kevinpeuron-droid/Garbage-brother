const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsView.tsx', 'utf-8');

code = code.replace(
`interface SettingsViewProps {
  binTypes: BinTypeConfig[];
  onUpdateBinTypes: (types: BinTypeConfig[]) => void;
  umapOffset: { x: number; y: number };
  onUpdateUmapOffset: (offset: { x: number; y: number }) => void;
}

export default function SettingsView({
  binTypes,
  onUpdateBinTypes,
  umapOffset,
  onUpdateUmapOffset,
}: SettingsViewProps) {`,
`interface SettingsViewProps {
  binTypes: BinTypeConfig[];
  onUpdateBinTypes: (types: BinTypeConfig[]) => void;
  umapOffsetPC: { x: number; y: number };
  onUpdateUmapOffsetPC: (offset: { x: number; y: number }) => void;
  umapOffsetMobile: { x: number; y: number };
  onUpdateUmapOffsetMobile: (offset: { x: number; y: number }) => void;
}

export default function SettingsView({
  binTypes,
  onUpdateBinTypes,
  umapOffsetPC,
  onUpdateUmapOffsetPC,
  umapOffsetMobile,
  onUpdateUmapOffsetMobile,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"pc" | "mobile">("pc");
  const umapOffset = activeTab === "pc" ? umapOffsetPC : umapOffsetMobile;
  const onUpdateUmapOffset = activeTab === "pc" ? onUpdateUmapOffsetPC : onUpdateUmapOffsetMobile;`
);

code = code.replace(
`          <p className="text-sm text-[#7A8275] mb-4">
            Ajustez le décalage du fond de carte pour l'aligner avec les points GPS de vos poubelles.
          </p>`,
`          <p className="text-sm text-[#7A8275] mb-4">
            Ajustez le décalage du fond de carte pour l'aligner avec les points GPS de vos poubelles.
          </p>
          
          <div className="flex gap-2 mb-4 bg-[#F4F1EA] p-1 rounded-lg border border-[#D9D3C7]">
            <button
              onClick={() => setActiveTab("pc")}
              className={\`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors \${activeTab === "pc" ? "bg-white shadow-sm text-[#4B6345]" : "text-[#7A8275] hover:text-[#3C413A]"}\`}
            >
              Ordi
            </button>
            <button
              onClick={() => setActiveTab("mobile")}
              className={\`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors \${activeTab === "mobile" ? "bg-white shadow-sm text-[#4B6345]" : "text-[#7A8275] hover:text-[#3C413A]"}\`}
            >
              Smartphone
            </button>
          </div>`
);

fs.writeFileSync('src/components/SettingsView.tsx', code);
