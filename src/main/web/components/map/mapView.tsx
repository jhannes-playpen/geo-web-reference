import * as React from "react";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { Map, View } from "ol";
import { OSM, WMTS } from "ol/source";
import TileLayer from "ol/layer/Tile";
import { Layer } from "ol/layer";
import { Projection, useGeographic } from "ol/proj";
import proj4 from "proj4";

import "ol/ol.css";
import { optionsFromCapabilities } from "ol/source/WMTS";
import { WMTSCapabilities } from "ol/format";
import { register } from "ol/proj/proj4";

useGeographic();
proj4.defs([
  [
    "urn:ogc:def:crs:EPSG::32633",
    "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs +type=crs",
  ],
]);
register(proj4);

export function MapView() {
  const [followMe, setFollowMe] = useState(false);

  const [projection, setProjection] = useState<Projection | null>();
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
    return new View({ ...viewport, projection });
  }, [projection]);
  const [layers, setLayers] = useState<Layer[]>(() => [
    new TileLayer({
      source: new OSM(),
    }),
  ]);

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

  useEffect(() => {
    (async () => {
      const res = await fetch(
        "https://services.geodataonline.no/arcgis/rest/services/Geocache_UTM33_WGS84/GeocacheBasis/MapServer/WMTS/1.0.0/WMTSCapabilities.xml"
      );
      if (res.ok) {
        const xml = await res.text();
        const parser = new WMTSCapabilities();
        const options = optionsFromCapabilities(parser.read(xml), {
          layer: "Geocache_UTM33_WGS84_GeocacheBasis",
          matrixSet: "default028mm",
        });
        const tileLayer = new TileLayer({
          source: new WMTS(options!),
          opacity: 1,
        });
        setLayers([tileLayer]);
        setProjection(tileLayer.getSource()!.getProjection());
      }
    })();
  }, []);

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
