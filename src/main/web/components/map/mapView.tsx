import * as React from "react";
import { MutableRefObject, useEffect, useRef } from "react";
import { Map, View } from "ol";
import { OSM } from "ol/source";
import TileLayer from "ol/layer/Tile";
import { Layer } from "ol/layer";

export function MapView() {
  const view = new View({
    center: [0, 0],
    zoom: 5,
  });
  const layers = [
    new TileLayer({
      source: new OSM(),
    }),
  ];

  return (
    <main>
      <MapDiv view={view} layers={layers} />
    </main>
  );
}

export function MapDiv({ view, layers }: { view: View; layers: Layer[] }) {
  const mapRef = useRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>;

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }
    const target = mapRef.current;
    const map = new Map({ layers, target, view });
    return () => map.setTarget(undefined);
  }, [mapRef.current]);

  return <div className={"map"} ref={mapRef} />;
}
