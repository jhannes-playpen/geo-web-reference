import * as React from "react";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { Map, View } from "ol";
import { OSM } from "ol/source";
import TileLayer from "ol/layer/Tile";
import { Layer } from "ol/layer";
import { useGeographic } from "ol/proj";

useGeographic();

export function MapView() {
  const [followMe, setFollowMe] = useState(false);
  const view = useMemo(() => {
    const sessionViewport = sessionStorage.getItem("viewport");
    const storageViewport = localStorage.getItem("viewport");
    const defaultViewport = {
      center: [9.5, 60],
      zoom: 5,
    };
    const viewport = sessionViewport
      ? JSON.parse(sessionViewport)
      : storageViewport
      ? JSON.parse(storageViewport)
      : defaultViewport;
    return new View(viewport);
  }, []);
  const layers = [
    new TileLayer({
      source: new OSM(),
    }),
  ];

  useEffect(() => {
    if (!followMe) {
      return;
    }
    const watchId = navigator.geolocation.watchPosition((pos) => {
      console.log(pos);
      const { latitude, longitude } = pos.coords;
      view.setCenter([longitude, latitude]);
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [followMe]);

  function handleMoveEnd() {
    const viewport = {
      center: view.getCenter(),
      zoom: view.getZoom(),
    };
    localStorage.setItem("viewport", JSON.stringify(viewport));
    sessionStorage.setItem("viewport", JSON.stringify(viewport));
    setFollowMe(false);
  }

  return (
    <main>
      <div>
        <label>
          Follow me
          <input
            type="checkbox"
            checked={followMe}
            onChange={(e) => setFollowMe(e.target.checked)}
          />
        </label>
      </div>
      <MapDiv view={view} layers={layers} onMoveEnd={handleMoveEnd} />
    </main>
  );
}

export function MapDiv({
  view,
  layers,
  onMoveEnd,
}: {
  view: View;
  layers: Layer[];
  onMoveEnd(): void;
}) {
  const mapRef = useRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>;

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }
    const target = mapRef.current;
    const map = new Map({ layers, target, view });
    map.on("moveend", onMoveEnd);
    return () => map.setTarget(undefined);
  }, [mapRef.current]);

  return <div className={"map"} ref={mapRef} />;
}
