import * as React from "react";
import { MutableRefObject, useEffect, useRef } from "react";
import { Map, View } from "ol";
import { OSM } from "ol/source";
import TileLayer from "ol/layer/Tile";

export function MapView() {
  const mapRef = useRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>;

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }
    const map = new Map({
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      target: mapRef.current,
      view: new View({
        center: [0, 0],
        zoom: 3,
      }),
    });
    return () => map.setTarget(undefined);
  }, [mapRef.current]);

  return (
    <main>
      <div className={"map"} ref={mapRef} id="mapId" />
    </main>
  );
}
