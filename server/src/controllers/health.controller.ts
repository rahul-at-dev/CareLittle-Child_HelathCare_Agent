import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { getEmergencyContacts } from '../config/countryConfig.js';

export const getHealthStatus = async (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const countryCode = (req.query.country as string) || process.env.DEFAULT_COUNTRY_CODE || 'IN';
  const emergencyInfo = getEmergencyContacts(countryCode);

  res.status(200).json({
    success: true,
    service: 'CareLittle AI Backend',
    version: '1.0.0-phase1',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      connected: dbState === 1
    },
    emergencyContacts: emergencyInfo,
    configuredProvider: process.env.DEFAULT_AI_PROVIDER || 'gemini'
  });
};
