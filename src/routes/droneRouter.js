import express from "express";
import {
  createDrone,
  getAllDrones,
  sendDrone,
  dropPayload,
  getAreaByDroneId,
  updateDrone,
  deleteDrone,
} from "../controllers/droneController.js";

const router = express.Router();

router.post("/create", createDrone);
router.get("/", getAllDrones);
router.post("/send", sendDrone);
router.post("/dropPayload", dropPayload);
router.get("/:drone_id", getAreaByDroneId);
router.post("/update/:id", updateDrone);
router.post("/delete/:id", deleteDrone);

export default router;
