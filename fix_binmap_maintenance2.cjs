const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
`                      <span
                        className={\`text-[10px] font-bold transition-colors \${bin.urgentRemoval ? "text-[#D4A373]" : "text-[#7A8275]"}\`}
                      >
                        À déposer en priorité
                      </span>
                    </label>
                  </div>`,
`                      <span
                        className={\`text-[10px] font-bold transition-colors \${bin.urgentRemoval ? "text-[#D4A373]" : "text-[#7A8275]"}\`}
                      >
                        À déposer en priorité
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bin.maintenanceRequired || false}
                        onChange={(e) =>
                          onUpdateBin &&
                          onUpdateBin(bin.id, {
                            maintenanceRequired: e.target.checked,
                          })
                        }
                        className="w-3.5 h-3.5 rounded border-[#D9D3C7] text-[#9333EA] focus:ring-[#9333EA]"
                      />
                      <span
                        className={\`text-[10px] font-bold transition-colors \${bin.maintenanceRequired ? "text-[#9333EA]" : "text-[#7A8275]"}\`}
                      >
                        Maintenance nécessaire
                      </span>
                    </label>
                  </div>`
);

fs.writeFileSync('src/components/BinMap.tsx', code);
