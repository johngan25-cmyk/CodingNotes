import mongoose from 'mongoose';

const DirectorySchema = new mongoose.Schema({
  // We use a fixed key name to ensure we only ever keep one master record
  key: {
    type: String,
    default: 'master_tree',
    unique: true
  },
  // Storing the entire nested structure object dynamically
  treeData: {
    type: Object,
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Directory', DirectorySchema);