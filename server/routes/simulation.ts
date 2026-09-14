import { Router } from "express";
import { z } from "zod";
import { createNetwork } from "../data/assets";
import { simulate } from "../simulation/cascade";

export const simulationRouter = Router();

const scenarioSchema = z.object({
  failedAssets: z.array(z.string()).optional(),
  hazards: z.array(z.object({
    type: z.string(),
    severity: z.number().min(0).max(1),
    district: z.string().optional(),
  })).optional(),
  severity: z.enum(["minor", "major", "complete"]).optional(),
  outageHours: z.number().min(0).optional(),
  mitigation: z.string().optional(),
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
