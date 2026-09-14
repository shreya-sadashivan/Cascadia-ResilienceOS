import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, BarChart3, Bell,
  CheckCircle2, ChevronDown, ChevronRight, CircleDot, Clock3, Crosshair,
  Download, Info, Layers3, MapPin, Network, Play, Plus, RotateCcw, Search,
  Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Target, Zap,
} from "lucide-react";
import { DependencyInspector } from "@/components/DependencyInspector";
import { LiveDataPanel } from "@/components/LiveDataPanel";

type Category = "POWER" | "WATER" | "TRANSPORT" | "HEALTHCARE" | "COMMUNICATIONS" | "EMERGENCY" | "POPULATION";
type Status = "operational" | "degraded" | "overloaded" | "failed" | "recovering";
type Hazard = "BASELINE" | "URBAN FLOOD" | "EXTREME HEAT" | "EARTHQUAKE" | "POWER FAILURE" | "TELECOMMUNICATION OUTAGE";
type Node = {
  id: string; name: string; category: Category; district: string; x: number; y: number;
  capacity: number; utilization: number; population: number; criticalServices: number;
  redundancy: number; recoveryHours: number; detail: string;
};
type Edge = { source: string; target: string; kind: "dependency" | "transport"; capacity: number; utilization: number; travelTime: number; alternateRoutes: number; emergencyPriority?: boolean };
type Scenario = {
  statusById: Record<string, Status>; failedIds: string[]; degradedIds: string[]; overloadedIds: string[];
  populationExposed: number; hospitalsOverloaded: number; degradedRoads: number; emergencyResponse: number;
  fireResponse: number; coverage: number; resilience: number; connectivity: number; recoveryHours: number; averageTravelTime: number;
  criticality: { node: Node; score: number; downstream: number; exposure: number }[];
  bottlenecks: { edge: Edge; score: number; impact: number; label: string; affectedPopulation: number; effectiveUtilization: number }[];
  affectedCount: number; waveCount: number;
};
type SourceState = { label: string; detail: string; status: "live" | "fallback" | "error"; updated: string };

