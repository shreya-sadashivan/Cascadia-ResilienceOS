import type { NetworkModel, ScenarioInput, SimulationResult } from "../types/infrastructure";
import { descendants } from "./graph";
import { applyCapacityStress, trafficStress } from "./capacity";
import { bottlenecks, criticality, districtRisk } from "./analytics";

function severityMultiplier(s?: ScenarioInput["severity"]) {
  return s === "minor" ? 0.65 : s === "complete" ? 1.35 : 1;
}

function hazardFailures(network: NetworkModel, hazards: ScenarioInput["hazards"] = []): string[] {
  if (!hazards) return [];
  const failed: string[] = [];
  for (const hazard of hazards) {
    for (const a of network.assets) {
      if (hazard.district && a.district !== hazard.district) continue;
      const vulnerability =
        hazard.type === "urban_flood"
          ? ["transport","power","water","emergency"].includes(a.category) ? 0.75 : 0.35
          : hazard.type === "extreme_heat"
            ? ["power","healthcare"].includes(a.category) ? 0.6 : 0.2
            : hazard.type === "earthquake"
              ? ["transport","power","water","telecom"].includes(a.category) ? 0.55 : 0.3
              : hazard.type === "power_failure"
                ? a.category === "power" ? 0.9 : 0.15
                : hazard.type === "telecom_outage"
                  ? a.category === "telecom" ? 0.9 : 0.15
                  : 0.4;
      if (hazard.severity * vulnerability > 0.55) failed.push(a.id);
    }
  }
  return [...new Set(failed)];
}

export function simulate(base: NetworkModel, scenario: ScenarioInput): SimulationResult {
  const network: NetworkModel = {
    assets: base.assets.map(a => ({...a})),
    edges: base.edges.map(e => ({...e}))
  };

  const severity = severityMultiplier(scenario.severity);
  const initialFailures = [...new Set([
    ...(scenario.failedAssets ?? []),
    ...hazardFailures(network, scenario.hazards)
  ])].filter(id => network.assets.some(a => a.id === id));

  const failed = new Set(initialFailures);
  for (const id of failed) {
    const a = network.assets.find(x => x.id === id);
    if (a) a.status = "failed";
  }

  const traversal = descendants(network, initialFailures);
  const { affected, overloaded } = applyCapacityStress(network.assets, network.edges, failed, severity);
  const traffic = trafficStress(network.assets, network.edges, failed, severity);

  // Secondary overload propagation.
  const overloadedNow = [...overloaded];
  for (const id of overloadedNow) {
    for (const edge of network.edges.filter(e => e.source === id)) {
      if (!failed.has(edge.target)) {
        affected.add(edge.target);
        const target = network.assets.find(a => a.id === edge.target);
        if (target && target.status === "operational") target.status = "degraded";
      }
    }
  }

  const affectedIds = [...new Set([...affected].filter(id => !failed.has(id)))];
  const affectedAssets = [...new Set([...initialFailures, ...affectedIds])];
  const criticalServicesAffected = network.assets.filter(a =>
    affectedAssets.includes(a.id) && a.criticalService && a.category !== "population"
  ).length;

  const populationExposed = network.assets
    .filter(a => affectedAssets.includes(a.id) && a.category !== "population")
    .reduce((sum, a) => sum + Math.round(a.populationServed * 0.55), 0);

  const healthcareOverload = network.assets
    .filter(a => a.category === "healthcare")
    .reduce((sum, a) => sum + Math.max(0, a.utilization - 100), 0);

  const depth = traversal.levels.length;
  const recoveryBase = initialFailures.reduce((sum, id) =>
    sum + (network.assets.find(a => a.id === id)?.recoveryHours ?? 24), 0);
  const recoveryHours = Math.round(
    Math.max(6, recoveryBase * (1 + depth * 0.18) * (scenario.outageHours ? Math.max(1, scenario.outageHours / 24) : 1))
  );

  const mitigationId = scenario.mitigation;
  const mitigationGain = mitigationId === "backup_generation" ? 12 : mitigationId === "alternate_route" ? 10 : mitigationId === "mobile_medical" ? 7 : 0;
  const impact = Math.min(85,
    initialFailures.length * 10 +
    affectedIds.length * 5 +
    depth * 6 +
    criticalServicesAffected * 4 +
    Math.min(15, healthcareOverload)
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
      assetIds: ids.filter(id => !failed.has(id)),
      label: i === 0 ? "Direct impact" : i === 1 ? "Secondary impact" : "System effect",
      reason: "Downstream dependencies experienced reduced capacity or accessibility."
    })).filter(x => x.assetIds.length)
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
    recoveryHours: Math.max(6, Math.round(recoveryHours * (mitigationId ? (mitigationId === "backup_generation" ? 0.72 : mitigationId === "alternate_route" ? 0.76 : 0.84) : 1))),
    emergencyResponseMinutes: traffic.responseMinutes,
    healthcareOverload: Math.round(healthcareOverload),
    districtRisk: districtRisk(network),
    timeline,
    criticality: criticality(network).slice(0, 10),
    bottlenecks: bottlenecks(network).slice(0, 10),
    mitigation: buildMitigation(network, affectedAssets, resilienceScore, populationExposed, recoveryHours)
  };
}

function buildMitigation(
  network: NetworkModel,
  affectedAssets: string[],
  score: number,
  exposure: number,
  recovery: number
) {
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
  return options.map(o => ({
    ...o,
    projectedResilience: Math.min(100, score + o.resilienceGain),
    projectedRecoveryHours: Math.max(6, recovery - o.recoveryReductionHours)
  })).sort((a,b) => b.resilienceGain - a.resilienceGain);
}
