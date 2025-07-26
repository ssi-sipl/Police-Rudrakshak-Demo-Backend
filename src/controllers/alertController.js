import prisma from "../lib/prisma.js";
import { broadcastAlert } from "../lib/websocket.js";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase.js";

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

    // Handle base64 image saving
    // Handle raw base64 image saving
    // let savedImagePath = null;
    // try {
    //   const buffer = Buffer.from(image, "base64"); // no prefix stripping needed

    //   const fileName = `${uuidv4()}.jpg`; // change to .png or .webp if needed
    //   const uploadDir = path.join(process.cwd(), "public", "uploads");

    //   // Ensure the directory exists
    //   fs.mkdirSync(uploadDir, { recursive: true });

    //   const filePath = path.join(uploadDir, fileName);
    //   fs.writeFileSync(filePath, buffer);

    //   savedImagePath = `/uploads/${fileName}`;
    // } catch (err) {
    //   console.error("Image save failed:", err);
    //   return res.status(500).json({ error: "Failed to save image" });
    // }

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

export async function getAlertById(req, res) {
  const { id } = req.params;
  try {
    const alert = await prisma.alert.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!alert) {
      return res
        .status(404)
        .json({ status: false, message: "Alert not found" });
    }
    res.status(200).json({ status: true, data: alert });
  } catch (err) {
    console.error("Error at controllers/alertController/getAlertById:", err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}
