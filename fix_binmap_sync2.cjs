const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

const newSync = `  const UmapSync = () => {
    const map = useMap();
    const [iframeRefState, setIframeRefState] = React.useState<{
      center: L.LatLng;
      zoom: number;
      refreshUmapOffset: {x: number, y: number};
    } | null>(null);

    const umapOffsetRef = React.useRef(umapOffset);
    umapOffsetRef.current = umapOffset;

    React.useEffect(() => {
      if (!iframeRef.current) return;
      
      const currentOffset = umapOffsetRef.current;
      const center = map.getCenter();
      const zoom = map.getZoom();
      
      const pt = map.latLngToContainerPoint(center);
      const adjustedPt = L.point(pt.x - currentOffset.x, pt.y - currentOffset.y);
      const adjustedLatLng = map.containerPointToLatLng(adjustedPt);
      
      const baseUrl = umapBaseUrl.split('#')[0];
      const newSrc = \`\${baseUrl}#\${zoom}/\${adjustedLatLng.lat}/\${adjustedLatLng.lng}\`;
      iframeRef.current.src = newSrc;
      
      setIframeRefState({ center: adjustedLatLng, zoom, refreshUmapOffset: currentOffset });
    }, [map, umapRefreshKey]);

    React.useEffect(() => {
      if (!iframeRefState) return;

      const onMove = () => {
        if (!iframeRef.current) return;
        
        const currentZoom = map.getZoom();
        const scale = map.getZoomScale(currentZoom, iframeRefState.zoom);
        
        const targetScreenPt = map.latLngToContainerPoint(iframeRefState.center);
        const centerScreenPt = map.latLngToContainerPoint(map.getCenter());
        
        let dx = targetScreenPt.x - centerScreenPt.x;
        let dy = targetScreenPt.y - centerScreenPt.y;
        
        const currentOffset = umapOffsetRef.current;
        dx -= (currentOffset.x - iframeRefState.refreshUmapOffset.x);
        dy -= (currentOffset.y - iframeRefState.refreshUmapOffset.y);

        iframeRef.current.style.transform = \`translate(\${dx}px, \${dy}px) scale(\${scale})\`;
        iframeRef.current.style.transformOrigin = 'center center';
      };

      let ticking = false;
      const onMoveRAF = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            onMove();
            ticking = false;
          });
          ticking = true;
        }
      };

      map.on("move zoom resize", onMoveRAF);
      onMove();

      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
        onMoveRAF();
      });
      resizeObserver.observe(map.getContainer());

      return () => {
        map.off("move zoom resize", onMoveRAF);
        resizeObserver.disconnect();
      };
    }, [map, iframeRefState, umapOffset]);

    return null;
  };`;

code = code.replace(/const UmapSync = \(\) => \{[\s\S]*?return null;\n  \};/, newSync);
fs.writeFileSync('src/components/BinMap.tsx', code);
