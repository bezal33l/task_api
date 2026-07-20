require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const tasksRouter = require('./routes/tasks');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/tasks', tasksRouter);

module.exports = app;
