import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { fetchChildById, fetchGrowthRecords, createGrowthRecord, ChildProfile, GrowthRecord, apiClient } from '../services/api';
import { Heart, Activity, Plus, ArrowLeft, Calendar, Scale, Ruler, AlertCircle } from 'lucide-react';

export const GrowthPage: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { getToken } = useAuth();

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [ageInMonths, setAgeInMonths] = useState<number>(0);
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

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
      const recordsData = await fetchGrowthRecords(childId);
      setGrowthRecords(recordsData);
    } catch (err: any) {
      console.error('Error loading growth page data:', err);
      setError(err.response?.data?.error || 'Failed to load growth records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [childId, getToken]);

  const handleAddGrowth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId || weightKg === '' || heightCm === '') return;
    setSubmitting(true);
    try {
      const token = await getToken();
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      await createGrowthRecord(childId, {
        date,
        ageInMonths,
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        headCircumferenceCm: headCircumferenceCm !== '' ? Number(headCircumferenceCm) : undefined,
      });
      setShowModal(false);
      setWeightKg('');
      setHeightCm('');
      setHeadCircumferenceCm('');
      loadData();
    } catch (err: any) {
      alert(`Failed to save record: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-50 p-8 flex items-center justify-center font-sans">
        <p className="text-forest-900 font-bold">Loading growth records...</p>
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
            <span className="text-xl font-black text-forest-900">{child?.name}'s Growth Monitoring</span>
          </Link>
          <Link to={`/child/${childId}`} className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:text-forest-900 underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Child Hub
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-forest-900">Growth Records & Measurements</h1>
            <p className="text-xs font-semibold text-forest-800">Track weight, height, and head circumference deterministically.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="classical-btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Measurement
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-800 text-rose-900 rounded-md text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700" /> {error}
          </div>
        )}

        {/* Latest Summary Cards */}
        {growthRecords.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="classical-card p-4">
              <span className="text-xs font-bold text-forest-800 uppercase tracking-wider block mb-1">Latest Weight</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-forest-900">{growthRecords[0].weightKg} kg</span>
                <span className="text-xs font-semibold text-forest-700">({growthRecords[0].ageInMonths} mos)</span>
              </div>
            </div>
            <div className="classical-card p-4">
              <span className="text-xs font-bold text-forest-800 uppercase tracking-wider block mb-1">Latest Height</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-forest-900">{growthRecords[0].heightCm} cm</span>
                <span className="text-xs font-semibold text-forest-700">({growthRecords[0].ageInMonths} mos)</span>
              </div>
            </div>
            <div className="classical-card p-4">
              <span className="text-xs font-bold text-forest-800 uppercase tracking-wider block mb-1">Head Circumference</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-forest-900">
                  {growthRecords[0].headCircumferenceCm ? `${growthRecords[0].headCircumferenceCm} cm` : 'Not recorded'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Measurement History Table */}
        <div className="classical-card p-6">
          <h2 className="text-lg font-black text-forest-900 mb-4 border-b-2 border-forest-900 pb-2">Measurement History</h2>

          {growthRecords.length === 0 ? (
            <div className="text-center py-10">
              <Activity className="w-10 h-10 text-forest-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-forest-900 mb-1">No Growth Records Found</h3>
              <p className="text-xs text-forest-800 font-medium mb-4">Click below to record your child's first weight and height measurement.</p>
              <button
                onClick={() => setShowModal(true)}
                className="classical-btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add First Record
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold border-collapse">
                <thead>
                  <tr className="border-b-2 border-forest-900 bg-forest-100 text-forest-900">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Age (Months)</th>
                    <th className="py-2.5 px-3">Weight (kg)</th>
                    <th className="py-2.5 px-3">Height (cm)</th>
                    <th className="py-2.5 px-3">Head Circ. (cm)</th>
                    <th className="py-2.5 px-3">Percentiles</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-forest-200">
                  {growthRecords.map((rec) => (
                    <tr key={rec._id} className="hover:bg-forest-50">
                      <td className="py-2.5 px-3 font-bold">{new Date(rec.date).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3">{rec.ageInMonths} months</td>
                      <td className="py-2.5 px-3 font-bold text-forest-900">{rec.weightKg} kg</td>
                      <td className="py-2.5 px-3 font-bold text-forest-900">{rec.heightCm} cm</td>
                      <td className="py-2.5 px-3">{rec.headCircumferenceCm ? `${rec.headCircumferenceCm} cm` : '-'}</td>
                      <td className="py-2.5 px-3 italic text-forest-700">
                        {rec.percentiles.weight !== null ? `W: ${rec.percentiles.weight}%` : 'Not calculated'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Record Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-forest-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="classical-card max-w-md w-full p-6 shadow-2xl">
              <h2 className="text-lg font-black text-forest-900 mb-4 border-b-2 border-forest-900 pb-2">Record Growth Measurement</h2>
              <form onSubmit={handleAddGrowth} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-forest-900 font-bold mb-1">Measurement Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-forest-900 font-bold mb-1">Age in Months</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={ageInMonths}
                    onChange={(e) => setAgeInMonths(Number(e.target.value))}
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-forest-900 font-bold mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      required
                      placeholder="e.g. 8.5"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-forest-900 font-bold mb-1">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      required
                      placeholder="e.g. 68.0"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-forest-900 font-bold mb-1">Head Circumference (cm, optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    placeholder="e.g. 42.5"
                    value={headCircumferenceCm}
                    onChange={(e) => setHeadCircumferenceCm(e.target.value === '' ? '' : Number(e.target.value))}
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
                    {submitting ? 'Saving...' : 'Save Measurement'}
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
