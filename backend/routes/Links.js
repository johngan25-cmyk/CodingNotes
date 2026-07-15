import express from "express";
import { LinkResource } from "../models/LinkResource.js";

const router = express.Router();

router.post("/create-link", async (req, res) => {
  const { resourcePath, destinationUrl } = req.body;

  // 1. Payload validation
  if (!resourcePath || !destinationUrl) {
    return res.status(400).json({
      success: false,
      message:
        "Both 'resourcePath' and 'destinationUrl' parameters are required.",
    });
  }

  try {
    // 2. Uniform URL Sanitation (ensure protocol prefix exists)
    let sanitizedUrl = destinationUrl.trim();
    if (!/^https?:\/\//i.test(sanitizedUrl)) {
      sanitizedUrl = `https://${sanitizedUrl}`; // or http:// if you prefer as the default
    }
    const url = new URL(sanitizedUrl);

    // Allow only http and https
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid protocol");
    }

    // Ensure a hostname exists
    if (!url.hostname) {
      throw new Error("Invalid hostname");
    }

    // 3. Database persistence execution
    const newLinkResource = await LinkResource.create({
      resourcePath,
      destinationUrl: sanitizedUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Link resource successfully registered.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/get-link", async (req, res) => {
  const { resourcePath } = req.query;

  // 1. Ingestion Validation
  if (!resourcePath) {
    return res.status(400).json({
      success: false,
      message: "The query parameter 'resourcePath' is required."
    });
  }

  try {
    // 2. Database Lookup Execution
    const linkResource = await LinkResource.findOne({ resourcePath: resourcePath });

    // 3. Handle Resource Absence
    if (!linkResource) {
      return res.status(404).json({
        success: false,
        message: "No link resource found matching the provided path mapping."
      });
    }

    // 4. Return Data Payload
    return res.status(200).json({
      success: true,
      data: {
        resourcePath: linkResource.resourcePath,
        destinationUrl: linkResource.destinationUrl
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.patch("/update-link", async (req, res) => {
  // Directly extract parameters from the root of req.body
  const { resourcePath, destinationUrl } = req.body;

  // 1. Ingestion Validation
  if (!resourcePath || !destinationUrl) {
    return res.status(400).json({
      success: false,
      message: "Both 'resourcePath' and 'destinationUrl' parameters are required."
    });
  }

  try {
    let sanitizedUrl = destinationUrl.trim();
    if (!/^https?:\/\//i.test(sanitizedUrl)) {
      sanitizedUrl = `https://${sanitizedUrl}`; // or http:// if you prefer as the default
    }

    // 3. Database Execution
    const updatedLinkResource = await LinkResource.findOneAndUpdate(
      { resourcePath: resourcePath },
      { destinationUrl: sanitizedUrl },
      { returnDocument: "after" } // Returns the modified document
    );

    // 4. Handle Resource Absence
    if (!updatedLinkResource) {
      return res.status(404).json({
        success: false,
        message: "No link resource found matching the provided path mapping."
      });
    }

    // 5. Return Updated Payload
    return res.status(200).json({
      success: true,
      message: "Link resource successfully updated.",
      data: updatedLinkResource
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.delete("/delete-link", async (req, res) => {
  const { resourcePath } = req.body;

  if (!resourcePath) {
    return res.status(400).json({ success: false, message: "Parameter 'resourcePath' is required." });
  }

  try {
    const deleted = await LinkResource.findOneAndDelete({ resourcePath });
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Resource  not found." });
    }
    return res.status(200).json({ success: true, message: "Link resource cleared successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

