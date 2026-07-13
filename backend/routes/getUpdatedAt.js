import express from 'express';
import DirectoryTree from '../models/Directory';

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
export default router;