'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Users, BarChart3, BookOpen, Calendar, Download, Search, RefreshCw, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Student {
    _id: string;
    studentId: string;
    studentName: string;
    department?: string;
    year?: string;
    division?: string;
    email?: string;
    parent_email?: string;
}

interface Stats {
    totalStudents: number;
    totalTeachers: number;
    totalSessions: number;
    uniqueDates: number;
    uniqueSubjects: string[];
}

export default function AdminDashboardModule() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const isAdmin = user?.userType === 'admin';

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const headers: Record<string, string> = {};
            if (user?.email) headers['X-User-Email'] = user.email;
            if (isAdmin) headers['X-User-Type'] = 'admin';

            const [statsRes, studentsRes] = await Promise.all([
                fetch('http://localhost:5000/api/admin/stats', { headers }),
                fetch('http://localhost:5000/api/admin/students', { headers }),
            ]);
            const statsData = await statsRes.json();
            const studentsData = await studentsRes.json();

            if (statsData.success) setStats(statsData.stats);
            if (studentsData.success) setStudents(studentsData.students);
        } catch (e) {
            setError('Failed to load data. Is the backend running?');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = students.filter((s) =>
        (s.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.studentId || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.department || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleDownloadAll = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const now = new Date().toLocaleString();

        // Title
        doc.setFontSize(18);
        doc.setTextColor(99, 102, 241);
        doc.text('All Students Report', 14, 18);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated: ${now}`, 14, 25);

        // Stats summary
        if (stats) {
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);
            doc.text(`Total Students: ${stats.totalStudents}   |   Total Teachers: ${stats.totalTeachers}   |   Total Sessions: ${stats.totalSessions}   |   Subjects: ${stats.uniqueSubjects.length}`, 14, 32);
        }

        // Students table
        autoTable(doc, {
            startY: 38,
            head: [['Student ID', 'Name', 'Department', 'Year', 'Division', 'Email', 'Parent Email']],
            body: students.map(s => [
                s.studentId || '—',
                s.studentName || '—',
                s.department || '—',
                s.year || '—',
                s.division || '—',
                s.email || '—',
                s.parent_email || 'Not set',
            ]),
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 255] },
            styles: { fontSize: 8, cellPadding: 3 },
        });

        doc.save(`all_students_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4" />
                    <p className="text-slate-500">Loading admin dashboard…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Admin Dashboard</h1>
                    <p className="text-slate-500 mt-1">Full system overview and analytics</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    <button
                        onClick={handleDownloadAll}
                        className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transition-all"
                    >
                        <Download className="w-4 h-4" /> Download PDF Report
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'from-blue-500 to-indigo-600' },
                        { label: 'Total Teachers', value: stats.totalTeachers, icon: CheckCircle, color: 'from-violet-500 to-purple-600' },
                        { label: 'Total Sessions', value: stats.totalSessions, icon: CheckCircle, color: 'from-green-500 to-teal-600' },
                        { label: 'Subjects Tracked', value: stats.uniqueSubjects.length, icon: BookOpen, color: 'from-amber-500 to-orange-600' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-3xl font-black text-slate-800">{value}</p>
                            <p className="text-sm text-slate-500 mt-1">{label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Subjects List */}
            {stats && stats.uniqueSubjects.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-violet-600" /> Tracked Subjects
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {stats.uniqueSubjects.map((subj) => (
                            <span key={subj} className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-sm font-semibold border border-violet-100">
                                {subj}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* All Students Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" /> All Students ({filtered.length})
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, department…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent w-72"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                {['Student ID', 'Name', 'Department', 'Year', 'Division', 'Email', 'Parent Email'].map((h) => (
                                    <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-slate-400">No students found</td>
                                </tr>
                            ) : (
                                filtered.map((s) => (
                                    <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-3 font-mono text-xs text-slate-600">{s.studentId || '—'}</td>
                                        <td className="px-5 py-3 font-semibold text-slate-800">{s.studentName || '—'}</td>
                                        <td className="px-5 py-3 text-slate-600">{s.department || '—'}</td>
                                        <td className="px-5 py-3 text-slate-600">{s.year || '—'}</td>
                                        <td className="px-5 py-3 text-slate-600">{s.division || '—'}</td>
                                        <td className="px-5 py-3 text-slate-500 text-xs">{s.email || '—'}</td>
                                        <td className="px-5 py-3 text-slate-500 text-xs">{s.parent_email || <span className="text-slate-300">Not set</span>}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
