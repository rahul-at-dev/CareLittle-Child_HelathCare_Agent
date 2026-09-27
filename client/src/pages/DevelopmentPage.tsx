import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  fetchChildById,
  fetchDevelopmentRecords,
  createDevelopmentRecord,
  updateDevelopmentRecord,
  deleteDevelopmentRecord,
  ChildProfile,
  DevelopmentRecord,
  MilestoneCategory,
  MilestoneStatus,
  apiClient
} from '../services/api';
import { Heart, Target, Plus, ArrowLeft, Edit2, Trash2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  gross_motor: 'Gross Motor Skills',
  fine_motor: 'Fine Motor Skills',
  cognitive: 'Cognitive & Problem Solving',
  language: 'Language & Communication',
  social_emotional: 'Social & Emotional'
};

const STATUS_LABELS: Record<MilestoneStatus, { label: string; style: string }> = {
  achieved: { label: 'Achieved', style: 'bg-emerald-100 text-emerald-900 border-emerald-700' },
  in_progress: { label: 'In Progress', style: 'bg-blue-100 text-blue-900 border-blue-700' },
  not_observed: { label: 'Not Observed', style: 'bg-amber-100 text-amber-900 border-amber-700' },
  needs_review: { label: 'Needs Review', style: 'bg-rose-100 text-rose-900 border-rose-700' },
  not_assessed: { label: 'Not Assessed', style: 'bg-slate-100 text-slate-800 border-slate-600' }
};

