// server/index.ts
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

// server/routes/network.ts
import { Router } from "express";

// server/data/assets.ts
var rawData = [
  ["power_central", "Central Grid Substation", "power", "Central", 12.9716, 77.5946, 450, 78, 64e4, 36, true, 96],
  ["power_east", "East Grid Substation", "power", "East", 13.004, 77.64, 280, 71, 31e4, 30, true, 88],
  ["power_west", "West Grid Substation", "power", "West", 12.965, 77.545, 300, 69, 28e4, 30, true, 86],
  ["power_north", "North Grid Substation", "power", "North", 13.035, 77.585, 250, 73, 24e4, 28, true, 82],
  ["solar", "Urban Solar Generation", "power", "South", 12.915, 77.61, 120, 52, 15e4, 12, false, 61],
  ["backup_gen", "Critical Backup Generation", "power", "Central", 12.978, 77.585, 90, 25, 18e4, 8, true, 74],
  ["water_treatment", "Central Water Treatment Plant", "water", "Industrial", 12.99, 77.56, 520, 76, 61e4, 60, true, 91],
  ["water_intake", "Raw Water Intake", "water", "West", 12.945, 77.52, 600, 73, 7e5, 54, true, 84],
  ["reservoir_central", "Central Reservoir", "water", "Central", 12.975, 77.575, 400, 69, 43e4, 42, true, 82],
  ["reservoir_east", "East Reservoir", "water", "East", 13, 77.625, 300, 62, 3e5, 36, false, 68],
  ["reservoir_west", "West Reservoir", "water", "West", 12.96, 77.55, 280, 64, 26e4, 36, false, 66],
  ["pump_a", "Central Pumping Station", "water", "Central", 12.968, 77.585, 300, 72, 39e4, 30, true, 77],
  ["pump_b", "East Pumping Station", "water", "East", 13.01, 77.635, 220, 67, 25e4, 28, false, 63],
  ["ring_road", "Ring Road", "transport", "Central", 12.97, 77.57, 9e3, 68, 52e4, 18, true, 87],
  ["north_corridor", "North-South Arterial", "transport", "North", 13.02, 77.58, 6e3, 72, 36e4, 18, true, 84],
  ["east_corridor", "East-West Corridor", "transport", "East", 12.995, 77.62, 6500, 74, 41e4, 20, true, 89],
  ["west_corridor", "Western Arterial", "transport", "West", 12.965, 77.55, 5200, 66, 3e5, 18, false, 73],
  ["river_bridge", "River Bridge 01", "transport", "Central", 12.985, 77.6, 4200, 79, 46e4, 72, true, 93],
  ["bridge_02", "River Bridge 02", "transport", "East", 12.98, 77.625, 3200, 62, 28e4, 60, false, 71],
  ["flyover", "Central Flyover", "transport", "Central", 12.975, 77.595, 3800, 81, 34e4, 48, false, 76],
  ["rail_junction", "Central Rail Junction", "transport", "Central", 12.978, 77.61, 220, 74, 39e4, 48, true, 79],
  ["metro_interchange", "Metro Interchange", "transport", "Central", 12.972, 77.605, 18e3, 71, 42e4, 36, false, 72],
  ["bus_depot", "Central Bus Depot", "transport", "South", 12.93, 77.6, 800, 68, 21e4, 24, false, 64],
  ["hospital_a", "Central Government Hospital", "healthcare", "Central", 12.9755, 77.6005, 850, 78, 32e4, 48, true, 94],
  ["hospital_b", "District Hospital", "healthcare", "North", 13.025, 77.585, 500, 84, 21e4, 42, true, 88],
  ["hospital_c", "Emergency Trauma Centre", "healthcare", "East", 12.995, 77.635, 420, 91, 19e4, 36, true, 90],
  ["hospital_d", "Private Hospital", "healthcare", "West", 12.96, 77.545, 650, 62, 18e4, 36, true, 76],
  ["hospital_e", "Community Health Centre", "healthcare", "South", 12.925, 77.61, 220, 69, 95e3, 24, false, 62],
  ["telecom_a", "Telecom Tower A", "telecom", "Central", 12.98, 77.59, 100, 72, 38e4, 18, true, 72],
  ["telecom_b", "Telecom Tower B", "telecom", "East", 13.005, 77.63, 100, 67, 26e4, 18, false, 63],
  ["telecom_c", "Telecom Tower C", "telecom", "West", 12.955, 77.55, 100, 61, 23e4, 18, false, 59],
  ["datacentre", "Emergency Data Centre", "telecom", "Central", 12.97, 77.61, 1e3, 58, 62e4, 24, true, 83],
  ["emergency_comms", "Emergency Communication Hub", "telecom", "Central", 12.975, 77.59, 100, 64, 7e5, 18, true, 87],
  ["eoc", "Emergency Operations Centre", "emergency", "Central", 12.973, 77.585, 100, 68, 7e5, 18, true, 92],
  ["fire_a", "Fire Station A", "emergency", "Central", 12.965, 77.585, 8, 61, 19e4, 12, true, 79],
  ["fire_b", "Fire Station B", "emergency", "North", 13.03, 77.575, 7, 58, 15e4, 12, true, 73],
  ["fire_c", "Fire Station C", "emergency", "East", 13, 77.635, 6, 63, 14e4, 12, true, 70],
  ["ambulance_a", "Ambulance Station A", "emergency", "Central", 12.968, 77.6, 20, 64, 23e4, 10, true, 81],
  ["ambulance_b", "Ambulance Station B", "emergency", "West", 12.955, 77.545, 14, 57, 16e4, 10, true, 74],
  ["police_control", "Police Control Centre", "emergency", "Central", 12.978, 77.595, 100, 70, 65e4, 18, true, 82],
  ["zone_central", "Central Population Zone", "population", "Central", 12.975, 77.6, 1e6, 74, 26e4, 0, true, 78],
  ["zone_north", "North Population Zone", "population", "North", 13.03, 77.58, 1e6, 68, 23e4, 0, false, 66],
  ["zone_east", "East Population Zone", "population", "East", 13, 77.63, 1e6, 71, 28e4, 0, false, 69],
  ["zone_west", "West Population Zone", "population", "West", 12.96, 77.55, 1e6, 65, 21e4, 0, false, 64],
  ["zone_south", "South Population Zone", "population", "South", 12.925, 77.61, 1e6, 63, 18e4, 0, false, 61],
  ["zone_industrial", "Industrial Population Zone", "population", "Industrial", 12.995, 77.555, 1e6, 59, 15e4, 0, false, 58]
];
var raw = rawData.map(([id, name, category, district, lat, lng, capacity, utilization, populationServed, recoveryHours, criticalService, importance]) => ({
  id,
  name,
  category,
  district,
  lat,
  lng,
  capacity,
  utilization,
  populationServed,
  recoveryHours,
  criticalService,
  importance
}));
var edgePairs = [
  ["power_central", "hospital_a", 0.95, "dependency"],
  ["power_central", "water_treatment", 0.92, "dependency"],
  ["power_central", "eoc", 0.9, "dependency"],
  ["power_central", "datacentre", 0.9, "dependency"],
  ["power_east", "hospital_c", 0.9, "dependency"],
  ["power_east", "pump_b", 0.82, "dependency"],
  ["power_west", "hospital_d", 0.88, "dependency"],
  ["power_west", "water_treatment", 0.65, "dependency"],
  ["power_north", "hospital_b", 0.9, "dependency"],
  ["solar", "power_east", 0.5, "supply"],
  ["backup_gen", "hospital_a", 0.7, "supply"],
  ["backup_gen", "eoc", 0.7, "supply"],
  ["water_intake", "water_treatment", 0.95, "supply"],
  ["water_treatment", "reservoir_central", 0.9, "supply"],
  ["water_treatment", "reservoir_east", 0.72, "supply"],
  ["reservoir_central", "pump_a", 0.85, "supply"],
  ["reservoir_east", "pump_b", 0.85, "supply"],
  ["pump_a", "hospital_a", 0.8, "dependency"],
  ["pump_b", "hospital_c", 0.75, "dependency"],
  ["reservoir_west", "hospital_d", 0.65, "dependency"],
  ["river_bridge", "ring_road", 0.92, "transport"],
  ["bridge_02", "east_corridor", 0.82, "transport"],
  ["ring_road", "north_corridor", 0.7, "transport"],
  ["ring_road", "east_corridor", 0.82, "transport"],
  ["ring_road", "west_corridor", 0.8, "transport"],
  ["north_corridor", "hospital_b", 0.9, "transport"],
  ["east_corridor", "hospital_c", 0.92, "transport"],
  ["west_corridor", "hospital_d", 0.9, "transport"],
  ["ring_road", "hospital_a", 0.86, "transport"],
  ["flyover", "ring_road", 0.72, "transport"],
  ["rail_junction", "metro_interchange", 0.62, "transport"],
  ["metro_interchange", "hospital_a", 0.55, "transport"],
  ["bus_depot", "hospital_e", 0.58, "transport"],
  ["east_corridor", "hospital_a", 0.62, "transport"],
  ["telecom_a", "eoc", 0.9, "dependency"],
  ["telecom_b", "eoc", 0.55, "dependency"],
  ["telecom_c", "eoc", 0.5, "dependency"],
  ["datacentre", "emergency_comms", 0.88, "dependency"],
  ["emergency_comms", "ambulance_a", 0.85, "dependency"],
  ["emergency_comms", "ambulance_b", 0.78, "dependency"],
  ["eoc", "fire_a", 0.82, "dependency"],
  ["eoc", "fire_b", 0.82, "dependency"],
  ["eoc", "fire_c", 0.82, "dependency"],
  ["eoc", "police_control", 0.9, "dependency"],
  ["ring_road", "ambulance_a", 0.9, "transport"],
  ["west_corridor", "ambulance_b", 0.85, "transport"],
  ["east_corridor", "fire_c", 0.88, "transport"],
  ["north_corridor", "fire_b", 0.88, "transport"],
  ["ring_road", "fire_a", 0.9, "transport"],
  ["ring_road", "ambulance_b", 0.62, "transport"],
  ["hospital_a", "eoc", 0.72, "dependency"],
  ["hospital_b", "eoc", 0.62, "dependency"],
  ["hospital_c", "eoc", 0.62, "dependency"],
  ["hospital_d", "eoc", 0.5, "dependency"],
  ["zone_central", "hospital_a", 0.9, "dependency"],
  ["zone_north", "hospital_b", 0.9, "dependency"],
  ["zone_east", "hospital_c", 0.9, "dependency"],
  ["zone_west", "hospital_d", 0.9, "dependency"],
  ["zone_south", "hospital_e", 0.85, "dependency"],
  ["zone_industrial", "hospital_a", 0.5, "dependency"]
];
var edges = edgePairs.map(([source, target, strength, type], i) => ({
  id: `edge_${i + 1}`,
  source,
  target,
  strength,
  type,
  capacity: 100,
  utilization: 60 + Math.round(strength * 30),
  travelTimeMinutes: type === "transport" ? 8 + Math.round((1 - strength) * 12) : void 0
}));
function createNetwork() {
  return {
    assets: raw.map((a) => ({ ...a, status: "operational" })),
    edges: edges.map((e) => ({ ...e }))
  };
}

