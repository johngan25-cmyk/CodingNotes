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
      { returnDocument: 'after', runValidators: true } // Returns the modified document and runs schema validations
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
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    return res.status(201).json({
      message: "File content document initialized successfully",
     
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
    const { targetPaths } = req.body;

    // 1. Validation Guard
    if (!targetPaths) {
      return res.status(400).json({ 
        error: "Missing parameters", 
        details: "Please provide a 'targetPaths' parameter (either a single string path or an array of paths)." 
      });
    }

    // 2. Scenario A: Handle Multiple Deletions (Array)
    if (Array.isArray(targetPaths)) {
      if (targetPaths.length === 0) {
        return res.status(400).json({ error: "Empty array provided" });
      }

      const result = await FileContent.deleteMany({ filePath: { $in: targetPaths } });
      
      return res.status(200).json({
        message: "Bulk deletion executed successfully",
        requestedCount: targetPaths.length,
        deletedCount: result.deletedCount
      });
    }
    console.log(targetPaths);
    
    // 3. Scenario B: Handle Single Deletion (String)
    const deletedFile = await FileContent.findOneAndDelete({ filePath: targetPaths });

    if (!deletedFile) {
      return res.status(404).json({ 
        error: "File not found", 
        details: `No document matches the path: ${targetPaths}` 
      });
    }

    return res.status(200).json({
      message: "Single file content deleted successfully",
      deletedPath: targetPaths
    });

  } catch (error) {
    console.error("Dynamic delete operation failed:", error);
    return res.status(500).json({ 
      error: "Database deletion failed", 
      details: error.message 
    });
  }
});

// PATCH endpoint to update multiple file paths at once in a single round-trip
router.patch('/update-file-paths-bulk', async (req, res) => {
  try {
    const { pathUpdates } = req.body; // Expects an array of path change objects

    // 1. Validation Guard
    if (!pathUpdates || !Array.isArray(pathUpdates) || pathUpdates.length === 0) {
      return res.status(400).json({ 
        error: "Invalid payload layout", 
        details: "Please provide a 'pathUpdates' array containing objects with oldPath and newPath fields." 
      });
    }

    // 2. Map the incoming array into atomic MongoDB updateOne actions
    const bulkOperations = pathUpdates.map(item => {
      if (!item.oldPath || !item.newPath) {
        throw new Error("Each item in pathUpdates must contain both 'oldPath' and 'newPath'.");
      }
      
      return {
        updateOne: {
          filter: { filePath: item.oldPath },
          update: { $set: { filePath: item.newPath } }
        }
      };
    });

    // 3. Execute all path adjustments simultaneously
    const result = await FileContent.bulkWrite(bulkOperations);

    return res.status(200).json({
      message: "Bulk path adjustments executed successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Bulk path update failed:", error);
    
    // Handle structural schema errors thrown inside the map loop
    if (error.message.includes("must contain both")) {
      return res.status(400).json({ error: "Validation error", details: error.message });
    }

    return res.status(500).json({ 
      error: "Database bulk operation failed", 
      details: error.message 
    });
  }
});
export default router;