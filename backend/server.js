import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit in case the app sends a large folder tree

// This variable now stores a single root node object instead of an array
let cachedDirectoryStructure = {};

/**
 * Endpoint A (For the App): Receives the completely nested tree from your app
 * POST request because the app is pushing a large structure body.
 */
app.post('/api/sync-directory', (req, res) => {
  const treeData = req.body;

  // Basic layout shape validation checking for root structure elements
  if (!treeData || typeof treeData !== 'object' || !treeData.name) {
    return res.status(400).json({ error: 'Invalid nested tree format structure' });
  }

  // Save the full root folder tree sent by the app directly to memory cache
  cachedDirectoryStructure = treeData;

  console.log(`🔄 Entire workspace tree synced from App root: ${treeData.name}`);
  res.json({ message: 'Nested workspace tree synced successfully!' });
});

/**
 * Endpoint B (For the Website): Serves the structure to the frontend UI
 * Switched to GET as it's a direct resource retrieval now.
 */
app.get('/api/directory', (req, res) => {
  // Fall back to a nested mock layout structure if the app hasn't pushed anything yet
  if (!cachedDirectoryStructure.name) {
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
        },
        {
          name: "TODO.md",
          isDirectory: false,
          fullPath: "C:/apps/my-app/TODO.md"
        }
      ]
    });
  }

  // Return the active synced tree structure cached from the app
  res.json(cachedDirectoryStructure);
});





/**
 * Endpoint C (For Website/App): Reads the file content
 */
app.post('/api/file/read', (req, res) => {
  const { filePath } = req.body;
  if (!filePath || path.extname(filePath) !== '.md') {
    return res.status(400).json({ error: 'Valid Markdown (.md) path is required' });
  }

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).json({ error: 'File unreadable', details: err.message });
    res.json({ content: data });
  });
});

/**
 * Endpoint D (For Website/App): Saves file edits
 */
app.post('/api/file/save', (req, res) => {
  const { filePath, content } = req.body;
  if (!filePath || content === undefined || path.extname(filePath) !== '.md') {
    return res.status(400).json({ error: 'Valid Markdown path and content required' });
  }

  const targetDir = path.dirname(filePath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFile(filePath, content, 'utf8', (err) => {
    if (err) return res.status(500).json({ error: 'Failed to write file', details: err.message });
    res.json({ message: 'Saved successfully!' });
  });
});

// Keep the local port listener for your local tests
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Sync Bridge Backend running on http://localhost:${PORT}`);
  });
}

// Export the app for Vercel's serverless environment
export default app;