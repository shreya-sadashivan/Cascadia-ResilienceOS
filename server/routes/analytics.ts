import { Router } from "express";
import { createNetwork } from "../data/assets";
import { criticality, bottlenecks } from "../simulation/analytics";

export const analyticsRouter = Router();

analyticsRouter.get("/criticality", (_req, res) => {
  res.json(criticality(createNetwork()));
});

analyticsRouter.get("/bottlenecks", (_req, res) => {
  res.json(bottlenecks(createNetwork()));
});
