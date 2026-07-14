import express from "express";
import ApiLog from "../models/Apilog.js";
const router = express.Router();

router.post("/api-logs", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body cannot be empty" });
    }
    const log = await ApiLog.create(req.body);

    res.status(201).json({
      message: "Log saved successfully",
      log,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to save log",
      error: err.message,
    });
  }
});

router.get('/api-logs', async (req, res) => {
  try {
    const logs = await ApiLog.find().sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api-logs', async (req, res) => {
  try {
    await ApiLog.deleteMany({});
    res.status(200).json({ success: true, message: "All logs deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete logs" });
  }
});
export default router;
