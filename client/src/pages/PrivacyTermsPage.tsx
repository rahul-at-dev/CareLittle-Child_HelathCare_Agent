import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Trash2, ArrowLeft } from 'lucide-react';

export const PrivacyTermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-forest-50 text-forest-900 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:text-forest-900 underline mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <div className="classical-card p-8">
          <div className="flex items-center gap-3.5 mb-6 border-b-2 border-forest-900 pb-4">
            <div className="p-2 bg-forest-100 border border-forest-700 rounded-md">
              <ShieldCheck className="w-8 h-8 text-forest-700" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-forest-900">Child Privacy, Consent & Data Governance</h1>
              <p className="text-xs font-bold text-forest-800">CareLittle AI Pediatric Data Retention Policy</p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-forest-900 font-medium leading-relaxed">
            <section className="bg-forest-100 p-4 rounded-md border border-forest-700">
              <h2 className="font-bold text-forest-900 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-forest-700" /> Parental Data Protection
              </h2>
              <p>
                CareLittle AI treats children’s health records with strict privacy protections. All child profiles, health events, and document records are strictly scoped to your authenticated account ID.
              </p>
            </section>

            <section>
              <h3 className="font-black text-forest-900 text-base mb-2">1. Data Consent & Minimization</h3>
              <p>
                We process child health information solely to render requested monitoring features (growth tracking, vaccination reminders, clinical summary generation). We do not sell or monetize personal pediatric health data.
              </p>
            </section>

            <section>
              <h3 className="font-black text-forest-900 text-base mb-2">2. Right to Erasure & Account Deletion</h3>
              <p>
                You retain complete ownership of your child’s health records. You may delete individual child profiles or request a complete account purge at any time.
              </p>
            </section>

            <section className="bg-rose-50 p-4 rounded-md border-1.5 border-rose-800 text-rose-900">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-700" /> Cascade Deletion Notice
              </h3>
              <p className="text-xs">
                Deleting a child profile or account permanently purges associated growth metrics, milestone logs, medical documents, and chat records from the database.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
