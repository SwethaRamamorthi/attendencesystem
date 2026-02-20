'use client';

import React, { useState, useEffect } from "react";
import { Calendar, Clock, BookOpen, Plus, Trash2, Save, Loader2, User, MapPin } from "lucide-react";
import { useAuth } from '@/app/context/AuthContext';

interface Period {
    period_number: number;
    subject: string;
    teacher: string;
    start_time: string;
    end_time: string;
    days: string[];
}

interface TeacherPeriod extends Period {
    department: string;
    year: string;
    division: string;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEPARTMENTS = ["MCA"];
const YEARS = ["1st Year", "2nd Year", "3rd Year"];
const DIVISIONS = ["G1", "G2"];

export default function TeacherTimetableModule() {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<'manage' | 'personal'>('personal');
    const [department, setDepartment] = useState("");
    const [year, setYear] = useState("");
    const [division, setDivision] = useState("");
    const [periods, setPeriods] = useState<Period[]>([]);
    const [teacherSchedule, setTeacherSchedule] = useState<TeacherPeriod[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [timetableId, setTimetableId] = useState<string | null>(null);

    // Fetch teacher's personal schedule on component mount
    useEffect(() => {
        if (user && viewMode === 'personal') {
            fetchTeacherSchedule();
        }
    }, [user, viewMode]);

    // Fetch teacher's personal schedule on component mount
    useEffect(() => {
        if (user && viewMode === 'personal') {
            fetchTeacherSchedule();
        }
    }, [user, viewMode]);

    const fetchTeacherSchedule = async () => {
        if (!user?.username) {
            setMessage("Unable to identify teacher. Please ensure you are logged in.");
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({ teacher: user.username });
            const res = await fetch(`http://localhost:5000/api/timetable/teacher?${params}`);
            const data = await res.json();

            if (data.success && data.periods) {
                setTeacherSchedule(data.periods);
                setMessage(`Loaded ${data.count} classes for ${data.teacher}`);
            } else {
                setTeacherSchedule([]);
                setMessage("No classes found for your schedule.");
            }
        } catch (error) {
            console.error("Error fetching teacher schedule:", error);
            setMessage("Error loading your schedule");
            setTeacherSchedule([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTimetable = async () => {
        if (!department || !year || !division) {
            setMessage("Please select department, year, and division");
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({ department, year, division });
            const res = await fetch(`http://localhost:5000/api/timetable/get?${params}`);
            const data = await res.json();

            if (data.success && data.timetable) {
                setPeriods(data.timetable.periods || []);
                setTimetableId(data.timetable._id);
                setMessage("Timetable loaded successfully");
            } else {
                setPeriods([]);
                setTimetableId(null);
                setMessage("No timetable found. Create a new one.");
            }
        } catch (error) {
            console.error("Error fetching timetable:", error);
            setMessage("Error loading timetable");
        } finally {
            setLoading(false);
        }
    };

    const addPeriod = () => {
        const newPeriod: Period = {
            period_number: periods.length + 1,
            subject: "",
            teacher: "",
            start_time: "09:00",
            end_time: "10:00",
            days: [...DAYS_OF_WEEK],
        };
        setPeriods([...periods, newPeriod]);
    };

    const removePeriod = (index: number) => {
        const updated = periods.filter((_, i) => i !== index);
        // Renumber periods
        updated.forEach((p, i) => (p.period_number = i + 1));
        setPeriods(updated);
    };

    const updatePeriod = (index: number, field: keyof Period, value: any) => {
        const updated = periods.filter((_) => true); // Create checking copy
        const current = { ...periods[index], [field]: value };
        const newPeriods = [...periods];
        newPeriods[index] = current;
        setPeriods(newPeriods);
    };

    const toggleDay = (periodIndex: number, day: string) => {
        const updated = [...periods];
        const period = { ...updated[periodIndex] };
        if (period.days.includes(day)) {
            period.days = period.days.filter((d) => d !== day);
        } else {
            period.days = [...period.days, day];
        }
        updated[periodIndex] = period;
        setPeriods(updated);
    };

    const saveTimetable = async () => {
        if (!department || !year || !division) {
            setMessage("Please select department, year, and division");
            return;
        }

        if (periods.length === 0) {
            setMessage("Please add at least one period");
            return;
        }

        setLoading(true);
        try {
            const payload = { department, year, division, periods };

            let res;
            if (timetableId) {
                // Update existing
                res = await fetch("http://localhost:5000/api/timetable/update", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...payload, timetable_id: timetableId }),
                });
            } else {
                // Create new
                res = await fetch("http://localhost:5000/api/timetable/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            const data = await res.json();
            if (data.success) {
                setMessage(timetableId ? "Timetable updated successfully!" : "Timetable created successfully!");
                if (data.timetable_id) setTimetableId(data.timetable_id);
            } else {
                setMessage(`Error: ${data.error || "Failed to save timetable"}`);
            }
        } catch (error) {
            console.error("Error saving timetable:", error);
            setMessage("Error saving timetable");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
            <div>
                <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Timetable Management</h1>
                <p className="text-slate-500 mt-1 font-medium">View your schedule or manage class timetables</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 border-b border-slate-200 pb-4">
                <button
                    onClick={() => setViewMode('personal')}
                    className={`px-6 py-3 font-bold text-sm rounded-xl transition-all ${viewMode === 'personal'
                        ? 'bg-blue-600 text-white shadow-glossy'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    <User className="w-4 h-4 inline-block mr-2" />
                    My Schedule
                </button>
                <button
                    onClick={() => setViewMode('manage')}
                    className={`px-6 py-3 font-bold text-sm rounded-xl transition-all ${viewMode === 'manage'
                        ? 'bg-blue-600 text-white shadow-glossy'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    <Calendar className="w-4 h-4 inline-block mr-2" />
                    Manage Timetables
                </button>
            </div>

            {/* Personal Schedule View */}
            {viewMode === 'personal' && (
                <div className="space-y-8">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                        </div>
                    ) : teacherSchedule.length > 0 ? (
                        <>
                            {/* Header Info */}
                            <div className="glass-card p-6 border-blue-100/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-glossy">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">{user?.username}'s Schedule</h2>
                                        <p className="text-sm text-slate-500 font-medium">{teacherSchedule.length} classes per week</p>
                                    </div>
                                </div>
                            </div>

                            {/* Timetable Grid */}
                            <div className="glass-card p-8 overflow-x-auto">
                                <div className="min-w-[800px]">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="p-4 text-left font-black text-slate-700 uppercase tracking-tight text-sm bg-slate-50 border-b-2 border-slate-200 sticky left-0 z-10">
                                                    Period
                                                </th>
                                                {DAYS_OF_WEEK.slice(0, 5).map((day) => (
                                                    <th key={day} className="p-4 text-center font-black text-slate-700 uppercase tracking-tight text-sm bg-slate-50 border-b-2 border-slate-200">
                                                        {day.substring(0, 3)}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[1, 2, 3, 4, 5, 6, 7].map((periodNum) => {
                                                return (
                                                    <tr key={periodNum} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors">
                                                        <td className="p-4 font-bold text-slate-600 bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm">
                                                                    P{periodNum}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {DAYS_OF_WEEK.slice(0, 5).map((day) => {
                                                            const classForSlot = teacherSchedule.find(
                                                                item => item.period_number === periodNum && item.days.includes(day)
                                                            );

                                                            const SUBJECT_COLORS = [
                                                                { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-200/60', text: 'text-blue-700', icon: 'bg-blue-100 text-blue-600', badge: 'bg-blue-100 text-blue-700 border-blue-200', hover: 'group-hover:border-blue-400' },
                                                                { bg: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-200/60', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', hover: 'group-hover:border-emerald-400' },
                                                                { bg: 'from-violet-50 to-violet-100/50', border: 'border-violet-200/60', text: 'text-violet-700', icon: 'bg-violet-100 text-violet-600', badge: 'bg-violet-100 text-violet-700 border-violet-200', hover: 'group-hover:border-violet-400' },
                                                                { bg: 'from-amber-50 to-amber-100/50', border: 'border-amber-200/60', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-600', badge: 'bg-amber-100 text-amber-700 border-amber-200', hover: 'group-hover:border-amber-400' },
                                                                { bg: 'from-rose-50 to-rose-100/50', border: 'border-rose-200/60', text: 'text-rose-700', icon: 'bg-rose-100 text-rose-600', badge: 'bg-rose-100 text-rose-700 border-rose-200', hover: 'group-hover:border-rose-400' },
                                                                { bg: 'from-cyan-50 to-cyan-100/50', border: 'border-cyan-200/60', text: 'text-cyan-700', icon: 'bg-cyan-100 text-cyan-600', badge: 'bg-cyan-100 text-cyan-700 border-cyan-200', hover: 'group-hover:border-cyan-400' },
                                                                { bg: 'from-indigo-50 to-indigo-100/50', border: 'border-indigo-200/60', text: 'text-indigo-700', icon: 'bg-indigo-100 text-indigo-600', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', hover: 'group-hover:border-indigo-400' },
                                                                { bg: 'from-orange-50 to-orange-100/50', border: 'border-orange-200/60', text: 'text-orange-700', icon: 'bg-orange-100 text-orange-600', badge: 'bg-orange-100 text-orange-700 border-orange-200', hover: 'group-hover:border-orange-400' },
                                                                { bg: 'from-teal-50 to-teal-100/50', border: 'border-teal-200/60', text: 'text-teal-700', icon: 'bg-teal-100 text-teal-600', badge: 'bg-teal-100 text-teal-700 border-teal-200', hover: 'group-hover:border-teal-400' },
                                                                { bg: 'from-fuchsia-50 to-fuchsia-100/50', border: 'border-fuchsia-200/60', text: 'text-fuchsia-700', icon: 'bg-fuchsia-100 text-fuchsia-600', badge: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200', hover: 'group-hover:border-fuchsia-400' },
                                                            ];

                                                            const getSubjectColor = (subject: string) => {
                                                                let hash = 0;
                                                                for (let i = 0; i < subject.length; i++) {
                                                                    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
                                                                }
                                                                const index = Math.abs(hash) % SUBJECT_COLORS.length;
                                                                return SUBJECT_COLORS[index];
                                                            };

                                                            return (
                                                                <td key={day} className="p-3 align-top border-r border-slate-100 last:border-r-0">
                                                                    {classForSlot ? (
                                                                        (() => {
                                                                            const colors = getSubjectColor(classForSlot.subject);
                                                                            return (
                                                                                <div className={`bg-gradient-to-br ${colors.bg} rounded-xl p-4 border ${colors.border} ${colors.hover} hover:shadow-lg transition-all duration-300 group relative overflow-hidden`}>
                                                                                    {/* Decorative blur */}
                                                                                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/40 rounded-full blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-500"></div>

                                                                                    <div className="relative z-10">
                                                                                        <div className="flex items-start justify-between mb-3">
                                                                                            <div className={`w-10 h-10 ${colors.icon} rounded-xl flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                                                                                {classForSlot.subject.split(' ')[0].substring(0, 2)}
                                                                                            </div>
                                                                                            <span className={`text-[10px] font-black ${colors.badge} px-2.5 py-1 rounded-lg border uppercase tracking-wide`}>
                                                                                                P{classForSlot.period_number}
                                                                                            </span>
                                                                                        </div>

                                                                                        <h4 className={`font-black text-slate-800 text-sm mb-2 line-clamp-2 leading-tight group-hover:${colors.text} transition-colors`}>
                                                                                            {classForSlot.subject}
                                                                                        </h4>

                                                                                        <div className="space-y-1.5">
                                                                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                                                                {classForSlot.department} • {classForSlot.year} • {classForSlot.division}
                                                                                            </p>
                                                                                            <div className={`flex items-center gap-1.5 text-[11px] font-bold ${colors.text} bg-white/60 w-fit px-2 py-0.5 rounded-md backdrop-blur-sm`}>
                                                                                                <Clock className="w-3 h-3" />
                                                                                                {classForSlot.start_time} - {classForSlot.end_time}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })()
                                                                    ) : (
                                                                        <div className="h-full min-h-[140px] rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center group hover:border-slate-200 transition-colors">
                                                                            <span className="text-slate-300 font-medium text-xs group-hover:text-slate-400 transition-colors">Free</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="glass-card p-12 text-center">
                            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-xl font-bold text-slate-700">No Classes Scheduled</h3>
                            <p className="text-slate-500 mt-2 font-medium">You don't have any classes assigned yet.</p>
                        </div>
                    )}

                    {message && (
                        <div className="glass-card p-4 bg-blue-50 border-blue-200 text-blue-700 font-medium text-sm">
                            {message}
                        </div>
                    )}
                </div>
            )}

            {/* Manage Timetable View (Original UI) */}
            {viewMode === 'manage' && (
                <>
                    {/* Class Selection */}
                    <div className="glass-card p-10 border-blue-100/30 shadow-elevated">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-glossy animate-float">
                                    <Calendar className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Schedule Configuration</h2>
                                    <p className="text-sm text-slate-500 font-medium">Select class details to view or edit schedule</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Department</label>
                                </div>
                                <div className="glass-select-wrapper">
                                    <select
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="glass-input glass-select w-full h-14 px-6 text-sm font-bold text-slate-700"
                                    >
                                        <option value="">Select Department</option>
                                        {DEPARTMENTS.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Year</label>
                                </div>
                                <div className="glass-select-wrapper">
                                    <select
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        className="glass-input glass-select w-full h-14 px-6 text-sm font-bold text-slate-700"
                                    >
                                        <option value="">Select Year</option>
                                        {YEARS.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Division</label>
                                </div>
                                <div className="glass-select-wrapper">
                                    <select
                                        value={division}
                                        onChange={(e) => setDivision(e.target.value)}
                                        className="glass-input glass-select w-full h-14 px-6 text-sm font-bold text-slate-700"
                                    >
                                        <option value="">Select Division</option>
                                        {DIVISIONS.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-10 border-t border-slate-100/50 flex justify-end">
                            <button
                                onClick={fetchTimetable}
                                className="px-10 py-5 bg-gradient-blue-vibrant text-white font-bold text-xs uppercase tracking-wide rounded-2xl flex items-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-glossy disabled:opacity-50"
                                disabled={loading}
                            >
                                <BookOpen className="w-5 h-5" />
                                {loading ? "Loading..." : "Load Timetable"}
                            </button>
                        </div>
                    </div>

                    {/* Status Message */}
                    {message && (
                        <div className={`glass-card p-5 border-l-4 animate-in slide-in-from-left duration-300 ${message.includes("Error") ? "border-red-500 bg-red-50/30 text-red-600" : "border-green-500 bg-green-50/30 text-green-600"}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${message.includes("Error") ? "bg-red-100" : "bg-green-100"}`}>
                                    {message.includes("Error") ? "!" : "✓"}
                                </div>
                                <p className="text-sm font-bold tracking-tight">{message}</p>
                            </div>
                        </div>
                    )}

                    {/* Periods Registry */}
                    <div className="glass-card p-8 border-slate-200/40">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-glossy">
                                    <Clock className="w-5 h-5" />
                                </div>
                                Classes ({periods.length})
                            </h2>
                            <button
                                onClick={addPeriod}
                                className="px-6 py-3 bg-blue-50/50 text-blue-600 hover:bg-blue-600 hover:text-white font-bold text-[10px] uppercase tracking-wide rounded-2xl flex items-center gap-2 transition-all active:scale-95 border border-blue-100/50"
                            >
                                <Plus className="w-4 h-4" />
                                Add Class
                            </button>
                        </div>

                        {periods.length === 0 ? (
                            <div className="text-center py-20 glass-container border-dashed border-2 border-slate-200 bg-slate-50/30 rounded-3xl">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <Calendar className="w-8 h-8 text-slate-300 animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">No Classes</h3>
                                <p className="text-slate-500 font-medium italic">Click 'Add Class' to start creating the schedule.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {periods.map((period, index) => (
                                    <div key={index} className="glass-card p-8 border-slate-100 hover:border-blue-200 transition-all duration-300 relative group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity"></div>

                                        <div className="relative flex items-start gap-8">
                                            {/* period numeric */}
                                            <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-blue-vibrant flex items-center justify-center text-white text-xl font-black shadow-glossy animate-float">
                                                {period.period_number}
                                            </div>

                                            {/* attributes grid */}
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">Subject</label>
                                                    <input
                                                        type="text"
                                                        value={period.subject}
                                                        onChange={(e) => updatePeriod(index, "subject", e.target.value)}
                                                        placeholder="e.g., Cryptography"
                                                        className="glass-input h-12 text-sm font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">Teacher</label>
                                                    <input
                                                        type="text"
                                                        value={period.teacher}
                                                        onChange={(e) => updatePeriod(index, "teacher", e.target.value)}
                                                        placeholder="e.g., Prof. Turing"
                                                        className="glass-input h-12 text-sm font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">Start Time</label>
                                                    <input
                                                        type="time"
                                                        value={period.start_time}
                                                        onChange={(e) => updatePeriod(index, "start_time", e.target.value)}
                                                        className="glass-input h-12 text-sm font-bold font-mono"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">End Time</label>
                                                    <input
                                                        type="time"
                                                        value={period.end_time}
                                                        onChange={(e) => updatePeriod(index, "end_time", e.target.value)}
                                                        className="glass-input h-12 text-sm font-bold font-mono"
                                                    />
                                                </div>
                                            </div>

                                            {/* Purge Control */}
                                            <button
                                                onClick={() => removePeriod(index)}
                                                className="shrink-0 w-12 h-12 flex items-center justify-center text-red-500 bg-red-50/50 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                title="Remove Class"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* vector matrix (days) */}
                                        <div className="mt-8 pt-8 border-t border-slate-100/50">
                                            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-4 block ml-1">Days</label>
                                            <div className="flex flex-wrap gap-3">
                                                {DAYS_OF_WEEK.map((day) => (
                                                    <button
                                                        key={day}
                                                        onClick={() => toggleDay(index, day)}
                                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all relative overflow-hidden group/day ${period.days.includes(day)
                                                            ? "bg-gradient-blue-vibrant text-white shadow-glossy animate-pulse-blue"
                                                            : "bg-slate-50 text-slate-500 border border-slate-100 hover:bg-white hover:text-blue-600 hover:shadow-sm"
                                                            }`}
                                                    >
                                                        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/day:translate-x-full transition-transform duration-500"></div>
                                                        <span className="relative z-10">{day}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Protocol Committal */}
                    {periods.length > 0 && (
                        <div className="flex justify-end pt-10">
                            <button
                                onClick={saveTimetable}
                                disabled={loading}
                                className="px-12 py-5 bg-gradient-blue-vibrant text-white font-bold text-xs uppercase tracking-wide rounded-2xl shadow-glossy transform hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                                {loading ? "Saving..." : timetableId ? "Update Timetable" : "Create Timetable"}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
