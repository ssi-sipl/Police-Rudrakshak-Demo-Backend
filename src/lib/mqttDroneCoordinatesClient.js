import mqtt from "mqtt";
import { broadcastLocation } from "./websocket.js";

const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  console.log("MQTT connected: location listener");
  client.subscribe("location/coordinates");
});

client.on("message", (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    const { lat, long } = payload;

    if (lat && long) {
      broadcastLocation({ lat, long });
    }
  } catch (err) {
    console.error(" Invalid MQTT location message:", err.message);
  }
});

export default client;
