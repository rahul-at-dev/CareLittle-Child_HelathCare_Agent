import { Response } from 'express';
import mongoose from 'mongoose';
import { ChildRequest } from '../middleware/childOwnership.js';
import { DevelopmentRecord, MilestoneCategory, MilestoneStatus } from '../models/DevelopmentRecord.js';

const ALLOWED_CATEGORIES: MilestoneCategory[] = ['gross_motor', 'fine_motor', 'cognitive', 'language', 'social_emotional'];
const ALLOWED_STATUSES: MilestoneStatus[] = ['achieved', 'in_progress', 'not_observed', 'needs_review', 'not_assessed'];

// List Development Records for a Child
export const getDevelopmentRecords = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const records = await DevelopmentRecord.find({ childId: child._id }).sort({ expectedAgeMonths: 1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add Development Record
export const createDevelopmentRecord = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const { milestoneCategory, milestoneName, expectedAgeMonths, status, achievedDate, notes } = req.body;

    if (!milestoneCategory || !ALLOWED_CATEGORIES.includes(milestoneCategory)) {
      res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`
      });
      return;
    }

    if (!milestoneName || typeof milestoneName !== 'string' || !milestoneName.trim()) {
      res.status(400).json({ success: false, error: 'Milestone name is required.' });
      return;
    }

    if (expectedAgeMonths === undefined || expectedAgeMonths < 0) {
      res.status(400).json({ success: false, error: 'Expected age in months must be a non-negative number.' });
      return;
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}`
      });
      return;
    }

    const record = await DevelopmentRecord.create({
      childId: child._id,
      milestoneCategory,
      milestoneName: milestoneName.trim(),
      expectedAgeMonths,
      status: status || 'not_assessed',
      achievedDate: achievedDate ? new Date(achievedDate) : undefined,
      notes
    });

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Development Record
export const updateDevelopmentRecord = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const recordId = req.params.recordId as string;
    const { milestoneCategory, milestoneName, expectedAgeMonths, status, achievedDate, notes } = req.body;

    if (!recordId || typeof recordId !== 'string' || !mongoose.Types.ObjectId.isValid(recordId)) {
      res.status(400).json({ success: false, error: 'Invalid record ID format.' });
      return;
    }

    if (milestoneCategory && !ALLOWED_CATEGORIES.includes(milestoneCategory)) {
      res.status(400).json({ success: false, error: `Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}` });
      return;
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}` });
      return;
    }

    const record = await DevelopmentRecord.findOneAndUpdate(
      { _id: recordId, childId: child._id },
      {
        $set: {
          ...(milestoneCategory ? { milestoneCategory } : {}),
          ...(milestoneName ? { milestoneName: milestoneName.trim() } : {}),
          ...(expectedAgeMonths !== undefined ? { expectedAgeMonths } : {}),
          ...(status ? { status } : {}),
          ...(achievedDate !== undefined ? { achievedDate: achievedDate ? new Date(achievedDate) : null } : {}),
          ...(notes !== undefined ? { notes } : {})
        }
      },
      { new: true }
    );

    if (!record) {
      res.status(404).json({ success: false, error: 'Development record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete Development Record
export const deleteDevelopmentRecord = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const recordId = req.params.recordId as string;

    if (!recordId || typeof recordId !== 'string' || !mongoose.Types.ObjectId.isValid(recordId)) {
      res.status(400).json({ success: false, error: 'Invalid record ID format.' });
      return;
    }

    const record = await DevelopmentRecord.findOneAndDelete({ _id: recordId, childId: child._id });
    if (!record) {
      res.status(404).json({ success: false, error: 'Development record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Development record deleted successfully.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
