// mqttClient.js
import mqtt from "mqtt";
import prisma from "./prisma.js";
import { broadcastAlert, broadcastLocation } from "./websocket.js";
import { supabase } from "./supabase.js";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { getActiveSessionId } from "./sessionManager.js";

const {
  MQTT_BROKER_URL,
  MQTT_BROKER_PORT,
  MQTT_BROKER_USERNAME,
  MQTT_BROKER_PASSWORD,
  MQTT_BROKER_TOPIC,
  MQTT_COORDINATE_TOPIC,
} = process.env;

const client = mqtt.connect(MQTT_BROKER_URL, {
  port: MQTT_BROKER_PORT,
  username: MQTT_BROKER_USERNAME,
  password: MQTT_BROKER_PASSWORD,
});

client.on("connect", () => {
  console.log("✅ MQTT connected");
  try {
    client.subscribe(MQTT_BROKER_TOPIC);
    console.log(`📡 Subscribed to ${MQTT_BROKER_TOPIC}`);
  } catch (err) {
    console.error(
      `❌ Failed to subscribe to ${MQTT_BROKER_TOPIC}:`,
      err.message
    );
    return;
  }
  try {
    client.subscribe(MQTT_COORDINATE_TOPIC);
    console.log(`📡 Subscribed to ${MQTT_COORDINATE_TOPIC}`);
  } catch (err) {
    console.error(
      `❌ Failed to subscribe to ${MQTT_BROKER_TOPIC}:`,
      err.message
    );
    return;
  }
});

client.on("message", async (topic, message) => {
  let sessionId;
  if (topic === MQTT_BROKER_TOPIC) {
    // Handle alert messages
    try {
      sessionId = await getActiveSessionId();
      console.log("📂 Active session ID:", sessionId);
      if (sessionId === null) {
        console.error("❌ No active session found. Cannot process alert.");
        return;
      }
    } catch (err) {
      console.error(
        "❌ Error in MQTT message handler (Error fetching the active session):",
        err
      );
      return;
    }

    try {
      // Step 1: Read metadata length
      let metadataLength;
      try {
        metadataLength = message.readUInt32BE(0);
        console.log("📏 Metadata length:", metadataLength);
      } catch (err) {
        console.error("❌ Failed to read metadata length:", err);
        return;
      }

      // Step 2: Extract and parse metadata
      let metadata;
      try {
        const metadataStart = 4;
        const metadataEnd = metadataStart + metadataLength;
        const metadataBuffer = message.slice(metadataStart, metadataEnd);
        const metadataJson = metadataBuffer.toString("utf-8");
        metadata = JSON.parse(metadataJson);
        console.log("📄 Metadata parsed:", metadata);
      } catch (err) {
        console.error("❌ Failed to parse metadata:", err);
        return;
      }

      // console.log("📩 Received MQTT message with metadata:", metadata);
      const { type, message: alertMessage, confidence, drone_id } = metadata;

      // Step 3: Extract image buffer
      let imageBuffer;
      try {
        imageBuffer = message.slice(4 + metadataLength);
      } catch (err) {
        console.error("❌ Failed to extract image buffer:", err);
        return;
      }

      // Step 4: Create file name and storage path
      const fileName = `image_${Date.now()}.jpg`;
      const storagePath = `alerts/${fileName}`;

      // Step 5: Upload to Supabase
      let uploadResult;
      try {
        uploadResult = await supabase.storage
          .from("images")
          .upload(storagePath, imageBuffer, {
            contentType: "image/jpeg",
            upsert: true,
            cacheControl: "3600",
          });

        if (uploadResult.error) {
          console.error(
            "❌ Upload to Supabase failed:",
            uploadResult.error.message
          );
          return;
        }

        console.log("✅ Uploaded to Supabase Storage:", fileName);
      } catch (err) {
        console.error("❌ Upload exception:", err);
        return;
      }

      // ✅ Step 6: Wait for CDN to update
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5 second delay

      // Step 7: Get public URL after delay
      let publicUrl;
      try {
        const { data: publicUrlData, error: urlError } = supabase.storage
          .from("images")
          .getPublicUrl(storagePath);

        if (urlError) {
          console.error("❌ Failed to get public URL:", urlError.message);
          return;
        }

        publicUrl = publicUrlData.publicUrl;
      } catch (err) {
        console.error("❌ Public URL generation failed:", err);
        return;
      }

      // Step 8: Create alert in DB
      try {
        const drone = await prisma.drone.findUnique({
          where: { drone_id: drone_id },
        });
        if (!drone) {
          return console.error("❌ Drone not found");
        }

        const newAlert = await prisma.alert.create({
          data: {
            type,
            message: alertMessage,
            confidence: parseFloat(confidence),
            image: publicUrl,
            drone: {
              connect: { id: drone.id },
            },
            session: {
              connect: { id: sessionId },
            },
          },
        });

        try {
          broadcastAlert(newAlert);
        } catch (err) {
          console.error("❌ Failed to broadcast alert:", err.message);
          return;
        }
        console.log("✅ New alert created:", newAlert);
        //     console.log("✅ Alert broadcasted to WebSocket clients");
      } catch (err) {
        console.error("❌ Failed to store alert or broadcast:", err);
      }
    } catch (err) {
      console.error("❌ Uncaught error in message handler:", err);
    }
  } else if (topic === MQTT_COORDINATE_TOPIC) {
    // Handle coordinate updates
    try {
      if (message.length === 0) {
        console.error("❌ Received empty coordinate message");
        return;
      }
      const coordinateData = JSON.parse(message.toString());
      console.log("📍 Received coordinate update:", coordinateData);

      // Broadcast the location data to WebSocket clients
      try {
        broadcastLocation(coordinateData);
        console.log("✅ Location broadcasted to WebSocket clients");
      } catch (err) {
        console.error("❌ Failed to broadcast location:", err.message);
      }
    } catch (err) {
      console.error("❌ Error processing coordinate message:", err);
    }
  }
});

export { client as mqttClient };
