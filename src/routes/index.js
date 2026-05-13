/**
 * Route Aggregator
 * Mounts all API route modules
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');

// Health check (unauthenticated)
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Phone Verify API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
router.use('/auth', authRoutes);

module.exports = router;
