require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini for Cloud Processing
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Edge-Focus Database connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Cloud AI Fallback Route: Heavy duty processing
app.post('/api/generate-exam', async (req, res) => {
  try {
    const { topic, difficulty, questionCount } = req.body;
    
    // The prompt that was too complex for the local device
    const prompt = `Act as an academic professor. Generate a ${difficulty} level mock exam with ${questionCount} questions about ${topic}. Include a detailed answer key at the bottom.`;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    res.json({ success: true, data: response.text() });
  } catch (error) {
    console.error('Cloud AI Error:', error);
    res.status(500).json({ success: false, message: 'Cloud AI fallback failed' });
  }
});

// Basic health check for the Flutter app to ping
app.get('/', (req, res) => {
  res.send('Edge-Focus Hybrid API is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));