import * as React from "react";
import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { Map, MapBrowserEvent, Overlay, View } from "ol";
import { OSM } from "ol/source";
import TileLayer from "ol/layer/Tile";
import { Layer } from "ol/layer";
import { useGeographic } from "ol/proj";
import proj4 from "proj4";

import "ol/ol.css";
import { register } from "ol/proj/proj4";
import {
  countryLayer,
  geodataWmtsLayer,
  loadWmtsLayer,
  politidistriktLayer,
} from "./layers";

useGeographic();
proj4.defs([
  [
    "urn:ogc:def:crs:EPSG::32633",
    "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs +type=crs",
  ],
]);
register(proj4);

export function MapView() {
  const map = useMemo(() => new Map(), []);
  const [baseLayer, setBaseLayer] = useState<Layer>(
    () => new TileLayer({ source: new OSM() })
  );
  const [selectedPolitidistrikt, setSelectedPolitidistrikt] = useState<
    string | undefined
  >();

  const layers = useMemo(
    () => [baseLayer, countryLayer, politidistriktLayer],
    [baseLayer]
  );
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
  useEffect(() => map.setLayers(layers), [layers]);
  useEffect(() => map.setView(view), [view]);

  const mapRef = useRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>;
  const overlayRef =
    useRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>;

  function handleMoveEnd() {
    const viewport = {
      center: view.getCenter(),
      zoom: view.getZoom(),
    };
    localStorage.setItem("viewport", JSON.stringify(viewport));
    sessionStorage.setItem("viewport", JSON.stringify(viewport));
    setFollowMe(false);
  }

  const overlay = useMemo(() => {
    return new Overlay({
      element: overlayRef.current,
    });
  }, [overlayRef.current]);
  useEffect(() => {
    if (!overlay.getElement()) {
      return () => {};
    }
    map.addOverlay(overlay);
    return () => map.removeOverlay(overlay);
  }, [overlay]);

  function handlePolitidistriktClick(e: MapBrowserEvent<MouseEvent>) {
    const features = politidistriktLayer
      .getSource()!
      .getFeaturesAtCoordinate(e.coordinate);
    if (features.length > 0) {
      setSelectedPolitidistrikt(features[0].getProperties().navn);
      overlay.setPosition(e.coordinate);
    } else {
      setSelectedPolitidistrikt(undefined);
      overlay.setPosition(undefined);
    }
  }

  useEffect(() => {
    if (!mapRef.current || !overlayRef.current) {
      return;
    }
    map.setTarget(mapRef.current);
    map.on("moveend", handleMoveEnd);
    map.on("click", handlePolitidistriktClick);
    return () => {
      map.setTarget(undefined);
      map.un("moveend", handleMoveEnd);
      map.un("click", handlePolitidistriktClick);
    };
  }, [mapRef.current, overlayRef.current]);

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
      <div className={"map"} ref={mapRef} />
      <div ref={overlayRef}>
        {selectedPolitidistrikt && <div>HEIHEI: {selectedPolitidistrikt}</div>}
      </div>
    </main>
  );
}
