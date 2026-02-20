"use client";

import React from "react";

interface Period {
    period_number: number;
    subject: string;
    start_time: string;
    end_time: string;
    days?: string[];
}

interface TimetableViewProps {
    periods: Period[];
    department?: string;
    year?: string;
    division?: string;
}

export default function TimetableView({ periods, department, year, division }: TimetableViewProps) {
    // Group periods by period number
    const periodsByNumber = periods.reduce((acc, period) => {
        if (!acc[period.period_number]) {
            acc[period.period_number] = [];
        }
        acc[period.period_number].push(period);
        return acc;
    }, {} as Record<number, Period[]>);

    const sortedPeriodNumbers = Object.keys(periodsByNumber).map(Number).sort((a, b) => a - b);

    return (
        <div className="glass-card p-6">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gradient-blue mb-2">Class Timetable</h3>
                {department && year && division && (
                    <p className="text-gray-600 text-sm">
                        {department} - {year} - Division {division}
                    </p>
                )}
            </div>

            {periods.length === 0 ? (
                <div className="text-center py-12 bg-gradient-blue rounded-lg">
                    <p className="text-gray-600">No timetable available for this class</p>
                    <p className="text-gray-500 text-sm mt-2">Create a timetable to get started</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sortedPeriodNumbers.map((periodNum) => {
                        const periodData = periodsByNumber[periodNum][0]; // Take first entry for each period
                        return (
                            <div
                                key={periodNum}
                                className="flex items-center gap-4 p-4 rounded-lg bg-gradient-glass border border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Period Number */}
                                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-blue-vibrant flex items-center justify-center text-white font-bold text-lg shadow-glossy">
                                    {periodNum}
                                </div>

                                {/* Period Details */}
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 text-lg">{periodData.subject}</h4>
                                    <p className="text-gray-600 text-sm">
                                        {periodData.start_time} - {periodData.end_time}
                                    </p>
                                    {periodData.days && periodData.days.length > 0 && (
                                        <div className="flex gap-2 mt-2">
                                            {periodData.days.map((day) => (
                                                <span
                                                    key={day}
                                                    className="px-2 py-1 text-xs rounded-full bg-accent-blue-100 text-primary-blue font-medium"
                                                >
                                                    {day.substring(0, 3)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Duration Badge */}
                                <div className="flex-shrink-0">
                                    <div className="px-3 py-1 rounded-full bg-white-80 border border-blue-200 text-sm text-gray-700">
                                        {calculateDuration(periodData.start_time, periodData.end_time)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Helper function to calculate duration
function calculateDuration(startTime: string, endTime: string): string {
    try {
        const [startHour, startMin] = startTime.split(":").map(Number);
        const [endHour, endMin] = endTime.split(":").map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const durationMinutes = endMinutes - startMinutes;

        if (durationMinutes >= 60) {
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
        return `${durationMinutes}m`;
    } catch {
        return "N/A";
    }
}
