import express from "express";
import { startSession, stopSession } from "../lib/sessionManager.js";

const router = express.Router();

router.post("/start", async (req, res) => {
  const { name } = req.body;
  const session = await startSession(name);
  res.json(session);
});

router.post("/stop", async (req, res) => {
  const session = await stopSession();
  res.json(session);
});

export default router;
