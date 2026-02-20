"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogIn,
  Mail,
  Lock,
  User,
  GraduationCap,
  BookOpen,
  Eye,
  EyeOff,
  UserPlus
} from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "student" // Default to student
  });
  const [status, setStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("Signing in...");

    try {
      const res = await fetch("http://127.0.0.1:5000/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          userType: formData.userType
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("Login successful! Redirecting...");

        // Store login state and user info in localStorage
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", formData.email);
        localStorage.setItem("userType", formData.userType); // ✅ fixed consistency

        if (data.user) {
          // Store full user object for AuthContext
          localStorage.setItem("user", JSON.stringify(data.user));

          localStorage.setItem("username", data.user.username || data.user.name || "");
          localStorage.setItem("userId", data.user._id || "");

          // Store teacher-specific info if applicable
          if (formData.userType === "teacher" && data.user.employeeId) {
            localStorage.setItem("employeeId", data.user.employeeId);
          }

          // Store student-specific info if applicable  
          if (formData.userType === "student" && data.user.studentId) {
            localStorage.setItem("studentId", data.user.studentId);
          }
        }

        // Redirect to appropriate dashboard based on user type
        setTimeout(() => {
          if (formData.userType === "teacher") {
            router.push("/desktop"); // Unified Dashboard
          } else {
            router.push("/desktop"); // Unified Dashboard
          }
        }, 1000);
      } else {
        setStatus(data.error || "Invalid credentials");
      }
    } catch {
      setStatus("Error connecting to server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Dynamic Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-[140px] animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-[0_8px_30px_rgb(99,102,241,0.4)] transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <LogIn className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Portal <span className="text-indigo-600">Access</span></h1>
          </div>
          <p className="text-slate-500 text-sm font-black uppercase tracking-[0.2em]">Secure Authentication Gateway</p>
        </div>

        {/* Sign In Form */}
        <div className="glass-card bg-white/40 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-10 border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Selection */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'student', label: 'Student', icon: GraduationCap, color: 'indigo' },
                  { type: 'teacher', label: 'Teacher', icon: BookOpen, color: 'emerald' },
                  { type: 'admin', label: 'Admin', icon: User, color: 'violet' },
                  { type: 'parent', label: 'Parent', icon: UserPlus, color: 'rose' },
                ].map(({ type, label, icon: Icon, color }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, userType: type }))}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 text-xs font-black uppercase tracking-widest ${formData.userType === type
                        ? `bg-${color}-50 border-${color}-400 text-${color}-700 shadow-[0_8px_20px_-4px_rgba(99,102,241,0.2)] scale-105`
                        : 'bg-white/50 border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${formData.userType === type ? `text-${color}-600` : 'text-slate-300'}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${formData.userType === 'teacher' ? 'group-focus-within:text-emerald-500' : 'group-focus-within:text-indigo-500'} text-slate-300`} />
                <input
                  name="email"
                  type="email"
                  placeholder={`Enter ${formData.userType} email`}
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-white/50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-slate-800 placeholder-slate-300 focus:outline-none transition-all duration-500 ${formData.userType === 'teacher' ? 'focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10' : 'focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10'}`}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Security Key
              </label>
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${formData.userType === 'teacher' ? 'group-focus-within:text-emerald-500' : 'group-focus-within:text-indigo-500'} text-slate-300`} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-white/50 border-2 border-slate-100 rounded-2xl pl-12 pr-12 py-4 text-slate-800 placeholder-slate-300 focus:outline-none transition-all duration-500 ${formData.userType === 'teacher' ? 'focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10' : 'focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 shadow-xl overflow-hidden group relative ${formData.userType === 'teacher'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-emerald-200'
                : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-indigo-200'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Enter System
                </>
              )}
            </button>
          </form>

          {/* Status Message */}
          {status && (
            <div className={`mt-6 p-4 rounded-xl text-center border-2 transition-all duration-300 ${status.includes("successful")
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : status.includes("Error") || status.includes("Invalid")
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
              {status}
            </div>
          )}

          {/* Sign Up Link */}
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4">New to the system?</p>
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors font-black uppercase tracking-widest text-xs hover:scale-105 transform duration-300"
            >
              <UserPlus className="w-4 h-4" />
              Request Teacher Account
            </button>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm font-medium">
            Face Recognition Attendance System
          </p>
        </div>
      </div>
    </div>
  );
}
