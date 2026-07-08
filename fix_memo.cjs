const fs = require('fs');

let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

const oldPlacedBins = `  const placedBins = bins
    .filter((b) => b.lat !== null && b.lng !== null)
    .filter((b) => {
      if (mode === "map_deutz") {
        if (deutzSubMode === "pose") {
          return ["to_install", "installed", "overflowing"].includes(b.status);
        } else {
          return ["installed", "to_remove", "removed", "overflowing"].includes(
            b.status,
          );
        }
      }
      return true;
    });`;

const newPlacedBins = `  const placedBins = React.useMemo(() => bins
    .filter((b) => b.lat !== null && b.lng !== null)
    .filter((b) => {
      if (mode === "map_deutz") {
        if (deutzSubMode === "pose") {
          return ["to_install", "installed", "overflowing"].includes(b.status);
        } else {
          return ["installed", "to_remove", "removed", "overflowing"].includes(
            b.status,
          );
        }
      }
      return true;
    }), [bins, mode, deutzSubMode]);`;

code = code.replace(oldPlacedBins, newPlacedBins);

const oldUnplacedBins = `  const unplacedBins = bins.filter((b) => b.lat === null || b.lng === null);
  const overflowingBins = placedBins.filter((b) => b.status === "overflowing");
  const maintenanceBins = placedBins.filter((b) => b.maintenanceRequired);
  const urgentPoseBins = bins.filter(
    (b) => b.urgentPlacement && b.status === "to_install",
  );
  const urgentDeposeBins = placedBins.filter(
    (b) => b.urgentRemoval && b.status === "to_remove",
  );`;

const newUnplacedBins = `  const unplacedBins = React.useMemo(() => bins.filter((b) => b.lat === null || b.lng === null), [bins]);
  const overflowingBins = React.useMemo(() => placedBins.filter((b) => b.status === "overflowing"), [placedBins]);
  const maintenanceBins = React.useMemo(() => placedBins.filter((b) => b.maintenanceRequired), [placedBins]);
  const urgentPoseBins = React.useMemo(() => bins.filter(
    (b) => b.urgentPlacement && b.status === "to_install",
  ), [bins]);
  const urgentDeposeBins = React.useMemo(() => placedBins.filter(
    (b) => b.urgentRemoval && b.status === "to_remove",
  ), [placedBins]);`;

code = code.replace(oldUnplacedBins, newUnplacedBins);

fs.writeFileSync('src/components/BinMap.tsx', code);
