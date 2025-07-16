import express from "express";
import {
  deleteAllAlert,
  getAlerts,
  handleAlert,
} from "../controllers/alertController.js";

const router = express.Router();

router.post("/alert", handleAlert);
router.get("/alert", getAlerts);
router.delete("/alert", deleteAllAlert);

export default router;