const districts = ["NORTH", "CENTRAL", "EAST", "WEST", "SOUTH", "INDUSTRIAL"];
type RawNode = [string, string, Category, string, number, number, number, number, number, number, number, number, string];
const rawNodes: RawNode[] = [
  // Power layer
  ["substation-central", "Central Substation", "POWER", "CENTRAL", 398, 174, 450, 78, 0, 5, 2, 36, "450 MW high-voltage hub serving central healthcare and emergency services."],
  ["substation-east", "East Substation", "POWER", "EAST", 615, 155, 260, 71, 0, 3, 1, 30, "East district distribution substation with solar support."],
  ["substation-west", "West Substation", "POWER", "WEST", 155, 206, 210, 74, 0, 2, 1, 30, "West district medium-voltage substation."],
  ["substation-north", "North Substation", "POWER", "NORTH", 300, 70, 180, 64, 0, 2, 1, 24, "North district distribution substation."],
  ["solar", "Solar Generation Facility", "POWER", "EAST", 705, 75, 160, 58, 0, 1, 1, 18, "Synthetic solar generation feeding the east grid."],
  ["generator", "Backup Generator Facility", "POWER", "INDUSTRIAL", 506, 363, 120, 32, 0, 2, 2, 12, "Mobile and stationary backup generation reserve."],
  // Water layer
  ["intake", "Raw Water Intake", "WATER", "NORTH", 72, 68, 620, 69, 0, 2, 1, 30, "Raw water source at the northern boundary."],
  ["treatment", "Central Water Treatment", "WATER", "NORTH", 170, 88, 520, 77, 0, 2, 3, 34, "Treatment plant supplying the city reservoirs."],
  ["reservoir-central", "Central Reservoir", "WATER", "CENTRAL", 334, 126, 310, 73, 0, 2, 2, 24, "Primary central storage reservoir."],
  ["reservoir-east", "East Reservoir", "WATER", "EAST", 590, 98, 220, 61, 0, 2, 1, 22, "Redundant east storage reservoir."],
  ["reservoir-west", "West Reservoir", "WATER", "WEST", 92, 182, 190, 68, 0, 1, 1, 20, "West district storage reservoir."],
  ["pump-a", "Pumping Station A", "WATER", "CENTRAL", 268, 222, 180, 72, 0, 1, 1, 18, "Central pumping station."],
  ["pump-b", "Pumping Station B", "WATER", "SOUTH", 632, 302, 140, 66, 0, 1, 1, 18, "South district pumping station."],
  ["distribution", "City Distribution Network", "WATER", "CENTRAL", 410, 260, 780, 76, 720000, 1, 4, 30, "Distribution network serving residential and critical users."],
  // Transport layer
  ["highway", "National Highway Corridor", "TRANSPORT", "NORTH", 222, 42, 100, 66, 0, 3, 2, 26, "Primary north-south arterial with national freight priority."],
  ["ring-road", "Ring Road", "TRANSPORT", "CENTRAL", 410, 105, 120, 68, 0, 4, 2, 28, "Inner ring road with four alternate segments."],
  ["central-arterial", "Central Arterial", "TRANSPORT", "CENTRAL", 424, 218, 85, 78, 0, 2, 2, 20, "Central arterial connecting healthcare and civic services."],
  ["east-west", "East-West Corridor", "TRANSPORT", "CENTRAL", 520, 245, 90, 73, 0, 2, 2, 22, "East-west corridor with emergency priority."],
  ["north-south", "North-South Corridor", "TRANSPORT", "NORTH", 285, 150, 90, 67, 0, 2, 2, 20, "North-south secondary arterial."],
  ["bridge", "River Bridge 01", "TRANSPORT", "CENTRAL", 475, 202, 70, 82, 0, 1, 2, 34, "Critical river crossing linking east and west districts."],
  ["bridge-2", "River Bridge 02", "TRANSPORT", "SOUTH", 545, 337, 55, 61, 0, 1, 1, 28, "Secondary river crossing with limited capacity."],
  ["flyover", "Central Flyover", "TRANSPORT", "CENTRAL", 349, 190, 65, 75, 0, 2, 2, 24, "Grade-separated junction near central hospital cluster."],
  ["rail", "Rail Junction", "TRANSPORT", "INDUSTRIAL", 615, 390, 75, 62, 0, 2, 1, 32, "Freight and commuter rail junction."],
  ["metro", "Metro Interchange", "TRANSPORT", "CENTRAL", 455, 310, 90, 59, 0, 2, 2, 20, "Metro interchange and evacuation access point."],
  ["bus-depot", "Central Bus Depot", "TRANSPORT", "WEST", 188, 320, 65, 70, 0, 2, 1, 18, "Public bus staging and emergency fleet reserve."],
  // Healthcare
  ["hospital-a", "Hospital A — Central Government", "HEALTHCARE", "CENTRAL", 362, 244, 850, 78, 320000, 2, 5, 42, "850 beds · high emergency capacity · central government facility."],
  ["hospital-b", "Hospital B — District Hospital", "HEALTHCARE", "WEST", 188, 250, 420, 84, 180000, 1, 3, 36, "420 beds · district referral hospital."],
  ["hospital-c", "Hospital C — Trauma Centre", "HEALTHCARE", "EAST", 606, 228, 350, 91, 240000, 1, 3, 40, "350 beds · trauma and emergency surge facility."],
  ["hospital-d", "Hospital D — Private Hospital", "HEALTHCARE", "NORTH", 278, 112, 280, 62, 120000, 2, 2, 30, "280 beds · private tertiary facility."],
  ["hospital-e", "Hospital E — Community Health", "HEALTHCARE", "SOUTH", 603, 362, 140, 66, 95000, 1, 1, 22, "140 beds · community health centre."],
  // Communications
  ["tower-a", "Telecom Tower A", "COMMUNICATIONS", "CENTRAL", 385, 75, 100, 63, 0, 2, 1, 20, "Central telecom tower."],
  ["tower-b", "Telecom Tower B", "COMMUNICATIONS", "EAST", 700, 220, 100, 68, 0, 2, 1, 20, "East telecom tower."],
  ["tower-c", "Telecom Tower C", "COMMUNICATIONS", "WEST", 82, 275, 100, 58, 0, 2, 1, 20, "West telecom tower."],
  ["datacentre", "Civic Data Centre", "COMMUNICATIONS", "INDUSTRIAL", 530, 405, 100, 71, 0, 2, 2, 28, "Synthetic municipal data centre."],
  ["comms-hub", "Emergency Communication Hub", "COMMUNICATIONS", "CENTRAL", 470, 135, 100, 66, 0, 2, 3, 26, "Emergency communications coordination hub."],
  // Emergency
  ["eoc", "Central Emergency Operations Centre", "EMERGENCY", "CENTRAL", 430, 145, 100, 70, 0, 2, 5, 32, "City emergency operations and incident coordination."],
  ["fire-a", "Fire Station A", "EMERGENCY", "CENTRAL", 320, 300, 12, 76, 160000, 2, 2, 18, "Central fire response station."],
  ["fire-b", "Fire Station B", "EMERGENCY", "EAST", 690, 285, 10, 64, 130000, 2, 1, 18, "East fire response station."],
  ["fire-c", "Fire Station C", "EMERGENCY", "WEST", 105, 370, 10, 61, 100000, 2, 1, 18, "West fire response station."],
  ["ambulance-a", "Ambulance Station A", "EMERGENCY", "CENTRAL", 375, 350, 14, 74, 250000, 2, 2, 14, "Central ambulance staging."],
  ["ambulance-b", "Ambulance Station B", "EMERGENCY", "SOUTH", 690, 390, 10, 59, 150000, 2, 1, 14, "South ambulance staging."],
  ["police", "Police Control Centre", "EMERGENCY", "WEST", 140, 130, 100, 67, 0, 2, 2, 24, "Police control and dispatch centre."],
  // Population zones
  ["zone-a", "Zone A · Central", "POPULATION", "CENTRAL", 390, 205, 180000, 73, 180000, 1, 2, 0, "Central population/service zone."],
  ["zone-b", "Zone B · North", "POPULATION", "NORTH", 230, 95, 240000, 69, 240000, 1, 2, 0, "North population/service zone."],
  ["zone-c", "Zone C · East", "POPULATION", "EAST", 655, 190, 310000, 75, 310000, 1, 2, 0, "East population/service zone."],
  ["zone-d", "Zone D · West", "POPULATION", "WEST", 120, 255, 150000, 64, 150000, 1, 2, 0, "West population/service zone."],
  ["zone-e", "Zone E · South", "POPULATION", "SOUTH", 570, 382, 280000, 67, 280000, 1, 2, 0, "South population/service zone."],
  ["zone-f", "Zone F · Industrial", "POPULATION", "INDUSTRIAL", 565, 345, 95000, 58, 95000, 1, 2, 0, "Industrial population/service zone."],
];
const nodes: Node[] = rawNodes.map(([id, name, category, district, x, y, capacity, utilization, population, criticalServices, redundancy, recoveryHours, detail]) => ({ id, name, category, district, x, y, capacity, utilization, population, criticalServices, redundancy, recoveryHours, detail }));

