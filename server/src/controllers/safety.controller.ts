import { Response } from 'express';
import { ChildRequest } from '../middleware/childOwnership.js';
import { triageEngine } from '../safety/index.js';
import { TriageInput } from '../safety/types.js';
import { SafetyEvent } from '../models/SafetyEvent.js';
import { Child } from '../models/Child.js';

// Controlled Safety Evaluation Endpoint (POST /api/v1/safety/evaluate)
export const evaluateSafety = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const parentId = req.user?.clerkId;
    if (!parentId) {
      res.status(401).json({ success: false, error: 'Unauthorized. Authentication required.' });
      return;
    }

    const { childId, text, temperature, temperatureUnit, structuredObservations, countryCode } = req.body;

    let childDOB: Date | undefined;
    let childAgeInDays: number | undefined;

    // If childId is passed, fetch verified child record from DB
    if (childId) {
      const child = req.child || (await Child.findOne({ _id: childId, parentId, isDeleted: false }));
      if (child) {
        childDOB = child.dateOfBirth;
        const now = new Date();
        const dob = new Date(child.dateOfBirth);
        const diffTime = Math.abs(now.getTime() - dob.getTime());
        childAgeInDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    const input: TriageInput = {
      childId,
      childAgeInDays,
      childDOB,
      text,
      temperature,
      temperatureUnit: temperatureUnit || 'C',
      structuredObservations,
      countryCode: countryCode || process.env.DEFAULT_COUNTRY_CODE || 'IN'
    };

    // Run deterministic triage engine (Zero LLM calls)
    const triageResult = triageEngine.evaluate(input);

    // If any safety rule triggered, persist internal SafetyEvent
    if (triageResult.matchedRules.length > 0) {
      await SafetyEvent.create({
        parentId,
        childId: childId || undefined,
        eventType: triageResult.level === 'emergency' ? 'red_flag' : 'rule_execution',
        triggerRule: triageResult.matchedRules.map((r) => r.ruleId).join(', '),
        details: {
          matchedRules: triageResult.matchedRules,
          userTextSnippet: text ? text.substring(0, 200) : undefined,
          temperature,
          childAgeInDays
        },
        severity: triageResult.level === 'emergency' ? 'critical' : 'medium',
        status: triageResult.level === 'emergency' ? 'escalated' : 'logged',
        timestamp: new Date()
      });
    }

    // Return user-safe classification response (Internal SafetyEvent document is NOT exposed)
    res.status(200).json({
      success: true,
      data: triageResult
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
