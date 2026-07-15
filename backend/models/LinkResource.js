import mongoose from "mongoose";

const LinkResourceSchema = new mongoose.Schema(
  {
    resourcePath: {
      type: String,
      required: true,
      unique: true, // Ensures a single unique path maps to exactly one URL resource
      trim: true,
    },
    destinationUrl: {
      type: String,
      required: true,
      trim: true,
    }
  },
  { 
    timestamps: true // Automatically manages createdAt and updatedAt records
  }
);

export const LinkResource = mongoose.model("LinkResource", LinkResourceSchema);