const idSet = new Set(nodes.map((n) => n.id));
const edges: Edge[] = [
  ["substation-central", "hospital-a"], ["substation-east", "hospital-c"], ["substation-west", "treatment"], ["substation-north", "eoc"], ["solar", "substation-east"], ["generator", "hospital-a"], ["substation-central", "pump-a"], ["substation-east", "pump-b"], ["substation-central", "comms-hub"], ["substation-central", "tower-a"], ["substation-east", "tower-b"], ["substation-west", "tower-c"], ["substation-central", "datacentre"],
  ["intake", "treatment"], ["treatment", "reservoir-central"], ["treatment", "reservoir-east"], ["reservoir-central", "distribution"], ["reservoir-east", "distribution"], ["reservoir-west", "distribution"], ["pump-a", "distribution"], ["pump-b", "distribution"], ["distribution", "hospital-a"], ["distribution", "hospital-b"], ["distribution", "hospital-c"], ["distribution", "hospital-d"], ["distribution", "fire-a"], ["distribution", "fire-b"], ["distribution", "fire-c"],
  ["highway", "ring-road"], ["ring-road", "central-arterial"], ["ring-road", "east-west"], ["north-south", "central-arterial"], ["central-arterial", "bridge"], ["east-west", "bridge"], ["bridge", "hospital-a"], ["bridge", "hospital-c"], ["bridge", "ambulance-a"], ["bridge", "fire-b"], ["flyover", "central-arterial"], ["central-arterial", "hospital-a"], ["east-west", "hospital-c"], ["bridge-2", "hospital-e"], ["metro", "hospital-a"], ["bus-depot", "ambulance-a"], ["rail", "industrial-zone"], ["north-south", "hospital-d"],
  ["tower-a", "comms-hub"], ["tower-b", "comms-hub"], ["tower-c", "comms-hub"], ["comms-hub", "eoc"], ["comms-hub", "ambulance-a"], ["comms-hub", "ambulance-b"], ["datacentre", "eoc"],
  ["eoc", "fire-a"], ["eoc", "fire-b"], ["eoc", "fire-c"], ["eoc", "police"], ["eoc", "ambulance-a"], ["eoc", "ambulance-b"], ["hospital-a", "zone-a"], ["hospital-b", "zone-d"], ["hospital-c", "zone-c"], ["hospital-d", "zone-b"], ["hospital-e", "zone-e"], ["fire-a", "zone-a"], ["fire-b", "zone-c"], ["fire-c", "zone-d"], ["ambulance-a", "zone-a"], ["ambulance-b", "zone-e"],
].map(([source, target], index) => ({ source, target, kind: index >= 29 && index <= 47 ? "transport" : "dependency", capacity: index >= 29 && index <= 47 ? 100 : 1, utilization: index >= 29 && index <= 47 ? 58 + (index % 5) * 7 : 0, travelTime: index >= 29 && index <= 47 ? 8 + (index % 4) * 2 : 0, alternateRoutes: index >= 29 && index <= 47 ? Math.max(0, 3 - (index % 4)) : 0, emergencyPriority: index >= 35 && index <= 45 }));
// The rail endpoint is intentionally represented as a synthetic industrial destination for the transport layer.
if (!idSet.has("industrial-zone")) edges.splice(edges.findIndex((e) => e.target === "industrial-zone"), 1);

const hazards: { value: Hazard; label: string }[] = [
  { value: "BASELINE", label: "Baseline network" },
  { value: "URBAN FLOOD", label: "Urban flood" },
  { value: "EXTREME HEAT", label: "Extreme heat" },
  { value: "EARTHQUAKE", label: "Earthquake" },
  { value: "POWER FAILURE", label: "Power failure" },
  { value: "TELECOMMUNICATION OUTAGE", label: "Telecommunication outage" },
];

const palette: Record<Status, string> = { operational: "#43d49b", degraded: "#f2a65a", overloaded: "#b58cff", failed: "#ff5c68", recovering: "#72b8ff" };
const categoryLabel: Record<Category, string> = { POWER: "POWER", WATER: "WATER", TRANSPORT: "TRANSPORT", HEALTHCARE: "HEALTHCARE", COMMUNICATIONS: "COMMS", EMERGENCY: "EMERGENCY", POPULATION: "POPULATION" };
const statusLabel: Record<Status, string> = { operational: "OPERATIONAL", degraded: "DEGRADED", overloaded: "OVERLOADED", failed: "FAILED", recovering: "RECOVERING" };

const API = import.meta.env.VITE_API_URL || "";
const backendIdByUiId: Record<string, string> = {
  "substation-central": "power_central", "substation-east": "power_east", "substation-west": "power_west", "substation-north": "power_north",
  solar: "solar", generator: "backup_gen", intake: "water_intake", treatment: "water_treatment",
  "reservoir-central": "reservoir_central", "reservoir-east": "reservoir_east", "reservoir-west": "reservoir_west",
  "pump-a": "pump_a", "pump-b": "pump_b", distribution: "water_treatment", highway: "north_corridor",
  "ring-road": "ring_road", "central-arterial": "ring_road", "east-west": "east_corridor", "north-south": "north_corridor",
  bridge: "river_bridge", "bridge-2": "bridge_02", flyover: "flyover", rail: "rail_junction", metro: "metro_interchange", "bus-depot": "bus_depot",
  "hospital-a": "hospital_a", "hospital-b": "hospital_b", "hospital-c": "hospital_c", "hospital-d": "hospital_d", "hospital-e": "hospital_e",
  "tower-a": "telecom_a", "tower-b": "telecom_b", "tower-c": "telecom_c", datacentre: "datacentre", "comms-hub": "emergency_comms",
  eoc: "eoc", "fire-a": "fire_a", "fire-b": "fire_b", "fire-c": "fire_c", "ambulance-a": "ambulance_a", "ambulance-b": "ambulance_b", police: "police_control",
  "zone-a": "zone_central", "zone-b": "zone_north", "zone-c": "zone_east", "zone-d": "zone_west", "zone-e": "zone_south", "zone-f": "zone_industrial",
};
// Several UI nodes intentionally collapse onto a single coarser backend asset (e.g. both
// "ring-road" and "central-arterial" represent the backend's single "ring_road" asset). Keep the
// full list of UI ids for each backend id so a backend-side status change is reflected on every
// corresponding UI node, not just one of them.
const uiIdsByBackendId: Record<string, string[]> = {};
for (const [uiId, backendId] of Object.entries(backendIdByUiId)) {
  (uiIdsByBackendId[backendId] ??= []).push(uiId);
}
const uiIdByBackendId = (backendId: string): string | undefined => uiIdsByBackendId[backendId]?.[0];
const backendHazardType: Record<Hazard, string | null> = {
  BASELINE: null, "URBAN FLOOD": "urban_flood", "EXTREME HEAT": "extreme_heat", EARTHQUAKE: "earthquake",
  "POWER FAILURE": "power_failure", "TELECOMMUNICATION OUTAGE": "telecom_outage",
};

type BackendSimulationResult = {
  failedAssets: string[]; affectedAssets: string[]; overloadedAssets: string[]; cascadeDepth: number; populationExposed: number;
  criticalServicesAffected: number; resilienceScore: number; recoveryHours: number; emergencyResponseMinutes: number;
  healthcareOverload: number; timeline: Array<{ level: number; assetIds: string[]; label: string; reason: string }>;
  criticality: Array<Record<string, unknown>>; bottlenecks: Array<Record<string, unknown>>; mitigation: Array<Record<string, unknown>>;
};

