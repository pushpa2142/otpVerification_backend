/**
 * Express Application Setup
 * Configures middleware, routes, and error handlers
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────────

// Set various HTTP security headers
app.use(helmet());

// CORS — allow Angular dev server and configured frontend URL
// const allowedOrigins = [
//   process.env.FRONTEND_URL || 'http://localhost:4200',
//   'http://localhost:4200',
//   'http://localhost:3000',
// ];

// app.use(cors({
//   origin: (origin, callback) => {
//     // Allow requests with no origin (e.g., mobile apps, Postman)
//     if (!origin || allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }
//     logger.warn(`CORS blocked for origin: ${origin}`);
//     callback(new Error(`CORS policy: origin ${origin} is not allowed`));
//   },
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
//   exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
//   credentials: true,
//   maxAge: 86400, // 24 hours preflight cache
// }));

// const allowedOrigins = [
//   process.env.FRONTEND_URL,
//   'http://localhost:4200'
// ];

// app.use(cors({
//   origin: (origin, callback) => {

//     // Allow Postman, mobile apps, server-to-server calls
//     if (!origin) {
//       return callback(null, true);
//     }

//     if (allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }

//     logger.warn(`CORS blocked for origin: ${origin}`);

//     return callback(new Error(`CORS policy: origin ${origin} is not allowed`));
//   },

//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

//   allowedHeaders: [
//     'Content-Type',
//     'Authorization',
//     'X-Requested-With'
//   ],

//   exposedHeaders: [
//     'X-RateLimit-Limit',
//     'X-RateLimit-Remaining'
//   ],

//   credentials: true,

//   maxAge: 86400
// }));
// Global rate limiter (fallback; specific limiters exist per route)

const allowedOrigins = [
  'http://localhost:4200',
  process.env.FRONTEND_URL
];

const corsOptions = {
  origin: function (origin, callback) {

    // Allow Postman / server requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, true);
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With'
  ]
};

app.use(cors(corsOptions));
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ─── Body Parsing ──────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Logging ───────────────────────────────────────────────────────────────────

// HTTP request logging (Morgan → Winston)
app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api', routes);

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
