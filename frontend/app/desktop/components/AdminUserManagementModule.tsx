'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import {
    UserPlus, GraduationCap, Heart, Users, ShieldCheck,
    CheckCircle, XCircle, RefreshCw, Eye, EyeOff, Key,
    ChevronDown, AlertCircle, Loader2, UserCog, Trash2
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────
interface Student {
    _id: string; studentId: string; studentName: string;
    department?: string; year?: string; division?: string;
    email?: string; parent_email?: string; status?: string;
}
interface Teacher {
    _id: string; username: string; email: string;
    employeeId?: string; department?: string;
    subjects?: string[]; status?: string;
}

// ─── Shared helpers ───────────────────────────────────────
const API = 'http://localhost:5000';

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
    if (!msg) return null;
    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl text-sm font-medium ${type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            <span>{msg}</span>
        </div>
    );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                {label}{required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children}
        </div>
    );
}

const inputCls = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white placeholder:text-slate-400 transition";

// ─── Tab: Create Student ──────────────────────────────────
function CreateStudentTab() {
    const [form, setForm] = useState({
        studentName: '', studentId: '', department: '', year: '', division: '',
        email: '', parentEmail: '', parentPassword: '', loginPassword: '',
    });
    const [showPass, setShowPass] = useState(false);
    const [showLoginPass, setShowLoginPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [created, setCreated] = useState<{ parentEmail: string; parentPassword: string } | null>(null);

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setMsg(null); setCreated(null);
        try {
            const res = await fetch(`${API}/api/admin/users/student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentName: form.studentName, studentId: form.studentId,
                    department: form.department, year: form.year, division: form.division,
                    email: form.email, parentEmail: form.parentEmail, parentPassword: form.parentPassword,
                    loginPassword: form.loginPassword,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setMsg({ type: 'success', text: data.message });
                if (data.parentEmail) setCreated({ parentEmail: data.parentEmail, parentPassword: data.parentPassword });
                setForm({ studentName: '', studentId: '', department: '', year: '', division: '', email: '', parentEmail: '', parentPassword: '', loginPassword: '' });
            } else {
                setMsg({ type: 'error', text: data.error });
            }
        } catch { setMsg({ type: 'error', text: 'Network error. Is the backend running?' }); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {msg && <Alert type={msg.type} msg={msg.text} />}
            {created && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm space-y-1">
                    <p className="font-bold text-violet-700">✅ Parent credentials created — save these now!</p>
                    <p className="text-violet-600">Email: <span className="font-mono font-bold">{created.parentEmail}</span></p>
                    <p className="text-violet-600">Password: <span className="font-mono font-bold">{created.parentPassword}</span></p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <Field label="Student Name" required>
                    <input className={inputCls} placeholder="e.g. Vinodha R" value={form.studentName} onChange={e => set('studentName', e.target.value)} required />
                </Field>
                <Field label="Student ID" required>
                    <input className={inputCls} placeholder="e.g. S001" value={form.studentId} onChange={e => set('studentId', e.target.value)} required />
                </Field>
                <Field label="Department">
                    <input className={inputCls} placeholder="e.g. CSE" value={form.department} onChange={e => set('department', e.target.value)} />
                </Field>
                <Field label="Year">
                    <input className={inputCls} placeholder="e.g. 3" value={form.year} onChange={e => set('year', e.target.value)} />
                </Field>
                <Field label="Division">
                    <input className={inputCls} placeholder="e.g. A" value={form.division} onChange={e => set('division', e.target.value)} />
                </Field>
                <Field label="Student Email" required>
                    <input type="email" className={inputCls} placeholder="student@college.edu" value={form.email} onChange={e => set('email', e.target.value)} required />
                </Field>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-indigo-500" /> Student Portal Login (optional)
                </p>
                <Field label="Student Login Password">
                    <div className="relative">
                        <input type={showLoginPass ? 'text' : 'password'} className={inputCls + ' pr-10'} placeholder="Set portal login password (min 6 chars)" value={form.loginPassword} onChange={e => set('loginPassword', e.target.value)} />
                        <button type="button" onClick={() => setShowLoginPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Leave blank to skip — can be set later from the student list</p>
                </Field>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 text-amber-500" /> Parent Credentials (optional)
                </p>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Parent Email">
                        <input type="email" className={inputCls} placeholder="parent@gmail.com" value={form.parentEmail} onChange={e => set('parentEmail', e.target.value)} />
                    </Field>
                    <Field label="Parent Password">
                        <div className="relative">
                            <input type={showPass ? 'text' : 'password'} className={inputCls + ' pr-10'} placeholder="Leave blank to auto-generate" value={form.parentPassword} onChange={e => set('parentPassword', e.target.value)} />
                            <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </Field>
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                {loading ? 'Creating…' : 'Create Student'}
            </button>
        </form>
    );
}

// ─── Tab: Create Teacher ──────────────────────────────────
function CreateTeacherTab() {
    const [form, setForm] = useState({
        username: '', email: '', password: '', employeeId: '', department: '', subjects: '',
    });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setMsg(null);
        try {
            const subjects = form.subjects.split(',').map(s => s.trim()).filter(Boolean);
            const res = await fetch(`${API}/api/admin/users/teacher`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, subjects }),
            });
            const data = await res.json();
            if (data.success) {
                setMsg({ type: 'success', text: data.message });
                setForm({ username: '', email: '', password: '', employeeId: '', department: '', subjects: '' });
            } else {
                setMsg({ type: 'error', text: data.error });
            }
        } catch { setMsg({ type: 'error', text: 'Network error.' }); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {msg && <Alert type={msg.type} msg={msg.text} />}
            <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name" required>
                    <input className={inputCls} placeholder="e.g. Dr. Ramesh Kumar" value={form.username} onChange={e => set('username', e.target.value)} required />
                </Field>
                <Field label="Email" required>
                    <input type="email" className={inputCls} placeholder="teacher@college.edu" value={form.email} onChange={e => set('email', e.target.value)} required />
                </Field>
                <Field label="Password" required>
                    <div className="relative">
                        <input type={showPass ? 'text' : 'password'} className={inputCls + ' pr-10'} placeholder="Set login password" value={form.password} onChange={e => set('password', e.target.value)} required />
                        <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </Field>
                <Field label="Employee ID">
                    <input className={inputCls} placeholder="e.g. T001" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} />
                </Field>
                <Field label="Department">
                    <input className={inputCls} placeholder="e.g. CSE" value={form.department} onChange={e => set('department', e.target.value)} />
                </Field>
                <Field label="Subjects (comma-separated)">
                    <input className={inputCls} placeholder="e.g. Maths, Physics, DSA" value={form.subjects} onChange={e => set('subjects', e.target.value)} />
                </Field>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {loading ? 'Creating…' : 'Create Teacher'}
            </button>
        </form>
    );
}

// ─── Tab: Create Parent ───────────────────────────────────
function CreateParentTab() {
    const [form, setForm] = useState({ studentId: '', parentEmail: '', parentPassword: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [created, setCreated] = useState<{ parentEmail: string; parentPassword: string; studentName: string } | null>(null);
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setMsg(null); setCreated(null);
        try {
            const res = await fetch(`${API}/api/admin/users/parent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                setMsg({ type: 'success', text: data.message });
                setCreated({ parentEmail: data.parentEmail, parentPassword: data.parentPassword, studentName: data.studentName });
                setForm({ studentId: '', parentEmail: '', parentPassword: '' });
            } else {
                setMsg({ type: 'error', text: data.error });
            }
        } catch { setMsg({ type: 'error', text: 'Network error.' }); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {msg && <Alert type={msg.type} msg={msg.text} />}
            {created && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm space-y-1">
                    <p className="font-bold text-amber-700">✅ Parent linked to {created.studentName} — save these now!</p>
                    <p className="text-amber-600">Email: <span className="font-mono font-bold">{created.parentEmail}</span></p>
                    <p className="text-amber-600">Password: <span className="font-mono font-bold">{created.parentPassword}</span></p>
                </div>
            )}
            <Field label="Student ID" required>
                <input className={inputCls} placeholder="e.g. S001" value={form.studentId} onChange={e => set('studentId', e.target.value)} required />
            </Field>
            <Field label="Parent Email" required>
                <input type="email" className={inputCls} placeholder="parent@gmail.com" value={form.parentEmail} onChange={e => set('parentEmail', e.target.value)} required />
            </Field>
            <Field label="Parent Password">
                <div className="relative">
                    <input type={showPass ? 'text' : 'password'} className={inputCls + ' pr-10'} placeholder="Leave blank to auto-generate" value={form.parentPassword} onChange={e => set('parentPassword', e.target.value)} />
                    <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </Field>
            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                {loading ? 'Linking…' : 'Link Parent to Student'}
            </button>
        </form>
    );
}

