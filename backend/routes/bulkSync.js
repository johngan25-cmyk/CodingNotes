import express from 'express';
import FileContent from '../models/FileContent.js'; // Note the explicit .js extension required by ES Modules

const router = express.Router();

// POST endpoint for bulk uploading text contents
router.post('/bulkSync', async (req, res) => {
  try {
    const fileArray = req.body;

    if (!Array.isArray(fileArray)) {
      return res.status(400).json({ 
        error: "Invalid payload format", 
        details: "Expected a JSON array of file objects." 
      });
    }

    if (fileArray.length === 0) {
      return res.status(400).json({ error: "Payload is empty" });
    }

    const bulkOperations = fileArray.map((file) => ({
      updateOne: {
        filter: { filePath: file.filePath },
        update: { $set: { textData: file.textData } },
        upsert: true
      }
    }));

    const result = await FileContent.bulkWrite(bulkOperations);

    return res.status(200).json({
      message: "Bulk sync completed successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount
    });

  } catch (error) {
    console.error("Bulk sync operation failed:", error);
    return res.status(500).json({ 
      error: "Database migration failed", 
      details: error.message 
    });
  }
});

export default router;