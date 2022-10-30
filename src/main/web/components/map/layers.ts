import { GeoJSON, WMTSCapabilities } from "ol/format";
import { optionsFromCapabilities } from "ol/source/WMTS";
import { WMTS } from "ol/source";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Stroke, Style } from "ol/style";

interface WmtsLayerDefinition {
  url: string;
  layer: string;
  matrixSet: string;
}

export async function loadWmtsLayer({
  url,
  layer,
  matrixSet,
}: WmtsLayerDefinition) {
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

export const geodataWmtsLayer = {
  url: "https://services.geodataonline.no/arcgis/rest/services/Geocache_UTM33_WGS84/GeocacheBasis/MapServer/WMTS/1.0.0/WMTSCapabilities.xml",
  layer: "Geocache_UTM33_WGS84_GeocacheBasis",
  matrixSet: "default028mm",
};
const geodataPhotoLayer = {
  url: "https://services.geodataonline.no/arcgis/rest/services/Geocache_UTM33_WGS84/GeocacheBilder/MapServer/WMTS/1.0.0/WMTSCapabilities.xml",
  layer: "Geocache_UTM33_WGS84_GeocacheBilder",
  matrixSet: "default028mm",
};
export const countryLayer = new VectorLayer({
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

export const politidistriktLayer = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: "/geojson/politidistrikter.geojson",
  }),
  style: new Style({
    stroke: new Stroke({
      color: "#2f2926",
      width: 3,
    }),
  }),
});
export const populatedLayer = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: "/geojson/cities.geojson",
  }),
});
