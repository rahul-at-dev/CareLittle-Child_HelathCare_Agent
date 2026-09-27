import { Response } from 'express';
import mongoose from 'mongoose';
import { ChildRequest } from '../middleware/childOwnership.js';
import { NutritionRecord, MealCategory } from '../models/NutritionRecord.js';

const ALLOWED_MEAL_CATEGORIES: MealCategory[] = ['breastfeeding', 'formula', 'solids', 'snacks', 'fluids'];

// List Nutrition Records for a Child
export const getNutritionRecords = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const records = await NutritionRecord.find({ childId: child._id }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add Nutrition Record
export const createNutritionRecord = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const { date, mealCategory, description, foodItems, dietaryNotes, allergiesTriggered, fluidIntakeMl } = req.body;

    if (!mealCategory || !ALLOWED_MEAL_CATEGORIES.includes(mealCategory)) {
      res.status(400).json({
        success: false,
        error: `Invalid meal category. Must be one of: ${ALLOWED_MEAL_CATEGORIES.join(', ')}`
      });
      return;
    }

    if (fluidIntakeMl !== undefined && (typeof fluidIntakeMl !== 'number' || fluidIntakeMl < 0)) {
      res.status(400).json({ success: false, error: 'Fluid intake (ml) cannot be negative.' });
      return;
    }

    const recordDate = date ? new Date(date) : new Date();
    if (isNaN(recordDate.getTime())) {
      res.status(400).json({ success: false, error: 'Invalid date format.' });
      return;
    }

    const record = await NutritionRecord.create({
      childId: child._id,
      date: recordDate,
      mealCategory,
      description,
      foodItems: foodItems || [],
      dietaryNotes,
      allergiesTriggered: allergiesTriggered || [],
      fluidIntakeMl
    });

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Nutrition Record
export const updateNutritionRecord = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const recordId = req.params.recordId as string;
    const { date, mealCategory, description, foodItems, dietaryNotes, allergiesTriggered, fluidIntakeMl } = req.body;

    if (!recordId || typeof recordId !== 'string' || !mongoose.Types.ObjectId.isValid(recordId)) {
      res.status(400).json({ success: false, error: 'Invalid record ID format.' });
      return;
    }

    if (mealCategory && !ALLOWED_MEAL_CATEGORIES.includes(mealCategory)) {
      res.status(400).json({ success: false, error: `Invalid meal category. Must be one of: ${ALLOWED_MEAL_CATEGORIES.join(', ')}` });
      return;
    }

    if (fluidIntakeMl !== undefined && (typeof fluidIntakeMl !== 'number' || fluidIntakeMl < 0)) {
      res.status(400).json({ success: false, error: 'Fluid intake (ml) cannot be negative.' });
      return;
    }

    const record = await NutritionRecord.findOneAndUpdate(
      { _id: recordId, childId: child._id },
      {
        $set: {
          ...(date ? { date: new Date(date) } : {}),
          ...(mealCategory ? { mealCategory } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(foodItems ? { foodItems } : {}),
          ...(dietaryNotes !== undefined ? { dietaryNotes } : {}),
          ...(allergiesTriggered ? { allergiesTriggered } : {}),
          ...(fluidIntakeMl !== undefined ? { fluidIntakeMl } : {})
        }
      },
      { new: true }
    );

    if (!record) {
      res.status(404).json({ success: false, error: 'Nutrition record not found.' });
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

// Delete Nutrition Record
export const deleteNutritionRecord = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const recordId = req.params.recordId as string;

    if (!recordId || typeof recordId !== 'string' || !mongoose.Types.ObjectId.isValid(recordId)) {
      res.status(400).json({ success: false, error: 'Invalid record ID format.' });
      return;
    }

    const record = await NutritionRecord.findOneAndDelete({ _id: recordId, childId: child._id });
    if (!record) {
      res.status(404).json({ success: false, error: 'Nutrition record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Nutrition record deleted successfully.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