// ─── Tab: All Users ───────────────────────────────────────
function AllUsersTab() {
    const { user, isAdmin } = useAuth();
    const [activeList, setActiveList] = useState<'students' | 'teachers' | 'parents'>('students');
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [parents, setParents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Link Parent modal state
    const [linkParentModal, setLinkParentModal] = useState<{ open: boolean; studentId: string; name: string }>({ open: false, studentId: '', name: '' });
    const [parentEmail, setParentEmail] = useState('');
    const [parentPass, setParentPass] = useState('');
    const [showParentPass, setShowParentPass] = useState(false);
    const [linkLoading, setLinkLoading] = useState(false);

    // Reset password modal state
    const [resetModal, setResetModal] = useState<{ open: boolean; userType: string; identifier: string; name: string }>({ open: false, userType: '', identifier: '', name: '' });
    const [newPass, setNewPass] = useState('');
    const [showNewPass, setShowNewPass] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const headers: Record<string, string> = {};
            if (user?.email) headers['X-User-Email'] = user.email;
            if (isAdmin) {
                headers['X-User-Type'] = 'admin';
            } else if (user?.role === 'teacher') {
                headers['X-User-Type'] = 'teacher';
            }

            const [sRes, tRes, pRes] = await Promise.all([
                fetch(`${API}/api/admin/students`, { headers }),
                fetch(`${API}/api/admin/users/teachers`, { headers }),
                fetch(`${API}/api/admin/users/parents`, { headers }),
            ]);
            const [sData, tData, pData] = await Promise.all([sRes.json(), tRes.json(), pRes.json()]);
            if (sData.success) setStudents(sData.students);
            if (tData.success) setTeachers(tData.teachers);
            if (pData.success) setParents(pData.parents);
        } catch { setMsg({ type: 'error', text: 'Failed to load users.' }); }
        finally { setLoading(false); }
    }, [user, isAdmin]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleDisableStudent = async (studentId: string, currentStatus: string) => {
        const action = currentStatus === 'inactive' ? 'enable' : 'disable';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (user?.email) headers['X-User-Email'] = user.email;
        if (isAdmin) headers['X-User-Type'] = 'admin';

        const res = await fetch(`${API}/api/admin/users/student/${studentId}/disable`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ action }),
        });
        const data = await res.json();
        setMsg({ type: data.success ? 'success' : 'error', text: data.message || data.error });
        if (data.success) fetchAll();
    };

    const handleDisableTeacher = async (teacherId: string, currentStatus: string) => {
        const action = currentStatus === 'inactive' ? 'enable' : 'disable';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (user?.email) headers['X-User-Email'] = user.email;
        if (isAdmin) headers['X-User-Type'] = 'admin';

        const res = await fetch(`${API}/api/admin/users/teacher/${teacherId}/disable`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ action }),
        });
        const data = await res.json();
        setMsg({ type: data.success ? 'success' : 'error', text: data.message || data.error });
        if (data.success) fetchAll();
    };

    const openLinkModal = (studentId: string, name: string) => {
        setLinkParentModal({ open: true, studentId, name });
        setParentEmail(''); setParentPass(''); setShowParentPass(false);
    };

    const openResetModal = (userType: string, identifier: string, name: string) => {
        setResetModal({ open: true, userType, identifier, name });
        setNewPass(''); setShowNewPass(false);
    };

    const handleResetPassword = async () => {
        if (!newPass) return;
        setResetLoading(true);
        try {
            let res;
            if (resetModal.userType === 'student-login') {
                // Use the dedicated student login password endpoint
                res = await fetch(`${API}/api/admin/student/set-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId: resetModal.identifier, password: newPass }),
                });
            } else {
                res = await fetch(`${API}/api/admin/users/reset-password`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userType: resetModal.userType, identifier: resetModal.identifier, newPassword: newPass }),
                });
            }
            const data = await res.json();
            setMsg({ type: data.success ? 'success' : 'error', text: data.message || data.error });
            if (data.success) setResetModal({ open: false, userType: '', identifier: '', name: '' });
        } catch { setMsg({ type: 'error', text: 'Network error.' }); }
        finally { setResetLoading(false); }
    };

    const handleLinkParent = async () => {
        if (!parentEmail) return;
        setLinkLoading(true);
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (user?.email) headers['X-User-Email'] = user.email;
            if (isAdmin) headers['X-User-Type'] = 'admin';

            const res = await fetch(`${API}/api/admin/users/parent`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    studentId: linkParentModal.studentId,
                    parentEmail,
                    parentPassword: parentPass,
                }),
            });
            const data = await res.json();
            setMsg({ type: data.success ? 'success' : 'error', text: data.message || data.error });
            if (data.success) {
                setLinkParentModal({ open: false, studentId: '', name: '' });
                fetchAll();
            }
        } catch { setMsg({ type: 'error', text: 'Network error.' }); }
        finally { setLinkLoading(false); }
    };

    const StatusBadge = ({ status }: { status?: string }) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${status === 'inactive' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
            {status === 'inactive' ? 'Disabled' : 'Active'}
        </span>
    );

    return (
        <div className="space-y-5">
            {msg && <Alert type={msg.type} msg={msg.text} />}

            {/* Sub-tabs */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                {(['students', 'teachers', 'parents'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveList(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeList === tab ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {tab} ({tab === 'students' ? students.length : tab === 'teachers' ? teachers.length : parents.length})
                    </button>
                ))}
                <button onClick={fetchAll} className="ml-2 px-3 py-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Students Table */}
            {activeList === 'students' && (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>{['ID', 'Name', 'Email', 'Dept', 'Year', 'Div', 'Parent Email', 'Status', 'Actions'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {students.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-10 text-slate-400">No students found</td></tr>
                            ) : students.map(s => (
                                <tr key={s._id} className={`hover:bg-slate-50 transition-colors ${s.status === 'inactive' ? 'opacity-50' : ''}`}>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.studentId}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-800">{s.studentName}</td>
                                    <td className="px-4 py-3 text-xs text-indigo-600 font-medium">{s.email || '—'}</td>
                                    <td className="px-4 py-3 text-slate-500">{s.department || '—'}</td>
                                    <td className="px-4 py-3 text-slate-500">{s.year || '—'}</td>
                                    <td className="px-4 py-3 text-slate-500">{s.division || '—'}</td>
                                    <td className="px-4 py-3 text-xs text-slate-400">{s.parent_email || <span className="text-slate-300">Not set</span>}</td>
                                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 flex-wrap">
                                            <button onClick={() => handleDisableStudent(s.studentId, s.status || 'active')}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${s.status === 'inactive' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                                                {s.status === 'inactive' ? 'Enable' : 'Disable'}
                                            </button>
                                            <button onClick={() => openResetModal('student-login', s.studentId, s.studentName)}
                                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-1">
                                                <Key className="w-3 h-3" /> Set Login
                                            </button>
                                            {s.parent_email && (
                                                <button onClick={() => openResetModal('parent', s.parent_email!, `Parent of ${s.studentName}`)}
                                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors flex items-center gap-1">
                                                    <Key className="w-3 h-3" /> Reset Parent
                                                </button>
                                            )}
                                            {!s.parent_email && (
                                                <button onClick={() => openLinkModal(s.studentId, s.studentName)}
                                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors flex items-center gap-1">
                                                    <Heart className="w-3 h-3" /> Link Parent
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Teachers Table */}
            {activeList === 'teachers' && (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>{['Name', 'Email', 'Emp ID', 'Dept', 'Subjects', 'Status', 'Actions'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {teachers.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-400">No teachers found</td></tr>
                            ) : teachers.map(t => (
                                <tr key={t._id} className={`hover:bg-slate-50 transition-colors ${t.status === 'inactive' ? 'opacity-50' : ''}`}>
                                    <td className="px-4 py-3 font-semibold text-slate-800">{t.username}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{t.email}</td>
                                    <td className="px-4 py-3 text-slate-500">{t.employeeId || '—'}</td>
                                    <td className="px-4 py-3 text-slate-500">{t.department || '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(t.subjects || []).map(s => (
                                                <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold border border-blue-100">{s}</span>
                                            ))}
                                            {(!t.subjects || t.subjects.length === 0) && <span className="text-slate-300 text-xs">None</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleDisableTeacher(t._id, t.status || 'active')}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${t.status === 'inactive' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                                                {t.status === 'inactive' ? 'Enable' : 'Disable'}
                                            </button>
                                            <button onClick={() => openResetModal('teacher', t.email, t.username)}
                                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors flex items-center gap-1">
                                                <Key className="w-3 h-3" /> Reset
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Parents Table */}
            {activeList === 'parents' && (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>{['Student', 'Student ID', 'Dept', 'Parent Email', 'Actions'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {parents.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-slate-400">No parent accounts found</td></tr>
                            ) : parents.map(p => (
                                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-800">{p.studentName}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.studentId}</td>
                                    <td className="px-4 py-3 text-slate-500">{p.department || '—'}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500">{p.parent_email}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => openResetModal('parent', p.parent_email!, `Parent of ${p.studentName}`)}
                                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors flex items-center gap-1">
                                            <Key className="w-3 h-3" /> Reset Password
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Key className="w-5 h-5 text-violet-600" /> Reset Password
                            </h3>
                            <button onClick={() => setResetModal({ open: false, userType: '', identifier: '', name: '' })} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <p className="text-sm text-slate-500">Setting new password for <span className="font-bold text-slate-700">{resetModal.name}</span></p>
                        <div className="relative">
                            <input type={showNewPass ? 'text' : 'password'} className={inputCls + ' pr-10'} placeholder="Enter new password" value={newPass} onChange={e => setNewPass(e.target.value)} />
                            <button type="button" onClick={() => setShowNewPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setResetModal({ open: false, userType: '', identifier: '', name: '' })} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors">Cancel</button>
                            <button onClick={handleResetPassword} disabled={!newPass || resetLoading} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                {resetLoading ? 'Resetting…' : 'Reset Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Link Parent Modal */}
            {linkParentModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Heart className="w-5 h-5 text-amber-500" /> Link Parent Account
                            </h3>
                            <button onClick={() => setLinkParentModal({ open: false, studentId: '', name: '' })} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <p className="text-sm text-slate-500">Creating parent credentials for <span className="font-bold text-slate-700">{linkParentModal.name}</span></p>

                        <div className="space-y-4">
                            <Field label="Parent Email" required>
                                <input type="email" className={inputCls} placeholder="parent@example.com" value={parentEmail} onChange={e => setParentEmail(e.target.value)} />
                            </Field>
                            <Field label="Parent Password">
                                <div className="relative">
                                    <input type={showParentPass ? 'text' : 'password'} className={inputCls + ' pr-10'} placeholder="Leave blank to auto-generate" value={parentPass} onChange={e => setParentPass(e.target.value)} />
                                    <button type="button" onClick={() => setShowParentPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showParentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </Field>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setLinkParentModal({ open: false, studentId: '', name: '' })} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors">Cancel</button>
                            <button onClick={handleLinkParent} disabled={!parentEmail || linkLoading} className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {linkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                                {linkLoading ? 'Linking…' : 'Link Parent'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Module ──────────────────────────────────────────
const TABS = [
    { id: 'create-student', label: 'Create Student', icon: GraduationCap, color: 'text-violet-600' },
    { id: 'create-teacher', label: 'Create Teacher', icon: UserPlus, color: 'text-blue-600' },
    { id: 'create-parent', label: 'Create Parent', icon: Heart, color: 'text-amber-500' },
    { id: 'all-users', label: 'All Users', icon: Users, color: 'text-slate-600' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AdminUserManagementModule() {
    const [activeTab, setActiveTab] = useState<TabId>('create-student');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                        <UserCog className="w-5 h-5 text-white" />
                    </div>
                    User Management
                </h1>
                <p className="text-slate-500 mt-1 ml-13">Create and manage all system users</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${isActive
                                ? 'bg-white shadow-md text-slate-800 border border-slate-200'
                                : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'}`}>
                            <Icon className={`w-4 h-4 ${isActive ? tab.color : ''}`} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                {activeTab === 'create-student' && <CreateStudentTab />}
                {activeTab === 'create-teacher' && <CreateTeacherTab />}
                {activeTab === 'create-parent' && <CreateParentTab />}
                {activeTab === 'all-users' && <AllUsersTab />}
            </div>
        </div>
    );
}
