const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace setBins
code = code.replace(
  /const setBins = \([\s\S]*?\n  };\n/m,
  `const setBins = (newBins: import("./types").TrashBin[] | ((prev: import("./types").TrashBin[]) => import("./types").TrashBin[])) => {
    _setBins((prev) => {
      const updated = typeof newBins === "function" ? newBins(prev) : newBins;
      if (isDbLoaded) {
        import("firebase/firestore").then(({ updateDoc, doc }) => {
          updateDoc(doc(db, "maps", "clean_v1"), { bins: updated }).catch(console.error);
        });
      }
      return updated;
    });
  };\n`
);

// Do the same for setEquipments
code = code.replace(
  /const setEquipments = \([\s\S]*?\n  };\n/m,
  `const setEquipments = (newEquipments: import("./types").EquipmentConfig[] | ((prev: import("./types").EquipmentConfig[]) => import("./types").EquipmentConfig[])) => {
    _setEquipments((prev) => {
      const updated = typeof newEquipments === "function" ? newEquipments(prev) : newEquipments;
      if (isDbLoaded) {
        import("firebase/firestore").then(({ updateDoc, doc }) => {
          updateDoc(doc(db, "maps", "clean_v1"), { equipments: updated }).catch(console.error);
        });
      }
      return updated;
    });
  };\n`
);

// Do the same for setSessions
code = code.replace(
  /const setSessions = \([\s\S]*?\n  };\n/m,
  `const setSessions = (newSessions: import("./types").WorkSession[] | ((prev: import("./types").WorkSession[]) => import("./types").WorkSession[])) => {
    _setSessions((prev) => {
      const updated = typeof newSessions === "function" ? newSessions(prev) : newSessions;
      if (isDbLoaded) {
        import("firebase/firestore").then(({ updateDoc, doc }) => {
          updateDoc(doc(db, "maps", "clean_v1"), { sessions: updated }).catch(console.error);
        });
      }
      return updated;
    });
  };\n`
);

// Do the same for setBinTypes
code = code.replace(
  /const setBinTypes = \([\s\S]*?\n  };\n/m,
  `const setBinTypes = (newBinTypes: import("./types").BinTypeConfig[] | ((prev: import("./types").BinTypeConfig[]) => import("./types").BinTypeConfig[])) => {
    _setBinTypes((prev) => {
      const updated = typeof newBinTypes === "function" ? newBinTypes(prev) : newBinTypes;
      if (isDbLoaded) {
        import("firebase/firestore").then(({ updateDoc, doc }) => {
          updateDoc(doc(db, "maps", "clean_v1"), { binTypes: updated }).catch(console.error);
        });
      }
      return updated;
    });
  };\n`
);

// Do the same for setBinCategories
code = code.replace(
  /const setBinCategories = \([\s\S]*?\n  };\n/m,
  `const setBinCategories = (newBinCategories: import("./types").BinCategoryConfig[] | ((prev: import("./types").BinCategoryConfig[]) => import("./types").BinCategoryConfig[])) => {
    _setBinCategories((prev) => {
      const updated = typeof newBinCategories === "function" ? newBinCategories(prev) : newBinCategories;
      if (isDbLoaded) {
        import("firebase/firestore").then(({ updateDoc, doc }) => {
          updateDoc(doc(db, "maps", "clean_v1"), { binCategories: updated }).catch(console.error);
        });
      }
      return updated;
    });
  };\n`
);

// Fix handleDeleteAllBins to explicitly update db to empty
code = code.replace(
  /const handleDeleteAllBins = \(\) => {[\s\S]*?};/m,
  `const handleDeleteAllBins = () => {
    _setBins([]);
    setSelectedBinId(null);
    setPlacingBinId(null);
    if (isDbLoaded) {
      import("firebase/firestore").then(({ updateDoc, doc }) => {
        updateDoc(doc(db, "maps", "clean_v1"), { bins: [] }).catch(console.error);
      });
    }
  };`
);


fs.writeFileSync('src/App.tsx', code);
