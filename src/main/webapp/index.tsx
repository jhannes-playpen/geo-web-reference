import * as React from "react";
import {
  MutableRefObject,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import * as ReactDOM from "react-dom/client";
import { Map, View } from "ol";
import { WMTS } from "ol/source";
import TileLayer from "ol/layer/Tile";
import { optionsFromCapabilities } from "ol/source/WMTS";
import { GeoJSON, WMTSCapabilities } from "ol/format";
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { transform } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";
import { Select } from "ol/interaction";
import { click } from "ol/events/condition";

import "ol/ol.css";
import { Popup } from "./components/popup";

proj4.defs([
  [
    "urn:ogc:def:crs:EPSG::32633",
    "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs +type=crs",
  ],
  ["EPSG:32633", "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs +type=crs"],
]);
register(proj4);

const app = ReactDOM.createRoot(document.getElementById("app")!);

function MapComponent({
  setCountry,
  setPopupLocation,
  children,
}: {
  setCountry(country?: string): void;
  setPopupLocation(loc?: { x: number; y: number }): void;
  children: ReactNode;
}) {
  const [politidistriktLayer] = useState(
    () =>
      new VectorLayer({
        style: new Style({
          stroke: new Stroke({
            color: "#2f2926",
            width: 3,
          }),
        }),
      })
  );
  const [map, setMap] = useState<Map | undefined>();
  const mapRef = useRef<HTMLDivElement>() as MutableRefObject<HTMLDivElement>;
  useEffect(() => {
    (async () => {
      const res = await fetch(
        "https://services.geodataonline.no/arcgis/rest/services/Geocache_UTM33_WGS84/GeocacheBasis/MapServer/WMTS/1.0.0/WMTSCapabilities.xml"
      );
      if (res.ok) {
        const parser = new WMTSCapabilities();
        const options = optionsFromCapabilities(parser.read(await res.text()), {
          layer: "Geocache_UTM33_WGS84_GeocacheBasis",
          matrixSet: "default028mm",
        });
        const lat = 59,
          long = 10;
        let vectorLayer = new VectorLayer({
          source: new VectorSource({
            format: new GeoJSON(),
            url: "https://raw.githubusercontent.com/openlayers/ol3/6838fdd4c94fe80f1a3c98ca92f84cf1454e232a/examples/data/geojson/countries.geojson",
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
        const map = new Map({
          target: mapRef.current,
          layers: [
            new TileLayer({ source: new WMTS(options!), opacity: 1 }),
            vectorLayer,
            politidistriktLayer,
          ],
          view: new View({
            projection: "EPSG:32633",
            center: transform([long, lat], "EPSG:4326", "EPSG:32633"),
            zoom: 7,
          }),
        });
        const select = new Select({
          condition: click,
          layers: [vectorLayer],
        });
        //map.addInteraction(select);
        map.on("click", (e) => {
          const pixel = map.getEventPixel(e.originalEvent);

          const coordinate = transform(
            e.coordinate,
            map.getView().getProjection(),
            "EPSG:4326"
          );
          const features = politidistriktLayer
            .getSource()!
            .getFeaturesAtCoordinate(e.coordinate);
          console.log(features);

          if (features.length > 0) {
            const feature = features[0];
            const { offsetX, offsetY } = e.originalEvent;
            const [x, y] = [offsetX, offsetY];
            console.log({ x, y, e: e.originalEvent });
            setCountry(feature.getProperties().navn);
            setPopupLocation({ x, y });
          } else {
            console.log(e.coordinate);
            setPopupLocation();
            setCountry(undefined);
          }
        });
        map.on("pointermove", (e) => {
          const pixel = map.getEventPixel(e.originalEvent);
          map.forEachFeatureAtPixel(pixel, (feature) => {
            //setCountry(feature.getProperties().name);
          });
        });
      }
    })();

    return;
  }, [map]);
  useEffect(() => {
    (async () => {
      const res = await fetch("/geojson/politidistrikter.json");
      if (res.ok) {
        politidistriktLayer.setSource(
          new VectorSource({
            features: new GeoJSON().readFeatures(await res.text(), {
              dataProjection: "EPSG:4326",
              featureProjection: "EPSG:32633",
            }),
          })
        );
      }
    })();
    return undefined;
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        height: 800,
        width: 800,
      }}
    >
      {children}
    </div>
  );
}

function Application() {
  const [country, setCountry] = useState<string | undefined>();
  const [popupLocation, setPopupLocation] = useState<
    { x: number; y: number } | undefined
  >();
  return (
    <>
      <h1>Hello There {country}</h1>
      <div style={{ position: "relative" }}>
        <MapComponent
          setCountry={setCountry}
          setPopupLocation={setPopupLocation}
        >
          {popupLocation && (
            <Popup popupLocation={popupLocation} country={country} />
          )}
        </MapComponent>
      </div>
    </>
  );
}

app.render(<Application />);
