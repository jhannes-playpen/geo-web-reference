import * as React from "react";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { Map, View } from "ol";
import { OSM, WMTS } from "ol/source";
import TileLayer from "ol/layer/Tile";
import { Layer } from "ol/layer";
import { useGeographic } from "ol/proj";
import proj4 from "proj4";

import "ol/ol.css";
import { optionsFromCapabilities } from "ol/source/WMTS";
import { GeoJSON, WMTSCapabilities } from "ol/format";
import { register } from "ol/proj/proj4";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";

useGeographic();
proj4.defs([
  [
    "urn:ogc:def:crs:EPSG::32633",
    "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs +type=crs",
  ],
]);
register(proj4);

interface WmtsLayerDefinition {
  url: string;
  layer: string;
  matrixSet: string;
}

async function loadWmtsLayer({ url, layer, matrixSet }: WmtsLayerDefinition) {
  const res = await fetch(url);
  if (res.ok) {
    const xml = await res.text();
    const parser = new WMTSCapabilities();
    const options = optionsFromCapabilities(parser.read(xml), {
      layer,
      matrixSet,
    });
    return {
      name: options!.layer,
      source: new WMTS(options!),
    };
  } else {
    return {
      name: layer,
      error: "Failed to load",
    };
  }
}

const geodataWmtsLayer = {
  url: "https://services.geodataonline.no/arcgis/rest/services/Geocache_UTM33_WGS84/GeocacheBasis/MapServer/WMTS/1.0.0/WMTSCapabilities.xml",
  layer: "Geocache_UTM33_WGS84_GeocacheBasis",
  matrixSet: "default028mm",
};
const geodataPhotoLayer = {
  url: "https://services.geodataonline.no/arcgis/rest/services/Geocache_UTM33_WGS84/GeocacheBilder/MapServer/WMTS/1.0.0/WMTSCapabilities.xml",
  layer: "Geocache_UTM33_WGS84_GeocacheBilder",
  matrixSet: "default028mm",
};

const countryLayer = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_sovereignty.geojson",
  }),
  style: new Style({
    stroke: new Stroke({
      color: "red",
      width: 2,
    }),
    fill: new Fill({
      color: "rgba(255, 255, 255, 0)",
    }),
  }),
});

export function MapView() {
  const [baseLayer, setBaseLayer] = useState<Layer>(
    () => new TileLayer({ source: new OSM() })
  );

  const layers = useMemo(() => [baseLayer, countryLayer], [baseLayer]);
  const projection = useMemo(
    () => baseLayer.getSource()?.getProjection(),
    [baseLayer]
  );

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
    return new View({ ...viewport, projection });
  }, [projection]);

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
      const wmtsLayer = await loadWmtsLayer(geodataWmtsLayer);
      if (wmtsLayer.source) {
        setBaseLayer(new TileLayer({ source: wmtsLayer.source }));
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
