import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { Heart, Lock, Mail, ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import childcareImg from '../assets/childcare.jpg';

export const SignInPage: React.FC = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError('');
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/dashboard');
      } else {
        console.log('SignIn status:', result);
        setError('Verification or additional step required.');
      }
    } catch (err: any) {
      console.error('Clerk SignIn error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Login failed. Please check credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-50 text-forest-900 font-sans flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b-2 border-forest-900 py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-forest-100 border border-forest-700 rounded-md">
              <Heart className="w-6 h-6 text-forest-700 fill-forest-700" />
            </div>
            <span className="text-2xl font-black tracking-tight text-forest-900">CareLittle AI</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:text-forest-900 underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Website
          </Link>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 flex items-center justify-center">
        <div className="classical-card w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-2xl">
          {/* Left Column: Custom Image UI */}
          <div className="relative bg-forest-900 p-8 flex flex-col justify-between border-b-2 md:border-b-0 md:border-r-2 border-forest-900 min-h-[350px]">
            <img
              src={childcareImg}
              alt="CareLittle Pediatric Childcare"
              className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-overlay"
            />
            <div className="relative z-10">
              <div className="classical-badge text-xs px-3 py-1 bg-forest-100 text-forest-900 inline-flex items-center gap-1.5 mb-4">
                <Shield className="w-3.5 h-3.5 text-forest-700" /> Parent Security Portal
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">
                Evidence-Based Pediatric Care for Every Milestone
              </h2>
              <p className="text-xs text-forest-100 font-medium leading-relaxed max-w-sm">
                Log growth percentiles, track vaccinations, generate doctor summaries, and access safety-first AI health guidance.
              </p>
            </div>

            <div className="relative z-10 pt-6 border-t border-forest-700/50">
              <p className="text-[11px] text-forest-200 font-semibold italic">
                "Grounding child health decisions in medical accuracy and safety guardrails."
              </p>
            </div>
          </div>

          {/* Right Column: Custom Auth Window Theme */}
          <div className="p-8 bg-white flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-forest-900">Parent Sign In</h2>
              <p className="text-xs font-semibold text-forest-800 mt-1">
                Access your registered children profiles & records
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-rose-50 border-2 border-rose-800 rounded-md text-rose-900 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-forest-900 font-bold mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-forest-700" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full border-2 border-forest-900 rounded-md px-3 py-2.5 bg-white text-forest-900 text-sm outline-none focus:bg-forest-50"
                />
              </div>

              <div>
                <label className="block text-forest-900 font-bold mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-forest-700" /> Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-2 border-forest-900 rounded-md px-3 py-2.5 bg-white text-forest-900 text-sm outline-none focus:bg-forest-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full classical-btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Parent Portal'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t-2 border-forest-900 text-center text-xs font-bold">
              <span className="text-forest-800">Don't have a parent account? </span>
              <Link to="/sign-up" className="text-forest-700 hover:text-forest-900 underline underline-offset-2">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-forest-900 bg-white py-4 text-center text-xs font-semibold text-forest-800">
        CareLittle AI • Pediatric Safety First Authentication
      </footer>
    </div>
  );
};
