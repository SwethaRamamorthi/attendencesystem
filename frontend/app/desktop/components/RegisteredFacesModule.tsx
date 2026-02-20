'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, User, Trash2, Pencil, X, Save, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

interface Student {
    _id: string;
    studentId: string;
    studentName: string;
    department: string;
    year: string;
    division: string;
    semester: string;
    email: string;
    phoneNumber: string;
    status: string;
    created_at: number;
}

export default function RegisteredFacesModule() {
    const { user } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');

    // Edit Mode State
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updateError, setUpdateError] = useState('');

    useEffect(() => {
        fetchRegisteredFaces();
    }, []);

    useEffect(() => {
        filterStudents();
    }, [searchTerm, departmentFilter, yearFilter, students]);

    const fetchRegisteredFaces = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/students/faces');
            const data = await response.json();
            if (data.success) {
                setStudents(data.students);
                setFilteredStudents(data.students);
            }
        } catch (error) {
            console.error('Error fetching registered faces:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterStudents = () => {
        let filtered = students;

        if (searchTerm) {
            filtered = filtered.filter(
                (s) =>
                    s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (departmentFilter) {
            filtered = filtered.filter((s) => s.department === departmentFilter);
        }

        if (yearFilter) {
            filtered = filtered.filter((s) => s.year === yearFilter);
        }

        setFilteredStudents(filtered);
    };

    const handleDelete = async (studentId: string) => {
        if (!confirm('Are you sure you want to delete this student?')) return;

        try {
            // Use the teacher-specific delete endpoint if available or fallback
            // Using database ID if possible, but the API expects studentId for the main endpoint
            // Let's use the teacher endpoint which uses _id
            const studentToDelete = students.find(s => s.studentId === studentId);
            if (!studentToDelete) return;

            const response = await fetch(`http://localhost:5000/api/teacher/student/${studentToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Type': 'teacher',
                    'X-User-Email': user?.email || ''
                }
            });
            const data = await response.json();
            if (data.success) {
                fetchRegisteredFaces(); // Refresh list
            } else {
                alert('Failed to delete: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    };

    const handleEditClick = (student: Student) => {
        setEditingStudent({ ...student });
        setUpdateError('');
        setIsEditModalOpen(true);
    };

    const handleUpdateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;

        setUpdateLoading(true);
        setUpdateError('');

        try {
            const response = await fetch(`http://localhost:5000/api/teacher/student/${editingStudent._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Type': 'teacher',
                    'X-User-Email': user?.email || ''
                },
                body: JSON.stringify(editingStudent)
            });

            const data = await response.json();

            if (data.success) {
                setIsEditModalOpen(false);
                fetchRegisteredFaces();
            } else {
                setUpdateError(data.error || 'Update failed');
            }
        } catch (error) {
            setUpdateError('Network error occurred');
        } finally {
            setUpdateLoading(false);
        }
    };

    const departments = Array.from(new Set(students.map((s) => s.department).filter(Boolean)));
    const years = Array.from(new Set(students.map((s) => s.year).filter(Boolean)));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Student Directory</h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Managing <span className="text-blue-600 font-bold">{filteredStudents.length}</span> registered students
                    </p>
                </div>
                <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50/50 rounded-2xl border border-blue-100/50 shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">System Status: Online</span>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="glass-card p-8 border-slate-200/40 shadow-blue-soft/10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Search */}
                    <div className="md:col-span-6 relative group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 group-focus-within:scale-110 transition-all w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="glass-input pl-12 h-14"
                        />
                    </div>

                    {/* Department Filter */}
                    <div className="md:col-span-3">
                        <div className="glass-select-wrapper">
                            <select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                                className="glass-input glass-select w-full h-14 px-5 text-sm font-bold"
                            >
                                <option value="">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept} value={dept}>
                                        {dept}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Year Filter */}
                    <div className="md:col-span-3">
                        <div className="glass-select-wrapper">
                            <select
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                className="glass-input glass-select w-full h-14 px-5 text-sm font-bold"
                            >
                                <option value="">All Years</option>
                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredStudents.map((student) => (
                    <div
                        key={student._id}
                        className="glass-card group hover:translate-y-[-5px] transition-all duration-300 border-slate-200/40 relative overflow-hidden"
                    >
                        {/* Interactive Background Gloss */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="p-8 relative">
                            {/* Student Avatar & Identity */}
                            <div className="flex items-center gap-5 mb-8">
                                <div className="w-20 h-20 bg-gradient-blue-vibrant rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-glossy animate-float group-hover:rotate-3 transition-transform">
                                    {student.studentName.charAt(0)}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="font-black text-xl text-slate-800 truncate tracking-tight" title={student.studentName}>
                                        {student.studentName}
                                    </h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mt-1 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        {student.studentId}
                                    </p>
                                </div>
                            </div>

                            {/* Entity Attributes */}
                            <div className="space-y-4 pt-4 border-t border-slate-100/50">
                                <div className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Department</span>
                                    <span className="text-xs font-bold text-slate-700">{student.department}</span>
                                </div>
                                <div className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Year</span>
                                    <span className="text-xs font-bold text-slate-700">{student.year}</span>
                                </div>
                                <div className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Division</span>
                                    <span className="text-xs font-bold text-slate-700">{student.division || 'NULL'}</span>
                                </div>
                                <div className="flex flex-col gap-1 px-1">
                                    <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Email</span>
                                    <span className="text-xs font-bold text-slate-800 truncate italic" title={student.email}>
                                        {student.email || <span className="text-red-400">UNREGISTERED</span>}
                                    </span>
                                </div>
                            </div>

                            {/* Command Bar */}
                            <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100/50">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wide shadow-sm ${student.status === 'active'
                                    ? 'bg-green-50 text-green-600 border border-green-100'
                                    : 'bg-red-50 text-red-600 border border-red-100'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${student.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    {student.status}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditClick(student)}
                                        className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-50/50 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                                        title="Edit Student"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(student.studentId)}
                                        className="w-10 h-10 flex items-center justify-center text-red-500 bg-red-50/50 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                                        title="Delete Student"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredStudents.length === 0 && (
                <div className="glass-card py-24 text-center border-dashed border-2 bg-slate-50/30">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <User className="w-10 h-10 text-slate-300 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">No Students Found</h3>
                    <p className="text-slate-500 font-medium italic">No students match your search filters.</p>
                </div>
            )}

            {/* High-Fidelity Edit Modal */}
            {isEditModalOpen && editingStudent && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
                    <div className="glass-card bg-white/95 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-blue-soft/20 animate-in zoom-in-95 duration-500">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-8 border-b border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
                            <div className="relative">
                                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Edit Student Details</h1>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600 mt-1">ID: {editingStudent._id}</p>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateStudent} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                            {updateError && (
                                <div className="glass-card bg-red-50/50 border-red-200 p-5 text-red-600 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-xl">!</div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wide">Update Failed</p>
                                        <p className="text-sm font-semibold">{updateError}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={editingStudent.studentName}
                                        onChange={e => setEditingStudent({ ...editingStudent, studentName: e.target.value })}
                                        className="glass-input h-14"
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">Student ID</label>
                                    <input
                                        type="text"
                                        value={editingStudent.studentId}
                                        onChange={e => setEditingStudent({ ...editingStudent, studentId: e.target.value })}
                                        className="glass-input h-14 font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={editingStudent.email}
                                    onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
                                    className="glass-input h-14 italic"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">Department</label>
                                    <select
                                        value={editingStudent.department}
                                        onChange={e => setEditingStudent({ ...editingStudent, department: e.target.value })}
                                        className="glass-input h-12 text-xs"
                                    >
                                        <option value="MCA">MCA</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">Year</label>
                                    <select
                                        value={editingStudent.year}
                                        onChange={e => setEditingStudent({ ...editingStudent, year: e.target.value })}
                                        className="glass-input h-12 text-xs"
                                    >
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">Division</label>
                                    <select
                                        value={editingStudent.division}
                                        onChange={e => setEditingStudent({ ...editingStudent, division: e.target.value })}
                                        className="glass-input h-12 text-xs"
                                    >
                                        <option value="G1">G1</option>
                                        <option value="G2">G2</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 ml-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={editingStudent.phoneNumber}
                                        onChange={e => setEditingStudent({ ...editingStudent, phoneNumber: e.target.value })}
                                        className="glass-input h-12 text-xs"
                                        placeholder="Phone"
                                    />
                                </div>
                            </div>

                            {/* Footer Command Section */}
                            <div className="flex gap-4 pt-10 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 h-14 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 font-bold text-xs uppercase tracking-wide transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateLoading}
                                    className="flex-[2] h-14 bg-gradient-blue-vibrant text-white rounded-2xl shadow-glossy font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {updateLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
