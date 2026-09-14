export type AssetStatus = "operational" | "degraded" | "overloaded" | "failed" | "recovering";
export type AssetCategory =
  | "power" | "water" | "transport" | "healthcare"
  | "telecom" | "emergency" | "population";

export interface InfrastructureAsset {
  id: string;
  name: string;
  category: AssetCategory;
  district: string;
  lat: number;
  lng: number;
  capacity: number;
  utilization: number;
  populationServed: number;
  recoveryHours: number;
  criticalService: boolean;
  status: AssetStatus;
  importance: number;
  metadata?: Record<string, unknown>;
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  type: "dependency" | "transport" | "supply";
  strength: number;
  capacity?: number;
  travelTimeMinutes?: number;
  utilization?: number;
}

export interface NetworkModel {
  assets: InfrastructureAsset[];
  edges: DependencyEdge[];
}

export interface ScenarioInput {
  failedAssets?: string[];
  hazards?: Array<{
    type: string;
    severity: number;
    district?: string;
  }>;
  severity?: "minor" | "major" | "complete";
  outageHours?: number;
  mitigation?: string;
}

export interface SimulationResult {
  scenarioId: string;
  failedAssets: string[];
  affectedAssets: string[];
  overloadedAssets: string[];
  cascadeDepth: number;
  populationExposed: number;
  criticalServicesAffected: number;
  resilienceScore: number;
  recoveryHours: number;
  emergencyResponseMinutes: number;
  healthcareOverload: number;
  districtRisk: Record<string, number>;
  timeline: Array<{
    level: number;
    assetIds: string[];
    label: string;
    reason: string;
  }>;
  criticality: Array<Record<string, unknown>>;
  bottlenecks: Array<Record<string, unknown>>;
  mitigation: Array<Record<string, unknown>>;
}
