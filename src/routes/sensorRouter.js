import express from "express";
import {
  createSensor,
  deleteSensor,
  getAllSensors,
  updateSensor,
} from "../controllers/sensorController.js";

const router = express.Router();

router.post("/create", createSensor);
router.get("/", getAllSensors);
router.post("/delete/:id", deleteSensor);
router.post("/update/:id", updateSensor);

export default router;
