'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, BookOpen, Calendar, Clock, Download, Filter, RefreshCw, CheckCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AttendanceRecord {
    studentId: string;
    studentName: string;
    date: string;
    sessionName: string;
    first_seen: string;
    last_seen: string;
    duration_minutes: number;
    period: string;
}

interface WardProfile {
    studentId: string;
    studentName: string;
    department: string;
    year: string;
    division: string;
    email?: string;
}

export default function ParentDashboardModule() {
    const { user } = useAuth();
    const parentEmail = user?.email || '';

    const [ward, setWard] = useState<WardProfile | null>(null);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [subjectSummary, setSubjectSummary] = useState<Record<string, number>>({});
    const [filterDate, setFilterDate] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const authHeaders = { 'X-Parent-Email': parentEmail };

    const fetchWard = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5000/api/parent/ward', { headers: authHeaders });
            const data = await res.json();
            if (data.success) setWard(data.ward);
        } catch {
            setError('Failed to load ward profile.');
        }
    }, [parentEmail]);

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (filterDate) params.set('date', filterDate);
            if (filterSubject) params.set('subject', filterSubject);

            const res = await fetch(`http://localhost:5000/api/parent/attendance?${params}`, { headers: authHeaders });
            const data = await res.json();
            if (data.success) {
                setRecords(data.attendance);
                setSubjectSummary(data.subjectSummary || {});
            } else {
                setError(data.error || 'Failed to load attendance');
            }
        } catch {
            setError('Network error. Is the backend running?');
        } finally {
            setLoading(false);
        }
    }, [parentEmail, filterDate, filterSubject]);

    useEffect(() => {
        fetchWard();
    }, [fetchWard]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const handleDownloadPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const now = new Date().toLocaleString();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(245, 158, 11); // amber
        doc.text('Student Attendance Report', 14, 18);

        // Ward info
        if (ward) {
            doc.setFontSize(11);
            doc.setTextColor(50, 50, 50);
            doc.text(`Student: ${ward.studentName}  |  ID: ${ward.studentId}  |  Dept: ${ward.department}  |  Year: ${ward.year}  |  Div: ${ward.division}`, 14, 27);
        }
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Generated: ${now}  |  Total Records: ${records.length}`, 14, 34);
        if (filterDate || filterSubject) {
            const f = [filterDate && `Date: ${filterDate}`, filterSubject && `Subject: ${filterSubject}`].filter(Boolean).join('  |  ');
            doc.text(`Filters: ${f}`, 14, 40);
        }

        // Subject summary
        if (Object.keys(subjectSummary).length > 0) {
            doc.setFontSize(11);
            doc.setTextColor(50, 50, 50);
            doc.text('Subject-wise Summary', 14, 50);
            autoTable(doc, {
                startY: 54,
                head: [['Subject', 'Sessions Present']],
                body: Object.entries(subjectSummary).map(([subj, count]) => [subj, count]),
                headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [255, 251, 235] },
                styles: { fontSize: 9, cellPadding: 3 },
                tableWidth: 100,
            });
        }

        // Attendance records table
        const summaryEndY = (doc as any).lastAutoTable?.finalY || 54;
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text('Attendance Records', 14, summaryEndY + 10);

        autoTable(doc, {
            startY: summaryEndY + 14,
            head: [['Date', 'Subject', 'Entry Time', 'Exit Time', 'Duration (min)', 'Period']],
            body: records.map(r => [
                r.date || '—',
                r.sessionName || '—',
                r.first_seen || '—',
                r.last_seen || '—',
                r.duration_minutes ?? '—',
                r.period || '—',
            ]),
            headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [255, 251, 235] },
            styles: { fontSize: 8, cellPadding: 3 },
        });

        const filename = `attendance_${ward?.studentName?.replace(/\s+/g, '_') || 'ward'}_${filterDate || new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
    };

    const totalPresent = records.length;
    const subjects = Object.keys(subjectSummary);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Parent Dashboard</h1>
                    <p className="text-slate-500 mt-1">Monitoring your ward's attendance</p>
                </div>
                <button
                    onClick={fetchAttendance}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
            )}

            {/* Ward Profile Card */}
            {ward && (
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                            <User className="w-9 h-9 text-white" />
                        </div>
                        <div>
                            <p className="text-white/70 text-sm font-semibold uppercase tracking-wider">Your Ward</p>
                            <h2 className="text-2xl font-black">{ward.studentName || '—'}</h2>
                            <p className="text-white/80 text-sm mt-0.5">
                                ID: {ward.studentId} &nbsp;·&nbsp; {ward.department} &nbsp;·&nbsp; Year {ward.year} &nbsp;·&nbsp; Div {ward.division}
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-4">
                        <div className="bg-white/20 rounded-xl p-3 text-center">
                            <p className="text-2xl font-black">{totalPresent}</p>
                            <p className="text-xs text-white/80 mt-0.5">Total Present</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3 text-center">
                            <p className="text-2xl font-black">{subjects.length}</p>
                            <p className="text-xs text-white/80 mt-0.5">Subjects</p>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3 text-center">
                            <p className="text-2xl font-black">
                                {records.length > 0
                                    ? Math.round(records.reduce((s, r) => s + (r.duration_minutes || 0), 0) / records.length)
                                    : 0}
                            </p>
                            <p className="text-xs text-white/80 mt-0.5">Avg Duration (min)</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Subject-wise Summary */}
            {subjects.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-amber-500" /> Subject-wise Attendance
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {subjects.map((subj) => (
                            <div key={subj} className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider truncate">{subj}</p>
                                <p className="text-2xl font-black text-amber-600 mt-1">{subjectSummary[subj]}</p>
                                <p className="text-xs text-amber-500">sessions</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters & Download */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-amber-500" /> Filter Records
                </h2>
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                        <select
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        >
                            <option value="">All Subjects</option>
                            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold shadow transition-all"
                    >
                        <Download className="w-4 h-4" /> Download PDF Report
                    </button>
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h2 className="font-bold text-slate-800">Attendance Records ({records.length})</h2>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    {['Date', 'Subject', 'Entry Time', 'Exit Time', 'Duration (min)', 'Period'].map((h) => (
                                        <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-slate-400">No attendance records found</td>
                                    </tr>
                                ) : (
                                    records.map((r, i) => (
                                        <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                                            <td className="px-5 py-3 font-semibold text-slate-700">{r.date || '—'}</td>
                                            <td className="px-5 py-3">
                                                <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold border border-amber-100">
                                                    {r.sessionName || '—'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-slate-600 text-xs">{r.first_seen || '—'}</td>
                                            <td className="px-5 py-3 text-slate-600 text-xs">{r.last_seen || '—'}</td>
                                            <td className="px-5 py-3 text-slate-600">{r.duration_minutes ?? '—'}</td>
                                            <td className="px-5 py-3 text-slate-500">{r.period || '—'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
