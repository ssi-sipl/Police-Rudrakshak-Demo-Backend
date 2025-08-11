import express from "express";
import {
  startSession,
  stopSession,
  getActiveSession,
} from "../lib/sessionManager.js";

const router = express.Router();

// Start session
router.post("/start", async (req, res) => {
  try {
    const { name } = req.body || {};
    const session = await startSession(name);
    res.json({
      status: true,
      message: "Session Started Successfully",
      data: session,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: "Failed to start session" });
  }
});

// Stop session
router.post("/stop", async (req, res) => {
  try {
    const session = await stopSession();
    if (!session)
      return res
        .status(404)
        .json({ status: false, message: "No active session" });
    res.json({
      status: true,
      message: "Session Stopped Successfully",
      data: session,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to stop session" });
  }
});

// Get current active session
router.get("/active", async (req, res) => {
  try {
    const session = await getActiveSession();
    if (!session)
      return res.status(404).json({
        status: false,
        message:
          "No active sessions found create a new one to start recieving alerts",
      });
    res.json({ status: true, message: "Active Session Found", data: session });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ status: false, message: "Failed to fetch active session" });
  }
});

export default router;
