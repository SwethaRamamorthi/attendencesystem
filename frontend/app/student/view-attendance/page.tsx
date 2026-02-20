"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// XLSX is dynamically imported in the browser-only export function to avoid
// bundling issues on the server (e.g. "fs" not found). Do not import at module top-level.

interface AttendanceRecord {
  _id: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  status: "present" | "absent";
  confidence: number;
}

export default function ViewAttendance() {
  const router = useRouter();
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterDivision, setFilterDivision] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStudentId, setFilterStudentId] = useState("");
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0,
  });
  const [searched, setSearched] = useState(false);

  // Auto-load today's attendance when page opens
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  // Auto-fetch when date is set
  useEffect(() => {
    if (selectedDate && !searched) {
      fetchAttendanceData();
    }
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    // Remove the alert - allow fetching without filters
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);
      if (filterDepartment) params.set("department", filterDepartment);
      if (filterYear) params.set("year", filterYear);
      if (filterDivision) params.set("division", filterDivision);
      if (filterSubject) params.set("subject", filterSubject);
      if (filterStudentId) params.set("student_id", filterStudentId);

      const res = await fetch(`http://127.0.0.1:5000/api/attendance?${params.toString()}`);
      const raw = await res.text();
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        console.error("Failed to parse /api/attendance response as JSON. status=", res.status, "body=", raw);
        throw err;
      }

      if (data && data.success) {
        const mappedData: AttendanceRecord[] = data.attendance.map((record: any, idx: number) => ({
          _id: record.studentId || `row-${idx}`,
          studentId: record.studentId || record.student_id || "-",
          studentName: record.studentName || record.student_name || "-",
          date: record.date || data.date || selectedDate,
          time: record.markedAt || record.time || "-",
          status: record.status || "present",
          confidence: record.confidence || 0,
        }));
        setAttendanceData(mappedData);
        setStats(data.stats);
      }
      setSearched(true);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);
      if (filterDepartment) params.set("department", filterDepartment);
      if (filterYear) params.set("year", filterYear);
      if (filterDivision) params.set("division", filterDivision);
      if (filterSubject) params.set("subject", filterSubject);

      const res = await fetch(`http://127.0.0.1:5000/api/attendance/export?${params.toString()}`);
      const raw = await res.text();
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        console.error("Failed to parse /api/attendance/export response as JSON. status=", res.status, "body=", raw);
        throw err;
      }
      if (data && data.success) {
        // Dynamic import so bundlers (Next.js SSR) don't try to include node-only deps
        const XLSX = await import("xlsx");
        const worksheet = XLSX.utils.json_to_sheet(data.data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
        XLSX.writeFile(workbook, `attendance_${selectedDate || "export"}.xlsx`);
      }
    } catch (error) {
      console.error("Error exporting excel:", error);
    }
  };

  const exportPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);
      if (filterDepartment) params.set("department", filterDepartment);
      if (filterYear) params.set("year", filterYear);
      if (filterDivision) params.set("division", filterDivision);
      if (filterSubject) params.set("subject", filterSubject);

      const res = await fetch(`http://127.0.0.1:5000/api/attendance/export?${params.toString()}`);
      const data = await res.json();

      if (data && data.success) {
        const { default: jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");

        const doc = new jsPDF() as any;

        // Add Title
        doc.setFontSize(20);
        doc.setTextColor(40);
        doc.text("Attendance Report", 14, 22);

        // Add Metadata
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Date: ${selectedDate || "N/A"}`, 14, 30);
        doc.text(`Department: ${filterDepartment || "All"} | Year: ${filterYear || "All"} | Division: ${filterDivision || "All"}`, 14, 36);
        doc.text(`Subject: ${filterSubject || "All"}`, 14, 42);

        // Prep data for table
        const tableColumn = ["Student ID", "Name", "Status", "First Seen", "Last Seen", "Duration"];
        const tableRows = data.data.map((row: any) => [
          row.studentId,
          row.name,
          row.status.toUpperCase(),
          row.first_seen,
          row.last_seen,
          `${row.duration_minutes.toFixed(1)} mins`
        ]);

        autoTable(doc, {
          startY: 50,
          head: [tableColumn],
          body: tableRows,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          alternateRowStyles: { fillColor: [241, 245, 249] },
          margin: { top: 50 },
        });

        doc.save(`attendance_${selectedDate || "export"}.pdf`);
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-blue p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Attendance Records</h1>
            <p className="text-gray-600">View and manage student attendance data</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="glossy-button-secondary px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="glass-input px-3 py-2 text-gray-900"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Year</label>
                <div className="glass-select-wrapper">
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="glass-input glass-select w-full px-4 py-2.5 text-sm font-bold text-slate-700"
                  >
                    <option value="">All Years</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Division</label>
                <div className="glass-select-wrapper">
                  <select
                    value={filterDivision}
                    onChange={(e) => setFilterDivision(e.target.value)}
                    className="glass-input glass-select w-full px-4 py-2.5 text-sm font-bold text-slate-700"
                  >
                    <option value="">All Divisions</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  placeholder="Subject name"
                  className="glass-input px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input
                  value={filterStudentId}
                  onChange={(e) => setFilterStudentId(e.target.value)}
                  placeholder="Student Id"
                  className="glass-input px-3 py-2 text-gray-900"
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Department</label>
                <div className="glass-select-wrapper">
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="glass-input glass-select w-full px-4 py-2.5 text-sm font-bold text-slate-700"
                  >
                    <option value="">All Departments</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="IT">IT</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={fetchAttendanceData}
                className="glossy-button px-6 py-3 flex items-center gap-2"
              >
                🔍 Search
              </button>
              <button
                onClick={exportExcel}
                className="glossy-button px-6 py-3 flex items-center gap-2"
              >
                📑 Export Excel
              </button>
              <button
                onClick={exportPDF}
                className="glossy-button-secondary px-6 py-3 flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
              >
                📄 Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {attendanceData.length > 0 && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-gradient-blue">{stats.totalStudents}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold" style={{ color: 'var(--success-green)' }}>{stats.presentToday}</div>
              <div className="text-sm text-gray-600">Present Today</div>
            </div>
            <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold" style={{ color: 'var(--error-red)' }}>{stats.absentToday}</div>
              <div className="text-sm text-gray-600">Absent Today</div>
            </div>
            <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-3xl font-bold text-gradient-blue">{stats.attendanceRate}%</div>
              <div className="text-sm text-gray-600">Attendance Rate</div>
            </div>
          </div>
        )}

        {/* Attendance Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Attendance {selectedDate ? `for ${new Date(selectedDate).toLocaleDateString()}` : ""}
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary-blue)' }}></div>
              <p>Loading attendance data...</p>
            </div>
          ) : !searched ? (
            <div className="p-8 text-center text-gray-500">
              Please apply filters and click <b>Search</b> to view attendance records.
            </div>
          ) : attendanceData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No attendance records found for the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceData.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.studentName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${record.status === "present"
                            ? "badge-success"
                            : "badge-error"
                            }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.confidence}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
