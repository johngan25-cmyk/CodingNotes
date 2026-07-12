import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Directory from './models/Directory.js';
import syncDirectory from './routes/syncDirectory.js'
import getDirectory from './routes/getDirectory.js'
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Establish connection to MongoDB Atlas database instance
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('🍃 Connected to MongoDB permanently'))
    .catch((err) => console.error('❌ Database connection failure:', err.message));
} else {
  console.warn('⚠️ Warning: MONGODB_URI environment variable is missing.');
}


app.use('/api',syncDirectory);

app.get('/api',getDirectory);



// Existing local/serverless runtime execution handlers
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Sync Bridge Backend running on port ${PORT}`));
}

export default app;