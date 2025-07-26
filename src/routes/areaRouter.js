import express from "express";
import {
  createArea,
  deleteArea,
  getAllAreas,
  getAreaById,
  updateArea,
} from "../controllers/areaController.js";

const router = express.Router();

router.post("/create", createArea);
router.get("/", getAllAreas);
router.get("/:id", getAreaById);
router.post("/update", updateArea);
router.post("/delete/:id", deleteArea);

export default router;
