const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsView.tsx', 'utf-8');

code = code.replace(
`          <div className="flex gap-2 mb-4 bg-[#F4F1EA] p-1 rounded-lg border border-[#D9D3C7]">
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
          </div>`,
`          <p className="text-xs text-[#7A8275] mb-2">
            Le calibrage Ordi est la base. Le calibrage Smartphone est un décalage relatif ajouté à celui de l'ordinateur.
          </p>
          <div className="flex gap-2 mb-4 bg-[#F4F1EA] p-1 rounded-lg border border-[#D9D3C7]">
            <button
              onClick={() => setActiveTab("pc")}
              className={\`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors \${activeTab === "pc" ? "bg-white shadow-sm text-[#4B6345]" : "text-[#7A8275] hover:text-[#3C413A]"}\`}
            >
              Ordi (Base)
            </button>
            <button
              onClick={() => setActiveTab("mobile")}
              className={\`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors \${activeTab === "mobile" ? "bg-white shadow-sm text-[#4B6345]" : "text-[#7A8275] hover:text-[#3C413A]"}\`}
            >
              Smartphone (Relatif)
            </button>
          </div>`
);

fs.writeFileSync('src/components/SettingsView.tsx', code);
