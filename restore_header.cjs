const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const brokenStart = code.indexOf('              {authError && (');
const brokenEnd = code.indexOf('      </header>');

const newBlock = `              {authError && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  Mot de passe incorrect
                </p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#6B8E63] text-white py-3 rounded-lg font-bold hover:bg-[#4B6345] transition-colors shadow-sm"
            >
              Accéder
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F4F1EA] font-sans overflow-hidden">
      <header className="bg-white p-3 md:p-4 shadow-sm border-b border-[#D9D3C7] flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            className="p-1 md:p-2 flex md:hidden items-center justify-center text-[#3C413A] hover:bg-[#E5E0D5] rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="w-8 h-8 bg-[#6B8E63] rounded-lg flex items-center justify-center text-white hidden md:flex">
            <Trash2 size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight flex items-baseline gap-2">
            Big Garbage{" "}
            <span className="text-sm italic font-normal text-[#7A8275] hidden md:inline">
              is cleaning you
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {!isExternal && (
            <button
              onClick={() => handleShare("mobile")}
              className="flex items-center gap-1 bg-white text-[#4B6345] border border-[#D9D3C7] px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm font-bold shadow-sm hover:bg-[#F4F1EA] transition-colors"
              title="Partager le lien"
            >
              {copiedMobile ? <Check size={16} className="text-[#6B8E63]" /> : <Share2 size={16} />}
              <span className="hidden md:inline">{copiedMobile ? "Copié !" : "Partager"}</span>
            </button>
          )}
          {isExternal && (
            <button
              onClick={() => setShowCalibration(!showCalibration)}
              className="w-8 h-8 flex items-center justify-center text-[#7A8275] opacity-20 hover:opacity-100 transition-opacity"
              title="Calibrage"
            >
              <Settings size={18} />
            </button>
          )}
        </div>`;

code = code.substring(0, brokenStart) + newBlock + code.substring(brokenEnd);

fs.writeFileSync('src/App.tsx', code);
