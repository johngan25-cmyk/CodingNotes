import express from 'express'
import Directory from '../models/Directory.js';
const router = express.Router();

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

export default router;

//for app