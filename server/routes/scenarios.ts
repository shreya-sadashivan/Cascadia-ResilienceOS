import { Router } from "express";
import { createNetwork } from "../data/assets";
import { simulate } from "../simulation/cascade";
import type { ScenarioInput } from "../types/infrastructure";

export const scenariosRouter = Router();

const presets: Record<string, ScenarioInput> = {
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
  const scenario = presets[req.params.name as keyof typeof presets];
  if (!scenario) return res.status(404).json({ error: "Unknown scenario" });
  res.json(simulate(createNetwork(), scenario));
});
