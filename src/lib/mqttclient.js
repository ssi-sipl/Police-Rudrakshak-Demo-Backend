// mqttClient.js
import mqtt from "mqtt";
import prisma from "./prisma.js";
import { broadcastAlert } from "./websocket.js";

const {
  MQTT_BROKER_URL,
  MQTT_BROKER_PORT,
  MQTT_BROKER_USERNAME,
  MQTT_BROKER_PASSWORD,
  MQTT_BROKER_TOPIC,
} = process.env;

const client = mqtt.connect(MQTT_BROKER_URL, {
  port: MQTT_BROKER_PORT,
  username: MQTT_BROKER_USERNAME,
  password: MQTT_BROKER_PASSWORD,
});

client.on("connect", () => {
  console.log("✅ MQTT connected");
  client.subscribe(MQTT_BROKER_TOPIC);
});

client.on("message", async (topic, payload) => {
  try {
    const alertData = JSON.parse(payload.toString());
    console.log("📩 Received MQTT message:", alertData);
    const { type, message, image, confidence } = alertData;

    if (!type || !message || !image || !confidence) {
      console.error("❌ Missing fields in MQTT message");
      return;
    }

    const newAlert = await prisma.alert.create({
      data: { type, message, image, confidence },
    });
    console.log("✅ New alert created:", newAlert);
    // Broadcast to WebSocket clients
    broadcastAlert(newAlert);

    console.log("✅ Alert broadcasted to WebSocket clients");
  } catch (err) {
    console.error("❌ Failed to process MQTT message:", err.message);
  }
});
