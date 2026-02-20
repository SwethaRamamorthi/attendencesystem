'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserCheck, GraduationCap, ShieldCheck, Heart } from 'lucide-react';
import { useAuth } from './context/AuthContext';

type RoleType = 'teacher' | 'student' | 'admin' | 'parent';

const ROLES: {
  id: RoleType;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  headerGradient: string;
  btnColor: string;
  features: string[];
}[] = [
    {
      id: 'teacher',
      label: 'Teacher Login',
      subtitle: 'Manage attendance & registrations',
      icon: UserCheck,
      gradient: 'from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800',
      headerGradient: 'from-blue-600 to-indigo-600',
      btnColor: 'bg-blue-600 hover:bg-blue-700',
      features: ['Register student faces', 'Live face detection', 'View all attendance records', 'Manage system settings'],
    },
    {
      id: 'student',
      label: 'Student Login',
      subtitle: 'View your records & schedule',
      icon: GraduationCap,
      gradient: 'from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800',
      headerGradient: 'from-green-600 to-teal-600',
      btnColor: 'bg-green-600 hover:bg-green-700',
      features: ['View your attendance', 'Check class timetable', 'Track attendance percentage', 'Download records'],
    },
    {
      id: 'admin',
      label: 'Admin Login',
      subtitle: 'Full system access & analytics',
      icon: ShieldCheck,
      gradient: 'from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800',
      headerGradient: 'from-violet-600 to-purple-600',
      btnColor: 'bg-violet-600 hover:bg-violet-700',
      features: ['Access all student data', 'View all attendance records', 'Filter & download reports', 'Manage parent accounts'],
    },
    {
      id: 'parent',
      label: 'Parent Login',
      subtitle: "Monitor your ward's progress",
      icon: Heart,
      gradient: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
      headerGradient: 'from-amber-500 to-orange-500',
      btnColor: 'bg-amber-500 hover:bg-amber-600',
      features: ["View ward's attendance", 'Subject-wise breakdown', 'Entry & exit times', 'Download ward report'],
    },
  ];

export default function HomePage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated) {
    router.push('/desktop');
    return null;
  }

  const activeRole = ROLES.find((r) => r.id === selectedRole);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password, selectedRole);

    if (result.success) {
      router.push('/desktop');
    } else {
      setError(result.error || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Face Recognition Attendance System
          </h1>
          <p className="text-slate-400 text-lg">
            Secure, accurate, and automated attendance management
          </p>
        </div>

        {!selectedRole ? (
          /* Role Selection – 2×2 grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`bg-gradient-to-br ${role.gradient} rounded-2xl p-8 text-left transition-all transform hover:scale-105 shadow-2xl`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-white/20 p-4 rounded-xl">
                      <Icon className="w-12 h-12 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{role.label}</h2>
                      <p className="text-white/80">{role.subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-white/90">
                    {role.features.map((f) => (
                      <li key={f}>✓ {f}</li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        ) : (
          /* Login Form */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className={`p-6 bg-gradient-to-r ${activeRole!.headerGradient}`}>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {activeRole && <activeRole.icon className="w-8 h-8" />}
                  {activeRole?.label}
                </h2>
              </div>

              <form onSubmit={handleLogin} className="p-8 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {selectedRole === 'parent' ? 'Parent Email Address' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                    placeholder={selectedRole === 'parent' ? 'Enter your registered parent email' : 'Enter your email'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900"
                    placeholder="Enter your password"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole(null);
                      setError('');
                    }}
                    className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 px-6 py-3 ${activeRole!.btnColor} text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    <LogIn className="w-5 h-5" />
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </div>

                {selectedRole === 'teacher' && (
                  <p className="text-center text-sm text-slate-600 mt-4">
                    Don't have an account?{' '}
                    <a href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
                      Register as Teacher
                    </a>
                  </p>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
