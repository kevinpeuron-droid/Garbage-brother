import React from "react";

export default function UmapView() {
  return (
    <div className="w-full h-full relative overflow-hidden bg-[#E5E0D5]">
      <iframe
        src="https://umap.vieillescharrues.bzh/fr/map/recap-container_20?scaleControl=false&miniMap=false&scrollWheelZoom=true&zoomControl=true&allowEdit=false&moreControl=true&searchControl=null&tilelayersControl=null&embedControl=null&datalayersControl=true&onLoadPanel=none&captionBar=false"
        className="w-full h-full border-none"
        title="Umap Background"
      />
    </div>
  );
}
