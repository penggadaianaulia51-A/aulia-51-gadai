import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      appName: "AULIA 51 GADAI",
      time: new Date().toISOString(),
      sheetId: "1XCK7FPFOn954Uv9DDMDR86bUvivTZBj8_gwCGtWB-aA",
      driveFolderId: "1eHS4ciGArpVXE429Nom6YI4aY0Wk2HlG",
    });
  });

  // Vite middleware for development or static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AULIA 51 GADAI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
