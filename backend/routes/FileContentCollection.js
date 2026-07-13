import express from 'express';
import FileContent from '../models/FileContent.js';

const router = express.Router();

// PATCH endpoint to dynamically update any fields in a file document by its current path
router.patch('/update-file-content', async (req, res) => {
  try {
    const { currentPath, updates } = req.body;

    // 1. Validation Guards
    if (!currentPath) {
      return res.status(400).json({ 
        error: "Missing identifier", 
        details: "Please provide the 'currentPath' of the document you want to target." 
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        error: "Missing update data", 
        details: "Please provide an 'updates' object containing the fields to modify." 
      });
    }

    // 2. Execute the dynamic update
    // Using $set with the dynamic updates object allows changing paths, textData, or future fields.
    const updatedFile = await FileContent.findOneAndUpdate(
      { filePath: currentPath },
      { $set: updates },
      { new: true, runValidators: true } // Returns the modified document and runs schema validations
    );

    // 3. Check if document existed
    if (!updatedFile) {
      return res.status(404).json({ 
        error: "File not found", 
        details: `No document matches the currentPath: ${currentPath}` 
      });
    }

    return res.status(200).json({
      message: "File updated successfully",
      data: updatedFile
    });

  } catch (error) {
    console.error("Dynamic update operation failed:", error);
    
    // Handle path collision if the new path already exists in the collection
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Duplicate path error",
        details: "The new target filePath is already taken by another document."
      });
    }

    return res.status(500).json({ 
      error: "Database update failed", 
      details: error.message 
    });
  }
});

// POST endpoint to handle a newly added file path
router.post('/add-file-content', async (req, res) => {
  try {
    const { filePath, textData } = req.body;

    // Guard: A file path is absolutely mandatory to insert a document
    if (!filePath) {
      return res.status(400).json({ 
        error: "Missing parameter", 
        details: "Please provide a 'filePath' to register the new file." 
      });
    }

    // Upsert the document. If textData is missing or undefined, it defaults to ""
    const savedFile = await FileContent.findOneAndUpdate(
      { filePath: filePath },
      { 
        $set: { 
          textData: textData !== undefined ? textData : "" 
        } 
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(201).json({
      message: "File content document initialized successfully",
      data: savedFile
    });

  } catch (error) {
    console.error("Add file operation failed:", error);
    return res.status(500).json({ 
      error: "Database insertion failed", 
      details: error.message 
    });
  }
});

// DELETE endpoint to permanently wipe a document when a file is removed
router.delete('/delete-file-content', async (req, res) => {
  try {
    // We look for targetPath in the request body
    const { targetPath } = req.body;

    if (!targetPath) {
      return res.status(400).json({ 
        error: "Missing identifier", 
        details: "Please provide the 'targetPath' of the file to remove." 
      });
    }

    // Locate and delete the document matching the path
    const deletedFile = await FileContent.findOneAndDelete({ filePath: targetPath });

    if (!deletedFile) {
      return res.status(404).json({ 
        error: "File not found", 
        details: `No document exists to delete at path: ${targetPath}` 
      });
    }

    return res.status(200).json({
      message: "File content deleted successfully from database",
      deletedPath: targetPath
    });

  } catch (error) {
    console.error("Delete operation failed:", error);
    return res.status(500).json({ 
      error: "Database deletion failed", 
      details: error.message 
    });
  }
});

export default router;