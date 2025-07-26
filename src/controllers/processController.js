import { mqttClient } from "../lib/mqttclient.js";

export async function controlDetectionProcess(req, res) {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ status: false, message: "Request body is undefined" });
    }
    const { action } = req.body;
    if (!["on", "off"].includes(action)) {
      return res
        .status(400)
        .json({ error: "Invalid action. Use 'on' or 'off'" });
    }
    const topic = process.env.MQTT_PROCESS_DETECTION_TOPIC;
    mqttClient.publish(topic, action, {}, (err) => {
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
    const { action } = req.body;
    if (!["on", "off"].includes(action)) {
      return res
        .status(400)
        .json({ error: "Invalid action. Use 'on' or 'off'" });
    }
    const topic = process.env.MQTT_PROCESS_FACIAL_RECOGNITION_TOPIC;
    mqttClient.publish(topic, action, {}, (err) => {
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
