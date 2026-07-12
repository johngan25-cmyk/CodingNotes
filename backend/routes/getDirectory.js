import express from 'express'
const router = express.Router();

router.get('/directory',async (req, res) => {
  try {
    const record = await Directory.findOne({ key: 'master_tree' });

    // Fall back to our nested mock layout structure if database collection is empty
    if (!record || !record.treeData) {
      return res.json({
        name: "root",
        isDirectory: true,
        fullPath: "C:/apps/my-app",
        children: [
          {
            name: "documentation",
            isDirectory: true,
            fullPath: "C:/apps/my-app/documentation",
            children: [
              {
                name: "getting-started.md",
                isDirectory: false,
                fullPath: "C:/apps/my-app/documentation/getting-started.md"
              }
            ]
          },
          {
            name: "README.md",
            isDirectory: false,
            fullPath: "C:/apps/my-app/README.md"
          }
        ]
      });
    }

    res.json(record.treeData);
  } catch (err) {
    res.status(500).json({ error: 'Database read failed', details: err.message });
  }
})

export default router;

//for webpage