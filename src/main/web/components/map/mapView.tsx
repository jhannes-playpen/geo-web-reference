import * as React from "react";
import {
  MutableRefObject,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Feature, Map, MapBrowserEvent, Overlay, View } from "ol";
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
  populatedLayer,
} from "./layers";
import { Point, Polygon } from "ol/geom";
import { buffer } from "ol/extent";
import { FloatingActionButton, Incident } from "../fab";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Style } from "ol/style";
import CircleStyle from "ol/style/Circle";

useGeographic();
proj4.defs([
  [
    "urn:ogc:def:crs:EPSG::32633",
    "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs +type=crs",
  ],
]);
register(proj4);

function MapPopup({ children }: { children: ReactNode }) {
  return <div className={"map-popup"}>{children}</div>;
}

type PolitidistriktFeature = Feature<Polygon>;

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState();
  return [value, setValue];
}

function useIncidents() {
  return useLocalStorage<Incident[]>("incidents", []);
}

export function MapView() {
  const map = useMemo(() => new Map(), []);
  const [baseLayer, setBaseLayer] = useState<Layer>(
    () => new TileLayer({ source: new OSM() })
  );
  const [selectedPolitidistrikt, setSelectedPolitidistrikt] = useState<
    PolitidistriktFeature | undefined
  >();
  const [selectedCity, setSelectedCity] = useState<
    Feature<Point & unknown> | undefined
  >();
  const incidents = JSON.parse(
    localStorage.getItem("incidents") || "[]"
  ) as Incident[];
  const incidentLayer = useMemo(
    () =>
      new VectorLayer({
        source: new VectorSource({
          features: incidents.map(
            (f) =>
              new Feature({
                geometry: new Point(f.position),
                label: f.label,
              })
          ),
        }),
        style: new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: "red" }),
          }),
        }),
      }),
    []
  );

  const layers = useMemo(
    () => [
      baseLayer,
      countryLayer,
      politidistriktLayer,
      populatedLayer,
      incidentLayer,
    ],
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
  const cityOverlayRef =
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
  const cityOverlay = useMemo(() => {
    return new Overlay({
      element: cityOverlayRef.current,
    });
  }, [cityOverlayRef.current]);
  useEffect(() => {
    if (!cityOverlay.getElement()) {
      return () => {};
    }
    map.addOverlay(cityOverlay);
    return () => map.removeOverlay(cityOverlay);
  }, [cityOverlay]);

  function handlePolitidistriktClick(e: MapBrowserEvent<MouseEvent>) {
    const features = politidistriktLayer
      .getSource()!
      .getFeaturesAtCoordinate(e.coordinate);
    if (features.length > 0) {
      setSelectedPolitidistrikt(features[0] as PolitidistriktFeature);
      overlay.setPosition(e.coordinate);
    } else {
      setSelectedPolitidistrikt(undefined);
      overlay.setPosition(undefined);
    }
  }

  function handleCityClick(e: MapBrowserEvent<MouseEvent>) {
    const { coordinate } = e;
    const extent = buffer([...coordinate, ...coordinate], 0.2);
    const features = populatedLayer.getSource()!.getFeaturesInExtent(extent);
    if (features.length > 0) {
      setSelectedCity(features[0] as Feature<Point>);
      cityOverlay.setPosition(e.coordinate);
      e.stopPropagation();
    } else {
      setSelectedCity(undefined);
      overlay.setPosition(undefined);
    }
  }

  useEffect(() => {
    if (!mapRef.current || !overlayRef.current) {
      return;
    }
    map.setTarget(mapRef.current);
    map.on("moveend", handleMoveEnd);
    map.on("click", handleCityClick);
    map.on("click", handlePolitidistriktClick);
    return () => {
      map.setTarget(undefined);
      map.un("moveend", handleMoveEnd);
      map.un("click", handlePolitidistriktClick);
      map.un("click", handleCityClick);
    };
  }, [mapRef.current, overlayRef.current]);

  return (
    <>
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
        <div className={"map"} ref={mapRef}>
          <FloatingActionButton map={map} />
        </div>
      </main>
      <aside>
        {selectedPolitidistrikt && (
          <div>{selectedPolitidistrikt.getProperties().navn}</div>
        )}
      </aside>
      <div ref={overlayRef}>
        {selectedPolitidistrikt && (
          <MapPopup>{selectedPolitidistrikt.getProperties().navn}</MapPopup>
        )}
      </div>
      <div ref={cityOverlayRef}>
        {selectedCity && (
          <MapPopup>{JSON.stringify(selectedCity.getProperties())}</MapPopup>
        )}
      </div>
    </>
  );
}
