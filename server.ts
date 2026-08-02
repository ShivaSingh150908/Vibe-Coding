import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // In-memory / file-backed sync vault store for cross-device cloud synchronization
  const syncVaults: Record<string, { data: any; updatedAt: string }> = {};

  // Cloud Sync GET Vault Data
  app.get("/api/sync/:vaultId", (req, res) => {
    const { vaultId } = req.params;
    const cleanId = vaultId.trim().toUpperCase();
    
    if (syncVaults[cleanId]) {
      return res.json({
        success: true,
        vaultId: cleanId,
        data: syncVaults[cleanId].data,
        updatedAt: syncVaults[cleanId].updatedAt,
      });
    }

    return res.status(404).json({
      success: false,
      message: "Sync vault not found. Push your local data first to initialize this Sync Key.",
    });
  });

  // Cloud Sync POST/PUT Vault Data
  app.post("/api/sync/:vaultId", (req, res) => {
    const { vaultId } = req.params;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ success: false, message: "Missing sync payload data" });
    }

    const cleanId = vaultId.trim().toUpperCase();
    const timestamp = new Date().toISOString();

    syncVaults[cleanId] = {
      data,
      updatedAt: timestamp,
    };

    return res.json({
      success: true,
      vaultId: cleanId,
      updatedAt: timestamp,
      message: "Cloud Sync vault updated successfully across devices",
    });
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "STEM Study Tracker Server", time: new Date().toISOString() });
  });

  // Vite middleware for dev or static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`STEM Study Tracker Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
