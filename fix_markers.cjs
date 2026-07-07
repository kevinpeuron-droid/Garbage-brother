const fs = require('fs');

let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

// 1. We need to define `BinPopupContent` and `MapMarkers`
const importSupercluster = `import useSupercluster from 'use-supercluster';`;
if (!code.includes('useSupercluster')) {
  code = code.replace(`import {`, importSupercluster + `\nimport {`);
}

// Extract Popup Content
const popupStart = code.indexOf('<Popup>');
const popupEnd = code.indexOf('</Popup>') + '</Popup>'.length;
const popupInner = code.substring(popupStart + '<Popup>'.length, code.indexOf('</Popup>'));

const binPopupContentStr = `
const BinPopupContent = ({ bin, binTypes, binCategories, mode, deutzSubMode, onUpdateBin, onUpdateStatus, onDeleteBin }: any) => {
  const typeConfig = binTypes.find((t: any) => t.id === bin.type);
  const categoryConfig = typeConfig ? binCategories.find((c: any) => c.id === typeConfig.categoryId) : undefined;
  return (
    <>
      ${popupInner}
    </>
  );
};

const createClusterIcon = (colors: string[], count: number, zoomLevel: number) => {
  const baseZoom = 18;
  const baseSize = 32;
  const size = Math.max(16, baseSize * Math.pow(2, zoomLevel - baseZoom));

  let gradientStr = "";
  if (colors.length === 0) {
    gradientStr = "white";
  } else if (colors.length === 1) {
    gradientStr = colors[0];
  } else {
    const step = 100 / colors.length;
    gradientStr = \`conic-gradient(\${colors.map((c, i) => \`\${c} \${i * step}% \${(i + 1) * step}%\`).join(", ")})\`;
  }

  const content = \`<span style="color: white; font-size: \${Math.max(10, size/2.5)}px; font-weight: bold; text-shadow: 0 0 3px rgba(0,0,0,0.8);">\${count}</span>\`;
  
  return new L.DivIcon({
    className: "custom-cluster-icon",
    html: \`<div style="background: \${gradientStr}; width: \${size}px; height: \${size}px; border-radius: 50%; border: \${Math.max(2, size/8)}px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">\${content}</div>\`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

const MapMarkers = ({ bins, binTypes, binCategories, mode, deutzSubMode, calibState, setCalibState, setCalibBinPoint, onUpdateBin, onUpdateStatus, onDeleteBin }: any) => {
  const map = useMap();
  const [bounds, setBounds] = React.useState<number[] | null>(null);

  React.useEffect(() => {
    const updateBounds = () => {
      const b = map.getBounds();
      setBounds([
        b.getWest(),
        b.getSouth(),
        b.getEast(),
        b.getNorth()
      ]);
    };
    updateBounds();
    map.on('moveend', updateBounds);
    return () => {
      map.off('moveend', updateBounds);
    };
  }, [map]);

  const points = bins.map((bin: any) => ({
    type: "Feature",
    properties: { cluster: false, binId: bin.id, bin },
    geometry: { type: "Point", coordinates: [bin.lng, bin.lat] }
  }));

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: map.getZoom(),
    options: { radius: 30, maxZoom: 22 }
  });

  return (
    <>
      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties;

        if (isCluster) {
          const leaves = supercluster.getLeaves(cluster.id, Infinity);
          const binLeaves = leaves.map((l: any) => l.properties.bin);
          const colors = binLeaves.map((bin: any) => getBinStyle(bin, binTypes, binCategories).fillColor);
          
          return (
            <Marker key={\`cluster-\${cluster.id}\`} position={[lat, lng]} icon={createClusterIcon(colors, pointCount, map.getZoom())}>
              <Popup className="cluster-popup" maxWidth={800}>
                <div className="flex gap-4 overflow-x-auto p-2" style={{ maxWidth: '80vw' }}>
                  {binLeaves.map((bin: any) => (
                    <div key={bin.id} className="flex-shrink-0 w-[240px] border border-[#E5E0D5] p-2 rounded-lg bg-white shadow-sm">
                      <BinPopupContent 
                         bin={bin} 
                         binTypes={binTypes} 
                         binCategories={binCategories} 
                         mode={mode} 
                         deutzSubMode={deutzSubMode} 
                         onUpdateBin={onUpdateBin} 
                         onUpdateStatus={onUpdateStatus} 
                         onDeleteBin={onDeleteBin} 
                      />
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          );
        }

        const bin = cluster.properties.bin;
        const { fillColor, borderColor } = getBinStyle(bin, binTypes, binCategories);
        return (
          <Marker 
            key={bin.id} 
            position={[lat, lng]} 
            icon={createIcon(fillColor, borderColor, bin.count, map.getZoom())}
            eventHandlers={{
              click: (e) => {
                if (calibState === "step1_bin") {
                  setCalibBinPoint({ lat: bin.lat as number, lng: bin.lng as number });
                  setCalibState("step2_map");
                  e.originalEvent.preventDefault();
                  e.originalEvent.stopPropagation();
                  return;
                }
              }
            }}
          >
            <Popup>
               <BinPopupContent 
                 bin={bin} 
                 binTypes={binTypes} 
                 binCategories={binCategories} 
                 mode={mode} 
                 deutzSubMode={deutzSubMode} 
                 onUpdateBin={onUpdateBin} 
                 onUpdateStatus={onUpdateStatus} 
                 onDeleteBin={onDeleteBin} 
               />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
`;

code = code.replace('export default function BinMap({', binPopupContentStr + '\nexport default function BinMap({');

// Replace the original mapping inside MapContainer
const mapStart = code.indexOf('{placedBins.map((bin) => {');
if (mapStart !== -1) {
  const mapEnd = code.indexOf('</MapContainer>', mapStart);
  
  const originalMapLoop = code.substring(mapStart, mapEnd);
  
  code = code.replace(originalMapLoop, `
        <MapMarkers 
          bins={placedBins}
          binTypes={binTypes}
          binCategories={binCategories}
          mode={mode}
          deutzSubMode={deutzSubMode}
          calibState={calibState}
          setCalibState={setCalibState}
          setCalibBinPoint={setCalibBinPoint}
          onUpdateBin={onUpdateBin}
          onUpdateStatus={onUpdateStatus}
          onDeleteBin={onDeleteBin}
        />
      `);
}

// To prevent TS errors with the any types if strict is on, let's keep it simple or we can fix the ts errors later.
// Write back
fs.writeFileSync('src/components/BinMap.tsx', code);
