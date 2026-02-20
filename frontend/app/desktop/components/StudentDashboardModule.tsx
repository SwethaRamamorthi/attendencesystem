'use client';

import { useState, useEffect } from 'react';
import {
    User, Mail, BookOpen, Hash, Calendar, Phone,
    GraduationCap, TrendingUp, CheckCircle2, XCircle,
    ClipboardList, Clock, Activity, Download, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

interface StudentProfile {
    studentId: string;
    studentName: string;
    email: string;
    department: string;
    year: string;
    division: string;
    semester?: string;
    phoneNumber?: string;
    status?: string;
}

interface AttendanceRecord {
    date: string;
    status: 'present' | 'absent';
    subject?: string;
    sessionName?: string;
    period?: string;
    first_seen?: string;
    last_seen?: string;
    duration_minutes?: number;
    time?: string;
}

interface SubjectStat {
    subject: string;
    total: number;
    present: number;
    percentage: number;
}

export default function StudentDashboardModule() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
    const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'attendance'>('overview');
    const [selectedSubject, setSelectedSubject] = useState('All Subjects');
    const [subjects, setSubjects] = useState<string[]>([]);

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        if (selectedSubject !== 'All Subjects') {
            fetchAttendance(selectedSubject);
        } else {
            fetchAttendance();
        }
    }, [selectedSubject]);

    const headers = {
        'Content-Type': 'application/json',
        'X-User-Email': user?.email || '',
        'X-User-Type': 'student',
        'X-Student-Id': user?.studentId || '',
    };

    const fetchAll = async () => {
        setLoading(true);
        await Promise.all([fetchProfile(), fetchAttendance()]);
        setLoading(false);
    };

    const fetchProfile = async () => {
        try {
            // Use data from AuthContext directly (already fetched on login)
            if (user) {
                setProfile({
                    studentId: user.studentId || '',
                    studentName: user.studentName || user.username || '',
                    email: user.email || '',
                    department: user.department || '',
                    year: user.year || '',
                    division: user.division || '',
                    semester: (user as any).semester || '',
                    phoneNumber: (user as any).phoneNumber || '',
                    status: 'active',
                });
            }
        } catch (e) {
            console.error('Profile fetch error:', e);
        }
    };

    const fetchAttendance = async (subject?: string) => {
        try {
            const params = new URLSearchParams();
            if (subject && subject !== 'All Subjects') params.append('subject', subject);

            // Fixed: Use new secure endpoint and correct headers
            const res = await fetch(`http://localhost:5000/api/student/attendance?student_id=${user?.studentId || ''}&${params.toString()}`, {
                headers,
            });
            const data = await res.json();

            if (data.success && data.attendance) {
                const records: AttendanceRecord[] = data.attendance.map((r: any) => ({
                    date: r.date,
                    status: r.status,
                    subject: r.subject || r.sessionName || 'Session',
                    sessionName: r.subject || r.sessionName || 'Session',
                    period: r.period,
                    first_seen: r.first_seen,
                    last_seen: r.last_seen,
                    duration_minutes: r.duration_minutes,
                    time: r.markedAt || r.time,
                }));

                setAttendance(records);

                if (!subject || subject === 'All Subjects') {
                    const uniqueSubjects = Array.from(new Set(records.map(r => r.sessionName || ''))) as string[];
                    setSubjects(uniqueSubjects.filter(Boolean));

                    // Build subject stats
                    const statsMap: Record<string, { total: number; present: number }> = {};
                    records.forEach(r => {
                        const s = r.sessionName || 'Session';
                        if (!statsMap[s]) statsMap[s] = { total: 0, present: 0 };
                        statsMap[s].total++;
                        if (r.status === 'present') statsMap[s].present++;
                    });
                    setSubjectStats(
                        Object.entries(statsMap).map(([subject, v]) => ({
                            subject,
                            total: v.total,
                            present: v.present,
                            percentage: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
                        })).sort((a, b) => b.total - a.total)
                    );

                    const present = records.filter(r => r.status === 'present').length;
                    const total = records.length;
                    setStats({ total, present, absent: total - present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 });
                }
            } else {
                console.warn('Failed to fetch attendance:', data.error);
                // Fallback to empty state but don't clear old data if just a refresh failure
                if (attendance.length === 0) setAttendance([]);
            }
        } catch (e) {
            console.error('Attendance fetch error:', e);
        }
    };

    const exportPDF = async () => {
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF() as any;
            doc.setFontSize(20);
            doc.text('My Attendance Report', 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Student: ${profile?.studentName} (${profile?.studentId})`, 14, 30);
            doc.text(`Department: ${profile?.department} | Year: ${profile?.year} | Division: ${profile?.division}`, 14, 36);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 42);
            autoTable(doc, {
                startY: 50,
                head: [['Subject', 'Period', 'Status', 'Time In', 'Time Out', 'Duration', 'Date']],
                body: attendance.map(r => [
                    r.sessionName || 'N/A',
                    r.period ? `P${r.period}` : 'N/A',
                    r.status.toUpperCase(),
                    r.first_seen || r.time || 'N/A',
                    r.last_seen || 'N/A',
                    r.duration_minutes ? `${Math.min(50, r.duration_minutes).toFixed(0)}m` : 'N/A',
                    r.date,
                ]),
                theme: 'grid',
                headStyles: { fillColor: [99, 102, 241] },
                alternateRowStyles: { fillColor: [241, 245, 249] },
            });
            doc.save(`attendance_${profile?.studentId}.pdf`);
        } catch (e) {
            console.error('PDF export error:', e);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    const pctColor = stats.percentage >= 75 ? 'text-emerald-600' : stats.percentage >= 50 ? 'text-amber-600' : 'text-rose-600';
    const pctBg = stats.percentage >= 75 ? 'from-emerald-500 to-teal-500' : stats.percentage >= 50 ? 'from-amber-500 to-orange-500' : 'from-rose-500 to-pink-500';

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                        Welcome, <span className="text-indigo-600">{profile?.studentName?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Your personal attendance portal</p>
                </div>
                <button
                    onClick={exportPDF}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-black text-sm shadow-lg hover:scale-105 transition-transform"
                >
                    <Download className="w-4 h-4" />
                    Export PDF
                </button>
            </div>

            {/* Profile Card */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-700 rounded-3xl p-8 text-white overflow-hidden shadow-[0_20px_60px_-15px_rgba(99,102,241,0.5)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-32 -translate-y-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-24 translate-y-24 blur-2xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner shrink-0">
                        <span className="text-4xl font-black text-white">
                            {profile?.studentName?.[0]?.toUpperCase() || 'S'}
                        </span>
                    </div>
                    {/* Info */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Full Name</p>
                            <p className="font-black text-lg">{profile?.studentName || '—'}</p>
                        </div>
                        <div>
                            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Student ID</p>
                            <p className="font-black text-lg font-mono">{profile?.studentId || '—'}</p>
                        </div>
                        <div>
                            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Email</p>
                            <p className="font-semibold text-sm truncate">{profile?.email || '—'}</p>
                        </div>
                        <div>
                            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Department</p>
                            <p className="font-black">{profile?.department || '—'}</p>
                        </div>
                        <div>
                            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Year / Division</p>
                            <p className="font-black">{profile?.year || '—'} / {profile?.division || '—'}</p>
                        </div>
                        {profile?.semester && (
                            <div>
                                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Semester</p>
                                <p className="font-black">{profile.semester}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: 'Total Classes', value: stats.total, icon: ClipboardList, color: 'indigo' },
                    { label: 'Days Present', value: stats.present, icon: CheckCircle2, color: 'emerald' },
                    { label: 'Days Absent', value: stats.absent, icon: XCircle, color: 'rose' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="glass-card p-6 group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-slate-500 text-[10px] font-black uppercase tracking-wide`}>{label}</p>
                                <h3 className={`text-4xl font-black mt-2 text-${color}-600`}>{value}</h3>
                            </div>
                            <div className={`w-12 h-12 bg-${color}-50 rounded-xl flex items-center justify-center text-${color}-600 group-hover:rotate-12 transition-transform`}>
                                <Icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
                {/* Percentage card */}
                <div className={`glass-card p-6 group bg-gradient-to-br ${pctBg} text-white border-none shadow-lg overflow-hidden relative`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-12 -translate-y-12 blur-xl" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-white/70 text-[10px] font-black uppercase tracking-wide">Attendance %</p>
                            <h3 className="text-4xl font-black mt-2">{stats.percentage}%</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
                {(['overview', 'attendance'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab === 'overview' ? 'Subject Overview' : 'Attendance Logs'}
                    </button>
                ))}
            </div>

            {/* Subject Overview Tab */}
            {activeTab === 'overview' && (
                <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-xl font-black text-slate-800">Subject-wise Attendance</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Your attendance breakdown by subject</p>
                    </div>
                    {subjectStats.length === 0 ? (
                        <div className="py-20 text-center">
                            <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="font-black text-slate-500">No attendance records yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {subjectStats.map((s, i) => {
                                const pct = s.percentage;
                                const barColor = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
                                const textColor = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600';
                                return (
                                    <div key={i} className="px-6 py-5 flex items-center gap-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-sm shrink-0">
                                            {s.subject[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-slate-800 truncate">{s.subject}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className={`text-xs font-black ${textColor} w-10 text-right`}>{pct}%</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-black text-slate-800">{s.present}/{s.total}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Present</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Attendance Logs Tab */}
            {activeTab === 'attendance' && (
                <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Attendance Logs</h2>
                            <p className="text-sm text-slate-500 mt-0.5">Your complete attendance history</p>
                        </div>
                        <div className="relative">
                            <select
                                value={selectedSubject}
                                onChange={e => setSelectedSubject(e.target.value)}
                                className="appearance-none pl-4 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                            >
                                <option>All Subjects</option>
                                {subjects.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    {['Subject', 'Period', 'Status', 'Time In / Out', 'Duration', 'Date'].map(h => (
                                        <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
                                {attendance.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                            <p className="font-black text-slate-500">No records found</p>
                                        </td>
                                    </tr>
                                ) : attendance.map((r, i) => (
                                    <tr key={i} className="hover:bg-white/40 transition-colors">
                                        <td className="px-6 py-5">
                                            <p className="font-black text-slate-800">{r.sessionName}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black border border-slate-200">
                                                {r.period ? `P${r.period}` : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-black text-[10px] uppercase tracking-widest ${r.status === 'present' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                {r.status === 'present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            {r.first_seen && r.last_seen ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-center">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase">In</p>
                                                        <p className="text-xs font-black text-slate-800 font-mono">{r.first_seen}</p>
                                                    </div>
                                                    <div className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-center">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase">Out</p>
                                                        <p className="text-xs font-black text-slate-800 font-mono">{r.last_seen}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-black font-mono">{r.time || 'N/A'}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            {r.duration_minutes ? (
                                                <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 w-fit">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-sm font-black">{Math.min(50, r.duration_minutes).toFixed(0)}<span className="text-[10px] opacity-70"> / 50m</span></span>
                                                </div>
                                            ) : <span className="text-xs font-black text-slate-300">N/A</span>}
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-black text-slate-800">{new Date(r.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(r.date).getFullYear()}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
