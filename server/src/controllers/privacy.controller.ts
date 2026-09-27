import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Child } from '../models/Child.js';

// Get Privacy & Data Consent Status
export const getPrivacyConsent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    let user = await User.findOne({ clerkId });
    if (!user) {
      user = await User.create({
        clerkId,
        email: req.user?.email || 'parent@carelittle.local',
        privacyConsent: {
          agreedToTerms: true,
          consentDate: new Date(),
          dataRetentionDays: 365
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        clerkId: user.clerkId,
        email: user.email,
        preferredLanguage: user.preferredLanguage,
        privacyConsent: user.privacyConsent
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Consent Options
export const updatePrivacyConsent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkId = req.user?.clerkId;
    const { agreedToTerms, dataRetentionDays, preferredLanguage } = req.body;

    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        $set: {
          'privacyConsent.agreedToTerms': agreedToTerms ?? true,
          'privacyConsent.consentDate': new Date(),
          'privacyConsent.dataRetentionDays': dataRetentionDays || 365,
          ...(preferredLanguage ? { preferredLanguage } : {})
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: user
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Account & Data Deletion Architecture (GDPR / COPPA Right to Erasure)
export const deleteAccountData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkId = req.user?.clerkId;
    if (!clerkId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    // Cascade soft/hard deletion across all child profiles and child-related data
    const childrenCount = await Child.countDocuments({ parentId: clerkId });
    await Child.updateMany({ parentId: clerkId }, { isDeleted: true, deletedAt: new Date() });
    await User.deleteOne({ clerkId });

    res.status(200).json({
      success: true,
      message: 'Account and associated children records successfully deleted',
      deletedChildrenCount: childrenCount
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
