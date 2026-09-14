import { useEffect, useRef, useState } from "react";
import { MapView } from "./Map";

type Asset = { id: string; name: string; category: string };
type SourceState = { label: string; detail: string; status: "live" | "fallback" | "error"; updated: string };
type Props = { assets: Asset[]; selectedId: string | null; onSources: (sources: SourceState[]) => void; refreshKey: number };
type Feature = { id: number; type: "node" | "way"; tags?: Record<string, string>; lat?: number; lon?: number; center?: { lat: number; lon: number }; geometry?: { lat: number; lon: number }[] };

const overpassUrl = "https://overpass-api.de/api/interpreter";
const earthquakeUrl = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=6&maxlatitude=37&minlongitude=68&maxlongitude=97&orderby=time&limit=50";
const populationUrl = "https://api.worldbank.org/v2/country/IND/indicator/SP.POP.TOTL?format=json&per_page=5";
const query = `[out:json][timeout:25];(nwr[amenity=hospital](12.80,77.45,13.15,77.75);way[highway~"primary|secondary|tertiary"](12.80,77.45,13.15,77.75););out center geom;`;

export function RealGisMap({ assets, selectedId, onSources, refreshKey }: Props) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [quakes, setQuakes] = useState<{ lat: number; lon: number; magnitude: number; title: string }[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlays = useRef<Array<{ setMap?: (map: google.maps.Map | null) => void }>>([]);

  useEffect(() => {
    let cancelled = false;
    const updated = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    Promise.allSettled([
      fetch(`${overpassUrl}?data=${encodeURIComponent(query)}`).then((response) => response.ok ? response.json() : Promise.reject(new Error("OSM unavailable"))),
      fetch(earthquakeUrl).then((response) => response.ok ? response.json() : Promise.reject(new Error("USGS unavailable"))),
      fetch(populationUrl).then((response) => response.ok ? response.json() : Promise.reject(new Error("World Bank unavailable"))),
    ]).then(([osmResult, quakeResult, populationResult]) => {
      if (cancelled) return;
      const osm = osmResult.status === "fulfilled" ? osmResult.value : null;
      const quake = quakeResult.status === "fulfilled" ? quakeResult.value : null;
      const population = populationResult.status === "fulfilled" ? populationResult.value : null;
      if (osm) setFeatures(osm.elements ?? []);
      if (quake) setQuakes((quake.features ?? []).map((feature: { geometry: { coordinates: [number, number, number] }; properties: { mag: number; place: string } }) => ({ lat: feature.geometry.coordinates[1], lon: feature.geometry.coordinates[0], magnitude: feature.properties.mag, title: feature.properties.place })));
      onSources([
        { label: "Hazard feeds", detail: quake ? `USGS earthquakes · India bbox · ${quake.features?.length ?? 0} events` : "USGS earthquake feed", status: quake ? "live" : "fallback", updated },
        { label: "Hospital facilities", detail: osm ? `OpenStreetMap facilities · Bengaluru bbox · ${(osm.elements ?? []).filter((item: Feature) => item.tags?.amenity === "hospital").length} mapped` : "OpenStreetMap hospital geometry", status: osm ? "live" : "fallback", updated },
        { label: "Population baseline", detail: population?.[1]?.[0]?.value ? `World Bank India population · ${Number(population[1][0].value).toLocaleString()} latest official estimate` : "World Bank India population indicator", status: population ? "live" : "fallback", updated },
      ]);
    });
    return () => { cancelled = true; };
  }, [onSources, refreshKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;
    overlays.current.forEach((overlay) => overlay.setMap?.(null));
    overlays.current = [];
    const g = window.google;
    const markerCtor = (g.maps as unknown as { marker?: { AdvancedMarkerElement: new (options: object) => { setMap?: (value: google.maps.Map | null) => void } } }).marker?.AdvancedMarkerElement;
    const addMarker = (position: google.maps.LatLngLiteral, title: string, color: string) => {
      if (!markerCtor) return;
      const marker = new markerCtor({ map, position, title, content: Object.assign(document.createElement("div"), { className: "gis-marker", style: `--marker-color:${color}`, title }) });
      overlays.current.push(marker);
    };
    features.forEach((feature) => {
      const position = feature.lat && feature.lon ? { lat: feature.lat, lng: feature.lon } : feature.center ? { lat: feature.center.lat, lng: feature.center.lon } : null;
      if (position && feature.tags?.amenity === "hospital") addMarker(position, feature.tags.name ?? "OSM hospital", "#b58cff");
      if (feature.type === "way" && feature.geometry?.length) {
        const line = new g.maps.Polyline({ map, path: feature.geometry.map((point) => ({ lat: point.lat, lng: point.lon })), strokeColor: "#72b8ff", strokeOpacity: .42, strokeWeight: 2 });
        overlays.current.push(line);
      }
    });
    quakes.forEach((quake) => addMarker({ lat: quake.lat, lng: quake.lon }, `${quake.magnitude.toFixed(1)}M · ${quake.title}`, "#ff5c68"));
    if (selectedId) map.setZoom(11);
    void assets;
  }, [assets, features, quakes, selectedId]);

  return <div className="real-gis-map"><MapView className="real-gis-canvas" initialCenter={{ lat: 12.9716, lng: 77.5946 }} initialZoom={11} onMapReady={(map) => { mapRef.current = map; }} /><div className="gis-badge">REAL GIS · BENGALURU <span>OSM ROADS + HOSPITALS · USGS HAZARDS</span></div><div className="gis-legend"><span><i className="gis-key road" />Road geometry</span><span><i className="gis-key hospital" />Hospitals</span><span><i className="gis-key hazard" />Hazards</span></div></div>;
}