// server/routes/network.ts
var networkRouter = Router();
networkRouter.get("/", (_req, res) => {
  res.json(createNetwork());
});

// server/routes/simulation.ts
import { Router as Router2 } from "express";
import { z } from "zod";

// server/simulation/graph.ts
function outgoing(network, id) {
  return network.edges.filter((e) => e.source === id);
}
function descendants(network, starts) {
  const seen = new Set(starts);
  const levels = [];
  let frontier = [...starts];
  while (frontier.length) {
    const next = [];
    for (const id of frontier) {
      for (const edge of outgoing(network, id)) {
        if (!seen.has(edge.target)) {
          seen.add(edge.target);
          next.push(edge.target);
        }
      }
    }
    if (next.length) levels.push(next);
    frontier = next;
  }
  return { nodes: [...seen], levels };
}

// server/simulation/capacity.ts
function applyCapacityStress(assets, edges2, failed, severityMultiplier2) {
  const affected = /* @__PURE__ */ new Set();
  const overloaded = /* @__PURE__ */ new Set();
  for (const edge of edges2) {
    if (failed.has(edge.source)) {
      affected.add(edge.target);
      const target = assets.find((a) => a.id === edge.target);
      if (!target) continue;
      const stress = edge.strength * severityMultiplier2;
      target.utilization = Math.min(140, target.utilization + stress * 55);
      if (target.utilization >= 100) {
        target.status = "overloaded";
        overloaded.add(target.id);
      } else if (target.status === "operational") {
        target.status = "degraded";
      }
    }
  }
  const hospitals = assets.filter((a) => a.category === "healthcare");
  const failedHospitals = hospitals.filter((h) => failed.has(h.id));
  if (failedHospitals.length) {
    const transferred = failedHospitals.reduce((sum, h) => sum + h.populationServed * 0.08, 0);
    const survivors = hospitals.filter((h) => !failed.has(h.id));
    const share = survivors.length ? transferred / survivors.length : 0;
    for (const h of survivors) {
      h.utilization = Math.min(140, h.utilization + share / Math.max(h.capacity, 1) * 100);
      if (h.utilization >= 100) {
        h.status = "overloaded";
        overloaded.add(h.id);
      } else if (h.utilization > 90) {
        h.status = "degraded";
        affected.add(h.id);
      }
    }
  }
  return { affected, overloaded };
}
function trafficStress(assets, edges2, failed, severityMultiplier2) {
  const transport = assets.filter((a) => a.category === "transport");
  const failedTransport = transport.filter((a) => failed.has(a.id));
  if (!failedTransport.length) return { responseMinutes: 9, overloadedRoads: [] };
  const road = transport.filter((a) => !failed.has(a.id));
  const overload = [];
  for (const r of road) {
    r.utilization = Math.min(145, r.utilization + failedTransport.length * 8 * severityMultiplier2);
    if (r.utilization >= 100) {
      r.status = "overloaded";
      overload.push(r.id);
    } else if (r.utilization > 85) {
      r.status = "degraded";
    }
  }
  return {
    responseMinutes: Math.round(9 + failedTransport.length * 5 * severityMultiplier2 + overload.length * 2),
    overloadedRoads: overload
  };
}

