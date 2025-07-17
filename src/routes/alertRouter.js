import express from "express";
import {
  deleteAllAlert,
  getAlertById,
  getAlerts,
  handleAlert,
} from "../controllers/alertController.js";

const router = express.Router();

router.post("/", handleAlert);
router.get("/", getAlerts);
router.delete("/", deleteAllAlert);
router.get("/:id", getAlertById);

export default router;
