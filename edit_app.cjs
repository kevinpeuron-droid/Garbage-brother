const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
`import {
  TrashBin,
  MapShape,
  BinTypeConfig,
  defaultBinTypes,
  EquipmentConfig,
  defaultEquipmentConfigs,
  WorkSession,
} from "./types";`,
`import {
  TrashBin,
  MapShape,
  BinTypeConfig,
  defaultBinTypes,
  BinCategoryConfig,
  defaultBinCategories,
  EquipmentConfig,
  defaultEquipmentConfigs,
  WorkSession,
} from "./types";`
);

code = code.replace(
`  const [binTypes, _setBinTypes] = useState<BinTypeConfig[]>(defaultBinTypes);`,
`  const [binTypes, _setBinTypes] = useState<BinTypeConfig[]>(defaultBinTypes);
  const [binCategories, _setBinCategories] = useState<BinCategoryConfig[]>(defaultBinCategories);`
);

code = code.replace(
`          if (data.binTypes) _setBinTypes(data.binTypes);`,
`          if (data.binTypes) _setBinTypes(data.binTypes);
          if (data.binCategories) _setBinCategories(data.binCategories);`
);

code = code.replace(
`            binTypes: defaultBinTypes,`,
`            binTypes: defaultBinTypes,
            binCategories: defaultBinCategories,`
);

code = code.replace(
`  const setBinTypes = (newTypes: BinTypeConfig[] | ((prev: BinTypeConfig[]) => BinTypeConfig[])) => {
    _setBinTypes((prev) => {
      const updated = typeof newTypes === "function" ? newTypes(prev) : newTypes;
      if (isDbLoaded)
        setDoc(doc(db, "maps", "clean_v1"), { binTypes: updated }, { merge: true })
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1"));
      return updated;
    });
  };`,
`  const setBinTypes = (newTypes: BinTypeConfig[] | ((prev: BinTypeConfig[]) => BinTypeConfig[])) => {
    _setBinTypes((prev) => {
      const updated = typeof newTypes === "function" ? newTypes(prev) : newTypes;
      if (isDbLoaded)
        setDoc(doc(db, "maps", "clean_v1"), { binTypes: updated }, { merge: true })
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1"));
      return updated;
    });
  };

  const setBinCategories = (newCategories: BinCategoryConfig[] | ((prev: BinCategoryConfig[]) => BinCategoryConfig[])) => {
    _setBinCategories((prev) => {
      const updated = typeof newCategories === "function" ? newCategories(prev) : newCategories;
      if (isDbLoaded)
        setDoc(doc(db, "maps", "clean_v1"), { binCategories: updated }, { merge: true })
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, "maps/clean_v1"));
      return updated;
    });
  };`
);

code = code.replace(
`              binTypes={binTypes}`,
`              binTypes={binTypes}
              binCategories={binCategories}`
);

code = code.replace(
`            binTypes={binTypes}`,
`            binTypes={binTypes}
            binCategories={binCategories}`
);

// We need to replace all instances of binTypes={binTypes}
// But wait, there are multiple views being passed these props.
fs.writeFileSync('src/App.tsx', code);
