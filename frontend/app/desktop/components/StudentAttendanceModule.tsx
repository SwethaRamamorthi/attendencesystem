'use client';

import { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, ClipboardList, AlertCircle, Clock, Activity, User, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

interface AttendanceRecord {
    studentId?: string;
    studentName?: string;
    date: string;
    status: 'present' | 'absent';
    sessionName: string;
    time: string;
    period?: string;
    teacher?: string;
    duration_minutes?: number;
    first_seen?: string;
    last_seen?: string;
}

const SUBJECT_COLORS = [
    { bg: 'from-indigo-50 to-indigo-100/50', border: 'border-indigo-200/60', text: 'text-indigo-700', icon: 'bg-indigo-100 text-indigo-600', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', hover: 'group-hover:border-indigo-400' },
    { bg: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-200/60', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', hover: 'group-hover:border-emerald-400' },
    { bg: 'from-violet-50 to-violet-100/50', border: 'border-violet-200/60', text: 'text-violet-700', icon: 'bg-violet-100 text-violet-600', badge: 'bg-violet-100 text-violet-700 border-violet-200', hover: 'group-hover:border-violet-400' },
    { bg: 'from-amber-50 to-amber-100/50', border: 'border-amber-200/60', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-600', badge: 'bg-amber-100 text-amber-700 border-amber-200', hover: 'group-hover:border-amber-400' },
    { bg: 'from-rose-50 to-rose-100/50', border: 'border-rose-200/60', text: 'text-rose-700', icon: 'bg-rose-100 text-rose-600', badge: 'bg-rose-100 text-rose-700 border-rose-200', hover: 'group-hover:border-rose-400' },
    { bg: 'from-cyan-50 to-cyan-100/50', border: 'border-cyan-200/60', text: 'text-cyan-700', icon: 'bg-cyan-100 text-cyan-600', badge: 'bg-cyan-100 text-cyan-700 border-cyan-200', hover: 'group-hover:border-cyan-400' },
    { bg: 'from-orange-50 to-orange-100/50', border: 'border-orange-200/60', text: 'text-orange-700', icon: 'bg-orange-100 text-orange-600', badge: 'bg-orange-100 text-orange-700 border-orange-200', hover: 'group-hover:border-orange-400' },
    { bg: 'from-teal-50 to-teal-100/50', border: 'border-teal-200/60', text: 'text-teal-700', icon: 'bg-teal-100 text-teal-600', badge: 'bg-teal-100 text-teal-700 border-teal-200', hover: 'group-hover:border-teal-400' },
    { bg: 'from-fuchsia-50 to-fuchsia-100/50', border: 'border-fuchsia-200/60', text: 'text-fuchsia-700', icon: 'bg-fuchsia-100 text-fuchsia-600', badge: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200', hover: 'group-hover:border-fuchsia-400' },
];

const getSubjectColor = (subject: string) => {
    let hash = 0;
    for (let i = 0; i < (subject?.length || 0); i++) {
        hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SUBJECT_COLORS.length;
    return SUBJECT_COLORS[index];
};

export default function StudentAttendanceModule() {
    const { user, isTeacher } = useAuth();
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
    const [selectedSubject, setSelectedSubject] = useState('All Subjects');
    const [subjects, setSubjects] = useState<string[]>([]);

    useEffect(() => {
        fetchAttendance();
    }, [selectedSubject]);

    const fetchAttendance = async () => {
        try {
            const studentId = user?.studentId;
            let url = 'http://localhost:5000/api/attendance?';
            const params = new URLSearchParams();

            if (!isTeacher && studentId) {
                params.append('student_id', studentId);
            } else if (!isTeacher && !studentId) {
                console.warn('No student ID found for current user');
                setAttendance([]);
                setLoading(false);
                return;
            }

            if (selectedSubject !== 'All Subjects') {
                params.append('subject', selectedSubject);
            }

            const response = await fetch(url + params.toString());
            const data = await response.json();

            if (data.success && data.attendance) {
                const records: AttendanceRecord[] = data.attendance.map((record: any) => {
                    const formatTime = (dateStr: string) => {
                        if (!dateStr) return null;
                        if (dateStr.includes('GMT') || dateStr.includes('T')) {
                            try {
                                return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                            } catch (e) { return dateStr; }
                        }
                        return dateStr;
                    };

                    return {
                        date: record.date,
                        status: record.status as 'present' | 'absent',
                        sessionName: record.subject || record.sessionName || 'Session',
                        time: record.markedAt || record.time || 'N/A',
                        studentName: record.studentName,
                        studentId: record.studentId,
                        period: record.period,
                        duration_minutes: record.duration_minutes,
                        first_seen: formatTime(record.first_seen),
                        last_seen: formatTime(record.last_seen),
                        teacher: record.teacher
                    };
                });

                setAttendance(records);

                if (selectedSubject === 'All Subjects') {
                    const uniqueSubjects = Array.from(new Set(records.map((r: any) => r.sessionName))) as string[];
                    setSubjects(uniqueSubjects);
                }

                const present = records.filter(r => r.status === 'present').length;
                const total = records.length;

                setStats({
                    total,
                    present,
                    absent: total - present,
                    percentage: total > 0 ? Math.round((present / total) * 100) : 0
                });
            } else {
                setAttendance([]);
                setStats({ total: 0, present: 0, absent: 0, percentage: 0 });
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            setLoading(false);
            setAttendance([]);
            setStats({ total: 0, present: 0, absent: 0, percentage: 0 });
        }
    };

    const exportPDF = async () => {
        try {
            const { default: jsPDF } = await import("jspdf");
            const { default: autoTable } = await import("jspdf-autotable");
            const doc = new jsPDF() as any;

            doc.setFontSize(20);
            doc.setTextColor(40);
            doc.text("Attendance Ledger", 14, 22);

            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`User: ${user?.username || 'N/A'} (${user?.studentId || 'N/A'})`, 14, 30);
            doc.text(`Subject: ${selectedSubject}`, 14, 36);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 42);

            const tableColumn = ["Details", "Period", "Status", "Time Logs", "Duration", "Date"];
            const tableRows = attendance.map((record: any) => [
                isTeacher ? `${record.studentName} (${record.studentId})` : record.sessionName,
                record.period || 'N/A',
                record.status.toUpperCase(),
                record.first_seen && record.last_seen ? `${record.first_seen} - ${record.last_seen}` : record.time,
                record.duration_minutes ? `${Math.min(50, record.duration_minutes).toFixed(0)}m` : "N/A",
                record.date
            ]);

            autoTable(doc, {
                startY: 50,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] },
                alternateRowStyles: { fillColor: [241, 245, 249] },
            });

            doc.save(`attendance_${selectedSubject.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("Error exporting PDF:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Attendance Ledger</h1>
                    <p className="text-slate-500 mt-1 font-medium">{isTeacher ? 'Monitor system-wide attendance' : 'Track your personal attendance history'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group">
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="appearance-none pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm group-hover:shadow-md cursor-pointer min-w-[200px] uppercase tracking-tight"
                        >
                            <option>All Subjects</option>
                            {subjects.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                            <ClipboardList className="w-4 h-4" />
                        </div>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    <button
                        onClick={exportPDF}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl flex items-center gap-2 font-black text-sm shadow-[0_8px_20px_-6px_rgba(139,92,246,0.6)] hover:scale-105 transition-transform group"
                    >
                        <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                        Export
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 group border-indigo-100/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-wide">{isTeacher ? 'Total Logs' : 'Total Classes'}</p>
                            <h3 className="text-4xl font-black mt-2 text-slate-800 group-hover:text-indigo-600 transition-colors uppercase">{stats.total}</h3>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:rotate-12 transition-transform shadow-sm">
                            <ClipboardList className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 group border-emerald-100/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-wide">{isTeacher ? 'Students Detected' : 'Days Present'}</p>
                            <h3 className="text-4xl font-black mt-2 text-emerald-600">{stats.present}</h3>
                        </div>
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:rotate-12 transition-transform shadow-sm">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 group border-rose-100/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-wide">Days Absent</p>
                            <h3 className="text-4xl font-black mt-2 text-rose-600">{stats.absent}</h3>
                        </div>
                        <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 group-hover:rotate-12 transition-transform shadow-sm">
                            <XCircle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 group bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-800 text-white relative shadow-[0_8px_20px_-6px_rgba(139,92,246,0.6)] overflow-hidden border-none" >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16 blur-2xl opacity-50"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-[10px] font-black uppercase tracking-wide">Attendance Percentage</p>
                            <h3 className="text-4xl font-black mt-2 drop-shadow-sm">{stats.percentage}%</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-md">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance List */}
            <div className="glass-card overflow-hidden">
                <div className="p-8 border-b border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-glossy">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Attendance Logs</h2>
                            <p className="text-sm text-slate-500 font-medium">{isTeacher ? 'All students marked present today' : 'Your recent attendance history'}</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">{isTeacher ? 'Student Details' : 'Class Details'}</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">Period</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">Time In/Out</th>
                                <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">Duration (50m cap)</th>
                                <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wide">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {attendance.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center">
                                            <AlertCircle className="w-16 h-16 text-slate-200 mb-4 animate-bounce-gentle" />
                                            <p className="text-lg font-black text-slate-700">No records found</p>
                                            <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">Try adjusting your filters or checking back later.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                attendance.map((record, index) => (
                                    <tr key={index} className="hover:bg-white/40 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                {(() => {
                                                    const colors = getSubjectColor(record.sessionName);
                                                    return (
                                                        <div className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center font-black text-lg shadow-sm border ${colors.border} group-hover:scale-110 transition-transform`}>
                                                            {record.sessionName[0]}
                                                        </div>
                                                    );
                                                })()}
                                                <div>
                                                    <p className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                        {isTeacher ? record.studentName : record.sessionName}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                            {isTeacher ? record.studentId : (record.teacher || 'Generic Session')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black border border-slate-200 uppercase tracking-tight">
                                                {record.period ? `P${record.period}` : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-black text-[10px] uppercase tracking-widest ${record.status === 'present'
                                                ? 'bg-green-50 text-green-700 border-green-100 shadow-[0_0_10px_rgba(74,222,128,0.1)]'
                                                : 'bg-red-50 text-red-700 border-red-100 shadow-[0_0_10px_rgba(248,113,113,0.1)]'
                                                }`}>
                                                {record.status === 'present' ? (
                                                    <><CheckCircle2 className="w-3 h-3" /> Mark Present</>
                                                ) : (
                                                    <><XCircle className="w-3 h-3" /> Mark Absent</>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {record.first_seen && record.last_seen ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-center">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">In</p>
                                                        <p className="text-xs font-black text-slate-800 font-mono">{record.first_seen}</p>
                                                    </div>
                                                    <div className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-center">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Out</p>
                                                        <p className="text-xs font-black text-slate-800 font-mono">{record.last_seen}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-black font-mono">{record.time}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            {record.duration_minutes ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100/50 w-fit">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span className="text-sm font-black text-indigo-700">
                                                            {Math.min(50, record.duration_minutes).toFixed(0)} <span className="text-[10px] opacity-70"> / 50 MIN</span>
                                                        </span>
                                                    </div>
                                                    <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${record.duration_minutes >= 40 ? 'bg-emerald-500' : 'bg-indigo-500'} transition-all`}
                                                            style={{ width: `${Math.min(100, (record.duration_minutes / 50) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-black text-slate-300">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="font-black text-slate-800">{new Date(record.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{new Date(record.date).getFullYear()}</p>
                                        </td>
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