// server/simulation/analytics.ts
function criticality(network) {
  const totalPopulation = network.assets.reduce((s, a) => s + a.populationServed, 0);
  return network.assets.filter((a) => a.category !== "population").map((a) => {
    const downstreamNodes = descendants(network, [a.id]).nodes;
    const reach = downstreamNodes.length - 1;
    const criticalDownstream = downstreamNodes.map((id) => network.assets.find((x) => x.id === id)).filter(Boolean).filter((x) => x.criticalService).length;
    const exposure = Math.min(100, a.populationServed / Math.max(totalPopulation, 1) * 600);
    const redundancy = Math.min(100, outgoing(network, a.id).length * 25);
    const score = Math.round(
      a.importance * 0.45 + Math.min(100, reach * 7) * 0.25 + exposure * 0.2 + (100 - redundancy) * 0.1
    );
    return {
      id: a.id,
      name: a.name,
      category: a.category,
      district: a.district,
      score: Math.min(100, score),
      populationExposure: a.populationServed,
      downstreamDependencies: reach,
      criticalServices: criticalDownstream,
      redundancy: Math.round(redundancy)
    };
  }).sort((a, b) => b.score - a.score);
}
function bottlenecks(network) {
  return network.edges.map((e) => {
    const downstream = descendants(network, [e.target]).nodes.length - 1;
    const score = Math.round(e.strength * 65 + Math.min(35, downstream * 3));
    return {
      edgeId: e.id,
      source: e.source,
      target: e.target,
      strength: e.strength,
      downstreamReach: downstream,
      score: Math.min(100, score),
      alternativeRoutes: Math.max(0, Math.floor((1 - e.strength) * 4))
    };
  }).sort((a, b) => b.score - a.score);
}
function districtRisk(network) {
  const result = {};
  for (const a of network.assets) {
    result[a.district] = Math.max(result[a.district] ?? 0, a.importance);
  }
  return result;
}