function backendScenario(result: BackendSimulationResult | null): Scenario {
  if (!result) return emptyScenario();
  const failedIds = result.failedAssets.flatMap(id => uiIdsByBackendId[id] ?? []);
  const overloadedIds = result.overloadedAssets.flatMap(id => uiIdsByBackendId[id] ?? []);
  const affectedIds = result.affectedAssets.flatMap(id => uiIdsByBackendId[id] ?? []);
  const degradedIds = affectedIds.filter(id => !failedIds.includes(id) && !overloadedIds.includes(id));
  const statusById: Record<string, Status> = Object.fromEntries(nodes.map(n => [n.id, "operational"]));
  failedIds.forEach(id => statusById[id] = "failed");
  degradedIds.forEach(id => statusById[id] = "degraded");
  overloadedIds.forEach(id => statusById[id] = "overloaded");
  const criticality = result.criticality.flatMap(item => {
    const ids = uiIdsByBackendId[String(item.id ?? "")] ?? [];
    return ids.map(id => {
      const node = nodes.find(n => n.id === id);
      if (!node) return null;
      return { node, score: Number(item.score ?? 0), downstream: Number(item.downstreamDependencies ?? 0), exposure: Number(item.populationExposure ?? 0) };
    });
  }).filter(Boolean) as Scenario["criticality"];
  const bottlenecks = result.bottlenecks.map(item => {
    const source = uiIdByBackendId(String(item.source ?? ""));
    const target = uiIdByBackendId(String(item.target ?? ""));
    const edge = edges.find(e => e.source === source && e.target === target) ?? edges.find(e => e.source === source);
    if (!edge) return null;
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    const score = Number(item.score ?? 0);
    return { edge, impact: score, score, label: `${sourceNode?.name ?? String(item.source)} → ${targetNode?.name ?? String(item.target)}`, affectedPopulation: targetNode?.population ?? 0, effectiveUtilization: Math.round(edge.utilization + Math.max(0, score - 70) * 0.4) };
  }).filter(Boolean) as Scenario["bottlenecks"];
  const affectedCount = new Set([...failedIds, ...degradedIds, ...overloadedIds]).size;
  const emergencyResponse = Number(result.emergencyResponseMinutes ?? 0);
  const connectivity = Math.max(0, Math.round(100 - failedIds.length / nodes.length * 25 - (degradedIds.length + overloadedIds.length) / nodes.length * 12));
  const hospitalsOverloaded = overloadedIds.filter(id => nodes.find(n => n.id === id)?.category === "HEALTHCARE").length;
  const degradedRoads = [...failedIds, ...degradedIds, ...overloadedIds].filter(id => nodes.find(n => n.id === id)?.category === "TRANSPORT").length;
  const coverage = Math.max(35, Math.round(100 - emergencyResponse * 0.9));
  return {
    statusById, failedIds, degradedIds, overloadedIds, populationExposed: result.populationExposed, hospitalsOverloaded, degradedRoads,
    emergencyResponse, fireResponse: Math.round(emergencyResponse * 0.75 * 10) / 10, coverage, resilience: result.resilienceScore, connectivity,
    recoveryHours: result.recoveryHours, averageTravelTime: emergencyResponse, criticality, bottlenecks, affectedCount, waveCount: Math.max(0, result.cascadeDepth),
  };
}

function scenarioPayload(hazard: Hazard, selectedId: string | null, mitigation?: string) {
  const hazardsPayload = backendHazardType[hazard] ? [{ type: backendHazardType[hazard], severity: 0.8 }] : [];
  const failedAssets = selectedId ? [backendIdByUiId[selectedId] ?? selectedId] : [];
  return { failedAssets, hazards: hazardsPayload, severity: "major", outageHours: 24, ...(mitigation ? { mitigation } : {}) };
}

