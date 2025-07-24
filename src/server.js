import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import { setupWebSocket } from "./lib/websocket.js";
import alertRouter from "./routes/alertRouter.js";
import "./lib/mqttclient.js"; 

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// Routes
// app.use("/api/alerts", alertRoutes);
app.use("/api/alert", alertRouter);

// WebSocket
setupWebSocket(server);

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
