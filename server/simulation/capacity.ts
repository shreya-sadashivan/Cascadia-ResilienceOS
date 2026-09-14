import type { InfrastructureAsset, DependencyEdge } from "../types/infrastructure";

export function applyCapacityStress(
  assets: InfrastructureAsset[],
  edges: DependencyEdge[],
  failed: Set<string>,
  severityMultiplier: number
) {
  const affected = new Set<string>();
  const overloaded = new Set<string>();

  for (const edge of edges) {
    if (failed.has(edge.source)) {
      affected.add(edge.target);
      const target = assets.find(a => a.id === edge.target);
      if (!target) continue;

      const stress = edge.strength * severityMultiplier;
      target.utilization = Math.min(140, target.utilization + stress * 55);

      if (target.utilization >= 100) {
        target.status = "overloaded";
        overloaded.add(target.id);
      } else if (target.status === "operational") {
        target.status = "degraded";
      }
    }
  }

  // Healthcare surge: failed hospitals transfer demand to surviving hospitals.
  const hospitals = assets.filter(a => a.category === "healthcare");
  const failedHospitals = hospitals.filter(h => failed.has(h.id));
  if (failedHospitals.length) {
    const transferred = failedHospitals.reduce((sum, h) => sum + h.populationServed * 0.08, 0);
    const survivors = hospitals.filter(h => !failed.has(h.id));
    const share = survivors.length ? transferred / survivors.length : 0;
    for (const h of survivors) {
      h.utilization = Math.min(140, h.utilization + (share / Math.max(h.capacity, 1)) * 100);
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

export function trafficStress(
  assets: InfrastructureAsset[],
  edges: DependencyEdge[],
  failed: Set<string>,
  severityMultiplier: number
) {
  const transport = assets.filter(a => a.category === "transport");
  const failedTransport = transport.filter(a => failed.has(a.id));
  if (!failedTransport.length) return { responseMinutes: 9, overloadedRoads: [] as string[] };

  const road = transport.filter(a => !failed.has(a.id));
  const overload: string[] = [];
  for (const r of road) {
    r.utilization = Math.min(145, r.utilization + failedTransport.length * 8 * severityMultiplier);
    if (r.utilization >= 100) {
      r.status = "overloaded";
      overload.push(r.id);
    } else if (r.utilization > 85) {
      r.status = "degraded";
    }
  }

  return {
    responseMinutes: Math.round(9 + failedTransport.length * 5 * severityMultiplier + overload.length * 2),
    overloadedRoads: overload
  };
}