export const DevelopmentPage: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [records, setRecords] = useState<DevelopmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DevelopmentRecord | null>(null);

  // Form State
  const [milestoneCategory, setMilestoneCategory] = useState<MilestoneCategory>('gross_motor');
  const [milestoneName, setMilestoneName] = useState('');
  const [expectedAgeMonths, setExpectedAgeMonths] = useState<number>(6);
  const [status, setStatus] = useState<MilestoneStatus>('not_assessed');
  const [achievedDate, setAchievedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { getToken } = useAuth();

  const loadData = async () => {
    if (!childId) return;
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      const childData = await fetchChildById(childId);
      setChild(childData);
      const devData = await fetchDevelopmentRecords(childId);
      setRecords(devData);
    } catch (err: any) {
      console.error('Error loading development data:', err);
      setError(err.response?.data?.error || 'Failed to load milestone records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [childId, getToken]);

  const openAddModal = () => {
    setEditingRecord(null);
    setMilestoneCategory('gross_motor');
    setMilestoneName('');
    setExpectedAgeMonths(6);
    setStatus('not_assessed');
    setAchievedDate('');
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (rec: DevelopmentRecord) => {
    setEditingRecord(rec);
    setMilestoneCategory(rec.milestoneCategory);
    setMilestoneName(rec.milestoneName);
    setExpectedAgeMonths(rec.expectedAgeMonths);
    setStatus(rec.status);
    setAchievedDate(rec.achievedDate ? rec.achievedDate.split('T')[0] : '');
    setNotes(rec.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId || !milestoneName.trim()) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        milestoneCategory,
        milestoneName,
        expectedAgeMonths,
        status,
        achievedDate: achievedDate || undefined,
        notes: notes || undefined
      };

      if (editingRecord) {
        await updateDevelopmentRecord(childId, editingRecord._id, payload);
      } else {
        await createDevelopmentRecord(childId, payload);
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(`Error saving record: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!childId || !window.confirm('Delete this milestone record?')) return;
    try {
      const token = await getToken();
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      await deleteDevelopmentRecord(childId, recordId);
      loadData();
    } catch (err: any) {
      alert(`Error deleting record: ${err.message}`);
    }
  };

  const filteredRecords = selectedCategory === 'all'
    ? records
    : records.filter((r) => r.milestoneCategory === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-50 p-8 flex items-center justify-center font-sans">
        <p className="text-forest-900 font-bold">Loading milestone records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest-50 text-forest-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b-2 border-forest-900 py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to={`/child/${childId}`} className="flex items-center gap-2">
            <div className="p-1.5 bg-forest-100 border border-forest-700 rounded-md">
              <Heart className="w-6 h-6 text-forest-700 fill-forest-700" />
            </div>
            <span className="text-xl font-black text-forest-900">{child?.name}'s Developmental Milestones</span>
          </Link>
          <Link to={`/child/${childId}`} className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:text-forest-900 underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Child Hub
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-forest-900">Milestone Tracker</h1>
            <p className="text-xs font-semibold text-forest-800">Track child development using neutral status indicators.</p>
          </div>
          <button
            onClick={openAddModal}
            className="classical-btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Record Milestone
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-800 text-rose-900 rounded-md text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700" /> {error}
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold border-1.5 ${
              selectedCategory === 'all'
                ? 'bg-forest-900 text-white border-forest-900'
                : 'bg-white text-forest-900 border-forest-700 hover:bg-forest-100'
            }`}
          >
            All Categories ({records.length})
          </button>
          {(Object.keys(CATEGORY_LABELS) as MilestoneCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold border-1.5 ${
                selectedCategory === cat
                  ? 'bg-forest-900 text-white border-forest-900'
                  : 'bg-white text-forest-900 border-forest-700 hover:bg-forest-100'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Milestone Records List */}
        <div className="classical-card p-6">
          <h2 className="text-lg font-black text-forest-900 mb-4 border-b-2 border-forest-900 pb-2">
            {selectedCategory === 'all' ? 'All Milestone Records' : CATEGORY_LABELS[selectedCategory as MilestoneCategory]}
          </h2>

          {filteredRecords.length === 0 ? (
            <div className="text-center py-10">
              <Target className="w-10 h-10 text-forest-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-forest-900 mb-1">No Milestone Records Found</h3>
              <p className="text-xs text-forest-800 font-medium mb-4">Click below to record your child's developmental milestone status.</p>
              <button
                onClick={openAddModal}
                className="classical-btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Milestone
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((rec) => {
                const statusMeta = STATUS_LABELS[rec.status] || STATUS_LABELS.not_assessed;
                return (
                  <div key={rec._id} className="border-1.5 border-forest-900 rounded-md p-4 bg-white flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-forest-900">{rec.milestoneName}</h3>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${statusMeta.style}`}>
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="text-xs text-forest-800 font-semibold flex items-center gap-3">
                        <span>Category: {CATEGORY_LABELS[rec.milestoneCategory]}</span>
                        <span>• Expected: ~{rec.expectedAgeMonths} mos</span>
                        {rec.achievedDate && (
                          <span>• Achieved: {new Date(rec.achievedDate).toLocaleDateString()}</span>
                        )}
                      </div>

                      {rec.notes && (
                        <p className="text-xs text-forest-800 italic mt-2 bg-forest-50 p-2 rounded border border-forest-200">
                          Notes: {rec.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(rec)}
                        className="p-1.5 border border-forest-700 rounded text-forest-900 hover:bg-forest-100"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rec._id)}
                        className="p-1.5 border border-rose-800 rounded text-rose-900 hover:bg-rose-100"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-forest-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="classical-card max-w-md w-full p-6 shadow-2xl">
              <h2 className="text-lg font-black text-forest-900 mb-4 border-b-2 border-forest-900 pb-2">
                {editingRecord ? 'Edit Milestone Record' : 'Record Developmental Milestone'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-semibold">
                <div>
                  <label className="block text-forest-900 font-bold mb-1">Category</label>
                  <select
                    value={milestoneCategory}
                    onChange={(e) => setMilestoneCategory(e.target.value as MilestoneCategory)}
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                  >
                    {(Object.keys(CATEGORY_LABELS) as MilestoneCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-forest-900 font-bold mb-1">Milestone Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rolling over, First words, Sitting unsupported"
                    value={milestoneName}
                    onChange={(e) => setMilestoneName(e.target.value)}
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-forest-900 font-bold mb-1">Expected Age (Months)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={expectedAgeMonths}
                      onChange={(e) => setExpectedAgeMonths(Number(e.target.value))}
                      className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-forest-900 font-bold mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
                      className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                    >
                      <option value="achieved">Achieved</option>
                      <option value="in_progress">In Progress</option>
                      <option value="not_observed">Not Observed</option>
                      <option value="needs_review">Needs Review</option>
                      <option value="not_assessed">Not Assessed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-forest-900 font-bold mb-1">Achieved Date (optional)</label>
                  <input
                    type="date"
                    value={achievedDate}
                    onChange={(e) => setAchievedDate(e.target.value)}
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-forest-900 font-bold mb-1">Parent Notes (optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Practicing daily during tummy time"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t-2 border-forest-900">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border-1.5 border-forest-900 rounded-md text-forest-900 font-bold hover:bg-forest-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="classical-btn-primary px-4 py-2 text-xs"
                  >
                    {submitting ? 'Saving...' : 'Save Milestone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
