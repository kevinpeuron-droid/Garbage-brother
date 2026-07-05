const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
`  Menu,
  X,
} from "lucide-react";`,
`  Menu,
  X,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
} from "lucide-react";`
);

code = code.replace(
`  const [isExternal] = useState(() => {`,
`  const [showCalibration, setShowCalibration] = useState(false);
  const [isExternal] = useState(() => {`
);

code = code.replace(
`          )}
        </div>
      </header>`,
`          )}
          {isExternal && (
            <button
              onClick={() => setShowCalibration(!showCalibration)}
              className="w-8 h-8 flex items-center justify-center text-[#7A8275] opacity-20 hover:opacity-100 transition-opacity"
              title="Calibrage"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
      </header>`
);

code = code.replace(
`              onAddAndPlaceBin={handleAddAndPlaceBin}
            />
          </div>
        )}`,
`              onAddAndPlaceBin={handleAddAndPlaceBin}
            />
            {isExternal && showCalibration && (
              <div className="absolute bottom-20 left-4 z-[400] bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-[#D9D3C7]">
                <h3 className="text-xs font-bold text-[#3C413A] mb-2 text-center">Calibrage</h3>
                <div className="flex flex-col items-center gap-1">
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
                </div>
              </div>
            )}
          </div>
        )}`
);

fs.writeFileSync('src/App.tsx', code);
