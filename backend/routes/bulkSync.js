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


/**
 * @route   GET /api/content/all-metadata
 * @desc    Fetch filePath and updatedAt for ALL documents in the collection in bulk
 */
router.get('/content/all-metadata', async (req, res) => {
  try {
    // Selects only filePath and updatedAt, explicitly excluding the _id field
    // ⚠️ Change 'FileContent' to match your exact Mongoose model name if different!
    const allMeta = await FileContent.find({})
      .select('filePath updatedAt -_id')
      .lean(); // .lean() converts documents to plain JS objects for maximum speed

    return res.status(200).json({
      count: allMeta.length,
      files: allMeta
    });
  } catch (error) {
    console.error("Failed to fetch all file metadata:", error);
    return res.status(500).json({ 
      error: "Internal server error fetching metadata catalog", 
      details: error.message 
    });
  }
});
export default router;