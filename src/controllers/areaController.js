import prisma from "../lib/prisma.js"; // adjust if your path differs

export async function createArea(req, res) {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ status: false, message: "Missing request body" });
    }

    const { name, area_id } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        message:
          'Invalid input: "name" is required and must be a non-empty string.',
      });
    }

    if (!area_id || typeof area_id !== "string" || area_id.trim() === "") {
      return res.status(400).json({
        status: false,
        message:
          'Invalid input: "area_id" is required and must be a non-empty string.',
      });
    }

    const existingArea = await prisma.area.findFirst({
      where: {
        OR: [{ name }, { area_id }],
      },
    });

    if (existingArea) {
      return res.status(409).json({
        status: false,
        message: "An area with this name or area_id already exists.",
      });
    }

    const newArea = await prisma.area.create({
      data: {
        name,
        area_id,
      },
    });

    res.status(201).json({
      status: true,
      message: "Area added successfully",
      data: newArea,
    });
  } catch (error) {
    console.error("Error at createArea:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}

// export async function getAllAreas(req, res) {
//   try {
//     const areas = await prisma.area.findMany();

//     if (!areas.length) {
//       return res.status(404).json({ status: true, message: "No areas found" });
//     }

//     res.status(200).json({
//       status: true,
//       message: "Areas fetched successfully",
//       data: areas,
//     });
//   } catch (error) {
//     console.error("Error at getAllAreas:", error);
//     res.status(500).json({ status: false, message: "Internal server error" });
//   }
// }

export async function getAllAreas(req, res) {
  try {
    const areas = await prisma.area.findMany({
      include: {
        _count: {
          select: { drones: true },
        },
      },
    });

    if (!areas.length) {
      return res.status(404).json({ status: true, message: "No areas found" });
    }

    // Optionally, map to include droneCount key explicitly
    // const areasWithDroneCount = areas.map((area) => ({
    //   ...area,
    //   droneCount: area._count.drones,
    // }));

    res.status(200).json({
      status: true,
      message: "Areas fetched successfully",
      data: areas,
    });
  } catch (error) {
    console.error("Error at getAllAreas:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}

export async function getAreaById(req, res) {
  try {
    const { id } = req.params;

    const area = await prisma.area.findUnique({
      where: { id: parseInt(id) },
      include: {
        drones: true, // populating drones
      },
    });

    if (!area) {
      return res.status(404).json({ status: false, message: "Area not found" });
    }

    res.status(200).json({
      status: true,
      message: "Area fetched successfully",
      data: area,
    });
  } catch (error) {
    console.error("Error at getAreaById:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}

export async function updateArea(req, res) {
  try {
    const { id, name, area_id } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid area ID format." });
    }

    const existingArea = await prisma.area.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingArea) {
      return res
        .status(404)
        .json({ status: false, message: "Area not found." });
    }

    const conflict = await prisma.area.findFirst({
      where: {
        id: { not: parseInt(id) },
        OR: [{ name }, { area_id }],
      },
    });

    if (conflict) {
      return res.status(409).json({
        status: false,
        message: "Another area with this name or area_id already exists.",
      });
    }

    const updated = await prisma.area.update({
      where: { id: parseInt(id) },
      data: {
        name,
        area_id,
      },
    });

    return res.status(200).json({
      status: true,
      message: "Area updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Error at updateArea:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}

export async function deleteArea(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid area ID format." });
    }

    const area = await prisma.area.findUnique({ where: { id: parseInt(id) } });
    if (!area) {
      return res
        .status(404)
        .json({ status: false, message: "Area not found." });
    }

    // Delete drones linked to the area
    await prisma.drone.deleteMany({ where: { areaRef: parseInt(id) } });

    // Then delete the area
    await prisma.area.delete({ where: { id: parseInt(id) } });

    return res.status(200).json({
      status: true,
      message: "Area and associated drones deleted successfully.",
    });
  } catch (error) {
    console.error("Error at deleteArea:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
}
