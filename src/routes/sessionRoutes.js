import express from "express";
import {
  startSession,
  stopSession,
  getActiveSession,
} from "../lib/sessionManager.js";
import prisma from "../lib/prisma.js";

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

router.get("/", async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { startedAt: "desc" },
    });
    res.status(200).json({ status: true, data: sessions });
  } catch (err) {
    console.error("Error fetching sessions:", err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
});

export default router;
