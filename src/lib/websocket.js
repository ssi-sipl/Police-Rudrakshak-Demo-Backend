import { WebSocketServer, WebSocket } from "ws";

let wss;

export function setupWebSocket(server) {
  wss = new WebSocketServer({ server });
  wss.on("connection", (ws) => {
    console.log("Welcome WebSocket client!");
    ws.on("close", () => console.log("WebSocket client disconnected!"));
  });
}

export function broadcastAlert(alert) {
  if (!wss) return;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(alert));
    }
  });
}
