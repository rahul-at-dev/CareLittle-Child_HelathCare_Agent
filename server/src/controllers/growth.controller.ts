import { Response } from 'express';
import { ChildRequest } from '../middleware/childOwnership.js';
import { GrowthRecord } from '../models/GrowthRecord.js';
import { calculateGrowthPercentiles } from '../services/growthCalculation.service.js';

// Add Growth Record
export const createGrowthRecord = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const { date, ageInMonths, weightKg, heightCm, headCircumferenceCm } = req.body;

    // Backend Input Validation
    if (weightKg === undefined || weightKg <= 0) {
      res.status(400).json({ success: false, error: 'Weight must be a positive number (kg).' });
      return;
    }

    if (heightCm === undefined || heightCm <= 0) {
      res.status(400).json({ success: false, error: 'Height must be a positive number (cm).' });
      return;
    }

    if (headCircumferenceCm !== undefined && (typeof headCircumferenceCm !== 'number' || headCircumferenceCm <= 0)) {
      res.status(400).json({ success: false, error: 'Head circumference must be a positive number (cm) when supplied.' });
      return;
    }

    if (ageInMonths === undefined || ageInMonths < 0) {
      res.status(400).json({ success: false, error: 'Age in months must be a non-negative number.' });
      return;
    }

    const recordDate = date ? new Date(date) : new Date();
    if (isNaN(recordDate.getTime())) {
      res.status(400).json({ success: false, error: 'Invalid date format.' });
      return;
    }

    // Calculate percentiles via deterministic service
    const percentiles = calculateGrowthPercentiles(child.gender, ageInMonths, weightKg, heightCm);

    const growthRecord = await GrowthRecord.create({
      childId: child._id,
      date: recordDate,
      ageInMonths,
      weightKg,
      heightCm,
      headCircumferenceCm,
      percentiles
    });

    res.status(201).json({
      success: true,
      data: growthRecord
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Growth Records History
export const getGrowthRecords = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const records = await GrowthRecord.find({ childId: child._id }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
