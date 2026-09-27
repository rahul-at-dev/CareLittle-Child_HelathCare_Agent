import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { generalLimiter, resourceIntensiveLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/health.routes.js';
import privacyRoutes from './routes/privacy.routes.js';
import childRoutes from './routes/child.routes.js';
import growthRoutes from './routes/growth.routes.js';
import developmentRoutes from './routes/development.routes.js';
import nutritionRoutes from './routes/nutrition.routes.js';
import safetyRoutes from './routes/safety.routes.js';
import chatRoutes from './routes/chat.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply Rate Limiting
app.use('/api/', generalLimiter);

// API v1 Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/privacy', privacyRoutes);
app.use('/api/v1/children', childRoutes);

// Phase 2 Core Health Record Sub-Routes
app.use('/api/v1/children/:childId/growth', growthRoutes);
app.use('/api/v1/children/:childId/development', developmentRoutes);
app.use('/api/v1/children/:childId/nutrition', nutritionRoutes);

// Phase 3 Deterministic Safety Route
app.use('/api/v1/safety', safetyRoutes);

// Phase 4 Configurable AI Chat Sub-Route
app.use('/api/v1/children/:childId/chat', chatRoutes);

// Health check shorthand at root
app.get('/', (req, res) => {
  res.redirect('/api/v1/health');
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 CareLittle AI Backend running on http://localhost:${PORT}`);
    console.log(`🏥 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Clerk Auth: ${process.env.CLERK_PUBLISHABLE_KEY ? 'Configured' : 'Dev Mode'}`);
    console.log(`=======================================================`);
  });
};

startServer();

export default app;
