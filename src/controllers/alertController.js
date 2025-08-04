import prisma from "../lib/prisma.js";
import { supabase } from "../lib/supabase.js";
import { broadcastAlert } from "../lib/websocket.js";
import { v4 as uuidv4 } from "uuid";

export const createAlert = async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ status: false, message: "Request body is undefined" });
    }

    const { type, message, confidence, drone_id, image } = req.body;

    if (!type || !message || !confidence || !drone_id) {
      return res
        .status(400)
        .json({ status: false, message: "Missing required fields" });
    }

    // Step 1: Check if drone exists
    const drone = await prisma.drone.findUnique({
      where: { drone_id: drone_id },
    });

    if (!drone) {
      return res
        .status(404)
        .json({ status: false, message: "Drone not found" });
    }

    let publicUrl = null;

    // Step 2: Handle image if present
    if (image) {
      try {
        const imageBuffer = Buffer.from(image, "base64");
        const fileName = `image_${Date.now()}_${uuidv4()}.jpg`;
        const storagePath = `alerts/${fileName}`;

        const uploadResult = await supabase.storage
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
          return res
            .status(500)
            .json({ status: false, message: "Failed to upload image" });
        }

        // Optional delay to ensure CDN propagates
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const { data: publicUrlData, error: urlError } = supabase.storage
          .from("images")
          .getPublicUrl(storagePath);

        if (urlError) {
          console.error("❌ Failed to get public URL:", urlError.message);
          return res
            .status(500)
            .json({ status: false, message: "Failed to get public URL" });
        }

        publicUrl = publicUrlData.publicUrl;
      } catch (err) {
        console.error("❌ Image upload exception:", err);
        return res
          .status(500)
          .json({ status: false, message: "Image processing failed" });
      }
    }

    // Step 3: Create alert in database
    const newAlert = await prisma.alert.create({
      data: {
        type,
        message,
        confidence: parseFloat(confidence),
        image: publicUrl || undefined,
        drone: {
          connect: { id: drone.id },
        },
      },
    });

    // Step 4: Broadcast
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
      message: "Alert Created and Sent to UI",
      data: newAlert,
    });
  } catch (error) {
    console.error("Error at controllers/alertController/createAlert:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error" });
  }
};

export const handleFacioMatcherAlert = async (req, res) => {
  try {
    if (!req.body) {
      console.log("🚁 Request body is undefined");
      return res
        .status(400)
        .json({ status: false, message: "Request body is undefined" });
    }

    const drone_id = req.params.droneId;
    if (!drone_id) {
      console.log("🚁 Missing drone_id in request params");
      return res
        .status(400)
        .json({ status: false, message: "Invalid Drone ID format" });
    }
    const {
      ts,
      detectedMug64,
      detectedGender,
      matchedMug64,
      matchedScore,
      matchedName64,
      matchedCategory64,
    } = req.body;

    if (
      !ts ||
      !detectedMug64 ||
      !detectedGender ||
      !matchedMug64 ||
      !matchedScore ||
      !matchedName64 ||
      !matchedCategory64
    ) {
      console.log("🚁 Missing required fields in request body");
      return res
        .status(400)
        .json({ status: false, message: "Missing required fields" });
    }
    const type = "person";
    const name = Buffer.from(matchedName64, "base64").toString("utf-8");
    const message = `Detected ${name} (${detectedGender})`;
    const confidence = parseFloat(matchedScore);
    const mugBase64 = detectedMug64.replace(/^data:image\/\w+;base64,/, "");
    const mugBuffer = Buffer.from(mugBase64, "base64");
    const mugFileName = `mugs/mug_${Date.now()}.jpg`;
    const mugStoragePath = mugFileName;

    if (!type || !message || !confidence || !drone_id) {
      console.log("🚁 Missing required fields for alert creation");
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

    const mugUploadResult = await supabase.storage
      .from("images") // or use a separate bucket like 'mugs' if needed
      .upload(mugStoragePath, mugBuffer, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "3600",
      });

    let publicMugUrl = null;
    if (mugUploadResult.error) {
      console.log(
        "❌ Failed to upload mug image:",
        mugUploadResult.error.message
      );
    } else {
      console.log("✅ Mug image uploaded:", mugFileName);

      // Optionally get public URL for mugshot
      const { data: mugUrlData, error: mugUrlError } = supabase.storage
        .from("images")
        .getPublicUrl(mugStoragePath);

      if (mugUrlError) {
        console.error("❌ Failed to get mug image URL:", mugUrlError.message);
        return res
          .status(500)
          .json({ status: false, message: "Failed to get mug image URL" });
      } else {
        console.log("🌐 Mugshot URL:", mugUrlData.publicUrl);
        publicMugUrl = mugUrlData.publicUrl;
      }
    }

    const newAlert = await prisma.alert.create({
      data: {
        type,
        message,
        confidence: parseFloat(confidence),
        image: publicMugUrl,
        source: "offboard",
        drone: {
          connect: { id: drone.id },
        },
      },
    });

    try {
      // broadcastAlert(newAlert);
      broadcastAlert(newAlert, "offboard");
    } catch (err) {
      console.log("❌ Failed to broadcast alert:", err.message);
      return res.status(500).json({
        status: false,
        message: "Failed to broadcast alert",
      });
    }

    console.log("🚁 Alert created and broadcasted:", newAlert);
    return res.status(201).json({
      status: true,
      message: "Alert Created and Send to the UI",
      data: newAlert,
    });
  } catch (error) {
    console.log(
      "Error at controllers/alertController/handleFacioMatcherAlert:",
      error
    );
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
