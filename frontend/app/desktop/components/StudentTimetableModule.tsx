'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Loader2, Activity, ClipboardList } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

interface Period {
    period_number: number;
    subject: string;
    teacher: string;
    start_time: string;
    end_time: string;
    days: string[];
}

interface ClassSchedule {
    day: string;
    time: string;
    subject: string;
    teacher: string;
    room: string;
    period_number: number;
}

const DAYS_OF_WEEK_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SUBJECT_COLORS = [
    { bg: 'from-indigo-50 to-indigo-100/50', border: 'border-indigo-200/60', text: 'text-indigo-700', icon: 'bg-indigo-100 text-indigo-600', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', hover: 'group-hover:border-indigo-400' },
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

export default function StudentTimetableModule() {
    const { user } = useAuth();
    const [selectedDivision, setSelectedDivision] = useState<string>('G1');
    const [timetable, setTimetable] = useState<ClassSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.division) {
            setSelectedDivision(user.division);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchTimetable();
        }
    }, [user, selectedDivision]);

    const fetchTimetable = async () => {
        if (!user?.department || !user?.year) {
            // handle missing details
        }

        try {
            const department = user?.department || 'MCA';
            const year = user?.year || '1st Year';
            const division = selectedDivision; // Use selected division

            const params = new URLSearchParams({ department, year, division });
            const res = await fetch(`http://localhost:5000/api/timetable/get?${params}`);
            const data = await res.json();

            if (data.success && data.timetable && data.timetable.periods) {
                const periods: Period[] = data.timetable.periods;
                const flattenedSchedule: ClassSchedule[] = [];

                periods.forEach(period => {
                    period.days.forEach(day => {
                        flattenedSchedule.push({
                            day,
                            time: `${period.start_time} - ${period.end_time}`,
                            subject: period.subject,
                            teacher: period.teacher,
                            room: 'Classroom',
                            period_number: period.period_number
                        });
                    });
                });

                // Sort by Day then by Start Time/Period Number
                flattenedSchedule.sort((a, b) => {
                    const dayA = DAYS_OF_WEEK_ORDER.indexOf(a.day);
                    const dayB = DAYS_OF_WEEK_ORDER.indexOf(b.day);
                    if (dayA !== dayB) return dayA - dayB;
                    return a.period_number - b.period_number;
                });

                setTimetable(flattenedSchedule);
            } else {
                setTimetable([]);
            }
        } catch (error) {
            console.error('Error fetching timetable:', error);
            setError('Failed to load timetable');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayClasses = timetable.filter(item => item.day === today);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Class Timetable</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wide shadow-md">
                            {user?.department || 'MCA'}
                        </span>
                        <span className="px-3 py-1 bg-white/60 backdrop-blur-sm border border-indigo-100 rounded-lg text-[10px] font-bold uppercase tracking-wide text-slate-600 shadow-sm">
                            Year {user?.year || '2'}
                        </span>

                        {/* Division Selector */}
                        <div className="flex items-center bg-white/60 backdrop-blur-sm border border-indigo-100 rounded-lg p-0.5 shadow-sm">
                            {['G1', 'G2'].map((div) => (
                                <button
                                    key={div}
                                    onClick={() => setSelectedDivision(div)}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${selectedDivision === div
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-indigo-600'
                                        }`}
                                >
                                    {div}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="hidden lg:flex items-center gap-2 p-2 glass-card border-indigo-100/30">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div className="pr-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Class Schedule</p>
                        <p className="text-sm font-bold text-slate-700">Academic Year 2023-24</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="glass-card border-red-200 bg-red-50/30 p-4 text-red-600 flex items-center gap-3 animate-bounce-gentle">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-sm uppercase tracking-tight">Error</p>
                        <p className="text-xs font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* Today's Classes Highlight */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-gradient-to-br from-indigo-700 via-purple-800 to-fuchsia-900 rounded-3xl shadow-2xl overflow-hidden p-8 text-white">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-32 -translate-y-32 blur-3xl"></div>

                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-1 flex items-center gap-3">
                                <Clock className="w-8 h-8 text-blue-200 animate-pulse" />
                                Today's Classes
                            </h2>
                            <p className="text-blue-100 font-bold uppercase tracking-wide text-[10px]">{today}</p>
                        </div>

                        {todayClasses.length > 0 ? (
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {todayClasses.map((item, index) => (
                                    <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/20 transition-all group/item hover:scale-[1.02]">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-inner group-hover/item:rotate-12 transition-transform">
                                                {item.subject[0]}
                                            </div>
                                            <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                                                Period {item.period_number}
                                            </span>
                                        </div>
                                        <h4 className="font-black text-lg mb-1">{item.subject}</h4>
                                        <div className="flex flex-col gap-2 opacity-80 decoration-slate-200">
                                            <div className="flex items-center gap-2 text-xs font-bold">
                                                <User className="w-3.5 h-3.5" />
                                                {item.teacher}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-bold">
                                                <Clock className="w-3.5 h-3.5" />
                                                {item.time}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-4 px-12 glass-container bg-white/10 border-white/20">
                                <Calendar className="w-10 h-10 mb-2 opacity-50" />
                                <p className="font-black">No sessions today</p>
                                <p className="text-xs opacity-70">Focus on independent study!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Weekly Schedule Grid */}
            <div className="glass-card overflow-hidden">
                <div className="p-8 border-b border-slate-200/50 bg-white/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                                <ClipboardList className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Week View</h2>
                                <p className="text-sm text-slate-500 font-medium">Your weekly class schedule</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 gap-12">
                        {DAYS_OF_WEEK_ORDER.map((day) => {
                            const dayClasses = timetable.filter(item => item.day === day);
                            if (dayClasses.length === 0) return null;

                            return (
                                <div key={day} className="relative">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-100 to-transparent"></div>
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            {day}
                                        </h3>
                                        <div className="h-0.5 flex-1 bg-gradient-to-l from-blue-100 to-transparent"></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {dayClasses.map((item, index) => {
                                            const colors = getSubjectColor(item.subject);
                                            return (
                                                <div key={index} className={`bg-gradient-to-br ${colors.bg} rounded-xl p-5 border ${colors.border} ${colors.hover} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group/card relative overflow-hidden`}>
                                                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/30 rounded-full blur-2xl opacity-50 group-hover/card:scale-150 transition-transform duration-500"></div>

                                                    <div className="relative z-10">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center font-black text-xl shadow-sm group-hover/card:scale-110 transition-transform duration-300`}>
                                                                    {item.subject[0]}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className={`font-black text-slate-800 text-sm leading-tight group-hover/card:${colors.text} transition-colors line-clamp-2`}>
                                                                        {item.subject}
                                                                    </h4>
                                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                                                                        {item.teacher}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className={`text-[10px] font-black ${colors.badge} px-2.5 py-1 rounded-lg border uppercase tracking-wide`}>
                                                                P{item.period_number}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-t border-slate-200/50 pt-4">
                                                            <div className={`flex items-center gap-2 ${colors.text} bg-white/60 px-2 py-1 rounded-md`}>
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {item.time}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-slate-400">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                {item.room}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {timetable.length === 0 && !loading && (
                            <div className="text-center py-20 glass-container border-dashed border-2 border-slate-200 bg-slate-50/30">
                                <Calendar className="w-16 h-16 mx-auto mb-6 text-slate-300 animate-float" />
                                <h3 className="text-xl font-bold text-slate-700">No Schedule</h3>
                                <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">
                                    No schedule found for {user?.department || 'MCA'} - Year {user?.year || '2'} - Div {selectedDivision}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
