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

/**
 * @route   POST /api/sync-directory
 * @desc    Overwrite the master tree structure with a pre-modified payload from Web or Android
 */
/*router.post('/sync-directory', async (req, res) => {
  try {
    const { modifiedTreeData } = req.body;

    if (!modifiedTreeData) {
      return res.status(400).json({ error: "Missing modifiedTreeData payload." });
    }

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
});*/

router.post('/sync-directory', async (req, res) => {
  const incomingTree = req.body;

  if (!incomingTree || typeof incomingTree !== 'object' || !incomingTree.name) {
    return res.status(400).json({ error: 'Invalid nested tree format structure' });
  }

  try {
    // Upsert logic: Find the master record and update it, or create it if missing
    await Directory.findOneAndUpdate(
      { key: 'master_tree' },
      { treeData: incomingTree },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`🔄 Workspace tree saved to Database from App root: ${incomingTree.name}`);
    res.json({ message: 'Nested tree persisted to database successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Database write failed', details: err.message });
  }
})

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