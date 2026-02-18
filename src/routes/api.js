import express from "express";
import schedulerService from "../services/SchedulerService.js";
import { verifyToken } from "../middlewares/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

router.use(verifyToken);

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.post("/schedule", upload.single("file"), async (req, res) => {
  try {
    const { number, message, time, mediaType, mediaUrl, filename } = req.body;

    let media = mediaUrl;
    let isFile = false;

    if (req.file) {
      media = req.file.path;
      isFile = true;
    }

    if (!number || !time) {
      // Message is required only for text type, media might have caption in message field
      if (mediaType === "text" && !message) {
        return res
          .status(400)
          .json({ message: "Message is required for text type" });
      }
      if (!mediaType && !message) {
        return res.status(400).json({ message: "Missing required fields" });
      }
    }

    const schedule = await schedulerService.createSchedule(
      req.user.id,
      number,
      message,
      time,
      mediaType,
      media,
      isFile,
      filename,
    );
    res.status(201).json(schedule);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error scheduling message", error: error.message });
  }
});

router.get("/schedules", async (req, res) => {
  try {
    const schedules = await schedulerService.getSchedules(req.user.id);
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching schedules" });
  }
});

router.delete("/schedule/:id", async (req, res) => {
  try {
    const deleted = await schedulerService.deleteSchedule(
      req.user.id,
      req.params.id,
    );
    if (deleted) {
      res.json({ message: "Schedule deleted" });
    } else {
      res.status(404).json({ message: "Schedule not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting schedule" });
  }
});

// Helper route to send message immediately
router.post("/send-message", async (req, res) => {
  try {
    const { number, message } = req.body;
    // Import waService here to avoid circular dependency issues if any, or use logic from a controller
    const { default: waService } = await import("../services/WaService.js");

    await waService.sendMessage(req.user.id, number, message);
    res.json({ message: "Message sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending message", error: error.message });
  }
});

router.post("/send-image", async (req, res) => {
  try {
    const { number, imageUrl, caption } = req.body;
    const { default: waService } = await import("../services/WaService.js");
    await waService.sendImage(req.user.id, number, imageUrl, caption);
    res.json({ message: "Image sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending image", error: error.message });
  }
});

router.post("/send-video", async (req, res) => {
  try {
    const { number, videoUrl, caption } = req.body;
    const { default: waService } = await import("../services/WaService.js");
    await waService.sendVideo(req.user.id, number, videoUrl, caption);
    res.json({ message: "Video sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending video", error: error.message });
  }
});

router.post("/send-document", async (req, res) => {
  try {
    const { number, docUrl, filename, caption } = req.body;
    const { default: waService } = await import("../services/WaService.js");
    await waService.sendDocument(
      req.user.id,
      number,
      docUrl,
      filename,
      caption,
    );
    res.json({ message: "Document sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending document", error: error.message });
  }
});

router.post("/send-sticker", async (req, res) => {
  try {
    const { number, stickerUrl } = req.body;
    const { default: waService } = await import("../services/WaService.js");
    await waService.sendSticker(req.user.id, number, stickerUrl);
    res.json({ message: "Sticker sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending sticker", error: error.message });
  }
});

export default router;
