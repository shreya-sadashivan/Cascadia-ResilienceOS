import { Router } from "express";
import { createNetwork } from "../data/assets";

export const networkRouter = Router();

networkRouter.get("/", (_req, res) => {
  res.json(createNetwork());
});
