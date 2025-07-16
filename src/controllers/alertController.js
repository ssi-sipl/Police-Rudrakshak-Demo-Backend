import prisma from "../lib/prisma.js";
import { broadcastAlert } from "../lib/websocket.js";

export async function handleAlert(req, res) {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ status: false, message: "Request body is undefined" });
    }
    const { type, message, image, confidence } = req.body;

    if (!type || !message || !image || !confidence) {
      return res.status(400).json({ error: "Missing fields" });
    }

    try {
      const newAlert = await prisma.alert.create({
        data: { type, message, image, confidence },
      });
      console.log("New alert created:", newAlert);
      // Broadcast to WebSocket clients
      broadcastAlert(newAlert);

      res.status(201).json({
        status: true,
        message: "Alert Created and Send to the UI",
        data: newAlert,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } catch (err) {
    console.error("Error at controllers/alertController/handleAlert:", err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}

export async function getAlerts(req, res) {
  try {
    const alerts = await prisma.alert.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ status: true, data: alerts });
  } catch (err) {
    console.error("Error at controllers/alertController/getAlerts:", err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}

export async function deleteAllAlert(req, res) {
  try {
    await prisma.alert.deleteMany();
    res.status(200).json({ status: true, message: "All alerts deleted" });
  } catch (err) {
    console.error("Error at controllers/alertController/deleteAllAlert:", err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}
