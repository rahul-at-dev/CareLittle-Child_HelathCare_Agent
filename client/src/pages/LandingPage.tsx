import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { fetchHealthStatus, HealthStatusResponse } from '../services/api';
import { Shield, Heart, Activity, AlertTriangle, ChevronRight, LogIn } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    fetchHealthStatus()
      .then((data) => {
        setHealthStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Backend connection error:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-forest-50 text-forest-900 font-sans">
      {/* Top Header */}
      <header className="bg-white border-b-2 border-forest-900 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-forest-100 border border-forest-700 rounded-md">
              <Heart className="w-6 h-6 text-forest-700 fill-forest-700" />
            </div>
            <span className="text-2xl font-black tracking-tight text-forest-900">CareLittle AI</span>
            <span className="classical-badge text-xs px-2.5 py-0.5 ml-2">Phase 1 Baseline</span>
          </div>

          <nav className="flex items-center gap-5">
            <Link to="/privacy-terms" className="text-sm font-semibold text-forest-900 hover:text-forest-700 underline underline-offset-4 decoration-forest-500">
              Privacy & Consent
            </Link>

            <SignedOut>
              <Link
                to="/sign-in"
                className="text-sm font-bold text-forest-900 hover:text-forest-700 flex items-center gap-1"
              >
                <LogIn className="w-4 h-4 text-forest-700" /> Sign In
              </Link>
              <Link
                to="/sign-up"
                className="classical-btn-primary text-sm px-4 py-2 flex items-center gap-1.5"
              >
                Register Account
              </Link>
            </SignedOut>

            <SignedIn>
              <Link
                to="/dashboard"
                className="classical-btn-primary text-sm px-4 py-2 flex items-center gap-1.5"
              >
                Parent Portal <ChevronRight className="w-4 h-4" />
              </Link>
              <div className="border-l-2 border-forest-900 pl-3">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </nav>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-14">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 classical-badge text-xs px-3.5 py-1.5 mb-6">
            <Shield className="w-4 h-4 text-forest-700" />
            Pediatric Safety First Architecture (AI-Assisted, Human Escalated)
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold italic text-forest-900 tracking-tight leading-tight mb-6">
            Empathetic, Safe & Evidence-Based Healthcare for Your Little Ones🧑‍🍼
          </h1>

          <p className="text-base md:text-lg text-forest-800 font-medium mb-8 leading-relaxed max-w-2xl mx-auto">
            CareLittle AI provides grounded child health tracking, WHO growth percentiles, vaccination scheduling, and deterministic triage safety guardrails.
          </p>

          <div className="flex justify-center gap-4">
            <SignedIn>
              <Link
                to="/dashboard"
                className="classical-btn-primary text-base px-7 py-3.5 flex items-center gap-2"
              >
                Go to Parent Dashboard <ChevronRight className="w-5 h-5" />
              </Link>
            </SignedIn>
            <SignedOut>
              <Link
                to="/sign-in"
                className="classical-btn-primary text-base px-7 py-3.5 flex items-center gap-2"
              >
                Sign In to Start <ChevronRight className="w-5 h-5" />
              </Link>
            </SignedOut>
          </div>
        </div>

        {/* Classical Box Card - System Status */}
        <div className="classical-card p-8 max-w-2xl mx-auto mb-14">
          <div className="flex items-center justify-between border-b-2 border-forest-900 pb-4 mb-6">
            <h2 className="text-xl font-bold text-forest-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-forest-700" /> System Readiness Status
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider bg-forest-100 border border-forest-700 text-forest-900 px-2.5 py-1 rounded">
              Clerk Auth Active
            </span>
          </div>

          {loading ? (
            <p className="text-forest-800 text-sm font-medium">Checking backend connectivity...</p>
          ) : healthStatus ? (
            <div className="space-y-4 text-sm font-medium">
              <div className="flex justify-between py-2 border-b border-forest-200">
                <span className="text-forest-800">Backend API Status:</span>
                <span className="font-bold text-forest-700 uppercase">{healthStatus.status}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-forest-200">
                <span className="text-forest-800">Database Connection:</span>
                <span className={`font-bold ${healthStatus.database.connected ? 'text-forest-700' : 'text-amber-700'}`}>
                  {healthStatus.database.status} (MongoDB Atlas)
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-forest-200">
                <span className="text-forest-800">Emergency & Poison Control:</span>
                <span className="font-bold text-forest-900 text-right">
                  {healthStatus.emergencyContacts.countryName} ({healthStatus.emergencyContacts.poisonControlName}: {healthStatus.emergencyContacts.poisonControlNumber})
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-forest-800">Configured AI Engine Provider:</span>
                <span className="font-bold text-forest-900 uppercase">{healthStatus.configuredProvider}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border-2 border-amber-800 text-amber-900 text-sm font-medium flex items-start gap-3 rounded-md">
              <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Backend Standby Mode:</strong> Unable to reach backend server at <code>http://localhost:5000</code>. Please verify the backend process is running.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-forest-900 bg-white py-6 text-center text-xs font-semibold text-forest-800">
        <p>© 2026 CareLittle AI. Classical Minimalist Pediatric Architecture. Not an autonomous medical doctor.</p>
      </footer>
    </div>
  );
};
