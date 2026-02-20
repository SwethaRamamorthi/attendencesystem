'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Sidebar from './components/Sidebar';
import DashboardModule from './components/DashboardModule';
import RegisterFaceModule from './components/RegisterFaceModule';
import LiveDetectionModule from './components/LiveDetectionModule';
import RegisteredFacesModule from './components/RegisteredFacesModule';
import StudentAttendanceModule from './components/StudentAttendanceModule';
import StudentTimetableModule from './components/StudentTimetableModule';
import TeacherTimetableModule from './components/TeacherTimetableModule';
import SettingsModule from './components/SettingsModule';
import AdminDashboardModule from './components/AdminDashboardModule';
import AdminReportsModule from './components/AdminReportsModule';
import AdminUserManagementModule from './components/AdminUserManagementModule';
import ParentDashboardModule from './components/ParentDashboardModule';
import StudentDashboardModule from './components/StudentDashboardModule';

export default function DesktopApp() {
    const router = useRouter();
    const { isAuthenticated, isTeacher, isStudent, isAdmin, isParent, loading } = useAuth();
    const [activeModule, setActiveModule] = useState('dashboard');
    const [sidebarWidth, setSidebarWidth] = useState(288); // Default 72 (288px)

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, loading, router]);

    // Set default module based on role
    useEffect(() => {
        if (isStudent) {
            setActiveModule('student-dashboard');
        } else if (isAdmin) {
            setActiveModule('admin-dashboard');
        } else if (isParent) {
            setActiveModule('parent-dashboard');
        }
    }, [isStudent, isAdmin, isParent]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const renderModule = () => {
        // Admin modules
        if (isAdmin) {
            switch (activeModule) {
                case 'admin-dashboard': return <AdminDashboardModule />;
                case 'admin-users': return <AdminUserManagementModule />;
                case 'register': return <RegisterFaceModule />;
                case 'detection': return <LiveDetectionModule />;
                case 'faces': return <RegisteredFacesModule />;
                case 'admin-reports': return <AdminReportsModule />;
                case 'settings': return <SettingsModule />;
                default: return <AdminDashboardModule />;
            }
        }

        // Parent modules
        if (isParent) {
            switch (activeModule) {
                case 'parent-dashboard': return <ParentDashboardModule />;
                case 'settings': return <SettingsModule />;
                default: return <ParentDashboardModule />;
            }
        }

        // Teacher modules
        if (isTeacher) {
            switch (activeModule) {
                case 'dashboard': return <DashboardModule />;
                case 'timetable': return <TeacherTimetableModule />;
                case 'detection': return <LiveDetectionModule />;
                case 'faces': return <RegisteredFacesModule />;
                case 'attendance': return <StudentAttendanceModule />;
                case 'settings': return <SettingsModule />;
                default: return <DashboardModule />;
            }
        }

        // Student modules
        if (isStudent) {
            switch (activeModule) {
                case 'student-dashboard': return <StudentDashboardModule />;
                case 'attendance': return <StudentDashboardModule />;
                case 'timetable': return <StudentTimetableModule />;
                default: return <StudentDashboardModule />;
            }
        }

        return null;
    };

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                activeModule={activeModule}
                onModuleChange={setActiveModule}
                width={sidebarWidth}
                onWidthChange={setSidebarWidth}
            />

            {/* Main Content Area */}
            <div
                className="flex-1 overflow-y-auto"
                style={{ marginLeft: `${sidebarWidth}px` }}
            >
                <div className="p-8">{renderModule()}</div>
            </div>
        </div>
    );
}
