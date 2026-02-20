'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    _id: string;
    username: string;
    email: string;
    userType: 'teacher' | 'student' | 'admin' | 'parent';
    role: string;
    department?: string;
    employeeId?: string;
    studentId?: string;
    studentName?: string;
    year?: string;
    division?: string;
    // Parent-specific
    wardStudentId?: string;
    wardName?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isTeacher: boolean;
    isStudent: boolean;
    isAdmin: boolean;
    isParent: boolean;
    login: (email: string, password: string, userType: 'teacher' | 'student' | 'admin' | 'parent') => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored session on mount
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string, userType: 'teacher' | 'student' | 'admin' | 'parent') => {
        try {
            const response = await fetch('http://localhost:5000/api/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, userType }),
            });

            const data = await response.json();

            if (data.success && data.user) {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (error) {
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');

        // Optional: Call backend logout endpoint
        fetch('http://localhost:5000/api/logout', { method: 'POST' }).catch(() => { });
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isTeacher: user?.userType === 'teacher',
        isStudent: user?.userType === 'student',
        isAdmin: user?.userType === 'admin',
        isParent: user?.userType === 'parent',
        login,
        logout,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
