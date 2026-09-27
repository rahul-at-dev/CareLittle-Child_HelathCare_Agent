import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    clerkId: string;
    email: string;
  };
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // When Clerk keys are configured, verify token here
      // For Phase 1 initial setup, extract clerk user payload or fallback
      req.user = {
        clerkId: token.startsWith('user_') ? token : 'dev_clerk_user_123',
        email: 'parent@carelittle.local'
      };
      return next();
    }
    
    // Dev fallback mode if Clerk credentials are placeholder
    if (process.env.NODE_ENV === 'development') {
      req.user = {
        clerkId: 'dev_clerk_user_123',
        email: 'parent@carelittle.local'
      };
      return next();
    }
    
    res.status(401).json({
      success: false,
      error: 'Unauthorized. Missing or invalid authentication token.'
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: 'Authentication verification failed.'
    });
  }
};
