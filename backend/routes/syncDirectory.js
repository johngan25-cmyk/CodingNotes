import express from 'express'
import DirectoryTree from '../models/Directory.js';
const router = express.Router();
/**
 * @route   GET /api/sync-directory
 * @desc    Fetch the single master tree structure for Web and Android clients
 */
router.get('/sync-directory', async (req, res) => {
  try {
    const masterRecord = await DirectoryTree.findOne({ key: "master_tree" });

    if (!masterRecord || !masterRecord.treeData) {
      return res.status(404).json({ 
        error: "Sync failed", 
        details: "No master tree structure found in the database collection." 
      });
    }

    return res.status(200).json(masterRecord.treeData);
  } catch (error) {
    console.error("Directory sync lookup failed:", error);
    return res.status(500).json({ 
      error: "Database error fetching workspace setup", 
      details: error.message 
    });
  }
});



// 🚀 1.  recursive helper to sanitize
const sanitizeBackendTree = (node) => {
  if (!node) return;
  
  // Explicitly strip away the frontend runtime flag if present
  if ('isNewUnsaved' in node) {
    delete node.isNewUnsaved;
  }
  
  // Recurse down into child directories
  if (Array.isArray(node.children)) {
    node.children.forEach(sanitizeBackendTree);
  }
};

/**
 * @route   POST /api/sync-directory
 * @desc    Overwrite the master tree structure with a pre-modified payload from Web or Android
 */
router.post('/sync-directory', async (req, res) => {
  try {
    const { modifiedTreeData } = req.body;

    if (!modifiedTreeData) {
      return res.status(400).json({ error: "Missing modifiedTreeData payload." });
    }

    sanitizeBackendTree(modifiedTreeData); 
    // Atomic update using $set to guarantee Mongoose tracks the deeply nested Mixed object alterations
    const result = await DirectoryTree.findOneAndUpdate(
      { key: "master_tree" },
      { $set: { treeData: modifiedTreeData } },
      { 
        new: true,          
        upsert: true,       
        runValidators: true 
      }
    );

    return res.status(200).json({
      message: "Directory tree synchronized successfully!",
      updatedAt: result.updatedAt
    });
  } catch (error) {
    console.error("Directory tree snapshot sync failed:", error);
    return res.status(500).json({ 
      error: "Failed to persist directory updates", 
      details: error.message 
    });
  }
});

/**
 * @route   GET /api/sync-directory/last-updated
 * @desc    Lightweight check that returns ONLY the timestamp of the last tree structural change
 */
router.get('/sync-directory/last-updated', async (req, res) => {
  try {
    // .select('updatedAt') tells MongoDB to exclude treeData entirely, saving network and CPU processing
    const masterRecord = await DirectoryTree.findOne({ key: "master_tree" }).select('updatedAt');

    if (!masterRecord) {
      return res.status(404).json({ 
        error: "Check failed", 
        details: "No master tree record exists yet." 
      });
    }

    return res.status(200).json({ 
      updatedAt: masterRecord.updatedAt 
    });
  } catch (error) {
    console.error("Timestamp handshake check failed:", error);
    return res.status(500).json({ 
      error: "Database error checking version timestamp", 
      details: error.message 
    });
  }
});

export default router;