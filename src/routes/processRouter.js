import express from "express";
import {
  controlDetectionProcess,
  controlFacialRecognitionProcess,
} from "../controllers/processController.js";

const router = express.Router();

router.post("/detection", controlDetectionProcess);
router.post("/facerecognition", controlFacialRecognitionProcess);

export default router;
