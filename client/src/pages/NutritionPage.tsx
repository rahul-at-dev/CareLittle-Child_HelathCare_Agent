import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  fetchChildById,
  fetchNutritionRecords,
  createNutritionRecord,
  deleteNutritionRecord,
  ChildProfile,
  NutritionRecord,
  MealCategory,
  apiClient
} from '../services/api';
import { Heart, Utensils, Plus, ArrowLeft, Trash2, Calendar, AlertCircle, Droplets } from 'lucide-react';

const MEAL_CATEGORY_LABELS: Record<MealCategory, string> = {
  breastfeeding: 'Breastfeeding',
  formula: 'Formula Feeding',
  solids: 'Solid Foods / Meals',
  snacks: 'Snacks',
  fluids: 'Fluids & Water'
};

export const NutritionPage: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [records, setRecords] = useState<NutritionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealCategory, setMealCategory] = useState<MealCategory>('solids');
  const [description, setDescription] = useState('');
  const [foodItemsInput, setFoodItemsInput] = useState('');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [fluidIntakeMl, setFluidIntakeMl] = useState<number | ''>('');
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
      const nutData = await fetchNutritionRecords(childId);
      setRecords(nutData);
    } catch (err: any) {
      console.error('Error loading nutrition data:', err);
      setError(err.response?.data?.error || 'Failed to load nutrition records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [childId, getToken]);

  const handleAddNutrition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      await createNutritionRecord(childId, {
        date,
        mealCategory,
        description: description || undefined,
        foodItems: foodItemsInput ? foodItemsInput.split(',').map((s) => s.trim()).filter(Boolean) : [],
        dietaryNotes: dietaryNotes || undefined,
        fluidIntakeMl: fluidIntakeMl !== '' ? Number(fluidIntakeMl) : undefined
      });

      setShowModal(false);
      setDescription('');
      setFoodItemsInput('');
      setDietaryNotes('');
      setFluidIntakeMl('');
      loadData();
    } catch (err: any) {
      alert(`Error saving nutrition record: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!childId || !window.confirm('Delete this nutrition record?')) return;
    try {
      const token = await getToken();
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      await deleteNutritionRecord(childId, recordId);
      loadData();
    } catch (err: any) {
      alert(`Error deleting record: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-50 p-8 flex items-center justify-center font-sans">
        <p className="text-forest-900 font-bold">Loading nutrition records...</p>
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
            <span className="text-xl font-black text-forest-900">{child?.name}'s Nutrition & Feeding Logs</span>
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
            <h1 className="text-2xl font-black text-forest-900">Feeding & Nutrition Records</h1>
            <p className="text-xs font-semibold text-forest-800">Log meals, solid foods, breastfeeding, and daily fluid intake.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="classical-btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Meal Record
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-800 text-rose-900 rounded-md text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-700" /> {error}
          </div>
        )}

        {/* Nutrition Log List */}
        <div className="classical-card p-6">
          <h2 className="text-lg font-black text-forest-900 mb-4 border-b-2 border-forest-900 pb-2">Nutrition History Timeline</h2>

          {records.length === 0 ? (
            <div className="text-center py-10">
              <Utensils className="w-10 h-10 text-forest-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-forest-900 mb-1">No Nutrition Records Logged</h3>
              <p className="text-xs text-forest-800 font-medium mb-4">Click below to record your child's first feeding or meal entry.</p>
              <button
                onClick={() => setShowModal(true)}
                className="classical-btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add First Record
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((rec) => (
                <div key={rec._id} className="border-1.5 border-forest-900 rounded-md p-4 bg-white flex justify-between items-start gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="classical-badge text-xs px-2.5 py-0.5 uppercase">
                        {MEAL_CATEGORY_LABELS[rec.mealCategory]}
                      </span>
                      <span className="text-xs font-bold text-forest-900">
                        {new Date(rec.date).toLocaleDateString()}
                      </span>
                    </div>

                    {rec.description && (
                      <p className="text-sm font-bold text-forest-900">{rec.description}</p>
                    )}

                    {rec.foodItems && rec.foodItems.length > 0 && (
                      <div className="text-xs font-semibold text-forest-800">
                        <strong>Food items:</strong> {rec.foodItems.join(', ')}
                      </div>
                    )}

                    {rec.fluidIntakeMl !== undefined && (
                      <div className="text-xs font-bold text-teal-800 flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-teal-700" /> Fluid intake: {rec.fluidIntakeMl} ml
                      </div>
                    )}

                    {rec.dietaryNotes && (
                      <p className="text-xs text-forest-800 italic bg-forest-50 p-2 rounded border border-forest-200">
                        Notes: {rec.dietaryNotes}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(rec._id)}
                    className="p-1.5 border border-rose-800 rounded text-rose-900 hover:bg-rose-100 flex-shrink-0"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-forest-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="classical-card max-w-md w-full p-6 shadow-2xl">
              <h2 className="text-lg font-black text-forest-900 mb-4 border-b-2 border-forest-900 pb-2">Record Feeding / Meal Entry</h2>
              <form onSubmit={handleAddNutrition} className="space-y-3.5 text-xs font-semibold">
                <div>
                  <label className="block text-forest-900 font-bold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-forest-900 font-bold mb-1">Meal / Feeding Category</label>
                  <select
                    value={mealCategory}
                    onChange={(e) => setMealCategory(e.target.value as MealCategory)}
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                  >
                    {(Object.keys(MEAL_CATEGORY_LABELS) as MealCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {MEAL_CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-forest-900 font-bold mb-1">Meal Title / Summary (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning Oats & Banana Mash"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-forest-900 font-bold mb-1">Food Items (comma separated, optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Pureed Apple, Steamed Carrots, Water"
                    value={foodItemsInput}
                    onChange={(e) => setFoodItemsInput(e.target.value)}
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-forest-900 font-bold mb-1">Fluid Intake (ml, optional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 150"
                    value={fluidIntakeMl}
                    onChange={(e) => setFluidIntakeMl(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-forest-900 font-bold mb-1">Dietary Notes (optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Finished entire bowl, tolerated solids well"
                    value={dietaryNotes}
                    onChange={(e) => setDietaryNotes(e.target.value)}
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
                    {submitting ? 'Saving...' : 'Save Meal Record'}
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
