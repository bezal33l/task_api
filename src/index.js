require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { initDb } = require('./db');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint — critical for load balancers and container orchestration
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Routes
app.use('/tasks', tasksRouter);

// Start server after DB is ready
async function start() {
  try {
    await initDb();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Task API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
