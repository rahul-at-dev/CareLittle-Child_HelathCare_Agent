import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  fetchChildById,
  evaluateSafetyCheck,
  ChildProfile,
  TriageResultResponse,
  apiClient
} from '../services/api';
import { Heart, Shield, ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft, PhoneCall } from 'lucide-react';

export const SafetyCheckPage: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loadingChild, setLoadingChild] = useState(true);
  const { getToken } = useAuth();

  // Form State
  const [text, setText] = useState('');
  const [temperature, setTemperature] = useState<number | ''>('');
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('C');
  const [grunting, setGrunting] = useState(false);
  const [stridor, setStridor] = useState(false);
  const [retractions, setRetractions] = useState(false);
  const [blueLips, setBlueLips] = useState(false);
  const [unresponsive, setUnresponsive] = useState(false);
  const [lethargic, setLethargic] = useState(false);
  const [poisonIngestion, setPoisonIngestion] = useState(false);

  // Result State
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<TriageResultResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadChild = async () => {
      if (!childId) return;
      setLoadingChild(true);
      try {
        const token = await getToken();
        if (token) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        const childData = await fetchChildById(childId);
        setChild(childData);
      } catch (err: any) {
        console.error('Error fetching child details:', err);
      } finally {
        setLoadingChild(false);
      }
    };

    loadChild();
  }, [childId, getToken]);

  const handleRunSafetyCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);
    setError('');
    setResult(null);

    try {
      const token = await getToken();
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      const res = await evaluateSafetyCheck({
        childId,
        text: text.trim() || undefined,
        temperature: temperature !== '' ? Number(temperature) : undefined,
        temperatureUnit,
        structuredObservations: {
          grunting,
          stridor,
          retractions,
          blueLips,
          unresponsive,
          lethargic,
          poisonIngestion
        },
        countryCode: 'IN'
      });

      setResult(res);
    } catch (err: any) {
      console.error('Safety evaluation error:', err);
      setError(err.response?.data?.error || 'Safety evaluation request failed.');
    } finally {
      setEvaluating(false);
    }
  };

  if (loadingChild) {
    return (
      <div className="min-h-screen bg-forest-50 p-8 flex items-center justify-center font-sans">
        <p className="text-forest-900 font-bold">Loading safety evaluation panel...</p>
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
            <span className="text-xl font-black text-forest-900">CareLittle Safety Evaluator</span>
          </Link>
          <Link to={`/child/${childId}`} className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:text-forest-900 underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Child Hub
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="classical-badge text-xs px-3 py-1 bg-forest-100 text-forest-900 inline-flex items-center gap-1.5 mb-2">
            <Shield className="w-3.5 h-3.5 text-forest-700" /> Deterministic Triage Engine (Zero AI / LLM Calls)
          </div>
          <h1 className="text-2xl font-black text-forest-900">Pediatric Red-Flag Safety Check for {child?.name}</h1>
          <p className="text-xs font-semibold text-forest-800">
            Evaluates neonatal fever rules (under 90 days old), respiratory distress, altered responsiveness, and poisoning red flags.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-800 text-rose-900 rounded-md text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-700" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Form Column */}
          <div className="classical-card p-6">
            <h2 className="text-base font-black text-forest-900 mb-4 border-b-2 border-forest-900 pb-2">
              Current Symptoms & Observations
            </h2>

            <form onSubmit={handleRunSafetyCheck} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-forest-900 font-bold mb-1">Describe what is happening...</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Baby has fever, making grunting sound, refusing feeds"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white text-forest-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-forest-900 font-bold mb-1">Measured Temperature (optional)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 38.5"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value === '' ? '' : Number(e.target.value))}
                    className="flex-1 border-2 border-forest-900 rounded-md px-3 py-2 bg-white outline-none"
                  />
                  <select
                    value={temperatureUnit}
                    onChange={(e) => setTemperatureUnit(e.target.value as 'C' | 'F')}
                    className="border-2 border-forest-900 rounded-md px-3 py-2 bg-white font-bold outline-none"
                  >
                    <option value="C">°C</option>
                    <option value="F">°F</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-forest-900 font-bold mb-2">Check any critical signs observed:</label>
                <div className="space-y-2 bg-forest-50 p-3 rounded-md border border-forest-200 text-forest-900">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={grunting} onChange={(e) => setGrunting(e.target.checked)} className="accent-forest-700" />
                    <span>Grunting sound while breathing</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={stridor} onChange={(e) => setStridor(e.target.checked)} className="accent-forest-700" />
                    <span>Stridor (high-pitched breathing sound)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={retractions} onChange={(e) => setRetractions(e.target.checked)} className="accent-forest-700" />
                    <span>Chest retractions (pulling in under ribs)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={blueLips} onChange={(e) => setBlueLips(e.target.checked)} className="accent-forest-700" />
                    <span>Blue lips / cyanosis</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={unresponsive} onChange={(e) => setUnresponsive(e.target.checked)} className="accent-forest-700" />
                    <span>Unresponsive / cannot wake child</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={lethargic} onChange={(e) => setLethargic(e.target.checked)} className="accent-forest-700" />
                    <span>Severe lethargy / unusually limp</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={poisonIngestion} onChange={(e) => setPoisonIngestion(e.target.checked)} className="accent-forest-700" />
                    <span>Poisoning / swallowed chemicals or pills</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={evaluating}
                className="w-full classical-btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2"
              >
                {evaluating ? 'Evaluating Safety Rules...' : 'Run Safety Check'}
              </button>
            </form>
          </div>

          {/* Result Column */}
          <div className="flex flex-col">
            {!result ? (
              <div className="classical-card p-6 flex-1 flex flex-col items-center justify-center text-center">
                <Shield className="w-12 h-12 text-forest-700 mb-3" />
                <h3 className="text-base font-black text-forest-900 mb-1">Deterministic Safety Standby</h3>
                <p className="text-xs text-forest-800 font-medium">
                  Fill out symptoms or observations on the left and click "Run Safety Check" to evaluate safety classifications.
                </p>
              </div>
            ) : result.level === 'emergency' ? (
              <div className="classical-card p-6 border-2 border-rose-800 bg-rose-50 text-rose-950 flex-1 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center gap-2 text-rose-900 font-black text-lg border-b-2 border-rose-800 pb-3 mb-4">
                    <ShieldAlert className="w-6 h-6 text-rose-700 flex-shrink-0" />
                    <span>EMERGENCY RED-FLAG TRIGGERED</span>
                  </div>

                  <p className="text-xs font-bold leading-relaxed mb-4 text-rose-950">
                    {result.userMessage}
                  </p>

                  <div className="mb-4">
                    <h4 className="text-xs font-black uppercase text-rose-900 mb-2">Triggered Safety Rules:</h4>
                    <ul className="space-y-1 text-xs font-semibold">
                      {result.matchedRules.map((r) => (
                        <li key={r.ruleId} className="bg-white border border-rose-800 p-2 rounded text-rose-950">
                          <strong>{r.ruleName}:</strong> {r.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-white border-2 border-rose-900 p-4 rounded-md text-rose-950 space-y-2">
                  <h4 className="text-xs font-black uppercase flex items-center gap-1">
                    <PhoneCall className="w-4 h-4 text-rose-700" /> Immediate Emergency Contacts ({result.emergencyContacts.countryName}):
                  </h4>
                  <div className="text-xs font-bold">
                    🚨 National Emergency: <span className="text-base font-black text-rose-700">{result.emergencyContacts.emergencyNumber}</span>
                  </div>
                  <div className="text-xs font-bold">
                    🧪 {result.emergencyContacts.poisonControlName}: <span className="text-sm font-black text-rose-700">{result.emergencyContacts.poisonControlNumber}</span>
                  </div>
                </div>
              </div>
            ) : result.level === 'advisory' ? (
              <div className="classical-card p-6 border-2 border-amber-800 bg-amber-50 text-amber-950 flex-1">
                <div className="flex items-center gap-2 text-amber-900 font-black text-lg border-b-2 border-amber-800 pb-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-amber-700 flex-shrink-0" />
                  <span>SAFETY ADVISORY</span>
                </div>
                <p className="text-xs font-bold leading-relaxed mb-4">{result.userMessage}</p>
              </div>
            ) : (
              <div className="classical-card p-6 border-2 border-forest-700 bg-forest-100 text-forest-950 flex-1">
                <div className="flex items-center gap-2 text-forest-900 font-black text-lg border-b-2 border-forest-800 pb-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-forest-700 flex-shrink-0" />
                  <span>NORMAL SAFETY CHECK</span>
                </div>
                <p className="text-xs font-bold leading-relaxed mb-4">{result.userMessage}</p>
                <p className="text-[11px] text-forest-800 font-medium">
                  Always seek professional medical care if symptoms change or if you feel uncertain about your child's condition.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
