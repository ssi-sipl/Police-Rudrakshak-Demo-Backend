import { WebSocketServer, WebSocket } from "ws";

let wss;

export function setupWebSocket(server) {
  wss = new WebSocketServer({ server });
  wss.on("connection", (ws) => {
    console.log("Welcome WebSocket client!");
    ws.on("close", () => console.log("WebSocket client disconnected!"));
  });
}

export function broadcastAlert(alert, source = "onboard") {
  if (!wss) return;
  const payload = { type: "alert", source: source, data: alert };
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  });
}

export function broadcastLocation(data) {
  if (!wss) return;

  const payload = { type: "location", data };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
