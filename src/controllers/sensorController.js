import prisma from "../lib/prisma.js";

// Create a new sensor
export const createSensor = async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ status: false, message: "Request body is required." });
    }
    const { name, area_id, sensor_id, latitude, longitude } = req.body;

    // Basic validation
    if (
      !name ||
      !area_id ||
      !sensor_id ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res
        .status(400)
        .json({ message: "Latitude and longitude must be numbers." });
    }
    if (
      typeof name !== "string" ||
      typeof area_id !== "string" ||
      typeof sensor_id !== "string"
    ) {
      return res
        .status(400)
        .json({ message: "Name, area_id, and sensor_id must be strings." });
    }

    // Check if a sensor with the same sensor_id or name already exists
    const existingSensor = await prisma.sensor.findFirst({
      where: {
        OR: [{ sensor_id }, { name }],
      },
    });

    if (existingSensor) {
      return res.status(409).json({
        message:
          "Sensor with the same sensor_id or sensor_name already exists.",
      });
    }

    // Check if the area exists
    const existingArea = await prisma.area.findUnique({
      where: { area_id },
    });

    if (!existingArea) {
      return res.status(404).json({
        message: "Area with the provided area_id does not exist.",
      });
    }

    // Create the sensor
    const newSensor = await prisma.sensor.create({
      data: {
        name,
        area_id,
        sensor_id,
        latitude,
        longitude,
      },
    });

    return res
      .status(201)
      .json({ message: "Sensor created successfully", sensor: newSensor });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getAllSensors = async (req, res) => {
  try {
    const sensors = await prisma.sensor.findMany();

    if (!sensors || sensors.length === 0) {
      return res
        .status(404)
        .json({ status: true, message: "No sensors found" });
    }

    res.status(200).json({
      status: true,
      message: "Sensors Fetched Successfully",
      data: sensors,
    });
  } catch (error) {
    console.log("Error at controllers/sensorController/getAllSensors: ", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

export const updateSensor = async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ status: false, message: "Request body is required." });
    }
    const { id } = req.params;
    const { name, area_id, sensor_id, latitude, longitude } = req.body;

    // Validate ID
    const sensorId = parseInt(id);
    if (!sensorId || isNaN(sensorId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid ID format.",
      });
    }

    // Validate input
    if (!sensor_id) {
      return res
        .status(400)
        .json({ status: false, message: "Sensor ID is required." });
    }

    if (
      !name &&
      !area_id &&
      latitude === undefined &&
      longitude === undefined
    ) {
      return res.status(400).json({
        status: false,
        message: "All fields are required to update the sensor.",
      });
    }

    // Check if the sensor exists
    const existingSensor = await prisma.sensor.findUnique({
      where: { id: sensorId },
    });

    if (!existingSensor) {
      return res
        .status(404)
        .json({ status: false, message: "Sensor not found." });
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (area_id) updateData.area_id = area_id;
    if (sensor_id) updateData.sensor_id = sensor_id;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    // Update the sensor
    const updatedSensor = await prisma.sensor.update({
      where: { id: sensorId },
      data: updateData,
    });

    return res.status(200).json({
      status: true,
      message: "Sensor updated successfully",
      sensor: updatedSensor,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const deleteSensor = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const sensorId = parseInt(id);
    if (!sensorId || isNaN(sensorId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid ID format.",
      });
    }

    // Find and delete the sensor
    const deletedSensor = await prisma.sensor
      .delete({
        where: { id: sensorId },
      })
      .catch(() => null); // Handle case where sensor doesn't exist

    if (!deletedSensor) {
      return res
        .status(404)
        .json({ status: false, message: "Sensor not found." });
    }

    return res.status(200).json({
      status: true,
      message: "Sensor deleted successfully",
      sensor: deletedSensor,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
