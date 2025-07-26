import prisma from "../lib/prisma.js";
import { mqttClient } from "../lib/mqttclient.js";

export async function createDrone(req, res) {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: false,
        message: "Missing request body",
      });
    }
    const { name, drone_id, area_id } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        message:
          'Invalid input: "name" is required and must be a non-empty string.',
      });
    }

    if (!drone_id || typeof drone_id !== "string" || drone_id.trim() === "") {
      return res.status(400).json({
        status: false,
        message:
          'Invalid input: "drone_id" is required and must be a non-empty string.',
      });
    }

    if (!area_id || typeof area_id !== "string" || area_id.trim() === "") {
      return res.status(400).json({
        status: false,
        message:
          'Invalid input: "area_id" is required and must be a non-empty string.',
      });
    }

    // Find area by area_id
    const area = await prisma.area.findUnique({
      where: { area_id: area_id },
    });

    if (!area) {
      return res.status(404).json({
        status: false,
        message: "Area with the provided ID does not exist.",
      });
    }

    // Check if drone with same ID or name exists
    const droneExists = await prisma.drone.findFirst({
      where: {
        OR: [{ drone_id: drone_id }, { name: name }],
      },
    });

    if (droneExists) {
      return res.status(404).json({
        status: false,
        message: "Drone with the provided ID or name already exists.",
      });
    }

    // Create new drone
    const drone = await prisma.drone.create({
      data: {
        name,
        drone_id,
        area_id,
        areaRef: area.id, // Connect to area using its ID
      },
    });

    res.status(201).json({
      status: true,
      message: "Drone added Successfully",
      data: drone,
    });
  } catch (error) {
    console.log("Error at controllers/droneController/createDrone: ", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}

export async function getAllDrones(req, res) {
  try {
    const drones = await prisma.drone.findMany({
      include: {
        area: true, // Include related area data
      },
    });

    if (!drones || drones.length === 0) {
      return res.status(404).json({ status: true, message: "No drones found" });
    }

    res.status(200).json({
      status: true,
      message: "Drones Fetched Successfully",
      data: drones,
    });
  } catch (error) {
    console.log("Error at controllers/droneController/getAllDrones: ", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}

export async function sendDrone(req, res) {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: false,
        message: "Missing request body",
      });
    }

    const { drone_id, area_id, latitude, longitude, altitude } = req.body;

    if (!drone_id || typeof drone_id !== "string" || drone_id.trim() === "") {
      return res.status(400).json({
        status: false,
        message:
          'Invalid input: "drone_id" is required and must be a non-empty string.',
      });
    }

    if (!area_id || typeof area_id !== "string" || area_id.trim() === "") {
      return res.status(400).json({
        status: false,
        message:
          'Invalid input: "area_id" is required and must be a non-empty string.',
      });
    }

    if (!latitude || !longitude || !altitude) {
      return res.status(400).json({
        status: false,
        message:
          'Invalid input: "latitude", "longitude", and "altitude" are required.',
      });
    }

    // Check if drone exists
    const droneExists = await prisma.drone.findUnique({
      where: { drone_id: drone_id },
    });

    if (!droneExists) {
      return res.status(404).json({
        status: false,
        message: "Drone with the provided ID does not exist.",
      });
    }

    // Check if area exists
    const areaExists = await prisma.area.findUnique({
      where: { area_id: area_id },
    });

    if (!areaExists) {
      return res.status(404).json({
        status: false,
        message: "Area with the provided ID does not exist.",
      });
    }

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      typeof altitude !== "number"
    ) {
      return res.status(400).json({
        status: false,
        message:
          "Invalid input: latitude, longitude, and altitude must all be numbers.",
      });
    }

    const droneData = {
      drone_id,
      area_id,
      latitude,
      longitude,
      altitude,
    };

    const topic = process.env.MQTT_BROKER_TOPIC;

    // Publish to MQTT
    mqttClient.publish(topic, JSON.stringify(droneData), (err) => {
      if (err) {
        console.error("MQTT Publish Error:", err);
        return res
          .status(500)
          .json({ status: false, message: "Failed to send data to drone." });
      }

      return res.status(200).json({
        status: true,
        message: "Drone data sent successfully",
        data: droneData,
      });
    });
  } catch (error) {
    console.error("Error at controllers/droneControllers/sendDrone:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

export async function dropPayload(req, res) {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: false,
        message: "Missing request body",
      });
    }

    const { drone_id, area_id } = req.body;

    if (!drone_id || typeof drone_id !== "string" || drone_id.trim() === "") {
      return res.status(400).json({
        status: false,
        message:
          'Invalid input: "drone_id" is required and must be a non-empty string.',
      });
    }

    if (!area_id || typeof area_id !== "string" || area_id.trim() === "") {
      return res.status(400).json({
        status: false,
        message:
          'Invalid input: "area_id" is required and must be a non-empty string.',
      });
    }

    // Check if drone exists
    const droneExists = await prisma.drone.findUnique({
      where: { drone_id: drone_id },
    });

    if (!droneExists) {
      return res.status(404).json({
        status: false,
        message: "Drone with the provided ID does not exist.",
      });
    }

    // Check if area exists
    const areaExists = await prisma.area.findUnique({
      where: { area_id: area_id },
    });

    if (!areaExists) {
      return res.status(404).json({
        status: false,
        message: "Area with the provided ID does not exist.",
      });
    }

    const dropData = {
      drone_id,
      area_id,
    };

    const topic = process.env.MQTT_BROKER_TOPIC;

    mqttClient.publish(topic, JSON.stringify(dropData), (err) => {
      if (err) {
        console.error("MQTT Publish Error:", err);
        return res
          .status(500)
          .json({ status: false, message: "Failed to send command to drone." });
      }

      return res.status(200).json({
        status: true,
        message: "Drone drop command sent successfully.",
        data: dropData,
      });
    });
  } catch (error) {
    console.error("Error at controllers/droneControllers/dropPayload:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

export async function getAreaByDroneId(req, res) {
  try {
    const { drone_id } = req.params;

    if (!drone_id || typeof drone_id !== "string") {
      return res.status(400).json({
        status: false,
        message: "Invalid or missing drone ID.",
      });
    }

    // Find drone including its associated area
    const drone = await prisma.drone.findUnique({
      where: { drone_id: drone_id },
      include: {
        area: true,
      },
    });

    if (!drone) {
      return res.status(404).json({
        status: false,
        message: "Drone not found.",
      });
    }

    const area = drone.area;
    if (!area) {
      return res.status(404).json({
        status: false,
        message: "Associated area not found for this drone.",
      });
    }

    res.status(200).json({
      status: true,
      message: "Area fetched successfully.",
      data: area,
    });
  } catch (error) {
    console.error("Error in getAreaByDroneId:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error.",
    });
  }
}

export async function updateDrone(req, res) {
  try {
    if (!req.body) {
      return res.status(400).json({
        status: false,
        message: "Missing request body",
      });
    }
    const { id } = req.params;
    const { name, drone_id, area_id } = req.body;

    // Validate ID
    const droneId = parseInt(id);
    if (!droneId || isNaN(droneId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid drone ID format.",
      });
    }

    // Validate other fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        status: false,
        message:
          'Invalid input: "name" is required and must be a non-empty string.',
      });
    }

    if (!drone_id || typeof drone_id !== "string" || drone_id.trim() === "") {
      return res.status(400).json({
        status: false,
        message:
          'Invalid input: "drone_id" is required and must be a non-empty string.',
      });
    }

    if (!area_id || typeof area_id !== "string" || area_id.trim() === "") {
      return res.status(400).json({
        status: false,
        message:
          'Invalid input: "area_id" is required and must be a non-empty string.',
      });
    }

    // Find the drone
    const existingDrone = await prisma.drone.findUnique({
      where: { id: droneId },
    });

    if (!existingDrone) {
      return res.status(404).json({
        status: false,
        message: "Drone with the provided ID does not exist.",
      });
    }

    // Find the area if area_id is provided
    let areaRef;
    if (area_id) {
      const area = await prisma.area.findUnique({
        where: { area_id: area_id },
      });

      if (!area) {
        return res.status(404).json({
          status: false,
          message: "Area with the provided ID does not exist.",
        });
      }
      areaRef = area.id;
    }

    // Update the drone
    const updatedDrone = await prisma.drone.update({
      where: { id: droneId },
      data: {
        name,
        drone_id,
        area_id,
        areaRef: areaRef || existingDrone.areaRef,
      },
    });

    res.status(200).json({
      status: true,
      message: "Drone updated successfully",
      data: updatedDrone,
    });
  } catch (error) {
    console.log("Error at controllers/droneController/updateDrone: ", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}

export async function deleteDrone(req, res) {
  try {
    const { id } = req.params;

    // Validate ID
    const droneId = parseInt(id);
    if (!droneId || isNaN(droneId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid drone ID format.",
      });
    }

    // Find and delete the drone
    const drone = await prisma.drone.delete({
      where: { id: droneId },
    });

    if (!drone) {
      return res.status(404).json({
        status: false,
        message: "Drone with the provided ID does not exist.",
      });
    }

    res.status(200).json({
      status: true,
      message: "Drone deleted successfully",
      data: drone,
    });
  } catch (error) {
    console.log("Error at controllers/droneController/deleteDrone: ", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}