// server/simulation/cascade.ts
function severityMultiplier(s) {
  return s === "minor" ? 0.65 : s === "complete" ? 1.35 : 1;
}
function hazardFailures(network, hazards = []) {
  if (!hazards) return [];
  const failed = [];
  for (const hazard of hazards) {
    for (const a of network.assets) {
      if (hazard.district && a.district !== hazard.district) continue;
      const vulnerability = hazard.type === "urban_flood" ? ["transport", "power", "water", "emergency"].includes(a.category) ? 0.75 : 0.35 : hazard.type === "extreme_heat" ? ["power", "healthcare"].includes(a.category) ? 0.6 : 0.2 : hazard.type === "earthquake" ? ["transport", "power", "water", "telecom"].includes(a.category) ? 0.55 : 0.3 : hazard.type === "power_failure" ? a.category === "power" ? 0.9 : 0.15 : hazard.type === "telecom_outage" ? a.category === "telecom" ? 0.9 : 0.15 : 0.4;
      if (hazard.severity * vulnerability > 0.55) failed.push(a.id);
    }
  }
  return [...new Set(failed)];
}
function simulate(base, scenario) {
  const network = {
    assets: base.assets.map((a) => ({ ...a })),
    edges: base.edges.map((e) => ({ ...e }))
  };
  const severity = severityMultiplier(scenario.severity);
  const initialFailures = [.../* @__PURE__ */ new Set([
    ...scenario.failedAssets ?? [],
    ...hazardFailures(network, scenario.hazards)
  ])].filter((id) => network.assets.some((a) => a.id === id));
  const failed = new Set(initialFailures);
  for (const id of failed) {
    const a = network.assets.find((x) => x.id === id);
    if (a) a.status = "failed";
  }
  const traversal = descendants(network, initialFailures);
  const { affected, overloaded } = applyCapacityStress(network.assets, network.edges, failed, severity);
  const traffic = trafficStress(network.assets, network.edges, failed, severity);
  const overloadedNow = [...overloaded];
  for (const id of overloadedNow) {
    for (const edge of network.edges.filter((e) => e.source === id)) {
      if (!failed.has(edge.target)) {
        affected.add(edge.target);
        const target = network.assets.find((a) => a.id === edge.target);
        if (target && target.status === "operational") target.status = "degraded";
      }
    }
  }
  const affectedIds = [...new Set([...affected].filter((id) => !failed.has(id)))];
  const affectedAssets = [.../* @__PURE__ */ new Set([...initialFailures, ...affectedIds])];
  const criticalServicesAffected = network.assets.filter(
    (a) => affectedAssets.includes(a.id) && a.criticalService && a.category !== "population"
  ).length;
  const populationExposed = network.assets.filter((a) => affectedAssets.includes(a.id) && a.category !== "population").reduce((sum, a) => sum + Math.round(a.populationServed * 0.55), 0);
  const healthcareOverload = network.assets.filter((a) => a.category === "healthcare").reduce((sum, a) => sum + Math.max(0, a.utilization - 100), 0);
  const depth = traversal.levels.length;
  const recoveryBase = initialFailures.reduce((sum, id) => sum + (network.assets.find((a) => a.id === id)?.recoveryHours ?? 24), 0);
  const recoveryHours = Math.round(
    Math.max(6, recoveryBase * (1 + depth * 0.18) * (scenario.outageHours ? Math.max(1, scenario.outageHours / 24) : 1))
  );
  const mitigationId = scenario.mitigation;
  const mitigationGain = mitigationId === "backup_generation" ? 12 : mitigationId === "alternate_route" ? 10 : mitigationId === "mobile_medical" ? 7 : 0;
  const impact = Math.min(
    85,
    initialFailures.length * 10 + affectedIds.length * 5 + depth * 6 + criticalServicesAffected * 4 + Math.min(15, healthcareOverload)
  );
  const resilienceScore = Math.min(100, Math.max(0, Math.round(100 - impact + mitigationGain)));
  const timeline = [
    {
      level: 0,
      assetIds: initialFailures,
      label: "Primary failure",
      reason: "Scenario-selected infrastructure became unavailable."
    },
    ...traversal.levels.map((ids, i) => ({
      level: i + 1,
      assetIds: ids.filter((id) => !failed.has(id)),
      label: i === 0 ? "Direct impact" : i === 1 ? "Secondary impact" : "System effect",
      reason: "Downstream dependencies experienced reduced capacity or accessibility."
    })).filter((x) => x.assetIds.length)
  ];
  return {
    scenarioId: `SCN-${Date.now().toString(36).toUpperCase()}`,
    failedAssets: initialFailures,
    affectedAssets,
    overloadedAssets: [...overloaded],
    cascadeDepth: depth,
    populationExposed,
    criticalServicesAffected,
    resilienceScore,
    recoveryHours: Math.max(6, Math.round(recoveryHours * (mitigationId ? mitigationId === "backup_generation" ? 0.72 : mitigationId === "alternate_route" ? 0.76 : 0.84 : 1))),
    emergencyResponseMinutes: traffic.responseMinutes,
    healthcareOverload: Math.round(healthcareOverload),
    districtRisk: districtRisk(network),
    timeline,
    criticality: criticality(network).slice(0, 10),
    bottlenecks: bottlenecks(network).slice(0, 10),
    mitigation: buildMitigation(network, affectedAssets, resilienceScore, populationExposed, recoveryHours)
  };
}
function buildMitigation(network, affectedAssets, score, exposure, recovery) {
  const options = [
    {
      id: "alternate_route",
      title: "Restore alternate transport route",
      reason: "Reduces dependency concentration around failed corridors.",
      costLakhs: 12,
      deploymentHours: 8,
      protectedPopulation: Math.round(exposure * 0.42),
      resilienceGain: 13,
      recoveryReductionHours: Math.round(recovery * 0.24)
    },
    {
      id: "backup_generation",
      title: "Activate critical backup generation",
      reason: "Maintains power to hospitals, water and emergency coordination.",
      costLakhs: 18,
      deploymentHours: 4,
      protectedPopulation: Math.round(exposure * 0.35),
      resilienceGain: 16,
      recoveryReductionHours: Math.round(recovery * 0.28)
    },
    {
      id: "mobile_medical",
      title: "Deploy mobile medical capacity",
      reason: "Absorbs healthcare surge when hospitals approach overload.",
      costLakhs: 9,
      deploymentHours: 6,
      protectedPopulation: Math.round(exposure * 0.27),
      resilienceGain: 10,
      recoveryReductionHours: Math.round(recovery * 0.16)
    }
  ];
  return options.map((o) => ({
    ...o,
    projectedResilience: Math.min(100, score + o.resilienceGain),
    projectedRecoveryHours: Math.max(6, recovery - o.recoveryReductionHours)
  })).sort((a, b) => b.resilienceGain - a.resilienceGain);
}

