const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
`                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode === "map_deutz" &&`,
`                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>

      {mode === "map_deutz" &&`
);

fs.writeFileSync('src/components/BinMap.tsx', code);
