'use client';

import { useEffect, useState } from 'react';
import { Activity, Users, Camera, TrendingUp, BarChart3, Clock, Calendar, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

interface PeriodStats {
    subject: string;
    teacher: string;
    total_sessions: number;
    total_present: number;
    unique_students: number;
    attendance_percentage: number;
    total_students: number;
}

export default function DashboardModule() {
    const { user, isTeacher } = useAuth();
    const [stats, setStats] = useState({
        total_students: 0,
        face_registered: 0,
        by_department: [] as { _id: string, count: number }[],
        by_year: [] as { _id: string, count: number }[]
    });
    const [periodStats, setPeriodStats] = useState<PeriodStats[]>([]);
    const [classSchedule, setClassSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scheduleLoading, setScheduleLoading] = useState(true);
    const [selectedDivision, setSelectedDivision] = useState<'G1' | 'G2'>('G1');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchStats();
        fetchPeriodStats();
        fetchGeneralSchedule();
    }, [selectedDivision]);

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/students/stats');
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPeriodStats = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/attendance/stats/period-wise');
            const data = await response.json();
            if (data.success) {
                setPeriodStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching period stats:', error);
        }
    };

    const fetchGeneralSchedule = async () => {
        setScheduleLoading(true);
        try {
            const params = new URLSearchParams({
                department: 'MCA',
                year: '2nd Year',
                division: selectedDivision
            });
            const response = await fetch(`http://localhost:5000/api/timetable/get?${params}`);
            const data = await response.json();
            if (data.success && data.timetable) {
                setClassSchedule(data.timetable.periods || []);
            } else {
                setClassSchedule([]);
            }
        } catch (error) {
            console.error('Error fetching general schedule:', error);
            setClassSchedule([]);
        } finally {
            setScheduleLoading(false);
        }
    };

    const SUBJECT_COLORS = [
        { bg: 'from-indigo-50 to-indigo-100/50', border: 'border-indigo-200/60', text: 'text-indigo-700', icon: 'bg-indigo-100 text-indigo-600', dot: 'bg-indigo-500' },
        { bg: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-200/60', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' },
        { bg: 'from-violet-50 to-violet-100/50', border: 'border-violet-200/60', text: 'text-violet-700', icon: 'bg-violet-100 text-violet-600', dot: 'bg-violet-500' },
        { bg: 'from-amber-50 to-amber-100/50', border: 'border-amber-200/60', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' },
        { bg: 'from-rose-50 to-rose-100/50', border: 'border-rose-200/60', text: 'text-rose-700', icon: 'bg-rose-100 text-rose-600', dot: 'bg-rose-500' },
        { bg: 'from-cyan-50 to-cyan-100/50', border: 'border-cyan-200/60', text: 'text-cyan-700', icon: 'bg-cyan-100 text-cyan-600', dot: 'bg-cyan-500' },
    ];

    const getSubjectColor = (subject: string) => {
        let hash = 0;
        for (let i = 0; i < (subject?.length || 0); i++) {
            hash = subject.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % SUBJECT_COLORS.length;
        return SUBJECT_COLORS[index];
    };

    const getCurrentDay = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[currentTime.getDay()];
    };

    const getTodaySessions = () => {
        const today = getCurrentDay();
        return classSchedule
            .filter(p => p.days.includes(today))
            .sort((a, b) => a.period_number - b.period_number);
    };

    const getLowAttendanceSubjects = () => {
        return periodStats.filter(s => s.attendance_percentage < 75);
    };

    // Colors for the bars
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-1 font-medium">System status and attendance overview</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-5 py-2.5 glass-card border-indigo-200/50 flex items-center gap-3 shadow-[0_8px_20px_-6px_rgba(99,102,241,0.4)] group hover:scale-105 transition-transform">
                        <Calendar className="w-4 h-4 text-indigo-500 group-hover:rotate-12 transition-transform" />
                        <span className="text-sm font-black text-indigo-700 uppercase tracking-widest">
                            {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    <div className="px-5 py-2.5 glass-card border-indigo-200/50 flex items-center gap-3 shadow-[0_8px_20px_-6px_rgba(99,102,241,0.4)] group hover:scale-105 transition-transform">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                        <span className="text-base font-black text-indigo-700 font-mono tracking-widest">
                            {currentTime.toLocaleTimeString()}
                        </span>
                        <span className="text-[10px] uppercase font-black text-indigo-400 tracking-tighter">Live Monitor</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 group cursor-default border-indigo-100/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Registered</p>
                            <h3 className="text-4xl font-black mt-2 text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tighter">
                                {stats.total_students || 0}
                            </h3>
                        </div>
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-[0_8px_16px_rgba(99,102,241,0.4)] group-hover:rotate-6">
                            <Users className="w-7 h-7" />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 group cursor-default border-emerald-100/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Departments</p>
                            <h3 className="text-4xl font-black mt-2 text-slate-800 group-hover:text-emerald-600 transition-colors tracking-tighter">
                                {stats.by_department?.length || 0}
                            </h3>
                        </div>
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-[0_8px_16px_rgba(16,185,129,0.4)] group-hover:-rotate-6">
                            <Activity className="w-7 h-7" />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 group cursor-default border-violet-100/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Active Years</p>
                            <h3 className="text-4xl font-black mt-2 text-slate-800 group-hover:text-violet-600 transition-colors tracking-tighter">
                                {stats.by_year?.length || 0}
                            </h3>
                        </div>
                        <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-[0_8px_16px_rgba(139,92,246,0.4)] group-hover:rotate-6">
                            <TrendingUp className="w-7 h-7" />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 group cursor-default border-rose-100/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">System Health</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xl font-black text-slate-800 tracking-tight">Optimal</span>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                            </div>
                        </div>
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-[0_8px_16px_rgba(244,63,94,0.4)] group-hover:-rotate-6">
                            <Camera className="w-7 h-7" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Insights Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Today's Agenda - Timeline */}
                <div className="xl:col-span-7 glass-card p-8 border-indigo-100/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Daily <span className="text-indigo-600">Schedule</span></h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">MCA 2nd Year · General Agenda</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                                <button
                                    onClick={() => setSelectedDivision('G1')}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${selectedDivision === 'G1'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Group 1
                                </button>
                                <button
                                    onClick={() => setSelectedDivision('G2')}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${selectedDivision === 'G2'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Group 2
                                </button>
                            </div>
                            <div className="px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest">
                                {getCurrentDay()}
                            </div>
                        </div>
                    </div>

                    {scheduleLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Synchronizing Schedule...</p>
                        </div>
                    ) : getTodaySessions().length === 0 ? (
                        <div className="text-center py-20 glass-container border-dashed border-2 border-slate-100 bg-slate-50/30">
                            <Clock className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                            <h3 className="text-lg font-black text-slate-700">No sessions scheduled for today</h3>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-tight mt-1">Enjoy your free time!</p>
                        </div>
                    ) : (
                        <div className="space-y-6 relative z-10">
                            {getTodaySessions().map((session, idx) => {
                                const colors = getSubjectColor(session.subject);
                                // Simple time check for "Now" (optional complexity but good for WoW)
                                const isNow = false; // Add time comparison logic if desired

                                return (
                                    <div key={idx} className="flex gap-6 group">
                                        {/* Time Column */}
                                        <div className="w-24 shrink-0 flex flex-col items-end pt-2">
                                            <span className="text-sm font-black text-slate-800">{session.start_time}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{session.end_time}</span>
                                        </div>

                                        {/* Timeline Dot/Line */}
                                        <div className="flex flex-col items-center">
                                            <div className={`w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 transition-transform group-hover:scale-125 ${colors.dot}`}></div>
                                            {idx !== getTodaySessions().length - 1 && (
                                                <div className="w-0.5 h-full bg-slate-100 group-hover:bg-indigo-100 transition-colors"></div>
                                            )}
                                        </div>

                                        {/* Content Card */}
                                        <div className={`flex-1 p-5 rounded-2xl border transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 bg-gradient-to-br ${colors.bg} ${colors.border}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2.5 rounded-xl ${colors.icon} font-black text-xs`}>
                                                        P{session.period_number}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-800 text-lg tracking-tight group-hover:text-indigo-600 transition-colors">
                                                            {session.subject}
                                                        </h4>
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                            {session.teacher} · MCA 2nd Year · {selectedDivision}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Attendance Alerts - Focus Required */}
                <div className="xl:col-span-5 space-y-8">
                    <div className="glass-card p-8 border-rose-100/50 h-full relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-50/50 rounded-full blur-2xl -ml-16 -mb-16"></div>
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-orange-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-100">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">System <span className="text-rose-600">Alerts</span></h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Action Required Areas</p>
                            </div>
                        </div>

                        {getLowAttendanceSubjects().length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4 border border-emerald-100">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-black text-slate-700">All Metrics Healthy</h3>
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Attendance is above 75% across all subjects</p>
                            </div>
                        ) : (
                            <div className="space-y-4 relative z-10">
                                {getLowAttendanceSubjects().map((alert, idx) => (
                                    <div key={idx} className="p-5 bg-white/60 border border-rose-100 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-rose-50 rounded-xl flex flex-col items-center justify-center border border-rose-100 group-hover:bg-rose-500 group-hover:text-white transition-all">
                                                <span className="text-lg font-black leading-none">{alert.attendance_percentage}%</span>
                                                <span className="text-[8px] font-black uppercase mt-1">Attend</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-slate-800 truncate group-hover:text-rose-600 transition-colors uppercase tracking-tight">{alert.subject}</h4>
                                                <p className="text-xs font-medium text-slate-500 mt-0.5">Below required 75% threshold</p>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3 mt-8">
                                    <TrendingUp className="w-5 h-5 text-orange-500 mt-0.5" />
                                    <p className="text-xs text-orange-700 font-bold leading-relaxed">
                                        Pro Tip: Use the Live Detection module more frequently to automate attendance logging and improve metrics.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Grid for Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 border-indigo-100/50">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <Users className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Department Distribution</h2>
                    </div>
                    <div className="space-y-4">
                        {stats.by_department.map((dept) => (
                            <div key={dept._id} className="flex items-center justify-between p-4 bg-white/40 hover:bg-white/80 rounded-xl border border-transparent hover:border-indigo-100 hover:shadow-md transition-all group">
                                <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{dept._id || 'Unknown'}</span>
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${(dept.count / stats.total_students) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black border border-indigo-100/50">
                                        {dept.count} Members
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-6 border-purple-100/50">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Academic Year Split</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {stats.by_year.map((item) => (
                            <div key={item._id} className="bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50 hover:from-white hover:to-white p-5 rounded-2xl border border-purple-50/50 transition-all group hover:shadow-lg hover:-translate-y-1">
                                <p className="text-xs text-slate-500 font-black uppercase tracking-widest group-hover:text-purple-600 transition-colors">{item._id}</p>
                                <p className="text-4xl font-black text-slate-800 mt-2 tracking-tighter drop-shadow-sm">{item.count}</p>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 group-hover:animate-scale-x origin-left" style={{ width: `${(item.count / stats.total_students) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
