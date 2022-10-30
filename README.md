# Reference project for hypothetical GIS web classroom course

## Goals

* [ ] Display OSM and custom WMTS map layers on OpenLayers map
* [ ] Import GeoJSON layer from public source and display regional boundaries
* [ ] Interact with vector objects on the map
* [ ] Display "resources" dots from separate source on map (wfs layers)
* [ ] Add "incident" dots on map through UI (e.g. "delivery order")
* [ ] Interact with "incidents"
* [ ] Add "point-of-interest" per "incident" (e.g. "pickup", e.g. "drop-off")
* [ ] Show and hide layers on demand

## Advanced features

* [ ] Use web sockets and offline storage to interact with "resources", "incidents" and "points-of-interest"
* [ ] Use offline storage to cache WMTS layers
* [ ] Multiple projections (one per WMTS layer)


## Plan of attack

1. Create Maven project
2. Add jetty
3. Create npm project
4. Add parcel + react + openlayers
5. Add jetty autoloader
6. Show openlayers map with OSM
7. Add WMTS layer from Norwegian source
8. Import geojson layer and serve from Jetty
9. Overlay when geojson layer clicked
10. Info-display when overlay is clicked
11. Clickaway overlay on other interaction

## TODO: Experiment with overlays
