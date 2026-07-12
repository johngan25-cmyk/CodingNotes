import mongoose from 'mongoose';

const FileContentSchema = new mongoose.Schema({
  filePath: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  textData: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Check if the model already exists before compilation to prevent hot-reload compilation errors
export default mongoose.models.FileContent || mongoose.model('FileContent', FileContentSchema);