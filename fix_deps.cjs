const fs = require('fs');
let code = fs.readFileSync('src/components/BinMap.tsx', 'utf-8');

code = code.replace(
`    React.useEffect(() => {
      if (!iframeRef.current) return;
      
      const center = map.getCenter();
      const zoom = map.getZoom();
      
      const baseUrl = umapBaseUrl.split('#')[0];
      const newSrc = \`\${baseUrl}#\${zoom}/\${center.lat}/\${center.lng}\`;
      iframeRef.current.src = newSrc;
      
      setIframeRefState({ center, zoom });
    }, [map, umapRefreshKey]);`,
`    React.useEffect(() => {
      if (!iframeRef.current) return;
      
      const center = map.getCenter();
      const zoom = map.getZoom();
      
      const baseUrl = umapBaseUrl.split('#')[0];
      const newSrc = \`\${baseUrl}#\${zoom}/\${center.lat}/\${center.lng}\`;
      iframeRef.current.src = newSrc;
      
      setIframeRefState({ center, zoom });
    }, [map, umapRefreshKey, umapBaseUrl]);`
);

code = code.replace(
`  const umapBaseUrl =
    \`https://umap.vieillescharrues.bzh/fr/map/recap-container_20?scaleControl=false&miniMap=false&scrollWheelZoom=false&zoomControl=false&allowEdit=false&moreControl=true&searchControl=null&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=none&captionBar=false\${showUmapData ? "" : "&datalayers="}\`;`,
`  const umapBaseUrl =
    \`https://umap.vieillescharrues.bzh/fr/map/recap-container_20?scaleControl=false&miniMap=false&scrollWheelZoom=false&zoomControl=false&allowEdit=false&moreControl=true&searchControl=null&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=none&captionBar=false\${showUmapData ? "" : "&datalayers=none"}\`;`
);

fs.writeFileSync('src/components/BinMap.tsx', code);