async function runBackendScenario(hazard: Hazard, selectedId: string | null, mitigation?: string): Promise<BackendSimulationResult> {
  const response = await fetch(`${API}/api/simulate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(scenarioPayload(hazard, selectedId, mitigation)) });
  if (!response.ok) throw new Error(`Simulation request failed (${response.status})`);
  return response.json();
}

// The full cascade-propagation model (hazard failures, capacity redistribution, hospital surge,
// resilience scoring, etc.) lives entirely on the backend — see server/simulation/cascade.ts.
// The frontend only ever needs a placeholder "nothing has happened yet" scenario before the
// first backend result arrives; that placeholder is fully static (no hazard, no failures), so
// it's computed directly here rather than re-implementing the backend's simulation logic.
function emptyScenario(): Scenario {
  const statusById: Record<string, Status> = {};
  nodes.forEach((node) => { statusById[node.id] = "operational"; });

  const transportEdges = edges.filter((edge) => edge.kind === "transport");
  const averageTravelTime = transportEdges.length
    ? Math.round((transportEdges.reduce((sum, edge) => sum + edge.travelTime, 0) / transportEdges.length) * 10) / 10
    : 0;
  const emergencyResponse = Math.round((11 + Math.max(0, averageTravelTime - 12) * 1.5) * 10) / 10;
  const fireResponse = Math.round((8 + Math.max(0, averageTravelTime - 12) * 1.1) * 10) / 10;
  const coverage = Math.max(35, Math.round(96 - emergencyResponse * 0.9));

  const downstreamCount = (id: string) => edges.filter((edge) => edge.source === id).length;
  const criticality = nodes
    .filter((node) => node.category !== "POPULATION")
    .map((node) => ({
      node,
      downstream: downstreamCount(node.id),
      exposure: node.population + downstreamCount(node.id) * 50000,
      score: Math.round(Math.min(99, 36 + node.criticalServices * 6 + (3 - Math.min(3, node.redundancy)) * 7 + downstreamCount(node.id) * 8 + node.population / 100000)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const bottlenecks = transportEdges
    .map((edge) => {
      const source = nodes.find((node) => node.id === edge.source)!;
      const target = nodes.find((node) => node.id === edge.target)!;
      const affectedPopulation = nodes
        .filter((node) => node.category === "POPULATION" && (node.district === target.district || node.district === source.district))
        .reduce((sum, node) => sum + node.population, 0);
      const impact = Math.round((100 - edge.alternateRoutes * 14) + Math.max(0, edge.utilization - 70) * 0.35 + (edge.emergencyPriority ? 15 : 0));
      return {
        edge, impact, score: Math.min(99, impact),
        label: `${source.name} → ${target.name}`,
        affectedPopulation,
        effectiveUtilization: Math.round(edge.utilization),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return {
    statusById, failedIds: [], degradedIds: [], overloadedIds: [],
    populationExposed: 0, hospitalsOverloaded: 0, degradedRoads: 0,
    emergencyResponse, fireResponse, coverage, resilience: 100, connectivity: 100,
    recoveryHours: 0, averageTravelTime, criticality, bottlenecks,
    affectedCount: 0, waveCount: 0,
  };
}

function BrandMark() { return <div className="brand-mark" aria-hidden="true"><svg viewBox="0 0 38 38" fill="none"><path d="M9 11.5 19 6l10 5.5v11L19 28 9 22.5v-11Z" stroke="currentColor" strokeWidth="1.3" /><path d="m9 11.5 10 5.8 10-5.8M19 17.3V28" stroke="currentColor" strokeWidth="1.3" opacity=".8" /><circle cx="9" cy="11.5" r="2.5" fill="#43d49b" /><circle cx="19" cy="6" r="2.5" fill="#72b8ff" /><circle cx="29" cy="11.5" r="2.5" fill="#43d49b" /><circle cx="19" cy="28" r="2.5" fill="#f2a65a" /></svg></div>; }
function MetricBar({ value, color = "cyan" }: { value: number; color?: "cyan" | "green" | "amber" | "red" }) { return <div className="metric-bar" aria-label={`${value}%`}><div className={`metric-fill ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>; }

function NetworkMap({ selectedId, scenario, layer, onSelect }: { selectedId: string | null; scenario: Scenario; layer: Category | "ALL"; onSelect: (id: string) => void }) {
  const selected = nodes.find((node) => node.id === selectedId);
  const visible = (node: Node) => layer === "ALL" || node.category === layer;
  return <div className="network-map" aria-label="Interactive Bengaluru GIS infrastructure network">
    <div className="map-grid" /><div className="map-coordinates top-left">SYNTHETIC URBAN NETWORK — INDIA</div><div className="map-coordinates top-right">DEMONSTRATION DATA · NOT AN OPERATIONAL PREDICTION</div><div className="map-coordinates bottom-left">GIS-READY SCHEMATIC · DISTRICTS: {districts.join(" / ")}</div>
    <div className="map-tools"><button className="icon-button" aria-label="Search network"><Search size={15} /></button><button className="icon-button" aria-label="Center network"><Crosshair size={15} /></button><button className="icon-button" aria-label="Layer settings"><Layers3 size={15} /></button></div>
    <svg className="network-svg" viewBox="0 0 800 440" role="img"><defs><filter id="nodeGlow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter><linearGradient id="linkGradient" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#72b8ff" stopOpacity=".34" /><stop offset="1" stopColor="#43d49b" stopOpacity=".28" /></linearGradient></defs>
      <path d="M22 104H758M22 208H758M22 312H758M186 22V420M382 22V420M578 22V420" stroke="#6b9abb" strokeOpacity=".07" strokeDasharray="2 7" /><path d="M22 286 C170 258 265 315 384 273 S610 246 770 292" fill="none" stroke="#72b8ff" strokeOpacity=".08" strokeWidth="26" /><path d="M22 286 C170 258 265 315 384 273 S610 246 770 292" fill="none" stroke="#72b8ff" strokeOpacity=".19" strokeWidth="1" strokeDasharray="3 8" />
      {edges.map((edge, index) => { const a = nodes.find((n) => n.id === edge.source); const b = nodes.find((n) => n.id === edge.target); if (!a || !b || (!visible(a) && !visible(b))) return null; const impacted = scenario.statusById[edge.source] !== "operational" || scenario.statusById[edge.target] !== "operational"; return <g key={`${edge.source}-${edge.target}`} opacity={layer === "ALL" || visible(a) || visible(b) ? 1 : .2}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`network-link ${impacted ? "cascade-link" : ""}`} strokeWidth={edge.kind === "transport" ? 1.7 : 1} />{impacted && <circle r="2.4" fill={palette[scenario.statusById[edge.source] === "failed" ? "failed" : "degraded"]}><animateMotion dur={`${1.6 + index % 3 * .3}s`} repeatCount="indefinite" path={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} /></circle>}</g>; })}
      {nodes.map((node) => { const isVisible = visible(node); const isSelected = node.id === selectedId; const status = scenario.statusById[node.id]; const showLabel = isSelected || node.criticalServices >= 2 || node.category === "HEALTHCARE" || node.category === "POWER"; return <g key={node.id} className="network-node" opacity={isVisible ? 1 : .17} onClick={() => onSelect(node.id)} tabIndex={0} role="button" aria-label={`Select ${node.name}`} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(node.id); }}><circle cx={node.x} cy={node.y} r={isSelected ? 12 : node.category === "POPULATION" ? 6 : 8} fill="#111b26" stroke={palette[status]} strokeWidth={isSelected ? 2.5 : 1.3} filter={isSelected ? "url(#nodeGlow)" : undefined} />{status !== "operational" && <circle cx={node.x} cy={node.y} r={node.category === "POPULATION" ? 9 : 15} fill="none" stroke={palette[status]} strokeOpacity=".25" strokeDasharray="2 3" />}{showLabel && <><text x={node.x + 13} y={node.y - 4} className="node-name">{node.name.length > 25 ? `${node.name.slice(0, 23)}…` : node.name}</text><text x={node.x + 13} y={node.y + 9} className="node-type">{categoryLabel[node.category]} · {statusLabel[status]}</text></>}</g>; })}
    </svg>
    {selected ? <div className="selected-asset-strip"><div className="selected-pin"><MapPin size={14} /></div><div><span className="eyebrow">ASSET INTELLIGENCE · {selected.district} DISTRICT</span><strong>{selected.name}</strong></div><span className="asset-type">{categoryLabel[selected.category]}</span><div className="strip-spacer" /><span className={`asset-status ${scenario.statusById[selected.id] === "failed" ? "failed" : "operational"}`}><span className="status-dot" />{statusLabel[scenario.statusById[selected.id]]}</span></div> : <div className="network-prompt"><div className="prompt-icon"><Target size={18} /></div><div><strong>Select an asset to trace dependencies and simulate a failure.</strong><p>Model cause-and-effect across the synthetic urban network. Values are estimated model outputs.</p></div><ChevronRight size={16} className="prompt-arrow" /></div>}
    <div className="map-legend"><span><i className="legend-dot green" />Operational</span><span><i className="legend-dot amber" />Degraded</span><span><i className="legend-dot red" />Failed</span><span><i className="legend-line" />Dependency link</span></div>
  </div>;
}

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hazard, setHazard] = useState<Hazard>("BASELINE");
  const [simulated, setSimulated] = useState(false);
  const [intervention, setIntervention] = useState(false);
  const [scenarioNumber, setScenarioNumber] = useState(0);
  const [layer, setLayer] = useState<Category | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState("Overview");
  const [toast, setToast] = useState<string | null>(null);
  const [sourceState, setSourceState] = useState<SourceState[]>([{ label: "Simulation engine", detail: "Backend cascade model", status: "live", updated: "connected" }, { label: "Infrastructure network", detail: "Synthetic Bengaluru urban network", status: "live", updated: "backend" }, { label: "Scenario outputs", detail: "Calculated on request", status: "live", updated: "backend" }]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [backendResult, setBackendResult] = useState<BackendSimulationResult | null>(null);
  const [unmitigatedResult, setUnmitigatedResult] = useState<BackendSimulationResult | null>(null);
  const [baselineResult, setBaselineResult] = useState<BackendSimulationResult | null>(null);
  const [comparisonResults, setComparisonResults] = useState<BackendSimulationResult[]>([]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 2600); };
  const selected = useMemo(() => nodes.find((node) => node.id === selectedId) ?? null, [selectedId]);
  const scenario = useMemo(() => backendScenario(backendResult), [backendResult]);
  const unmitigatedScenario = useMemo(() => backendScenario(unmitigatedResult ?? backendResult), [unmitigatedResult, backendResult]);
  const baseline = useMemo(() => backendScenario(baselineResult), [baselineResult]);
  const comparisons = useMemo(() => {
    const values: Hazard[] = ["BASELINE", "URBAN FLOOD", "EXTREME HEAT", "EARTHQUAKE"];
    return values.map((value, index) => ({ hazard: value, result: backendScenario(index === 0 ? baselineResult : comparisonResults[index - 1] ?? null) }));
  }, [baselineResult, comparisonResults]);
  useEffect(() => {
    let cancelled = false;
    Promise.all([runBackendScenario("BASELINE", null), runBackendScenario("URBAN FLOOD", null), runBackendScenario("EXTREME HEAT", null), runBackendScenario("EARTHQUAKE", null)])
      .then(([base, flood, heat, quake]) => { if (!cancelled) { setBaselineResult(base); setComparisonResults([flood, heat, quake]); } })
      .catch(() => { if (!cancelled) notify("Backend unavailable · showing local baseline until the server is started"); });
    return () => { cancelled = true; };
  }, []);
  const reset = () => { setSelectedId(null); setHazard("BASELINE"); setSimulated(false); setIntervention(false); setBackendResult(baselineResult); notify("Network returned to baseline conditions"); };
  const newScenario = () => { setScenarioNumber((current) => current + 1); setSelectedId("bridge"); setHazard("URBAN FLOOD"); setSimulated(false); setIntervention(false); setBackendResult(null); notify("New scenario workspace created · Urban Flood ready"); };
  const runSimulation = async () => { if (!selectedId && hazard === "BASELINE") { setSelectedId("bridge"); notify("River Bridge 01 selected as the initiating asset"); return; } try { const result = await runBackendScenario(hazard, selectedId); setBackendResult(result); setUnmitigatedResult(result); setSimulated(true); setIntervention(false); notify(`Backend model calculated · ${result.cascadeDepth} propagation levels detected`); } catch { notify("Could not reach the simulation engine · start the backend with npm run dev:all"); } };
  const activateIntervention = async () => { if (!simulated) { notify("Run a hazard scenario before testing mitigation"); return; } if (intervention) { setIntervention(false); if (backendResult) { try { setBackendResult(await runBackendScenario(hazard, selectedId)); } catch { notify("Could not recalculate the unmitigated case"); } } return; } const mitigationId = String(backendResult?.mitigation?.[0]?.id ?? "alternate_route"); try { setBackendResult(await runBackendScenario(hazard, selectedId, mitigationId)); setIntervention(true); notify("Backend intervention applied · outcome recalculated"); } catch { notify("Could not apply the backend intervention"); } };
  const refreshSources = async () => { setLoadingSources(true); try { await runBackendScenario("BASELINE", null); setSourceState(current => current.map(source => ({ ...source, status: "live", updated: new Date().toLocaleTimeString() }))); } catch { setSourceState(current => current.map(source => ({ ...source, status: "error", updated: "unavailable" }))); } finally { setLoadingSources(false); } };
  const topCritical = scenario.criticality.slice(0, 5);
  const compareMetric = activeTab === "Overview" ? (result: Scenario) => result.resilience : activeTab === "Connectivity" ? (result: Scenario) => result.connectivity : (result: Scenario) => Math.max(0, Math.round(100 - result.recoveryHours));

  return <div className="app-shell">
    <header className="topbar"><div className="brand-lockup"><BrandMark /><div><div className="brand-name">RESILIENCE<span>OS</span></div><div className="brand-subtitle">INFRASTRUCTURE RESILIENCE INTELLIGENCE</div></div></div><div className="topbar-right"><div className="network-health"><span className="pulse-dot" /><div><span className="top-label">SYSTEM STATUS</span><strong>{simulated ? "CASCADE UNDER ANALYSIS" : "NETWORK OPERATIONAL"}</strong></div></div><div className="top-divider" /><div className="scenario-chip"><span className="top-label">MODEL</span><strong>SYNTHETIC INDIA</strong></div><button className="outline-button" onClick={newScenario}><Plus size={14} /> New scenario</button><button className="icon-button top-icon" aria-label="Notifications"><Bell size={16} /><span className="notification-dot" /></button></div></header>
    <main className="workspace">
      <div className="scenario-bar"><div className="scenario-context"><span className="section-kicker">SCENARIO CONTROL</span><select className="hazard-select" value={hazard} onChange={(event) => { setHazard(event.target.value as Hazard); setSimulated(false); setIntervention(false); }} aria-label="Select hazard scenario">{hazards.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><ChevronDown size={14} /></div><div className="scenario-stages">{(["FAILURE", "CASCADE", "IMPACT", "INSIGHT", "INTERVENTION", "RECOVERY"] as const).map((stage, index) => <div key={stage} className={`stage ${simulated && index < 3 ? "active" : !simulated && index === 0 ? "current" : ""}`}><span>{String(index + 1).padStart(2, "0")}</span>{stage}</div>)}</div><div className="scenario-actions"><button className="text-button" onClick={reset}><RotateCcw size={14} /> Reset</button><button className="primary-button" onClick={runSimulation}><Play size={14} fill="currentColor" /> {simulated ? "Re-run simulation" : "Run simulation"}</button></div></div>
      <div className="model-disclaimer"><Info size={13} /> Public evidence layer — Bengaluru GIS, USGS hazards, OpenStreetMap facilities, and World Bank population indicators. Scenario impacts remain estimated model outputs.</div>
      <div className="layer-selector"><span className="section-kicker"><Layers3 size={13} /> DATA LAYER</span>{(["ALL", "POWER", "WATER", "TRANSPORT", "HEALTHCARE", "COMMUNICATIONS", "EMERGENCY", "POPULATION"] as const).map((item) => <button key={item} className={layer === item ? "active" : ""} onClick={() => setLayer(item)}>{item === "COMMUNICATIONS" ? "COMMS" : item}</button>)}</div>
      <div className="main-grid"><section className="panel network-panel"><div className="panel-head"><div><div className="section-kicker"><Network size={13} /> CITY NETWORK TOPOLOGY · {nodes.length} ASSETS / {edges.length} LINKS</div><h1>Synthetic Indian Urban Network <span className="live-tag"><span className="live-pulse" />MODEL OUTPUT</span></h1></div><div className="panel-head-actions"><button className="compact-button" onClick={() => notify("Filters are scoped to the active data layer") }><SlidersHorizontal size={14} /> Filters</button><button className="compact-button" onClick={() => notify("Network model export is ready for the next data contract") }><Download size={14} /> Export</button></div></div><NetworkMap selectedId={selectedId} scenario={scenario} layer={layer} onSelect={setSelectedId} /></section>
        <aside className="panel intelligence-panel"><div className="panel-head compact-head"><div><div className="section-kicker"><Sparkles size={13} /> IMPACT INTELLIGENCE</div><h2>{simulated ? `${hazard} cascade` : "Baseline conditions"}</h2></div><button className="icon-button" aria-label="Panel settings"><Settings2 size={15} /></button></div><div className={`intelligence-status ${simulated ? "alert" : "clear"}`}><div className="status-icon">{simulated ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}</div><div><strong>{simulated ? `${scenario.affectedCount} ASSETS AFFECTED · ${scenario.waveCount} WAVES` : "ALL INFRASTRUCTURE OPERATIONAL"}</strong><span>{simulated ? `Estimated exposure: ${Math.round(scenario.populationExposed / 1000)}K people · ${scenario.hospitalsOverloaded} hospitals overloaded` : "No active disruptions detected"}</span></div></div><div className="risk-score"><div><span className="eyebrow">CITY RESILIENCE</span><strong className={scenario.resilience < 70 ? "risk-alert" : ""}>{scenario.resilience}<small>/100</small></strong></div><div className="risk-gauge"><div className="gauge-track"><div className={`gauge-value ${scenario.resilience < 70 ? "high" : "low"}`} style={{ width: `${scenario.resilience}%` }} /></div><span>{scenario.resilience < 70 ? "ELEVATED" : "MODEL BASELINE"}</span></div></div><div className="kpi-row"><div><span>EXPOSURE</span><strong>{Math.round(scenario.populationExposed / 1000)}K</strong><em className={scenario.populationExposed ? "warn-text" : "good-text"}>estimated people</em></div><div><span>RESPONSE</span><strong>{scenario.emergencyResponse}m</strong><em className={scenario.emergencyResponse > 15 ? "warn-text" : "good-text"}>ambulance avg</em></div><div><span>RECOVERY</span><strong>{scenario.recoveryHours}h</strong><em>{simulated ? "estimated" : "not needed"}</em></div></div><div className="affected-list"><div className="subhead"><span>AFFECTED ASSETS</span><button className="link-button">View all <ChevronRight size={13} /></button></div>{simulated ? topCritical.filter(({ node }) => scenario.statusById[node.id] !== "operational").slice(0, 3).map(({ node }) => <div className="affected-item" key={node.id}><div className={`list-icon ${scenario.statusById[node.id] === "failed" ? "red" : "amber"}`}><CircleDot size={13} /></div><div className="affected-copy"><strong>{node.name}</strong><span>{statusLabel[scenario.statusById[node.id]]} · {node.category}</span></div><span className={`impact-value ${scenario.statusById[node.id] === "failed" ? "red" : "amber"}`}>{scenario.statusById[node.id] === "failed" ? "FAIL" : "IMPACT"}</span></div>) : <div className="affected-item"><div className="list-icon green"><CircleDot size={13} /></div><div className="affected-copy"><strong>No active disruptions</strong><span>Network ready for simulation</span></div></div>}</div><button className="insight-button" onClick={() => notify(selected ? `Tracing upstream and downstream dependencies for ${selected.name}` : "Select an asset to unlock dependency tracing")}><BarChart3 size={15} /> {selected ? "Trace dependencies" : "Explore impact pathways"} <ArrowRight size={15} /></button></aside></div>

      <DependencyInspector selected={selected} assets={nodes} links={edges} statusById={scenario.statusById} onSelect={setSelectedId} />
      <LiveDataPanel sources={sourceState} loading={loadingSources} onRefresh={refreshSources} />
      <section className="panel timeline-panel"><div className="panel-head compact-head"><div><div className="section-kicker"><Clock3 size={13} /> CASCADE TIMELINE · ESTIMATED</div><h2>{simulated ? `Propagation sequence · ${hazard}` : "Awaiting initiating event"}</h2></div><div className="timeline-meta"><span className="timeline-range">{simulated ? `0h — ${scenario.recoveryHours}h` : "No event window"}</span><button className="icon-button" aria-label="Timeline options"><Settings2 size={14} /></button></div></div><div className="timeline-track"><div className={`track-line ${simulated ? "progress" : ""}`} />{[{ time: "00:00", title: simulated ? "Hazard / failure detected" : "Baseline state", detail: simulated ? `${hazard} · ${scenario.failedIds.length} initiating assets` : "All assets within operational thresholds", state: simulated ? "failed" : "operational", icon: simulated ? AlertTriangle : CheckCircle2 }, { time: "+01h", title: simulated ? "Direct dependencies degrade" : "Ready for analysis", detail: simulated ? `${scenario.degradedIds.length} assets enter degraded state` : "Select a hazard and model a disruption", state: simulated ? "degraded" : "pending", icon: Activity }, { time: "+04h", title: simulated ? "Service capacity shifts" : "Impact propagation", detail: simulated ? `${scenario.hospitalsOverloaded} hospitals overloaded · ${scenario.emergencyResponse}m ambulance response` : "Observe cross-system consequences", state: simulated ? "degraded" : "pending", icon: Zap }, { time: `+${scenario.recoveryHours}h`, title: simulated ? "Recovery equilibrium" : "Recovery pathway", detail: simulated ? `${scenario.resilience}/100 resilience · ${scenario.coverage}% emergency coverage` : "Test interventions and compare outcomes", state: simulated ? "operational" : "pending", icon: ShieldCheck }].map((event) => <div className={`timeline-event ${event.state}`} key={event.time}><div className="event-time">{event.time}</div><div className="event-node"><event.icon size={13} /></div><strong>{event.title}</strong><span>{event.detail}</span></div>)}</div></section>

      <div className="analysis-grid"><section className="panel analysis-panel"><div className="panel-head compact-head"><div><div className="section-kicker"><Target size={13} /> CRITICALITY ANALYSIS</div><h2>Top critical assets</h2></div><button className="link-button">Why? <Info size={13} /></button></div><p className="panel-description">Calculated from dependencies, population exposure, critical services, and redundancy.</p><div className="ranking-list">{topCritical.map(({ node, score, downstream }) => <div className="ranking-item" key={node.id}><span className="rank">{String(topCritical.indexOf(topCritical.find((x) => x.node.id === node.id)!) + 1).padStart(2, "0")}</span><div className="rank-name"><strong>{node.name}</strong><span>{node.category} · {downstream} downstream impacts</span></div><MetricBar value={score} color={node.category === "POWER" ? "cyan" : node.category === "TRANSPORT" ? "red" : "green"} /><strong className="rank-score">{score}</strong></div>)}</div></section>
        <section className="panel analysis-panel"><div className="panel-head compact-head"><div><div className="section-kicker"><ArrowDownRight size={13} /> BOTTLENECK ANALYSIS</div><h2>Critical connections</h2></div><button className="compact-button">Calculated <CheckCircle2 size={13} /></button></div><p className="panel-description">Ranked by alternate routes, emergency priority, utilization, and population impact.</p><div className="bottleneck-list">{scenario.bottlenecks.slice(0, 3).map(({ label, score, edge, affectedPopulation, effectiveUtilization }) => <div className="bottleneck-item" key={`${edge.source}-${edge.target}`}><div className={`connection-line ${score > 75 ? "red" : "amber"}`}><span /><span /><span /></div><div><strong>{label}</strong><span>{effectiveUtilization}% utilization · {Math.round(affectedPopulation / 1000)}K affected · {edge.alternateRoutes} alternates</span></div><em className={score > 75 ? "red" : "amber"}>{score > 75 ? "HIGH" : "MED"}</em><ChevronRight size={14} className="muted-icon" /></div>)}</div></section>
        <section className="panel analysis-panel mitigation-panel"><div className="panel-head compact-head"><div><div className="section-kicker"><SlidersHorizontal size={13} /> MITIGATION ANALYSIS</div><h2>Decision intelligence</h2></div><div className="intervention-badge"><Sparkles size={12} /> MODELLED OPTION</div></div><p className="panel-description">A reversible intervention scenario, not an unquestionable recommendation.</p><div className="mitigation-row"><div className="mitigation-score"><strong>{simulated ? scenario.resilience : baseline.resilience}</strong><span>RESILIENCE<br />SCORE</span></div><div className="mitigation-copy"><strong>{intervention ? "Restore alternate route + mobile medical unit" : "Restore alternate route"}</strong><span>{intervention ? `Protects ${Math.max(0, Math.round((unmitigatedScenario.populationExposed - scenario.populationExposed) / 1000))}K estimated people · +${Math.max(0, scenario.resilience - unmitigatedScenario.resilience)} resilience · response ${scenario.emergencyResponse}m` : simulated ? `Current model output: ${scenario.resilience}/100 · test the intervention to compare` : "Run a hazard scenario, then test cause-and-effect"}</span><MetricBar value={simulated ? scenario.resilience : baseline.resilience} color="green" /></div><button className="round-arrow" aria-label="Apply mitigation" onClick={activateIntervention}><ArrowRight size={16} /></button></div><div className="mitigation-footer"><span><CheckCircle2 size={13} /> {intervention ? "Intervention active" : "Scenario-ready recommendation"}</span><button onClick={activateIntervention}>{intervention ? "Remove intervention" : "Test intervention"} <ChevronRight size={13} /></button></div></section></div>

      <section className="panel comparison-panel"><div className="panel-head compact-head"><div><div className="section-kicker"><BarChart3 size={13} /> SCENARIO COMPARISON · CALCULATED</div><h2>Resilience outcome by hazard</h2></div><div className="tab-list">{["Overview", "Connectivity", "Recovery"].map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? "active" : ""}>{tab}</button>)}</div></div><div className="comparison-content"><div className="comparison-note"><div className="note-icon"><Network size={16} /></div><div><strong>{activeTab === "Overview" ? "Compare calculated model outputs across multi-hazard scenarios." : activeTab === "Connectivity" ? "Connectivity is derived from failed and degraded assets across the multi-layer graph." : "Recovery reflects failed assets, overloaded services, hazard type, and applied intervention."}</strong><span>Estimated values from synthetic network model · not live data.</span></div></div><div className="comparison-bars">{comparisons.slice(0, 3).map(({ hazard: value, result }) => <div className={`compare-col ${result.resilience < 70 ? "alert-col" : ""}`} key={value}><span>{value === "BASELINE" ? "BASELINE" : value.replace(" ", " ")}</span><div className="compare-bar"><i style={{ height: `${compareMetric(result)}%` }} /></div><strong>{compareMetric(result)}</strong></div>)}</div></div></section>
      <section className="panel data-readiness"><div><div className="section-kicker"><ShieldCheck size={13} /> DATA READINESS</div><strong>Live GIS adapter ✓</strong><span>USGS hazards · OpenStreetMap facilities · World Bank population</span><span>Scenario engine · estimated</span></div><div><div className="section-kicker"><Network size={13} /> NEXT CONNECTORS</div><span>NDMA / SACHET alerts · IMD weather · municipal GIS · hospital capacity feeds</span></div></section>
    </main><footer className="footer"><span><span className="pulse-dot" />Model output updated locally</span><span>v4.0 · {nodes.length} model assets · {edges.length} model links · live adapters enabled</span><span className="footer-right"><Download size={13} /> Export report <span className="footer-separator">|</span> <Settings2 size={13} /> Workspace settings</span></footer>{toast && <div className="toast"><CheckCircle2 size={15} /> {toast}</div>}
  </div>;
}
