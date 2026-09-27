import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from './auth.js';
import { Child, IChild } from '../models/Child.js';

export interface ChildRequest extends AuthenticatedRequest {
  child?: IChild;
}

export const validateChildOwnership = async (
  req: ChildRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parentId = req.user?.clerkId;
    const childId = req.params.childId as string;

    if (!parentId) {
      res.status(401).json({ success: false, error: 'Unauthorized. Authentication required.' });
      return;
    }

    if (!childId || typeof childId !== 'string' || !mongoose.Types.ObjectId.isValid(childId)) {
      res.status(400).json({ success: false, error: 'Invalid child ID format.' });
      return;
    }

    const child = await Child.findOne({ _id: childId, isDeleted: false });

    if (!child) {
      res.status(404).json({ success: false, error: 'Child profile not found.' });
      return;
    }

    // Strict Parent Ownership Check
    if (child.parentId !== parentId) {
      res.status(403).json({ success: false, error: 'Forbidden. You do not have permission to access or modify this child record.' });
      return;
    }

    req.child = child;
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
