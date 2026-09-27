import { Response } from 'express';
import mongoose from 'mongoose';
import { ChildRequest } from '../middleware/childOwnership.js';
import { ConversationSession } from '../models/ConversationSession.js';
import { ChatMessage } from '../models/Message.js';
import { triageEngine } from '../safety/triageEngine.js';
import { symptomAgent } from '../agents/SymptomAgent.js';
import { validateAIOutput } from '../safety/outputValidator.js';
import { SafetyEvent } from '../models/SafetyEvent.js';
import { AIMessageContext } from '../services/ai/types.js';
import { retrievalService } from '../services/rag/retrieval.service.js';
import { contextBuilderService } from '../services/rag/contextBuilder.service.js';
import { citationService } from '../services/rag/citation.service.js';

// Create Chat Session
export const createSession = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const { title } = req.body;

    const session = await ConversationSession.create({
      childId: child._id,
      parentId: req.user!.clerkId,
      title: title || `Health Chat for ${child.name}`
    });

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// List Chat Sessions for a Child
export const getSessions = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const sessions = await ConversationSession.find({
      childId: child._id,
      parentId: req.user!.clerkId,
      status: { $ne: 'deleted' }
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Session Messages
export const getSessionMessages = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const sessionId = req.params.sessionId as string;

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      res.status(400).json({ success: false, error: 'Invalid session ID format.' });
      return;
    }

    const session = await ConversationSession.findOne({
      _id: sessionId,
      childId: child._id,
      parentId: req.user!.clerkId,
      status: { $ne: 'deleted' }
    });

    if (!session) {
      res.status(404).json({ success: false, error: 'Conversation session not found.' });
      return;
    }

    const messages = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Post Message & Process Phase 5 RAG + AI Response Flow
export const sendMessage = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const sessionId = req.params.sessionId as string;
    const { message: userText, temperature, countryCode } = req.body;

    if (!userText || typeof userText !== 'string' || !userText.trim()) {
      res.status(400).json({ success: false, error: 'Message text is required.' });
      return;
    }

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      res.status(400).json({ success: false, error: 'Invalid session ID format.' });
      return;
    }

    const session = await ConversationSession.findOne({
      _id: sessionId,
      childId: child._id,
      parentId: req.user!.clerkId,
      status: { $ne: 'deleted' }
    });

    if (!session) {
      res.status(404).json({ success: false, error: 'Conversation session not found.' });
      return;
    }

    // 1. Calculate child age in days & months for deterministic safety and age filtering
    const now = new Date();
    const dob = new Date(child.dateOfBirth);
    const childAgeInDays = Math.floor(Math.abs(now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24));
    const childAgeInMonths = Math.floor(childAgeInDays / 30.44);

    // 2. RUN PHASE 3 DETERMINISTIC SAFETY TRIAGE FIRST
    const triageResult = triageEngine.evaluate({
      childId: child._id.toString(),
      childAgeInDays,
      childDOB: child.dateOfBirth,
      text: userText,
      temperature: temperature ? Number(temperature) : undefined,
      countryCode: countryCode || process.env.DEFAULT_COUNTRY_CODE || 'IN'
    });

    // Save User Message to MongoDB
    const userMsg = await ChatMessage.create({
      sessionId: session._id,
      sender: 'user',
      text: userText.trim(),
      triageLevel: triageResult.level
    });

    // IF EMERGENCY RED FLAG: DO NOT CALL RAG OR LLM!
    if (triageResult.level === 'emergency') {
      const safetyEvent = await SafetyEvent.create({
        parentId: req.user!.clerkId,
        childId: child._id.toString(),
        sessionId: session._id.toString(),
        eventType: 'red_flag',
        triggerRule: triageResult.matchedRules.map((r) => r.ruleId).join(', '),
        details: {
          matchedRules: triageResult.matchedRules,
          userText
        },
        severity: 'critical',
        status: 'escalated',
        timestamp: new Date()
      });

      const emergencyAiMsg = await ChatMessage.create({
        sessionId: session._id,
        sender: 'ai',
        text: triageResult.userMessage,
        triageLevel: 'emergency',
        safetyEventId: safetyEvent._id
      });

      session.updatedAt = new Date();
      await session.save();

      res.status(200).json({
        success: true,
        data: {
          userMessage: userMsg,
          aiMessage: emergencyAiMsg,
          triageLevel: 'emergency',
          safetyTriggered: true,
          emergencyContacts: triageResult.emergencyContacts,
          grounding: {
            status: 'no_results',
            sources: []
          }
        }
      });
      return;
    }

    // 3. RUN PHASE 5 MEDICAL RAG RETRIEVAL
    let ragResult;
    try {
      ragResult = await retrievalService.retrieveRelevantEvidence(userText, {
        ageInMonths: childAgeInMonths
      });
    } catch (ragErr: any) {
      console.warn('[RAG Retrieval Warning]:', ragErr.message);
      ragResult = {
        status: 'insufficient_evidence' as const,
        evidenceList: [],
        groundingMetadata: { status: 'insufficient_evidence' as const, sources: [] }
      };
    }

    const evidenceContext = contextBuilderService.buildEvidenceContext(
      ragResult.evidenceList,
      ragResult.status
    );
    const groundingMetadata = citationService.generateGroundingMetadata(
      ragResult.evidenceList,
      ragResult.status
    );

    // 4. Fetch Recent Chat History
    const pastMessages = await ChatMessage.find({ sessionId }).sort({ createdAt: -1 }).limit(8);
    const history: AIMessageContext[] = pastMessages
      .reverse()
      .filter((m) => m._id.toString() !== userMsg._id.toString())
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }));

    // 5. ROUTE TO SYMPTOM AGENT WITH RAG CONTEXT
    let aiResponseText = '';
    try {
      const agentResult = await symptomAgent.processQuery({
        child,
        userMessage: userText,
        history,
        evidenceContext
      });
      aiResponseText = agentResult.content;
    } catch (aiErr: any) {
      console.error('[AI Provider Error]:', aiErr.message);
      aiResponseText =
        'I apologize, but I am currently having trouble communicating with the configured AI provider. ' +
        'Please ensure internet connectivity or try again in a moment. If your child has urgent symptoms, please consult a pediatrician directly.';
    }

    // 6. RUN OUTPUT SAFETY VALIDATOR
    const outputValidation = await validateAIOutput(
      aiResponseText,
      req.user!.clerkId,
      child._id.toString(),
      session._id.toString()
    );

    // Formatted citation strings for MongoDB storage
    const citationStrings = groundingMetadata.sources.map(
      (s) => `[${s.publisher}] ${s.title} (${s.url})`
    );

    // 7. SAVE AI RESPONSE TO MONGODB
    const aiMsg = await ChatMessage.create({
      sessionId: session._id,
      sender: 'ai',
      text: outputValidation.sanitizedContent,
      triageLevel: triageResult.level,
      citations: citationStrings
    });

    session.updatedAt = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        userMessage: userMsg,
        aiMessage: aiMsg,
        triageLevel: triageResult.level,
        safetyTriggered: !outputValidation.isValid,
        citations: citationStrings,
        grounding: groundingMetadata
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete Chat Session
export const deleteSession = async (req: ChildRequest, res: Response): Promise<void> => {
  try {
    const child = req.child!;
    const sessionId = req.params.sessionId as string;

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      res.status(400).json({ success: false, error: 'Invalid session ID format.' });
      return;
    }

    const session = await ConversationSession.findOneAndUpdate(
      { _id: sessionId, childId: child._id, parentId: req.user!.clerkId },
      { status: 'deleted' },
      { new: true }
    );

    if (!session) {
      res.status(404).json({ success: false, error: 'Conversation session not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Chat session deleted successfully.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
