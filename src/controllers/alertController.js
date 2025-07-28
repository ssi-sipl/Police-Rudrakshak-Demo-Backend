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

export const createAlert = async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ status: false, message: "Request body is undefined" });
    }
    const { type, message, confidence, drone_id } = req.body;

    if (!type || !message || !confidence || !drone_id) {
      return res
        .status(400)
        .json({ status: false, message: "Missing required fields" });
    }

    // Check if drone exists
    const drone = await prisma.drone.findUnique({
      where: { drone_id: drone_id },
    });
    if (!drone) {
      return res
        .status(404)
        .json({ status: false, message: "Drone not found" });
    }

    const newAlert = await prisma.alert.create({
      data: {
        type,
        message,
        confidence: parseFloat(confidence),
        drone: {
          connect: { id: drone.id },
        },
      },
    });

    try {
      broadcastAlert(newAlert);
    } catch (err) {
      console.error("❌ Failed to broadcast alert:", err.message);
      return res.status(500).json({
        status: false,
        message: "Failed to broadcast alert",
      });
    }

    return res.status(201).json({
      status: true,
      message: "Alert Created and Send to the UI",
      data: newAlert,
    });
  } catch (error) {
    console.error("Error at controllers/alertController/createAlert:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error" });
  }
};

export async function getAlertsByDroneId(req, res) {
  try {
    console.log("🚁 Fetching alerts for drone ID:", req.params);
    const droneId = parseInt(req.params.droneId, 10);

    console.log("🚁 Fetching alerts for drone ID:", droneId);
    if (!droneId) {
      return res
        .status(400)
        .json({ status: false, message: "Drone ID is required" });
    }
    if (isNaN(droneId)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid Drone ID format" });
    }
    const alerts = await prisma.alert.findMany({
      where: { droneId: droneId },
      orderBy: { createdAt: "desc" }, // newest first`
    });

    res.status(200).json({ status: true, data: alerts });
  } catch (err) {
    console.error(
      "Error at controllers/alertController/getAlertsByDroneId:",
      err
    );
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
