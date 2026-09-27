import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useAuth } from '@clerk/clerk-react';
import { fetchChildrenProfiles, createChildProfile, ChildProfile, apiClient } from '../services/api';
import { Heart, Plus, Users, Calendar, AlertCircle, ArrowLeft, LogIn } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { getToken } = useAuth();

  // Form State
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [allergies, setAllergies] = useState('');

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      const data = await fetchChildrenProfiles();
      setChildren(data);
    } catch (err) {
      console.warn('Failed to load child profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      await createChildProfile({
        name,
        dateOfBirth,
        gender,
        allergies: allergies ? allergies.split(',').map((s) => s.trim()) : [],
      });
      setName('');
      setDateOfBirth('');
      setAllergies('');
      setShowModal(false);
      loadProfiles();
    } catch (err: any) {
      alert(`Error creating profile: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-forest-50 text-forest-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b-2 border-forest-900">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-forest-100 border border-forest-700 rounded-md">
              <Heart className="w-6 h-6 text-forest-700 fill-forest-700" />
            </div>
            <span className="text-2xl font-black tracking-tight text-forest-900">CareLittle Parent Hub</span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="classical-btn-primary text-sm px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Child Profile
            </button>
            <div className="border-l-2 border-forest-900 pl-3">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:text-forest-900 underline mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
            <h1 className="text-3xl font-black text-forest-900">Children Profiles</h1>
            <p className="text-sm font-medium text-forest-800">Manage health records, growth monitoring, and AI chat per child.</p>
          </div>
        </div>

        {loading ? (
          <p className="text-forest-800 text-sm font-medium">Loading children profiles...</p>
        ) : children.length === 0 ? (
          <div className="classical-card p-10 text-center max-w-lg mx-auto">
            <div className="p-3 bg-forest-100 border border-forest-700 rounded-full w-fit mx-auto mb-4">
              <Users className="w-8 h-8 text-forest-700" />
            </div>
            <h3 className="text-xl font-black text-forest-900 mb-2">No Children Profiles Registered</h3>
            <p className="text-sm text-forest-800 font-medium mb-6 leading-relaxed">
              Register a child profile to track growth percentiles, developmental milestones, vaccination schedules, and start safe AI health chats.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="classical-btn-primary text-sm px-5 py-2.5 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Register First Child Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div key={child._id} className="classical-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3 border-b-2 border-forest-900 pb-3">
                    <div>
                      <h3 className="text-xl font-black text-forest-900">{child.name}</h3>
                      <p className="text-xs font-semibold text-forest-800 flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-forest-700" /> Born: {new Date(child.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="classical-badge text-xs px-2.5 py-0.5 uppercase">
                      {child.gender}
                    </span>
                  </div>

                  {child.allergies && child.allergies.length > 0 && (
                    <div className="mb-4">
                      <span className="text-xs text-rose-900 bg-rose-100 border border-rose-800 px-2.5 py-1 rounded font-bold flex items-center gap-1.5 w-fit">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-700" /> Allergies: {child.allergies.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-forest-200 flex gap-2">
                  <Link
                    to={`/child/${child._id}`}
                    className="flex-1 classical-btn-secondary text-xs py-2 px-3 text-center block"
                  >
                    View Child Dashboard
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-forest-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="classical-card max-w-md w-full p-6 shadow-2xl">
              <h2 className="text-xl font-black text-forest-900 mb-4 border-b-2 border-forest-900 pb-2">Register Child Profile</h2>
              <form onSubmit={handleAddChild} className="space-y-4 text-sm font-medium">
                <div>
                  <label className="block text-forest-900 font-bold mb-1">Child's Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white text-forest-900 outline-none focus:bg-forest-50"
                  />
                </div>

                <div>
                  <label className="block text-forest-900 font-bold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white text-forest-900 outline-none focus:bg-forest-50"
                  />
                </div>

                <div>
                  <label className="block text-forest-900 font-bold mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white text-forest-900 outline-none focus:bg-forest-50"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-forest-900 font-bold mb-1">Known Allergies (comma separated)</label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. Peanuts, Penicillin"
                    className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white text-forest-900 outline-none focus:bg-forest-50"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t-2 border-forest-900">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border-1.5 border-forest-900 rounded-md text-forest-900 hover:bg-forest-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="classical-btn-primary px-5 py-2 text-sm"
                  >
                    Save Profile
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
