'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function TeacherSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeId: '',
    department: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          userType: 'teacher',
          employeeId: formData.employeeId,
          department: formData.department,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[15%] -left-[10%] w-[50%] h-[50%] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[10%] -right-[15%] w-[45%] h-[45%] bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full blur-[140px] animate-pulse delay-1000"></div>
        <div className="absolute -bottom-[20%] left-[10%] w-[55%] h-[55%] bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-full blur-[150px] animate-pulse delay-700"></div>
      </div>
      <div className="max-w-2xl w-full">
        {/* Back to Login */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 mb-8 transition-all font-black uppercase tracking-widest text-[10px] group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Gateway
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 rounded-2xl mb-6 shadow-xl transform -rotate-2 hover:rotate-0 transition-transform duration-500">
            <UserCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
            Faculty <span className="text-emerald-600">Onboarding</span>
          </h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Create your academic identity</p>
        </div>

        {/* Registration Form */}
        <div className="glass-card bg-white/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-white/60 overflow-hidden">
          <div className="p-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-white tracking-tight">Register as Teacher</h2>
              <p className="text-emerald-100/80 text-[10px] font-black uppercase tracking-widest mt-1">Personnel Information System</p>
            </div>
          </div>

          <form onSubmit={handleSignup} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-green-700 text-sm">
                  Registration successful! Redirecting to login...
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Employee ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                  placeholder="E.g., TCH001"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                placeholder="teacher@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Department *
              </label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full px-8 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? 'Initializing...' : 'Create Teacher Account'}
            </button>

            <p className="text-center text-xs font-black uppercase tracking-widest text-slate-400">
              Already verified?{' '}
              <Link href="/" className="text-emerald-600 hover:text-emerald-700 transition-colors">
                Return to Login
              </Link>
            </p>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-emerald-50/50 backdrop-blur rounded-[1.5rem] p-6 border border-emerald-100/50">
          <h3 className="text-emerald-800 font-black uppercase tracking-widest text-[10px] mb-4">Post-Registration Protocols</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Credential Verification",
              "Biometric Enrollment",
              "Live Identification",
              "Attendance Analytics"
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-[10px] font-black text-emerald-600/70 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}