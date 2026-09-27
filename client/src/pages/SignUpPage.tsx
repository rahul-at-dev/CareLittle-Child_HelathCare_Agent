import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignUp } from '@clerk/clerk-react';
import { Heart, Lock, Mail, User, ArrowLeft, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import childcareImg from '../assets/childcare.jpg';

export const SignUpPage: React.FC = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError('');
    setLoading(true);

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setVerifying(true);
    } catch (err: any) {
      console.error('Clerk SignUp error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setError('');
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        navigate('/dashboard');
      } else {
        console.log('Verification status:', completeSignUp);
        setError('Verification pending. Please check code.');
      }
    } catch (err: any) {
      console.error('Clerk Verification error:', err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || 'Invalid code.';
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
                <Shield className="w-3.5 h-3.5 text-forest-700" /> Create Account
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">
                Join the CareLittle Parent Community
              </h2>
              <p className="text-xs text-forest-100 font-medium leading-relaxed max-w-sm">
                Start tracking growth percentiles, vaccination milestones, and managing health records for your children.
              </p>
            </div>

            <div className="relative z-10 pt-6 border-t border-forest-700/50">
              <p className="text-[11px] text-forest-200 font-semibold italic">
                "Child privacy and parental consent come standard with every account."
              </p>
            </div>
          </div>

          {/* Right Column: Custom Auth Window */}
          <div className="p-8 bg-white flex flex-col justify-center">
            {!verifying ? (
              <>
                <div className="mb-5">
                  <h2 className="text-2xl font-black text-forest-900">Create Parent Account</h2>
                  <p className="text-xs font-semibold text-forest-800 mt-1">
                    Free registration for child health tracking
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3.5 bg-rose-50 border-2 border-rose-800 rounded-md text-rose-900 text-xs font-bold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
                    <div>{error}</div>
                  </div>
                )}

                <form onSubmit={handleSignUp} className="space-y-3.5 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-forest-900 font-bold mb-1 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-forest-700" /> First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white text-forest-900 text-xs outline-none focus:bg-forest-50"
                      />
                    </div>
                    <div>
                      <label className="block text-forest-900 font-bold mb-1 flex items-center gap-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white text-forest-900 text-xs outline-none focus:bg-forest-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-forest-900 font-bold mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-forest-700" /> Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="parent@example.com"
                      className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white text-forest-900 text-xs outline-none focus:bg-forest-50"
                    />
                  </div>

                  <div>
                    <label className="block text-forest-900 font-bold mb-1 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-forest-700" /> Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border-2 border-forest-900 rounded-md px-3 py-2 bg-white text-forest-900 text-xs outline-none focus:bg-forest-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full classical-btn-primary py-2.5 text-sm font-bold flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? 'Registering...' : 'Complete Registration'}
                  </button>
                </form>

                <div className="mt-5 pt-4 border-t-2 border-forest-900 text-center text-xs font-bold">
                  <span className="text-forest-800">Already have an account? </span>
                  <Link to="/sign-in" className="text-forest-700 hover:text-forest-900 underline underline-offset-2">
                    Sign In
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="mb-5 text-center">
                  <CheckCircle className="w-10 h-10 text-forest-700 mx-auto mb-2" />
                  <h2 className="text-xl font-black text-forest-900">Verify Your Email</h2>
                  <p className="text-xs font-semibold text-forest-800 mt-1">
                    We sent a verification code to <strong>{email}</strong>
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-rose-50 border-2 border-rose-800 rounded-md text-rose-900 text-xs font-bold">
                    {error}
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-forest-900 font-bold mb-1">Verification Code</label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full border-2 border-forest-900 rounded-md px-3 py-2.5 bg-white text-forest-900 text-center text-base font-mono tracking-widest outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full classical-btn-primary py-2.5 text-sm font-bold"
                  >
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                </form>
              </>
            )}
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
