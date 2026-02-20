'use client';

import { Camera, UserPlus, Users, BarChart3, Settings, Home, LogOut, Calendar, ClipboardList, User, ShieldCheck, FileText, Heart, UserCog, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

interface SidebarProps {
    activeModule: string;
    onModuleChange: (module: string) => void;
    width: number;
    onWidthChange: (width: number) => void;
}

export default function Sidebar({ activeModule, onModuleChange, width, onWidthChange }: SidebarProps) {
    const { user, isTeacher, isStudent, isAdmin, isParent, logout } = useAuth();
    const router = useRouter();

    const handleMouseDown = (e: React.MouseEvent) => {
        const startX = e.clientX;
        const startWidth = width;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(200, Math.min(450, startWidth + (moveEvent.clientX - startX)));
            onWidthChange(newWidth);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
    };

    const teacherMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'timetable', label: 'Timetable', icon: Calendar },
        { id: 'detection', label: 'Live Detection', icon: Camera },
        { id: 'faces', label: 'Registered Faces', icon: Users },
        { id: 'attendance', label: 'Attendance', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const studentMenuItems = [
        { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'attendance', label: 'My Attendance', icon: ClipboardList },
        { id: 'timetable', label: 'Timetable', icon: Calendar },
    ];

    const adminMenuItems = [
        { id: 'admin-dashboard', label: 'Dashboard', icon: Home },
        { id: 'admin-users', label: 'User Management', icon: UserCog },
        { id: 'register', label: 'Register Student', icon: UserPlus },
        { id: 'detection', label: 'Live Detection', icon: Camera },
        { id: 'faces', label: 'Registered Faces', icon: Users },
        { id: 'admin-reports', label: 'Reports', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const parentMenuItems = [
        { id: 'parent-dashboard', label: 'My Ward', icon: Heart },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const menuItems = isAdmin
        ? adminMenuItems
        : isParent
            ? parentMenuItems
            : isTeacher
                ? teacherMenuItems
                : studentMenuItems;

    const roleLabel = isAdmin ? 'Admin' : isParent ? 'Parent' : isTeacher ? 'Teacher' : 'Student';

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <aside
            className="fixed left-0 top-0 h-screen glass-nav z-50 flex flex-col p-6 transition-colors duration-300"
            style={{ width: `${width}px` }}
        >
            {/* Resizer Handle */}
            <div
                onMouseDown={handleMouseDown}
                className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize group hover:bg-blue-400/30 transition-colors z-50"
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-slate-300/50 rounded-full group-hover:bg-blue-400 group-hover:h-12 transition-all"></div>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-4 mb-10 px-2 overflow-hidden whitespace-nowrap">
                <div className="shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(99,102,241,0.6)] animate-float">
                    <Camera className="w-7 h-7 text-white" />
                </div>
                <div className="min-w-0">
                    <h1 className="text-xl font-black text-slate-800 tracking-tight bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">FaceRec</h1>
                    <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">Attendance System</p>
                </div>
            </div>

            {/* User Profile Summary */}
            <div className="mb-8 p-4 glass-card border-indigo-100/50 overflow-hidden group">
                <div className="flex items-center gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center border border-indigo-200 shadow-sm transition-transform group-hover:rotate-12">
                        {isAdmin ? <ShieldCheck className="w-5 h-5 text-violet-600" />
                            : isParent ? <Heart className="w-5 h-5 text-amber-500" />
                                : <User className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-tighter">
                            {roleLabel}
                        </p>
                        <p className="text-sm font-bold text-slate-800 truncate">{user?.username || 'Not Signed In'}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                {menuItems.map((item) => {
                    const isActive = activeModule === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onModuleChange(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-500 relative group overflow-hidden ${isActive
                                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-[0_8px_20px_-6px_rgba(139,92,246,0.6)] translate-x-1'
                                : 'text-slate-600 hover:bg-white/60 hover:text-indigo-600 hover:translate-x-1'
                                }`}
                        >
                            {/* Glossy Reflection Effect on Hover/Active */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                            <item.icon className={`shrink-0 w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`} />
                            <span className="font-bold text-sm tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>

                            {isActive && (
                                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="pt-6 border-t border-slate-200/50 mt-auto overflow-hidden">
                <button
                    onClick={handleLogout}
                    className="w-full h-12 flex items-center gap-3 px-4 text-slate-500 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all duration-300 group"
                >
                    <LogOut className="shrink-0 w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    <span className="font-bold text-sm whitespace-nowrap">Logout</span>
                </button>
                <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-50/50 rounded-lg whitespace-nowrap overflow-hidden border border-indigo-100/50">
                    <div className="shrink-0 w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-ellipsis overflow-hidden">System Online</span>
                </div>
            </div>
        </aside>
    );
}
