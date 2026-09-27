import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Child } from '../models/Child.js';

// Create a new Child Profile
export const createChild = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user?.clerkId;
    if (!parentId) {
      res.status(401).json({ success: false, error: 'User unauthenticated' });
      return;
    }

    const { name, dateOfBirth, gender, birthWeightKg, allergies, chronicConditions, bloodType } = req.body;

    if (!name || !dateOfBirth || !gender) {
      res.status(400).json({ success: false, error: 'Name, dateOfBirth, and gender are required.' });
      return;
    }

    const child = await Child.create({
      parentId,
      name,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      birthWeightKg,
      allergies: allergies || [],
      chronicConditions: chronicConditions || [],
      bloodType
    });

    res.status(201).json({
      success: true,
      data: child
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// List all active children for authenticated parent
export const getChildren = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user?.clerkId;
    const children = await Child.find({ parentId, isDeleted: false }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: children.length,
      data: children
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single child profile by ID
export const getChildById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user?.clerkId;
    const { childId } = req.params;

    const child = await Child.findOne({ _id: childId, parentId, isDeleted: false });
    if (!child) {
      res.status(404).json({ success: false, error: 'Child profile not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: child
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete single child profile (Soft delete)
export const deleteChild = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user?.clerkId;
    const { childId } = req.params;

    const child = await Child.findOneAndUpdate(
      { _id: childId, parentId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!child) {
      res.status(404).json({ success: false, error: 'Child profile not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Child profile '${child.name}' deleted successfully`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
