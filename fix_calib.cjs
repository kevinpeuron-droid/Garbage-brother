const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
`              umapOffset={deviceType === "mobile" ? umapOffsetMobile : umapOffsetPC}
              onUpdateUmapOffset={deviceType === "mobile" ? setUmapOffsetMobile : setUmapOffsetPC}`,
`              umapOffset={deviceType === "mobile" ? { x: umapOffsetPC.x + umapOffsetMobile.x, y: umapOffsetPC.y + umapOffsetMobile.y } : umapOffsetPC}
              onUpdateUmapOffset={setUmapOffsetPC}`
);

code = code.replace(
`                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => {
                      const offset = deviceType === "mobile" ? umapOffsetMobile : umapOffsetPC;
                      const setOffset = deviceType === "mobile" ? setUmapOffsetMobile : setUmapOffsetPC;
                      setOffset({ ...offset, y: offset.y - 10 });
                    }}
                    className="p-2 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
                  >
                    <ArrowUp size={20} className="text-[#3C413A]" />
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const offset = deviceType === "mobile" ? umapOffsetMobile : umapOffsetPC;
                        const setOffset = deviceType === "mobile" ? setUmapOffsetMobile : setUmapOffsetPC;
                        setOffset({ ...offset, x: offset.x - 10 });
                      }}
                      className="p-2 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
                    >
                      <ArrowLeft size={20} className="text-[#3C413A]" />
                    </button>
                    <div className="w-12 flex flex-col items-center justify-center font-mono text-[10px] text-[#7A8275]">
                      <div>X: {deviceType === "mobile" ? umapOffsetMobile.x : umapOffsetPC.x}</div>
                      <div>Y: {deviceType === "mobile" ? umapOffsetMobile.y : umapOffsetPC.y}</div>
                    </div>
                    <button
                      onClick={() => {
                        const offset = deviceType === "mobile" ? umapOffsetMobile : umapOffsetPC;
                        const setOffset = deviceType === "mobile" ? setUmapOffsetMobile : setUmapOffsetPC;
                        setOffset({ ...offset, x: offset.x + 10 });
                      }}
                      className="p-2 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
                    >
                      <ArrowRight size={20} className="text-[#3C413A]" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      const offset = deviceType === "mobile" ? umapOffsetMobile : umapOffsetPC;
                      const setOffset = deviceType === "mobile" ? setUmapOffsetMobile : setUmapOffsetPC;
                      setOffset({ ...offset, y: offset.y + 10 });
                    }}
                    className="p-2 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
                  >
                    <ArrowDown size={20} className="text-[#3C413A]" />
                  </button>
                </div>`,
`                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setUmapOffsetPC({ ...umapOffsetPC, y: umapOffsetPC.y - 10 })}
                    className="p-2 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
                  >
                    <ArrowUp size={20} className="text-[#3C413A]" />
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setUmapOffsetPC({ ...umapOffsetPC, x: umapOffsetPC.x - 10 })}
                      className="p-2 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
                    >
                      <ArrowLeft size={20} className="text-[#3C413A]" />
                    </button>
                    <div className="w-12 flex flex-col items-center justify-center font-mono text-[10px] text-[#7A8275]">
                      <div>X: {umapOffsetPC.x}</div>
                      <div>Y: {umapOffsetPC.y}</div>
                    </div>
                    <button
                      onClick={() => setUmapOffsetPC({ ...umapOffsetPC, x: umapOffsetPC.x + 10 })}
                      className="p-2 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
                    >
                      <ArrowRight size={20} className="text-[#3C413A]" />
                    </button>
                  </div>
                  <button
                    onClick={() => setUmapOffsetPC({ ...umapOffsetPC, y: umapOffsetPC.y + 10 })}
                    className="p-2 bg-white hover:bg-[#EBE7DF] rounded-lg shadow-sm border border-[#D9D3C7] transition-colors"
                  >
                    <ArrowDown size={20} className="text-[#3C413A]" />
                  </button>
                </div>`
);

fs.writeFileSync('src/App.tsx', code);
