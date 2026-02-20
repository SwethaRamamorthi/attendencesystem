'use client';

import { useState } from 'react';
import {
    User, Mail, Bell, Shield, Smartphone,
    Moon, Sun, Monitor, Globe, ChevronRight,
    LogOut, Save, BadgeCheck, Camera, Laptop
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SettingsModule() {
    const { user, logout } = useAuth();
    const [theme, setTheme] = useState('system');
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        attendance: true,
        security: true
    });

    const toggleNotification = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Settings</h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage your account preferences and system configuration</p>
                </div>
                <button
                    onClick={logout}
                    className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-100 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6 border-indigo-100/50">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative group cursor-pointer">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1">
                                    <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center text-3xl font-black text-indigo-600 overflow-hidden">
                                        {(user?.studentName || user?.username || 'U')[0]?.toUpperCase()}
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <h2 className="mt-4 text-xl font-bold text-slate-800">{user?.studentName || user?.username || 'User Name'}</h2>
                            <p className="text-slate-500 font-medium text-sm">{user?.role || 'Role'}</p>

                            <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                                <BadgeCheck className="w-3 h-3" />
                                Verified Account
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                                    <p className="text-sm font-semibold text-slate-700 truncate">{user?.email || 'user@example.com'}</p>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Security Level</p>
                                    <p className="text-sm font-semibold text-slate-700">High (2FA Enabled)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 border-slate-100">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">System Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-semibold text-slate-600">Face Recognition API</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Operational</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-semibold text-slate-600">Database Connection</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Connected</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Settings Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Appearance */}
                    <div className="glass-card p-8 group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-rose-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                <Sun className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Appearance</h3>
                                <p className="text-sm text-slate-500">Customize how the application looks</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <button
                                onClick={() => setTheme('light')}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                                <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span className={`text-sm font-bold ${theme === 'light' ? 'text-indigo-700' : 'text-slate-600'}`}>Light</span>
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                                <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-indigo-700' : 'text-slate-600'}`}>Dark</span>
                            </button>
                            <button
                                onClick={() => setTheme('system')}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                                <Monitor className={`w-6 h-6 ${theme === 'system' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span className={`text-sm font-bold ${theme === 'system' ? 'text-indigo-700' : 'text-slate-600'}`}>System</span>
                            </button>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="glass-card p-8 group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Notifications</h3>
                                <p className="text-sm text-slate-500">Manage how you receive alerts</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { key: 'email', label: 'Email Notifications', desc: 'Receive daily summaries' },
                                { key: 'push', label: 'Push Notifications', desc: 'Get real-time browser notifications' },
                                { key: 'attendance', label: 'Attendance Alerts', desc: 'Notify when marked absent' }
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                    <div>
                                        <p className="font-bold text-slate-700">{item.label}</p>
                                        <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleNotification(item.key as keyof typeof notifications)}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${notifications[item.key as keyof typeof notifications] ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                    >
                                        <span className={`inline-block w-4 h-4 transform transition duration-200 ease-in-out bg-white rounded-full translate-y-1 ${notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                            <Save className="w-4 h-4" />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
