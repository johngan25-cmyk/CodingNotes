import express from 'express';
import DirectoryTree from '../models/Directory.js';
import FileContent from '../models/FileContent.js'
const router = express.Router();

/**
 * @route   GET /api/sync-directory/last-updated
 * @desc    Fetch ONLY the timestamp of the last directory tree layout modification
 */
router.get('/sync-directory/last-updated', async (req, res) => {
  try {
    // Exclude treeData entirely, fetching only the tracking timestamp
    const masterRecord = await DirectoryTree.findOne({ key: "master_tree" }).select('updatedAt');

    if (!masterRecord) {
      return res.status(404).json({ 
        error: "Sync check failed", 
        details: "No master directory tree structure exists in the database yet." 
      });
    }

    return res.status(200).json({ 
      updatedAt: masterRecord.updatedAt 
    });
  } catch (error) {
    console.error("Directory timestamp sync check failed:", error);
    return res.status(500).json({ 
      error: "Internal server error checking directory version", 
      details: error.message 
    });
  }
});


/**
 * @route   GET /api/content/last-updated
 * @desc    Fetch ONLY the timestamp of the last textual update for a specific file
 * @query   ?path=root/dsa/Stack.md
 */
router.get('/file/last-updated', async (req, res) => {
  try {
    const filePath = req.query.path;

    if (!filePath) {
      return res.status(400).json({ 
        error: "Missing parameters", 
        details: "A 'path' query parameter is required." 
      });
    }

    // .select('updatedAt') ensures MongoDB does not load or transmit the actual textData field
    // ⚠️ Change 'FileContent' to match your exact Mongoose model name if it's different!
    const fileRecord = await FileContent.findOne({ filePath: filePath }).select('updatedAt');
    console.log(fileRecord,filePath);
    
    if (!fileRecord) {
      return res.status(404).json({ 
        error: "Not found", 
        details: "No content record exists for the specified file path." 
      });
    }

    return res.status(200).json({ 
      updatedAt: fileRecord.updatedAt 
    });
  } catch (error) {
    console.error("File content timestamp check failed:", error);
    return res.status(500).json({ 
      error: "Internal server error checking file version", 
      details: error.message 
    });
  }
});


















export default router;