'use client';

import { useState } from 'react';
import { Download, Filter, Search, FileText, X } from 'lucide-react';
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

export default function AdminReportsModule() {
    const [filters, setFilters] = useState({
        date: '',
        subject: '',
        student_id: '',
        department: '',
        year: '',
        division: '',
    });
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');

    const buildQuery = (extra?: Record<string, string>) => {
        const params = new URLSearchParams();
        const f = { ...filters, ...extra };
        Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v); });
        return params.toString();
    };

    const handleSearch = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`http://localhost:5000/api/admin/attendance?${buildQuery()}`);
            const data = await res.json();
            if (data.success) {
                setRecords(data.attendance);
                setSearched(true);
            } else {
                setError(data.error || 'Failed to fetch records');
            }
        } catch {
            setError('Network error. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });
        const now = new Date().toLocaleString();
        const activeFilters = Object.entries(filters).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('  |  ');

        doc.setFontSize(18);
        doc.setTextColor(99, 102, 241);
        doc.text('Attendance Report', 14, 18);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated: ${now}`, 14, 25);
        if (activeFilters) doc.text(`Filters: ${activeFilters}`, 14, 31);

        autoTable(doc, {
            startY: activeFilters ? 37 : 31,
            head: [['Student ID', 'Name', 'Date', 'Subject', 'First Seen', 'Last Seen', 'Duration (min)', 'Period']],
            body: records.map(r => [
                r.studentId || '—',
                r.studentName || '—',
                r.date || '—',
                r.sessionName || '—',
                r.first_seen || '—',
                r.last_seen || '—',
                r.duration_minutes ?? '—',
                r.period || '—',
            ]),
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 255] },
            styles: { fontSize: 8, cellPadding: 3 },
        });

        const dateStr = filters.date || new Date().toISOString().slice(0, 10);
        doc.save(`attendance_report_${dateStr}.pdf`);
    };

    const clearFilters = () => {
        setFilters({ date: '', subject: '', student_id: '', department: '', year: '', division: '' });
        setRecords([]);
        setSearched(false);
        setError('');
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-800">Attendance Reports</h1>
                <p className="text-slate-500 mt-1">Filter and download attendance data across all students</p>
            </div>

            {/* Filter Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-base font-bold text-slate-700 mb-5 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-violet-600" /> Filter Options
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                        { key: 'date', label: 'Date', type: 'date', placeholder: '' },
                        { key: 'subject', label: 'Subject', type: 'text', placeholder: 'e.g. Mathematics' },
                        { key: 'student_id', label: 'Student ID', type: 'text', placeholder: 'e.g. S001' },
                        { key: 'department', label: 'Department', type: 'text', placeholder: 'e.g. CSE' },
                        { key: 'year', label: 'Year', type: 'text', placeholder: 'e.g. 3' },
                        { key: 'division', label: 'Division', type: 'text', placeholder: 'e.g. A' },
                    ].map(({ key, label, type, placeholder }) => (
                        <div key={key}>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                            <input
                                type={type}
                                value={filters[key as keyof typeof filters]}
                                onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                                placeholder={placeholder}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                            />
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                        <Search className="w-4 h-4" />
                        {loading ? 'Searching…' : 'Search Records'}
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl font-semibold transition-all shadow"
                    >
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                    {searched && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold transition-colors"
                        >
                            <X className="w-4 h-4" /> Clear
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
            )}

            {/* Results Table */}
            {searched && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-violet-600" />
                        <h2 className="font-bold text-slate-800">Results ({records.length} records)</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    {['Student ID', 'Name', 'Date', 'Subject', 'First Seen', 'Last Seen', 'Duration (min)', 'Period'].map((h) => (
                                        <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {records.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12 text-slate-400">No records found for the selected filters</td>
                                    </tr>
                                ) : (
                                    records.map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-3 font-mono text-xs text-slate-600">{r.studentId || '—'}</td>
                                            <td className="px-5 py-3 font-semibold text-slate-800">{r.studentName || '—'}</td>
                                            <td className="px-5 py-3 text-slate-600">{r.date || '—'}</td>
                                            <td className="px-5 py-3 text-slate-600">{r.sessionName || '—'}</td>
                                            <td className="px-5 py-3 text-slate-500 text-xs">{r.first_seen || '—'}</td>
                                            <td className="px-5 py-3 text-slate-500 text-xs">{r.last_seen || '—'}</td>
                                            <td className="px-5 py-3 text-slate-600">{r.duration_minutes ?? '—'}</td>
                                            <td className="px-5 py-3 text-slate-600">{r.period || '—'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
