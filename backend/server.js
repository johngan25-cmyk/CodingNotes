import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit in case the app sends a large folder tree

// This variable will hold the latest directory structure sent by your app
let cachedDirectoryStructure = {
  currentPath: '',
  parentPath: '',
  items: [] // Array of { name, isDirectory, fullPath }
};

/**
 * Endpoint A (For the App): Receives the updated structure from your app
 * Whenever the app adds/deletes/changes files, it hits this endpoint.
 */
app.post('/api/sync-directory', (req, res) => {
  const { currentPath, parentPath, items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid directory data format structure' });
  }

  // Save the structural map sent by the app
  cachedDirectoryStructure = {
    currentPath: currentPath || '',
    parentPath: parentPath || '',
    items: items
  };

  console.log(`🔄 Directory updated via App sync at path: ${currentPath}`);
  res.json({ message: 'Directory map synced successfully!' });
});

/**
 * Endpoint B (For the Website): Serves the cached app structure to the frontend UI
 * Replaces the old drive scanning endpoint.
 */
app.post('/api/directory', (req, res) => {
  // The website simply pulls whatever structure the app last provided
  res.json({msg:"yet to sync app"});
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