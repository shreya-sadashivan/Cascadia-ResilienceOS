import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { networkRouter } from "./routes/network";
import { simulationRouter } from "./routes/simulation";
import { analyticsRouter } from "./routes/analytics";
import { scenariosRouter } from "./routes/scenarios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = createServer(app);

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

const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
app.use(express.static(staticPath));
app.get("*", (_req, res) => res.sendFile(path.join(staticPath, "index.html")));

const port = Number(process.env.PORT || 3001);
server.listen(port, () => console.log(`ResilienceOS server running on http://localhost:${port}`));
