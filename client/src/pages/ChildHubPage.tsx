import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { fetchChildById, ChildProfile, apiClient } from '../services/api';
import { Heart, Activity, Target, Utensils, Shield, ArrowLeft, Calendar, AlertCircle, MessageSquare } from 'lucide-react';

export const ChildHubPage: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getToken } = useAuth();

  useEffect(() => {
    const loadChild = async () => {
      if (!childId) return;
      setLoading(true);
      setError('');
      try {
        const token = await getToken();
        if (token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        const data = await fetchChildById(childId);
        setChild(data);
      } catch (err: any) {
        console.error('Error fetching child details:', err);
        setError(err.response?.data?.error || 'Unable to load child profile.');
      } finally {
        setLoading(false);
      }
    };

    loadChild();
  }, [childId, getToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-50 p-8 flex items-center justify-center font-sans">
        <p className="text-forest-900 font-bold">Loading child profile hub...</p>
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="min-h-screen bg-forest-50 p-8 font-sans">
        <div className="max-w-xl mx-auto classical-card p-6 text-center">
          <AlertCircle className="w-10 h-10 text-rose-700 mx-auto mb-3" />
          <h2 className="text-xl font-black text-forest-900 mb-2">Access Error</h2>
          <p className="text-sm font-medium text-forest-800 mb-4">{error || 'Child record not found or access unauthorized.'}</p>
          <Link to="/dashboard" className="classical-btn-primary px-4 py-2 text-xs">
            Return to Parent Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest-50 text-forest-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b-2 border-forest-900 py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="p-1.5 bg-forest-100 border border-forest-700 rounded-md">
              <Heart className="w-6 h-6 text-forest-700 fill-forest-700" />
            </div>
            <span className="text-xl font-black text-forest-900">{child.name}'s Health Hub</span>
          </Link>
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:text-forest-900 underline">
            <ArrowLeft className="w-3.5 h-3.5" /> All Children Profiles
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Child Summary Header */}
        <div className="classical-card p-6 mb-8 flex justify-between items-center flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-forest-900">{child.name}</h1>
              <span className="classical-badge text-xs px-2.5 py-0.5 uppercase">{child.gender}</span>
            </div>
            <p className="text-xs font-semibold text-forest-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-forest-700" /> Date of Birth: {new Date(child.dateOfBirth).toLocaleDateString()}
            </p>
          </div>

          {child.allergies && child.allergies.length > 0 && (
            <div className="bg-rose-100 border border-rose-800 px-3 py-1.5 rounded text-xs font-bold text-rose-900">
              ⚠️ Allergies: {child.allergies.join(', ')}
            </div>
          )}
        </div>

        {/* Core Health Records Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pediatric Safety Check */}
          <div className="classical-card p-6 flex flex-col justify-between border-2 border-forest-900 bg-forest-100">
            <div>
              <div className="p-3 bg-white border border-forest-700 rounded-md w-fit mb-4">
                <Shield className="w-6 h-6 text-forest-700" />
              </div>
              <h3 className="text-lg font-black text-forest-900 mb-2">Safety Evaluator</h3>
              <p className="text-xs font-semibold text-forest-900 mb-6 leading-relaxed">
                Run deterministic triage rules for neonatal fever, breathing distress, and poisoning signs.
              </p>
            </div>
            <Link
              to={`/child/${child._id}/safety`}
              className="classical-btn-primary text-xs py-2.5 px-4 text-center block"
            >
              Run Safety Check
            </Link>
          </div>

          {/* AI Symptom Chat Assistant (Phase 4) */}
          <div className="classical-card p-6 flex flex-col justify-between border-2 border-forest-900 bg-emerald-50">
            <div>
              <div className="p-3 bg-white border border-forest-700 rounded-md w-fit mb-4">
                <MessageSquare className="w-6 h-6 text-forest-700" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-black text-forest-900">Symptom AI Chat</h3>
                <span className="bg-forest-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">Phase 4</span>
              </div>
              <p className="text-xs font-medium text-forest-800 mb-6 leading-relaxed">
                Discuss child health symptoms with the AI Symptom Agent. Guarded by pre-LLM safety triage.
              </p>
            </div>
            <Link
              to={`/child/${child._id}/chat`}
              className="classical-btn-primary text-xs py-2.5 px-4 text-center block"
            >
              Start Symptom Chat
            </Link>
          </div>

          {/* Growth Monitoring */}
          <div className="classical-card p-6 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-forest-100 border border-forest-700 rounded-md w-fit mb-4">
                <Activity className="w-6 h-6 text-forest-700" />
              </div>
              <h3 className="text-lg font-black text-forest-900 mb-2">Growth Monitoring</h3>
              <p className="text-xs font-medium text-forest-800 mb-6 leading-relaxed">
                Log height, weight, and head circumference over time. View growth history and measurements.
              </p>
            </div>
            <Link
              to={`/child/${child._id}/growth`}
              className="classical-btn-primary text-xs py-2.5 px-4 text-center block"
            >
              Open Growth Records
            </Link>
          </div>

          {/* Developmental Milestones */}
          <div className="classical-card p-6 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-forest-100 border border-forest-700 rounded-md w-fit mb-4">
                <Target className="w-6 h-6 text-forest-700" />
              </div>
              <h3 className="text-lg font-black text-forest-900 mb-2">Developmental Milestones</h3>
              <p className="text-xs font-medium text-forest-800 mb-6 leading-relaxed">
                Track motor, cognitive, language, and social milestones using neutral status indicators.
              </p>
            </div>
            <Link
              to={`/child/${child._id}/development`}
              className="classical-btn-primary text-xs py-2.5 px-4 text-center block"
            >
              Open Milestone Tracker
            </Link>
          </div>

          {/* Nutrition & Feeding Records */}
          <div className="classical-card p-6 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-forest-100 border border-forest-700 rounded-md w-fit mb-4">
                <Utensils className="w-6 h-6 text-forest-700" />
              </div>
              <h3 className="text-lg font-black text-forest-900 mb-2">Nutrition & Feeding</h3>
              <p className="text-xs font-medium text-forest-800 mb-6 leading-relaxed">
                Log breastfeeding, formula, solid meals, snacks, and daily fluid intake.
              </p>
            </div>
            <Link
              to={`/child/${child._id}/nutrition`}
              className="classical-btn-primary text-xs py-2.5 px-4 text-center block"
            >
              Open Nutrition Records
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

