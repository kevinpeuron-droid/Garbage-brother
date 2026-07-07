const fs = require('fs');

let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
  `const [bounds, setBounds] = React.useState<number[] | null>(null);`,
  `const [bounds, setBounds] = React.useState<number[] | null>(null);
  const [zoom, setZoom] = React.useState(map.getZoom());`
);

code = code.replace(
  `      setBounds([
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
    };`,
  `      setBounds([
        b.getWest(),
        b.getSouth(),
        b.getEast(),
        b.getNorth()
      ]);
      setZoom(map.getZoom());
    };
    updateBounds();
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);
    return () => {
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };`
);

code = code.replace(
  `zoom: map.getZoom(),`,
  `zoom: zoom,`
);

// We should also replace map.getZoom() in the render function where we pass zoomLevel to icons
code = code.replace(/map\.getZoom\(\)/g, "zoom");

fs.writeFileSync('src/components/BinMap.tsx', code);
