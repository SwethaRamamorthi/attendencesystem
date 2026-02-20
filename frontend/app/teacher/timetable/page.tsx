"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, BookOpen, Plus, Trash2, Save, ArrowLeft } from "lucide-react";

interface Period {
    period_number: number;
    subject: string;
    teacher: string;
    start_time: string;
    end_time: string;
    days: string[];
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEPARTMENTS = ["Computer Science", "IT", "Electronics", "Mechanical", "Civil"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const DIVISIONS = ["A", "B", "C", "D"];

export default function TimetableManager() {
    const router = useRouter();
    const [department, setDepartment] = useState("");
    const [year, setYear] = useState("");
    const [division, setDivision] = useState("");
    const [periods, setPeriods] = useState<Period[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [timetableId, setTimetableId] = useState<string | null>(null);

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
        const updated = [...periods];
        updated[index] = { ...updated[index], [field]: value };
        setPeriods(updated);
    };

    const toggleDay = (periodIndex: number, day: string) => {
        const updated = [...periods];
        const period = updated[periodIndex];
        if (period.days.includes(day)) {
            period.days = period.days.filter((d) => d !== day);
        } else {
            period.days = [...period.days, day];
        }
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
        <div className="min-h-screen bg-gradient-blue p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/teacher/dashboard")}
                            className="glossy-button-secondary p-3 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gradient-blue">Timetable Management</h1>
                            <p className="text-gray-600">Create and manage class timetables</p>
                        </div>
                    </div>
                </div>

                {/* Class Selection */}
                <div className="glass-card p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary-blue" />
                        Select Class
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                            <select
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="glass-input w-full px-3 py-2 text-gray-900"
                            >
                                <option value="">Select Department</option>
                                {DEPARTMENTS.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                            <select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="glass-input w-full px-3 py-2 text-gray-900"
                            >
                                <option value="">Select Year</option>
                                {YEARS.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                            <select
                                value={division}
                                onChange={(e) => setDivision(e.target.value)}
                                className="glass-input w-full px-3 py-2 text-gray-900"
                            >
                                <option value="">Select Division</option>
                                {DIVISIONS.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={fetchTimetable}
                        className="glossy-button mt-4 px-6 py-3 flex items-center gap-2"
                        disabled={loading}
                    >
                        <BookOpen className="w-5 h-5" />
                        Load Timetable
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <div className={`glass-card p-4 mb-6 ${message.includes("Error") ? "border-error-red" : "border-success-green"}`}>
                        <p className={message.includes("Error") ? "text-error-red" : "text-success-green"}>{message}</p>
                    </div>
                )}

                {/* Periods List */}
                <div className="glass-card p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary-blue" />
                            Periods ({periods.length})
                        </h2>
                        <button
                            onClick={addPeriod}
                            className="glossy-button px-4 py-2 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add Period
                        </button>
                    </div>

                    {periods.length === 0 ? (
                        <div className="text-center py-12 bg-gradient-blue rounded-lg">
                            <p className="text-gray-600">No periods added yet</p>
                            <p className="text-gray-500 text-sm mt-2">Click "Add Period" to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {periods.map((period, index) => (
                                <div key={index} className="bg-gradient-glass p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-start gap-4">
                                        {/* Period Number */}
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-blue-vibrant flex items-center justify-center text-white font-bold">
                                            {period.period_number}
                                        </div>

                                        {/* Period Details */}
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                                                <input
                                                    type="text"
                                                    value={period.subject}
                                                    onChange={(e) => updatePeriod(index, "subject", e.target.value)}
                                                    placeholder="Subject name"
                                                    className="glass-input w-full px-3 py-2 text-sm text-gray-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Teacher</label>
                                                <input
                                                    type="text"
                                                    value={period.teacher}
                                                    onChange={(e) => updatePeriod(index, "teacher", e.target.value)}
                                                    placeholder="Teacher name"
                                                    className="glass-input w-full px-3 py-2 text-sm text-gray-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                                                <input
                                                    type="time"
                                                    value={period.start_time}
                                                    onChange={(e) => updatePeriod(index, "start_time", e.target.value)}
                                                    className="glass-input w-full px-3 py-2 text-sm text-gray-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                                                <input
                                                    type="time"
                                                    value={period.end_time}
                                                    onChange={(e) => updatePeriod(index, "end_time", e.target.value)}
                                                    className="glass-input w-full px-3 py-2 text-sm text-gray-900"
                                                />
                                            </div>
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => removePeriod(index)}
                                            className="flex-shrink-0 p-2 rounded-lg bg-error-red-light hover:bg-error-red text-error-red hover:text-white transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Days Selection */}
                                    <div className="mt-4">
                                        <label className="block text-xs font-medium text-gray-600 mb-2">Days</label>
                                        <div className="flex flex-wrap gap-2">
                                            {DAYS_OF_WEEK.map((day) => (
                                                <button
                                                    key={day}
                                                    onClick={() => toggleDay(index, day)}
                                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${period.days.includes(day)
                                                        ? "bg-gradient-blue-vibrant text-white shadow-glossy"
                                                        : "bg-white-80 text-gray-600 hover:bg-white-90"
                                                        }`}
                                                >
                                                    {day.substring(0, 3)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Save Button */}
                {periods.length > 0 && (
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={() => router.push("/teacher/dashboard")}
                            className="glossy-button-secondary px-6 py-3"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={saveTimetable}
                            disabled={loading}
                            className="glossy-button px-6 py-3 flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? "Saving..." : timetableId ? "Update Timetable" : "Create Timetable"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
