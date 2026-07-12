import express from 'express';
import FileContent from '../models/FileContent.js';

const router = express.Router();

// GET endpoint to fetch a single file's content by its path
router.get('/content', async (req, res) => {
  try {
    const { path } = req.query;

    // Guard: Ensure a path parameter was actually provided
    if (!path) {
      return res.status(400).json({ 
        error: "Missing path parameter", 
        details: "Please provide a ?path=/your/file/path query parameter." 
      });
    }

    // Look up the exact document matching the path
    const file = await FileContent.findOne({ filePath: path });

    if (!file) {
      return res.status(404).json({ 
        error: "File not found", 
        details: `No content exists for the path: ${path}` 
      });
    }

    // Return the document containing the markdown textData
    return res.status(200).json(file);

  } catch (error) {
    console.error("Failed to fetch file content:", error);
    return res.status(500).json({ 
      error: "Database read failed", 
      details: error.message 
    });
  }
});

export default router;