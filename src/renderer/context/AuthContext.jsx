import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 로컬 스토리지에서 토큰 복원
        const savedToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('user');

        console.log('[Auth] Init check - Token exists:', !!savedToken);

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = useCallback((userData, authToken) => {
        console.log('[Auth] Login:', userData.username);
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        console.log('[Auth] Logout executing...');
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        console.log('[Auth] LocalStorage cleared.');
    }, []);

    const value = useMemo(() => ({
        user,
        token,
        login,
        logout,
        loading
    }), [user, token, login, logout, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
