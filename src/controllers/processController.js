import { mqttClient } from "../lib/mqttclient.js";

export async function controlDetectionProcess(req, res) {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ status: false, message: "Request body is undefined" });
    }
    const { action, drone_id } = req.body;
    if (!["on", "off"].includes(action)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid action. Use 'on' or 'off'" });
    }
    if (!drone_id) {
      return res
        .status(400)
        .json({ status: false, message: "Drone ID is required" });
    }
    const topic = process.env.MQTT_PROCESS_DETECTION_TOPIC;
    const payload = JSON.stringify({ action, drone_id });
    mqttClient.publish(topic, payload, {}, (err) => {
      if (err) {
        console.error("❌ MQTT publish error:", err.message);
        return res
          .status(500)
          .json({ status: false, messsage: "Failed to publish MQTT message" });
      }

      console.log(`✅ Published '${action}' to ${topic}`);
      return res.status(200).json({
        status: true,
        message:
          action === "on"
            ? `Detection Process Will Start Now`
            : "Detection Process Will Stop Now.",
      });
    });
  } catch (error) {
    console.error("❌ Error in controlDetectionProcess:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function controlFacialRecognitionProcess(req, res) {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ status: false, message: "Request body is undefined" });
    }
    const { action, drone_id } = req.body;
    if (!["on", "off"].includes(action)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid action. Use 'on' or 'off'" });
    }
    if (!drone_id) {
      return res
        .status(400)
        .json({ status: false, message: "Drone ID is required" });
    }
    // Ensure the MQTT topic is set correctly
    const topic = process.env.MQTT_PROCESS_FACIAL_RECOGNITION_TOPIC;
    const payload = JSON.stringify({ action, drone_id });

    mqttClient.publish(topic, payload, {}, (err) => {
      if (err) {
        console.error("❌ MQTT publish error:", err.message);
        return res
          .status(500)
          .json({ status: false, messsage: "Failed to publish MQTT message" });
      }

      console.log(`✅ Published '${action}' to ${topic}`);
      return res.status(200).json({
        status: true,
        message:
          action === "on"
            ? `Face Recognition Process Will Start Now`
            : "Face Recognition Will Stop Now.",
      });
    });
  } catch (error) {
    console.error("❌ Error in controlDetectionProcess:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
