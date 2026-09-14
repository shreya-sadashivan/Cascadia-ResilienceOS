import type { NetworkModel } from "../types/infrastructure";
import { descendants, outgoing } from "./graph";

export function criticality(network: NetworkModel) {
  const totalPopulation = network.assets.reduce((s, a) => s + a.populationServed, 0);
  return network.assets
    .filter(a => a.category !== "population")
    .map(a => {
      const downstreamNodes = descendants(network, [a.id]).nodes;
      const reach = downstreamNodes.length - 1;
      const criticalDownstream = downstreamNodes
        .map(id => network.assets.find(x => x.id === id))
        .filter(Boolean)
        .filter(x => x!.criticalService).length;
      const exposure = Math.min(100, (a.populationServed / Math.max(totalPopulation,1)) * 600);
      const redundancy = Math.min(100, outgoing(network, a.id).length * 25);
      const score = Math.round(
        a.importance * 0.45 +
        Math.min(100, reach * 7) * 0.25 +
        exposure * 0.2 +
        (100 - redundancy) * 0.1
      );
      return {
        id: a.id, name: a.name, category: a.category, district: a.district,
        score: Math.min(100, score), populationExposure: a.populationServed,
        downstreamDependencies: reach, criticalServices: criticalDownstream,
        redundancy: Math.round(redundancy)
      };
    })
    .sort((a,b) => b.score - a.score);
}

export function bottlenecks(network: NetworkModel) {
  return network.edges.map(e => {
    const downstream = descendants(network, [e.target]).nodes.length - 1;
    const score = Math.round(e.strength * 65 + Math.min(35, downstream * 3));
    return {
      edgeId: e.id, source: e.source, target: e.target, strength: e.strength,
      downstreamReach: downstream, score: Math.min(100, score),
      alternativeRoutes: Math.max(0, Math.floor((1 - e.strength) * 4))
    };
  }).sort((a,b) => b.score - a.score);
}

export function districtRisk(network: NetworkModel) {
  const result: Record<string, number> = {};
  for (const a of network.assets) {
    result[a.district] = Math.max(result[a.district] ?? 0, a.importance);
  }
  return result;
}
