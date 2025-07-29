import express from "express";
import {
  createAlert,
  deleteAllAlert,
  getAlertById,
  getAlerts,
  getAlertsByDroneId,
  handleFacioMatcherAlert,
} from "../controllers/alertController.js";

const router = express.Router();

router.post("/", createAlert);
router.post("/fm/:droneId", handleFacioMatcherAlert);
router.get("/", getAlerts);
router.get("/drone/:droneId", getAlertsByDroneId);
router.delete("/", deleteAllAlert);
router.get("/:id", getAlertById);

export default router;