// server/routes/simulation.ts
var simulationRouter = Router2();
var scenarioSchema = z.object({
  failedAssets: z.array(z.string()).optional(),
  hazards: z.array(z.object({
    type: z.string(),
    severity: z.number().min(0).max(1),
    district: z.string().optional()
  })).optional(),
  severity: z.enum(["minor", "major", "complete"]).optional(),
  outageHours: z.number().min(0).optional(),
  mitigation: z.string().optional()
});
simulationRouter.post("/simulate", (req, res) => {
  const parsed = scenarioSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid scenario input", details: parsed.error.flatten() });
  }
  try {
    const result = simulate(createNetwork(), parsed.data);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Simulation failed" });
  }
});

// server/routes/analytics.ts
import { Router as Router3 } from "express";
var analyticsRouter = Router3();
analyticsRouter.get("/criticality", (_req, res) => {
  res.json(criticality(createNetwork()));
});
analyticsRouter.get("/bottlenecks", (_req, res) => {
  res.json(bottlenecks(createNetwork()));
});

// server/routes/scenarios.ts
import { Router as Router4 } from "express";
var scenariosRouter = Router4();
var presets = {
  urban_flood: { hazards: [{ type: "urban_flood", severity: 0.8 }] },
  extreme_heat: { hazards: [{ type: "extreme_heat", severity: 0.82 }] },
  earthquake: { hazards: [{ type: "earthquake", severity: 0.78 }] },
  bridge_power: { failedAssets: ["river_bridge", "power_central"], severity: "major" },
  healthcare_surge: { failedAssets: ["hospital_c"], severity: "major" }
};
scenariosRouter.get("/", (_req, res) => {
  res.json(Object.keys(presets));
});
scenariosRouter.get("/:name", (req, res) => {
  const scenario = presets[req.params.name];
  if (!scenario) return res.status(404).json({ error: "Unknown scenario" });
  res.json(simulate(createNetwork(), scenario));
});

// server/index.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var server = createServer(app);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "ResilienceOS simulation backend", model: "India synthetic urban network", version: "1.0.0" }));
app.use("/api/network", networkRouter);
app.use("/api", simulationRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/scenarios", scenariosRouter);
var staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
app.use(express.static(staticPath));
app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));
var port = Number(process.env.PORT || 3001);
server.listen(port, () => console.log(`ResilienceOS server running on http://localhost:${port}`));
